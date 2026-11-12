import { Types } from "mongoose";
import Student from "@/models/Student";
import StudentReferral from "@/models/StudentReferral";
import StudentPayment from "@/models/StudentPayment";
import { connectToDatabase } from "@/lib/db";

export type StudentFinancialSummary = {
  totalEarnings: number;
  paidAmount: number;
  pendingPayment: number;
  currency: string;
};

/**
 * Recalculates and synchronizes a student's total earnings, paid amounts, and pending balance.
 *
 * Rules:
 * - Total Earnings: Only count approved commissions from verified creators.
 * - Paid Amount: Sum of all payments marked as 'paid'.
 * - Pending Payment: Total approved earnings minus paid amount (cannot be negative).
 */
export async function recalculateStudentFinancials(
  studentId: string | Types.ObjectId
): Promise<StudentFinancialSummary> {
  await connectToDatabase();

  const sId = typeof studentId === "string" ? new Types.ObjectId(studentId) : studentId;

  const [earningsAgg, paymentsAgg, student] = await Promise.all([
    // Approved commissions only
    StudentReferral.aggregate<{ _id: null; total: number }>([
      { $match: { student: sId, status: "verified", commissionApproved: true } },
      { $group: { _id: null, total: { $sum: "$commissionEarned" } } },
    ]),
    // Paid amounts only
    StudentPayment.aggregate<{ _id: null; total: number }>([
      { $match: { student: sId, status: "paid" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Student.findById(sId),
  ]);

  const totalEarnings = Math.max(0, earningsAgg[0]?.total ?? 0);
  const paidAmount = Math.max(0, paymentsAgg[0]?.total ?? 0);
  const pendingPayment = Math.max(0, totalEarnings - paidAmount);

  if (student) {
    student.totalEarnings = totalEarnings;
    student.paidAmount = paidAmount;
    student.pendingPayment = pendingPayment;
    await student.save();
  }

  return {
    totalEarnings,
    paidAmount,
    pendingPayment,
    currency: student?.currency || "INR",
  };
}

/**
 * Generates an uppercase, unique support ticket reference.
 * Example: ST-LX5K9-482
 */
export function generateTicketNumber(): string {
  const timestampPart = Date.now().toString(36).toUpperCase().slice(-5);
  const randomPart = Math.floor(100 + Math.random() * 900);
  return `ST-${timestampPart}-${randomPart}`;
}

