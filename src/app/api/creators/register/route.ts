import { randomUUID } from "node:crypto";
import { auth } from "@/lib/auth";
import { apiSuccess, ApiError, withApiErrors } from "@/lib/api-response";
import { connectToDatabase } from "@/lib/db";
import { enforceRateLimit, getClientAddress } from "@/lib/rate-limit";
import { readJson, validateMutationOrigin } from "@/lib/request";
import { creatorApplicationSchema } from "@/lib/validations/public";
import Creator from "@/models/Creator";
import CreatorApplication from "@/models/CreatorApplication";
import Student from "@/models/Student";
import StudentReferral from "@/models/StudentReferral";
import { normalizeInstagramHandle } from "@/lib/commission";
import { recordCommittedActivity } from "@/services/activity.service";
import { notifyAdminUsers } from "@/services/notification.service";

export const POST = withApiErrors(async (request) => {
  validateMutationOrigin(request);
  const address = getClientAddress(request);
  await enforceRateLimit({ scope: "creator-application-ip", identity: address, limit: 9, windowMs: 60 * 60 * 1000 });
  const body = creatorApplicationSchema.parse(await readJson(request));
  const contactIdentity = body.email ?? body.phone;
  if (!contactIdentity) throw new ApiError("Add an email address or phone number so our team can contact you.", 400);
  await enforceRateLimit({ scope: "creator-application-contact", identity: contactIdentity, limit: 9, windowMs: 24 * 60 * 60 * 1000 });

  await connectToDatabase();
  const session = await auth();
  if (session?.user?.role === "creator" && body.email && session.user.email?.toLowerCase() !== body.email) {
    throw new ApiError("Use the email address associated with your creator account.", 403);
  }
  const email = body.email ?? (session?.user?.role === "creator" ? session.user.email?.toLowerCase() : undefined);

  const instagramHandle = body.platform === "Instagram" ? normalizeInstagramHandle(body.socialProfile) : normalizeUsername(body.socialProfile);

  // Check duplicate across StudentReferral to enforce:
  // "One Instagram account can only be attributed to one student.
  // Prevent duplicate commission for the same creator."
  if (body.platform === "Instagram" && instagramHandle) {
    const existingReferral = await StudentReferral.findOne({ creatorHandle: instagramHandle });
    if (existingReferral) {
      throw new ApiError("This Instagram account has already been registered or attributed to an ambassador.", 409);
    }
  }

  const socialChecks = [
    { socialProfile: body.socialProfile.trim().toLowerCase() },
    ...(body.platform === "Instagram" ? [{ instagramUsername: instagramHandle }] : []),
    ...(body.platform === "YouTube" ? [{ youtubeChannel: normalizeUsername(body.socialProfile) }] : []),
  ];
  const duplicate = await CreatorApplication.exists({
    $or: [...(email ? [{ email }] : []), ...socialChecks],
  });
  const creatorChecks = [
    ...(email ? [{ email }] : []),
    ...(body.platform === "Instagram" ? [{ instagramUsername: instagramHandle }] : []),
    ...(body.platform === "YouTube" ? [{ youtubeChannel: normalizeUsername(body.socialProfile) }] : []),
    ...(!["Instagram", "YouTube"].includes(body.platform)
      ? [{ otherSocialPlatforms: { $elemMatch: { platform: body.platform, username: normalizeUsername(body.socialProfile) } } }]
      : []),
  ];
  const existingCreator = creatorChecks.length > 0 ? await Creator.exists({ $or: creatorChecks }) : null;
  if (duplicate || existingCreator) {
    throw new ApiError("An application or creator profile already uses this email or social account.", 409);
  }

  const application = await CreatorApplication.create({
    referenceId: `CR-${randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`,
    name: body.name,
    email,
    phone: body.phone,
    socialProfile: body.socialProfile.trim().toLowerCase(),
    ...(body.platform === "Instagram" ? { instagramUsername: instagramHandle } : {}),
    ...(body.platform === "YouTube" ? { youtubeChannel: normalizeUsername(body.socialProfile) } : {}),
    primaryPlatform: body.platform,
    followers: body.followers,
    user: session?.user?.id,
  });

  // If referred by a student ambassador, record the referral permanently
  if (body.referralCode) {
    const cleanReferralCode = body.referralCode.trim().toUpperCase();
    const student = await Student.findOne({ referralCode: cleanReferralCode });
    if (student && student.status === "active") {
      await StudentReferral.create({
        student: student._id,
        referralCode: student.referralCode,
        creatorName: body.name,
        creatorHandle: instagramHandle,
        platform: body.platform,
        category: "General",
        followers: body.followers,
        status: "pending",
        registrationDate: new Date(),
        creatorApplication: application._id,
      });

      // Update student referral counters
      student.totalCreatorsReferred = (student.totalCreatorsReferred || 0) + 1;
      student.pendingVerification = (student.pendingVerification || 0) + 1;
      await student.save();
    }
  }

  await recordCommittedActivity({
    actorId: session?.user?.id,
    action: "creator.application_submitted",
    resourceType: "CreatorApplication",
    resourceId: application.id,
    ipAddress: address,
  });
  await notifyAdminUsers({
    type: "creator_application",
    title: "New creator application",
    message: `${application.name} submitted an application for review.`,
    href: "/admin/creators?type=creator-applications",
    data: { referenceId: application.referenceId },
  });

  return apiSuccess(
    { referenceId: application.referenceId, approvalStatus: application.approvalStatus },
    "Creator application received for review.",
    201,
  );
});

function normalizeUsername(value: string): string {
  const normalized = value.trim().replace(/^@/, "").toLowerCase();
  const urlHandle = normalized.match(/^https?:\/\/(?:www\.)?[^/]+\/(?:@|channel\/|c\/|user\/)?([^/?#]+)/);
  return urlHandle?.[1] ?? normalized;
}
