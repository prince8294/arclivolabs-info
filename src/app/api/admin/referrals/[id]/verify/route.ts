import { z } from "zod";
import { apiSuccess, ApiError, withApiErrors } from "@/lib/api-response";
import { requireAdminPermission } from "@/lib/admin/permissions";
import { connectToDatabase } from "@/lib/db";
import { readJson, validateMutationOrigin } from "@/lib/request";
import StudentReferral from "@/models/StudentReferral";
import Student from "@/models/Student";
import { getOrInitializeCommissionRules, calculateCommissionForFollowers } from "@/lib/commission";
import { recalculateStudentFinancials } from "@/lib/student-payment";

const verifySchema = z.object({
  confirmedFollowers: z.number().int().min(0).optional(),
  overrideCommissionAmount: z.number().min(0).optional(),
  notes: z.string().trim().max(500).optional(),
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

  // Prevent duplicate verification / duplicate commission
  if (referral.status === "verified" && referral.commissionApproved) {
    throw new ApiError("This creator has already been verified and commission has already been approved.", 400);
  }

  const body = verifySchema.parse(await readJson(request));
  const finalFollowers = body.confirmedFollowers !== undefined ? body.confirmedFollowers : referral.followers;

  const student = await Student.findById(referral.student);
  const customRates = student?.hasCustomCommissionRates ? student.customCommissionRates : undefined;

  // Calculate commission based on student custom rates or DB rules
  const rules = await getOrInitializeCommissionRules();
  const calculated = calculateCommissionForFollowers(finalFollowers, rules, customRates);

  const amount = body.overrideCommissionAmount !== undefined ? body.overrideCommissionAmount : calculated.amount;
  const label = body.overrideCommissionAmount !== undefined ? `${calculated.label} (Adjusted: ₹${amount})` : calculated.label;
  const currency = calculated.currency || "INR";

  // Update referral record
  referral.status = "verified";
  referral.confirmedFollowers = finalFollowers;
  referral.commissionEarned = amount;
  referral.commissionApproved = true;
  referral.commissionApprovedAt = new Date();
  referral.commissionTierLabel = label;
  referral.currency = currency;
  referral.verifiedAt = new Date();
  referral.verifiedBy = actor._id;
  if (body.notes) {
    referral.notes = body.notes;
  }

  // Add audit record
  const adjustmentNote = body.overrideCommissionAmount !== undefined
    ? ` [Manual commission adjustment by ${actor.name} from calculated ₹${calculated.amount} to ₹${amount}]`
    : "";

  referral.auditLog.push({
    action: "creator_verified_commission_approved",
    performedBy: actor._id,
    performedByName: actor.name,
    timestamp: new Date(),
    details: `Verified by ${actor.name}. Confirmed followers: ${finalFollowers.toLocaleString()}. Commission: ${currency} ${amount} (${label}).${adjustmentNote}`,
  });

  await referral.save();

  // Recalculate referring student's real metrics and balances
  if (student) {
    const [totalReferred, verifiedCount, pendingCount, rejectedCount] = await Promise.all([
      StudentReferral.countDocuments({ student: student._id }),
      StudentReferral.countDocuments({ student: student._id, status: "verified" }),
      StudentReferral.countDocuments({ student: student._id, status: "pending" }),
      StudentReferral.countDocuments({ student: student._id, status: "rejected" }),
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
      confirmedFollowers: referral.confirmedFollowers,
      commissionEarned: referral.commissionEarned,
      commissionTierLabel: referral.commissionTierLabel,
      referringStudentName: student?.name,
    },
    `Creator @${referral.creatorHandle} verified successfully. Commission of ₹${amount} approved for ${student?.name || "student"}.`
  );
});
