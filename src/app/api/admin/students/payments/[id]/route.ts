import { z } from "zod";
import { apiSuccess, ApiError, withApiErrors } from "@/lib/api-response";
import { requireAdminPermission } from "@/lib/admin/permissions";
import { connectToDatabase } from "@/lib/db";
import { readJson, validateMutationOrigin } from "@/lib/request";
import StudentPayment from "@/models/StudentPayment";
import Student from "@/models/Student";
import { recalculateStudentFinancials } from "@/lib/student-payment";
import { recordCommittedActivity } from "@/services/activity.service";

const updatePaymentSchema = z
  .object({
    status: z.enum(["pending", "processing", "paid", "rejected"]).optional(),
    transactionReference: z.string().trim().max(120).optional(),
    internalNote: z.string().trim().max(1000).optional(),
    paymentDate: z
      .string()
      .datetime()
      .or(z.string().regex(/^\d{4}-\d{2}-\d{2}/))
      .optional(),
  })
  .strict();

type RouteContext = { params: Promise<{ id: string }> };

export const PATCH = withApiErrors(async (request: Request, { params }: RouteContext) => {
  validateMutationOrigin(request);
  const actor = await requireAdminPermission("student:manage");
  await connectToDatabase();
  const { id } = await params;

  const payment = await StudentPayment.findById(id);
  if (!payment) {
    throw new ApiError("Payment record not found.", 404);
  }

  const body = updatePaymentSchema.parse(await readJson(request));
  const student = await Student.findById(payment.student);
  if (!student) {
    throw new ApiError("Associated student not found.", 404);
  }

  // If changing status to/from paid, verify balance
  if (body.status) {
    if (body.status === "paid" && payment.status !== "paid") {
      const financials = await recalculateStudentFinancials(student._id);
      if (payment.amount > financials.pendingPayment) {
        throw new ApiError(
          `Cannot mark as paid. Payment amount (₹${payment.amount}) exceeds current available approved balance (₹${financials.pendingPayment}).`,
          400
        );
      }
      payment.status = "paid";
      payment.paidAt = new Date();
    } else {
      payment.status = body.status;
      if (body.status !== "paid") {
        payment.paidAt = undefined;
      }
    }
  }

  if (body.transactionReference !== undefined) {
    const cleanRef = body.transactionReference.trim();
    if (cleanRef) {
      const duplicateRef = await StudentPayment.findOne({
        _id: { $ne: payment._id },
        transactionReference: cleanRef,
      });
      if (duplicateRef) {
        throw new ApiError(
          `Another payment record already uses transaction reference "${cleanRef}".`,
          409
        );
      }
      payment.transactionReference = cleanRef;
    } else {
      payment.transactionReference = undefined;
    }
  }

  if (body.internalNote !== undefined) {
    payment.internalNote = body.internalNote.trim() || undefined;
  }

  if (body.paymentDate) {
    payment.paymentDate = new Date(body.paymentDate);
  }

  payment.auditLog.push({
    action: "payment_updated",
    performedBy: actor._id,
    performedByName: actor.name,
    timestamp: new Date(),
    details: `Updated by ${actor.name}. Status: ${payment.status}. Reference: ${payment.transactionReference || "None"}.`,
  });

  await payment.save();

  // Synchronize student financials
  const updatedFinancials = await recalculateStudentFinancials(student._id);

  await recordCommittedActivity({
    actorId: actor._id,
    action: "student.payment_updated",
    resourceType: "StudentPayment",
    resourceId: payment._id.toString(),
  });

  return apiSuccess(
    {
      payment,
      studentBalances: updatedFinancials,
    },
    `Payment updated successfully.`
  );
});
