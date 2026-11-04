import { randomUUID } from "node:crypto";
import { auth } from "@/lib/auth";
import { apiSuccess, ApiError, withApiErrors } from "@/lib/api-response";
import { connectToDatabase } from "@/lib/db";
import { enforceRateLimit, getClientAddress } from "@/lib/rate-limit";
import { readJson, validateMutationOrigin } from "@/lib/request";
import { creatorApplicationSchema } from "@/lib/validations/public";
import Creator from "@/models/Creator";
import CreatorApplication from "@/models/CreatorApplication";
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

  const socialChecks = [
    { socialProfile: body.socialProfile.trim().toLowerCase() },
    ...(body.platform === "Instagram" ? [{ instagramUsername: normalizeUsername(body.socialProfile) }] : []),
    ...(body.platform === "YouTube" ? [{ youtubeChannel: normalizeUsername(body.socialProfile) }] : []),
  ];
  const duplicate = await CreatorApplication.exists({
    $or: [...(email ? [{ email }] : []), ...socialChecks],
  });
  const creatorChecks = [
    ...(email ? [{ email }] : []),
    ...(body.platform === "Instagram" ? [{ instagramUsername: normalizeUsername(body.socialProfile) }] : []),
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
    ...(body.platform === "Instagram" ? { instagramUsername: normalizeUsername(body.socialProfile) } : {}),
    ...(body.platform === "YouTube" ? { youtubeChannel: normalizeUsername(body.socialProfile) } : {}),
    primaryPlatform: body.platform,
    followers: body.followers,
    user: session?.user?.id,
  });
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
