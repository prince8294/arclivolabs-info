import { apiSuccess, ApiError, withApiErrors } from "@/lib/api-response";
import { requireRole } from "@/lib/permissions";
import { connectToDatabase } from "@/lib/db";
import Student from "@/models/Student";
import StudentCertificate from "@/models/StudentCertificate";

export const GET = withApiErrors(async () => {
  const user = await requireRole(["student"]);
  await connectToDatabase();

  const student = await Student.findOne({ user: user._id }).lean();
  if (!student) {
    throw new ApiError("Student profile not found.", 404);
  }

  const certificates = await StudentCertificate.find({
    student: student._id,
    status: "published",
  })
    .sort({ issueDate: -1, createdAt: -1 })
    .select("certificateId title description issueDate fileUrl fileName fileType fileSize createdAt")
    .lean();

  return apiSuccess({
    certificates,
    total: certificates.length,
    studentName: student.name,
    studentId: student.studentId,
  });
});

