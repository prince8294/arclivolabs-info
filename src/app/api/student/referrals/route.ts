import { ApiError, apiSuccess, withApiErrors } from "@/lib/api-response";
import { requireRole } from "@/lib/permissions";
import { connectToDatabase } from "@/lib/db";
import Student from "@/models/Student";
import StudentReferral from "@/models/StudentReferral";

export const GET = withApiErrors(async (request) => {
  const user = await requireRole(["student"]);
  await connectToDatabase();

  const student = await Student.findOne({ user: user._id }).lean();
  if (!student || student.status !== "active") {
    throw new ApiError("Student account not active.", 403);
  }

  const url = new URL(request.url);
  const status = url.searchParams.get("status")?.trim() || "all";

  const filter: Record<string, unknown> = {
    student: student._id,
    ...(status && status !== "all" ? { status } : {}),
  };

  const referrals = await StudentReferral.find(filter)
    .select("creatorName creatorHandle platform category followers confirmedFollowers status verifiedAt commissionEarned commissionTierLabel currency createdAt registrationDate")
    .sort({ createdAt: -1 })
    .lean();

  return apiSuccess({
    referrals,
    referralCode: student.referralCode,
    total: referrals.length,
  });
});

