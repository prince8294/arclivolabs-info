import { z } from "zod";
import { apiSuccess, ApiError, withApiErrors } from "@/lib/api-response";
import { requireAdminPermission } from "@/lib/admin/permissions";
import { connectToDatabase } from "@/lib/db";
import { readJson, validateMutationOrigin } from "@/lib/request";
import Student from "@/models/Student";
import StudentCertificate from "@/models/StudentCertificate";
import { notifyUser } from "@/services/notification.service";
import { recordCommittedActivity } from "@/services/activity.service";

const createCertificateSchema = z
  .object({
    studentId: z.string().trim().min(1, "Student is required."),
    certificateId: z
      .string()
      .trim()
      .min(3, "Certificate ID must be at least 3 characters.")
      .max(64),
    title: z.string().trim().min(3, "Title must be at least 3 characters.").max(200),
    description: z.string().trim().max(1000).optional(),
    issueDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)),
    fileUrl: z.string().trim().min(1, "Certificate file is required."),
    fileName: z.string().trim().min(1),
    fileType: z.string().trim().min(1),
    fileSize: z.number().int().min(0),
    status: z.enum(["published", "revoked"]).default("published"),
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
    ...(status && ["published", "revoked"].includes(status) ? { status } : {}),
    ...(studentFilter ? { student: studentFilter } : {}),
    ...(rx
      ? {
          $or: [
            { certificateId: rx },
            { title: rx },
            { studentName: rx },
            { studentId: rx },
            ...(matchingStudentIds.length > 0 ? [{ student: { $in: matchingStudentIds } }] : []),
          ],
        }
      : {}),
  };

  const [items, total, totalCount, publishedCount, revokedCount] = await Promise.all([
    StudentCertificate.find(filter)
      .populate("student", "name email studentId referralCode")
      .populate("issuedBy", "name email")
      .sort({ issueDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    StudentCertificate.countDocuments(filter),
    StudentCertificate.countDocuments({}),
    StudentCertificate.countDocuments({ status: "published" }),
    StudentCertificate.countDocuments({ status: "revoked" }),
  ]);

  return apiSuccess({
    items,
    total,
    page,
    pages: Math.ceil(total / limit) || 1,
    stats: {
      total: totalCount,
      published: publishedCount,
      revoked: revokedCount,
    },
  });
});

export const POST = withApiErrors(async (request: Request) => {
  validateMutationOrigin(request);
  const actor = await requireAdminPermission("student:manage");
  await connectToDatabase();

  const body = createCertificateSchema.parse(await readJson(request));

  const student = await Student.findById(body.studentId);
  if (!student) {
    throw new ApiError("Student not found.", 404);
  }

  const cleanCertId = body.certificateId.trim().toUpperCase();

  // Validate uniqueness of certificate ID
  const duplicate = await StudentCertificate.findOne({ certificateId: cleanCertId });
  if (duplicate) {
    throw new ApiError(
      `A certificate with ID "${cleanCertId}" already exists. Please choose a unique certificate ID.`,
      409
    );
  }

  const issueDate = new Date(body.issueDate);

  const cert = await StudentCertificate.create({
    certificateId: cleanCertId,
    student: student._id,
    studentUser: student.user,
    studentName: student.name,
    studentEmail: student.email,
    studentId: student.studentId,
    title: body.title,
    description: body.description?.trim() || undefined,
    issueDate,
    fileUrl: body.fileUrl,
    fileName: body.fileName,
    fileType: body.fileType,
    fileSize: body.fileSize,
    status: body.status,
    issuedBy: actor._id,
    issuedByName: actor.name,
    auditLog: [
      {
        action: "certificate_issued",
        performedBy: actor._id,
        performedByName: actor.name,
        timestamp: new Date(),
        details: `Certificate "${body.title}" [${cleanCertId}] assigned to ${student.name}. Status: ${body.status}.`,
      },
    ],
  });

  await recordCommittedActivity({
    actorId: actor._id,
    action: "student.certificate_issued",
    resourceType: "StudentCertificate",
    resourceId: cert._id.toString(),
  });

  // Notify student
  await notifyUser({
    userId: student.user.toString(),
    type: "certificate_awarded",
    title: `Certificate of Achievement Awarded`,
    message: `You have been awarded "${body.title}" (${cleanCertId}). You can now view and download it in your portal.`,
    href: "/student/certificate",
  });

  return apiSuccess(cert, `Certificate ${cleanCertId} successfully assigned to ${student.name}.`, 201);
});

