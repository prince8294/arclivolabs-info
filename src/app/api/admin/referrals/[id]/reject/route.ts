import { z } from "zod";
import { apiSuccess, ApiError, withApiErrors } from "@/lib/api-response";
import { requireAdminPermission } from "@/lib/admin/permissions";
import { connectToDatabase } from "@/lib/db";
import { readJson, validateMutationOrigin } from "@/lib/request";
import StudentReferral from "@/models/StudentReferral";
import Student from "@/models/Student";
import { recalculateStudentFinancials } from "@/lib/student-payment";

const rejectSchema = z.object({
  reason: z.string().trim().max(500).optional(),
}).strict();

type RouteContext = { params: Promise<{ id: string }> };

export const POST = withApiErrors(async (request: Request, { params }: RouteContext) => {
  validateMutationOrigin(request);
  const actor = await requireAdminPermission("student:manage");
  await connectToDatabase();
  const { id } = await params;

  const referral = await StudentReferral.findById(id);
  if (!referral) {
    throw new ApiError("Referred creator record not found.", 404);
  }

  const body = rejectSchema.parse(await readJson(request));

  referral.status = "rejected";
  referral.commissionEarned = 0;
  referral.commissionApproved = false;
  referral.rejectionReason = body.reason || "Rejected by administration";

  referral.auditLog.push({
    action: "creator_rejected",
    performedBy: actor._id,
    performedByName: actor.name,
    timestamp: new Date(),
    details: `Rejected by ${actor.name}. Reason: ${body.reason || "No specific reason provided"}`,
  });

  await referral.save();

  // Recalculate referring student's real metrics and balances
  const student = await Student.findById(referral.student);
  if (student) {
    const [totalReferred, verifiedCount, pendingCount] = await Promise.all([
      StudentReferral.countDocuments({ student: student._id }),
      StudentReferral.countDocuments({ student: student._id, status: "verified" }),
      StudentReferral.countDocuments({ student: student._id, status: "pending" }),
    ]);

    student.totalCreatorsReferred = totalReferred;
    student.verifiedCreators = verifiedCount;
    student.pendingVerification = pendingCount;
    await student.save();

    await recalculateStudentFinancials(student._id);
  }

  return apiSuccess(
    {
      referralId: referral._id,
      status: referral.status,
      rejectionReason: referral.rejectionReason,
    },
    `Creator @${referral.creatorHandle} has been rejected.`
  );
});
