import bcrypt from "bcryptjs";
import { z } from "zod";
import { ApiError, apiSuccess, withApiErrors } from "@/lib/api-response";
import { requireRole } from "@/lib/permissions";
import { connectToDatabase } from "@/lib/db";
import { readJson, validateMutationOrigin } from "@/lib/request";
import Student from "@/models/Student";
import StudentReferral from "@/models/StudentReferral";
import StudentPayment from "@/models/StudentPayment";
import User from "@/models/User";

const updateProfileSchema = z.object({
  phone: z.string().trim().max(32).optional().or(z.literal("")),
  institution: z.string().trim().max(200).optional().or(z.literal("")),
  currentPassword: z.string().min(1).optional(),
  newPassword: z.string().min(6, "New password must be at least 6 characters.").max(100).optional(),
}).strict();

export const GET = withApiErrors(async () => {
  const user = await requireRole(["student"]);
  await connectToDatabase();

  const student = await Student.findOne({ user: user._id }).lean();
  if (!student) {
    throw new ApiError("Student profile not found.", 404);
  }

  if (student.status !== "active") {
    throw new ApiError("Your student account is deactivated. Please contact administration.", 403);
  }

  // Count live referrals and payments for this student
  const [totalReferred, verifiedCount, pendingCount, earningsSum, paymentsSum] = await Promise.all([
    StudentReferral.countDocuments({ student: student._id }),
    StudentReferral.countDocuments({ student: student._id, status: "verified" }),
    StudentReferral.countDocuments({ student: student._id, status: "pending" }),
    StudentReferral.aggregate<{ _id: null; total: number }>([
      { $match: { student: student._id, status: "verified", commissionApproved: true } },
      { $group: { _id: null, total: { $sum: "$commissionEarned" } } },
    ]),
    StudentPayment.aggregate<{ _id: null; total: number }>([
      { $match: { student: student._id, status: "paid" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
  ]);

  const totalEarnings = Math.max(student.totalEarnings || 0, earningsSum[0]?.total ?? 0);
  const paidAmount = Math.max(student.paidAmount || 0, paymentsSum[0]?.total ?? 0);
  const pendingPayment = Math.max(0, totalEarnings - paidAmount);

  const stats = {
    totalCreatorsReferred: Math.max(student.totalCreatorsReferred || 0, totalReferred),
    verifiedCreators: Math.max(student.verifiedCreators || 0, verifiedCount),
    pendingVerification: Math.max(student.pendingVerification || 0, pendingCount),
    totalEarnings,
    paidAmount,
    pendingPayment,
    currency: student.currency || "INR",
  };

  return apiSuccess({
    student: {
      _id: student._id,
      name: student.name,
      email: student.email,
      studentId: student.studentId,
      referralCode: student.referralCode,
      phone: student.phone,
      institution: student.institution,
      status: student.status,
      createdAt: student.createdAt,
    },
    stats,
  });
});

export const PUT = withApiErrors(async (request) => {
  validateMutationOrigin(request);
  const user = await requireRole(["student"]);
  await connectToDatabase();

  const student = await Student.findOne({ user: user._id });
  if (!student || student.status !== "active") {
    throw new ApiError("Student account not active.", 403);
  }

  const body = updateProfileSchema.parse(await readJson(request));

  if (body.phone !== undefined) {
    student.phone = body.phone || undefined;
  }
  if (body.institution !== undefined) {
    student.institution = body.institution || undefined;
  }

  // If changing password, verify current password
  if (body.newPassword) {
    if (!body.currentPassword) {
      throw new ApiError("Current password is required to set a new password.", 400);
    }

    const userRecord = await User.findById(user._id).select("+passwordHash");
    if (!userRecord) {
      throw new ApiError("User not found.", 404);
    }

    const isMatch = await bcrypt.compare(body.currentPassword, userRecord.passwordHash);
    if (!isMatch) {
      throw new ApiError("Current password is incorrect.", 400);
    }

    userRecord.passwordHash = await bcrypt.hash(body.newPassword, 12);
    userRecord.sessionVersion = (userRecord.sessionVersion || 0) + 1;
    await userRecord.save();
  }

  await student.save();

  return apiSuccess(
    {
      name: student.name,
      email: student.email,
      phone: student.phone,
      institution: student.institution,
    },
    "Profile updated successfully."
  );
});

