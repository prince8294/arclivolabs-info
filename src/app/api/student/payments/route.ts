import { apiSuccess, ApiError, withApiErrors } from "@/lib/api-response";
import { requireRole } from "@/lib/permissions";
import { connectToDatabase } from "@/lib/db";
import Student from "@/models/Student";
import StudentPayment from "@/models/StudentPayment";
import StudentReferral from "@/models/StudentReferral";

export const GET = withApiErrors(async () => {
  const user = await requireRole(["student"]);
  await connectToDatabase();

  const student = await Student.findOne({ user: user._id }).lean();
  if (!student) {
    throw new ApiError("Student profile not found.", 404);
  }

  const [payments, earningsAgg, paymentsAgg] = await Promise.all([
    StudentPayment.find({ student: student._id })
      .sort({ paymentDate: -1, createdAt: -1 })
      .select("amount currency paymentDate paymentMethod transactionReference internalNote status createdAt paidAt")
      .lean(),
    StudentReferral.aggregate<{ _id: null; total: number }>([
      { $match: { student: student._id, status: "verified", commissionApproved: true } },
      { $group: { _id: null, total: { $sum: "$commissionEarned" } } },
    ]),
    StudentPayment.aggregate<{ _id: null; total: number }>([
      { $match: { student: student._id, status: "paid" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
  ]);

  const totalEarnings = Math.max(student.totalEarnings || 0, earningsAgg[0]?.total ?? 0);
  const paidAmount = Math.max(student.paidAmount || 0, paymentsAgg[0]?.total ?? 0);
  const pendingPayment = Math.max(0, totalEarnings - paidAmount);

  return apiSuccess({
    payments,
    summary: {
      totalEarnings,
      paidAmount,
      pendingPayment,
      currency: student.currency || "INR",
    },
  });
});
