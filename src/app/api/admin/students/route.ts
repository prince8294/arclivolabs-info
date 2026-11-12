import bcrypt from "bcryptjs";
import { z } from "zod";
import { ApiError, apiSuccess, withApiErrors } from "@/lib/api-response";
import { requireAdminPermission } from "@/lib/admin/permissions";
import { connectToDatabase } from "@/lib/db";
import { validateMutationOrigin, readJson } from "@/lib/request";
import Student from "@/models/Student";
import User from "@/models/User";

const createStudentSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(120),
  email: z.string().trim().email("Invalid email address.").max(254),
  password: z.string().min(6, "Password must be at least 6 characters.").max(100),
  studentId: z.string().trim().min(3, "Student ID must be at least 3 characters.").max(50).toUpperCase(),
  referralCode: z.string().trim().min(3, "Referral code must be at least 3 characters.").max(30).toUpperCase(),
  phone: z.string().trim().max(32).optional().or(z.literal("")),
  institution: z.string().trim().max(200).optional().or(z.literal("")),
  status: z.enum(["active", "deactivated"]).default("active"),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
}).strict();

export const GET = withApiErrors(async (request) => {
  await requireAdminPermission("student:read");
  await connectToDatabase();

  const url = new URL(request.url);
  const search = url.searchParams.get("search")?.trim().slice(0, 100) ?? "";
  const status = url.searchParams.get("status")?.trim() ?? "";
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") ?? "20", 10) || 20));
  const skip = (page - 1) * limit;

  const safeSearch = search ? search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") : "";
  const rx = safeSearch ? new RegExp(safeSearch, "i") : null;

  const filter: Record<string, unknown> = {
    ...(status && (status === "active" || status === "deactivated") ? { status } : {}),
    ...(rx
      ? {
          $or: [
            { name: rx },
            { email: rx },
            { studentId: rx },
            { referralCode: rx },
            { institution: rx },
          ],
        }
      : {}),
  };

  const [items, total, totalStudents, activeStudents, deactivatedStudents] = await Promise.all([
    Student.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Student.countDocuments(filter),
    Student.countDocuments({}),
    Student.countDocuments({ status: "active" }),
    Student.countDocuments({ status: "deactivated" }),
  ]);

  const totalReferrals = items.reduce((acc, curr) => acc + (curr.totalCreatorsReferred || 0), 0);

  return apiSuccess({
    items,
    total,
    page,
    pages: Math.max(1, Math.ceil(total / limit)),
    stats: {
      totalStudents,
      activeStudents,
      deactivatedStudents,
      totalReferrals,
    },
  });
});

export const POST = withApiErrors(async (request) => {
  validateMutationOrigin(request);
  await requireAdminPermission("student:manage");
  await connectToDatabase();

  const body = createStudentSchema.parse(await readJson(request));
  const emailLower = body.email.toLowerCase();
  const studentIdUpper = body.studentId.toUpperCase();
  const referralCodeUpper = body.referralCode.toUpperCase();

  // 1. Check if user with this email already exists
  const existingUser = await User.findOne({ email: emailLower });
  if (existingUser) {
    throw new ApiError("An account with this email address already exists.", 400);
  }

  // 2. Check if student ID is unique
  const existingId = await Student.findOne({ studentId: studentIdUpper });
  if (existingId) {
    throw new ApiError("This Student ID is already assigned to another student.", 400);
  }

  // 3. Check if referral code is unique
  const existingCode = await Student.findOne({ referralCode: referralCodeUpper });
  if (existingCode) {
    throw new ApiError("This referral code is already taken. Please generate or enter another code.", 400);
  }

  const passwordHash = await bcrypt.hash(body.password, 12);

  // Create User account with role "student"
  const user = await User.create({
    name: body.name,
    email: emailLower,
    passwordHash,
    phone: body.phone || undefined,
    role: "student",
    status: body.status,
    isEmailVerified: true,
    emailVerifiedAt: new Date(),
  });

  // Create Student document
  const student = await Student.create({
    user: user._id,
    name: body.name,
    email: emailLower,
    studentId: studentIdUpper,
    referralCode: referralCodeUpper,
    phone: body.phone || undefined,
    institution: body.institution || undefined,
    status: body.status,
    notes: body.notes || undefined,
    totalCreatorsReferred: 0,
    verifiedCreators: 0,
    pendingVerification: 0,
    totalEarnings: 0,
    currency: "INR",
  });

  return apiSuccess(student, "Student account created successfully.", 201);
});

