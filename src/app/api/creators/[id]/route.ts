import { Types } from "mongoose";
import { apiSuccess, ApiError, withApiErrors } from "@/lib/api-response";
import { connectToDatabase } from "@/lib/db";
import { getCurrentUser, hasElevatedRole } from "@/lib/permissions";
import { readJson, validateMutationOrigin } from "@/lib/request";
import { creatorProfileAdminUpdateSchema, creatorProfileUpdateSchema } from "@/lib/validations/campaign";
import Creator from "@/models/Creator";
import { getClientAddress } from "@/lib/rate-limit";
import { recordCommittedActivity } from "@/services/activity.service";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withApiErrors(async (_request, context: RouteContext) => {
  const { id } = await context.params;
  if (!Types.ObjectId.isValid(id)) throw new ApiError("Creator was not found.", 404);
  await connectToDatabase();
  const creator = await Creator.findOne({ _id: id, approvalStatus: "approved" })
    .select("fullName bio profileImage instagramUsername instagramUrl youtubeChannel youtubeUrl otherSocialPlatforms primaryPlatform contentCategories followers averageViews engagementRate location country languages portfolioUrl availability verificationStatus")
    .lean();
  if (!creator) throw new ApiError("Creator was not found.", 404);
  return apiSuccess({
    creator: {
      id: creator._id.toString(),
      fullName: creator.fullName,
      bio: creator.bio,
      profileImage: creator.profileImage,
      instagramUsername: creator.instagramUsername,
      instagramUrl: creator.instagramUrl,
      youtubeChannel: creator.youtubeChannel,
      youtubeUrl: creator.youtubeUrl,
      otherSocialPlatforms: creator.otherSocialPlatforms,
      primaryPlatform: creator.primaryPlatform,
      contentCategories: creator.contentCategories,
      followers: creator.followers,
      averageViews: creator.averageViews,
      engagementRate: creator.engagementRate,
      location: creator.location,
      country: creator.country,
      languages: creator.languages,
      portfolioUrl: creator.portfolioUrl,
      availability: creator.availability,
      verificationStatus: creator.verificationStatus,
    },
  });
});

export const PATCH = withApiErrors(async (request, context: RouteContext) => {
  validateMutationOrigin(request);
  const { id } = await context.params;
  if (!Types.ObjectId.isValid(id)) throw new ApiError("Creator was not found.", 404);
  const user = await getCurrentUser();
  const isAdmin = hasElevatedRole(user.role);
  const changes = isAdmin
    ? creatorProfileAdminUpdateSchema.parse(await readJson(request))
    : creatorProfileUpdateSchema.parse(await readJson(request));
  await connectToDatabase();
  const filter = isAdmin ? { _id: id } : { _id: id, user: user._id };
  if (!isAdmin && user.role !== "creator") {
    throw new ApiError("You do not have permission to update creator profiles.", 403);
  }
  const creator = await Creator.findOneAndUpdate(filter, { $set: changes }, { returnDocument: "after", runValidators: true })
    .select("fullName bio profileImage primaryPlatform contentCategories followers location country availability approvalStatus verificationStatus featured");
  if (!creator) throw new ApiError("Creator was not found or is not accessible.", 404);
  await recordCommittedActivity({
    actorId: user.id,
    action: isAdmin ? "creator.reviewed" : "creator.profile_updated",
    resourceType: "Creator",
    resourceId: creator.id,
    ipAddress: getClientAddress(request),
  });
  return apiSuccess({ creator }, "Creator profile updated successfully.");
});
