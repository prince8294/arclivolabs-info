import bcrypt from "bcryptjs";
import { z } from "zod";
import { ApiError, apiSuccess, withApiErrors } from "@/lib/api-response";
import { requireAdminPermission } from "@/lib/admin/permissions";
import { connectToDatabase } from "@/lib/db";
import { validateMutationOrigin, readJson } from "@/lib/request";
import Student from "@/models/Student";
import User from "@/models/User";

const updateStudentSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(120).optional(),
  email: z.string().trim().email("Invalid email address.").max(254).optional(),
  studentId: z.string().trim().min(3, "Student ID must be at least 3 characters.").max(50).toUpperCase().optional(),
  referralCode: z.string().trim().min(3, "Referral code must be at least 3 characters.").max(30).toUpperCase().optional(),
  phone: z.string().trim().max(32).optional().or(z.literal("")),
  institution: z.string().trim().max(200).optional().or(z.literal("")),
  status: z.enum(["active", "deactivated"]).optional(),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
  newPassword: z.string().min(6, "Password must be at least 6 characters.").max(100).optional().or(z.literal("")),
}).strict();

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withApiErrors(async (_request: Request, { params }: RouteContext) => {
  await requireAdminPermission("student:read");
  await connectToDatabase();
  const { id } = await params;

  const student = await Student.findById(id).lean();
  if (!student) {
    throw new ApiError("Student not found.", 404);
  }

  return apiSuccess(student);
});

export const PUT = withApiErrors(async (request: Request, { params }: RouteContext) => {
  validateMutationOrigin(request);
  await requireAdminPermission("student:manage");
  await connectToDatabase();
  const { id } = await params;

  const body = updateStudentSchema.parse(await readJson(request));
  const student = await Student.findById(id);
  if (!student) {
    throw new ApiError("Student not found.", 404);
  }

  const user = await User.findById(student.user);

  // Validate email changes
  if (body.email && body.email.toLowerCase() !== student.email) {
    const existingUser = await User.findOne({ email: body.email.toLowerCase(), _id: { $ne: student.user } });
    if (existingUser) {
      throw new ApiError("Email is already used by another account.", 400);
    }
    student.email = body.email.toLowerCase();
    if (user) user.email = body.email.toLowerCase();
  }

  // Validate studentId changes
  if (body.studentId && body.studentId.toUpperCase() !== student.studentId) {
    const existingId = await Student.findOne({ studentId: body.studentId.toUpperCase(), _id: { $ne: student._id } });
    if (existingId) {
      throw new ApiError("This Student ID is already assigned to another student.", 400);
    }
    student.studentId = body.studentId.toUpperCase();
  }

  // Validate referralCode changes
  if (body.referralCode && body.referralCode.toUpperCase() !== student.referralCode) {
    const existingCode = await Student.findOne({ referralCode: body.referralCode.toUpperCase(), _id: { $ne: student._id } });
    if (existingCode) {
      throw new ApiError("This referral code is already taken.", 400);
    }
    student.referralCode = body.referralCode.toUpperCase();
  }

  if (body.name !== undefined) {
    student.name = body.name;
    if (user) user.name = body.name;
  }

  if (body.phone !== undefined) {
    student.phone = body.phone || undefined;
    if (user) user.phone = body.phone || undefined;
  }

  if (body.institution !== undefined) {
    student.institution = body.institution || undefined;
  }

  if (body.notes !== undefined) {
    student.notes = body.notes || undefined;
  }

  // Handle status change
  if (body.status !== undefined && body.status !== student.status) {
    student.status = body.status;
    if (user) {
      user.status = body.status;
      if (body.status === "deactivated") {
        user.sessionVersion = (user.sessionVersion || 0) + 1;
      }
    }
  }

  // Handle password reset
  if (body.newPassword && body.newPassword.trim().length >= 6) {
    if (user) {
      user.passwordHash = await bcrypt.hash(body.newPassword, 12);
      user.sessionVersion = (user.sessionVersion || 0) + 1;
    }
  }

  if (user) await user.save();
  await student.save();

  return apiSuccess(student, "Student details updated successfully.");
});

export const DELETE = withApiErrors(async (request: Request, { params }: RouteContext) => {
  validateMutationOrigin(request);
  await requireAdminPermission("student:manage");
  await connectToDatabase();
  const { id } = await params;

  const student = await Student.findById(id);
  if (!student) {
    throw new ApiError("Student not found.", 404);
  }

  // Deactivate account instead of hard deletion to preserve referral integrity
  student.status = "deactivated";
  await student.save();

  const user = await User.findById(student.user);
  if (user) {
    user.status = "deactivated";
    user.sessionVersion = (user.sessionVersion || 0) + 1;
    await user.save();
  }

  return apiSuccess({ id: student._id, status: "deactivated" }, "Student account deactivated successfully.");
});

