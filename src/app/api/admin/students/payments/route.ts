import { z } from "zod";
import { apiSuccess, ApiError, withApiErrors } from "@/lib/api-response";
import { requireAdminPermission } from "@/lib/admin/permissions";
import { connectToDatabase } from "@/lib/db";
import { readJson, validateMutationOrigin } from "@/lib/request";
import Student from "@/models/Student";
import StudentPayment from "@/models/StudentPayment";
import StudentReferral from "@/models/StudentReferral";
import { recalculateStudentFinancials } from "@/lib/student-payment";
import { recordCommittedActivity } from "@/services/activity.service";

const createPaymentSchema = z
  .object({
    studentId: z.string().trim().min(1, "Student is required."),
    amount: z.number().positive("Payment amount must be greater than 0."),
    paymentDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)),
    paymentMethod: z.enum(["UPI", "Bank Transfer", "Other"]),
    transactionReference: z.string().trim().max(120).optional(),
    internalNote: z.string().trim().max(1000).optional(),
    status: z.enum(["pending", "processing", "paid", "rejected"]).default("paid"),
  })
  .strict();

export const GET = withApiErrors(async (request: Request) => {
  await requireAdminPermission("student:read");
  await connectToDatabase();

  const url = new URL(request.url);
  const search = url.searchParams.get("search")?.trim().slice(0, 100) ?? "";
  const status = url.searchParams.get("status")?.trim() ?? "";
  const studentFilter = url.searchParams.get("student")?.trim() ?? "";
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") ?? "20", 10) || 20));
  const skip = (page - 1) * limit;

  const safeSearch = search ? search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") : "";
  const rx = safeSearch ? new RegExp(safeSearch, "i") : null;

  let matchingStudentIds: unknown[] = [];
  if (rx) {
    const matched = await Student.find({
      $or: [{ name: rx }, { studentId: rx }, { referralCode: rx }, { email: rx }],
    })
      .select("_id")
      .lean();
    matchingStudentIds = matched.map((s) => s._id);
  }

  const filter: Record<string, unknown> = {
    ...(status && ["pending", "processing", "paid", "rejected"].includes(status) ? { status } : {}),
    ...(studentFilter ? { student: studentFilter } : {}),
    ...(rx
      ? {
          $or: [
            { transactionReference: rx },
            { internalNote: rx },
            ...(matchingStudentIds.length > 0 ? [{ student: { $in: matchingStudentIds } }] : []),
          ],
        }
      : {}),
  };

  const [items, total, totalPaidAgg, totalPendingPaymentAgg, totalApprovedCommissionsAgg] =
    await Promise.all([
      StudentPayment.find(filter)
        .populate("student", "name email studentId referralCode totalEarnings paidAmount pendingPayment")
        .populate("recordedBy", "name email")
        .sort({ paymentDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      StudentPayment.countDocuments(filter),
      // Sum all paid payments
      StudentPayment.aggregate<{ _id: null; total: number }>([
        { $match: { status: "paid" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      // Sum all approved commissions
      StudentReferral.aggregate<{ _id: null; total: number }>([
        { $match: { status: "verified", commissionApproved: true } },
        { $group: { _id: null, total: { $sum: "$commissionEarned" } } },
      ]),
      // Student count
      Student.countDocuments({ status: "active" }),
    ]);

  const totalPaid = totalPaidAgg[0]?.total ?? 0;
  const totalApprovedCommissions = totalPendingPaymentAgg[0]?.total ?? 0;
  const totalPendingBalance = Math.max(0, totalApprovedCommissions - totalPaid);

  return apiSuccess({
    items,
    total,
    page,
    pages: Math.ceil(total / limit) || 1,
    stats: {
      totalApprovedCommissions,
      totalPaid,
      totalPendingBalance,
      totalPaymentsCount: total,
    },
  });
});

export const POST = withApiErrors(async (request: Request) => {
  validateMutationOrigin(request);
  const actor = await requireAdminPermission("student:manage");
  await connectToDatabase();

  const body = createPaymentSchema.parse(await readJson(request));

  const student = await Student.findById(body.studentId);
  if (!student) {
    throw new ApiError("Student not found.", 404);
  }

  // Recalculate student earnings to ensure fresh, accurate numbers
  const financials = await recalculateStudentFinancials(student._id);

  if (financials.pendingPayment <= 0) {
    throw new ApiError(
      `Cannot create payment. ${student.name} currently has no pending approved balance (Approved: ₹${financials.totalEarnings}, Paid: ₹${financials.paidAmount}).`,
      400
    );
  }

  if (body.amount > financials.pendingPayment) {
    throw new ApiError(
      `Payment amount of ₹${body.amount} exceeds ${student.name}'s available approved balance of ₹${financials.pendingPayment}.`,
      400
    );
  }

  // Prevent duplicate transaction references if specified
  if (body.transactionReference) {
    const existingRef = await StudentPayment.findOne({
      transactionReference: body.transactionReference.trim(),
    });
    if (existingRef) {
      throw new ApiError(
        `A payment record with transaction reference "${body.transactionReference.trim()}" already exists.`,
        409
      );
    }
  }

  const paymentDate = new Date(body.paymentDate);

  const payment = await StudentPayment.create({
    student: student._id,
    studentUser: student.user,
    amount: body.amount,
    currency: student.currency || "INR",
    paymentDate,
    paymentMethod: body.paymentMethod,
    transactionReference: body.transactionReference?.trim() || undefined,
    internalNote: body.internalNote?.trim() || undefined,
    status: body.status,
    paidAt: body.status === "paid" ? paymentDate : undefined,
    recordedBy: actor._id,
    recordedByName: actor.name,
    auditLog: [
      {
        action: body.status === "paid" ? "payment_created_and_paid" : "payment_created_pending",
        performedBy: actor._id,
        performedByName: actor.name,
        timestamp: new Date(),
        details: `Created payment of ₹${body.amount} (${body.paymentMethod}) for ${student.name} [${student.studentId}]. Status: ${body.status}.`,
      },
    ],
  });

  // Synchronize student's financial balance
  const updatedFinancials = await recalculateStudentFinancials(student._id);

  await recordCommittedActivity({
    actorId: actor._id,
    action: "student.payment_recorded",
    resourceType: "StudentPayment",
    resourceId: payment._id.toString(),
  });

  return apiSuccess(
    {
      payment,
      studentBalances: updatedFinancials,
    },
    `Payment record of ₹${body.amount} created successfully for ${student.name}.`,
    201
  );
});
