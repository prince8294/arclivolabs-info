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
  await enforceRateLimit({ scope: "creator-application-email", identity: body.email, limit: 9, windowMs: 24 * 60 * 60 * 1000 });

  await connectToDatabase();
  const session = await auth();
  if (session?.user?.role === "creator" && session.user.email?.toLowerCase() !== body.email) {
    throw new ApiError("Use the email address associated with your creator account.", 403);
  }

  const socialChecks = [
    ...(body.instagram ? [{ instagramUsername: normalizeUsername(body.instagram) }] : []),
    ...(body.youtube ? [{ youtubeChannel: normalizeUsername(body.youtube) }] : []),
  ];
  const duplicate = await CreatorApplication.exists({
    $or: [{ email: body.email }, ...socialChecks],
  });
  const existingCreator = await Creator.exists({
    $or: [
      { email: body.email },
      ...(body.instagram ? [{ instagramUsername: normalizeUsername(body.instagram) }] : []),
      ...(body.youtube ? [{ youtubeChannel: normalizeUsername(body.youtube) }] : []),
    ],
  });
  if (duplicate || existingCreator) {
    throw new ApiError("An application or creator profile already uses this email or social account.", 409);
  }

  const application = await CreatorApplication.create({
    referenceId: `CR-${randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`,
    name: body.name,
    email: body.email,
    phone: body.phone,
    instagramUsername: body.instagram ? normalizeUsername(body.instagram) : undefined,
    youtubeChannel: body.youtube ? normalizeUsername(body.youtube) : undefined,
    primaryPlatform: body.platform,
    contentCategory: body.category,
    followers: body.followers,
    location: body.location,
    portfolioUrl: body.portfolio || undefined,
    introduction: body.introduction,
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
  return value.trim().replace(/^@/, "").toLowerCase();
}
