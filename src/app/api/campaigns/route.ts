import { apiSuccess, ApiError, withApiErrors } from "@/lib/api-response";
import { connectToDatabase } from "@/lib/db";
import { getCurrentUser, hasElevatedRole } from "@/lib/permissions";
import { readJson, validateMutationOrigin } from "@/lib/request";
import { getClientAddress } from "@/lib/rate-limit";
import { campaignCreateSchema } from "@/lib/validations/campaign";
import { recordCommittedActivity } from "@/services/activity.service";
import { paginationSchema } from "@/lib/validations/public";
import Brand from "@/models/Brand";
import Campaign from "@/models/Campaign";
import Creator from "@/models/Creator";

export const GET = withApiErrors(async (request) => {
  const user = await getCurrentUser();
  const { page, limit } = paginationSchema.parse(Object.fromEntries(new URL(request.url).searchParams));
  await connectToDatabase();

  let filter: Record<string, unknown> = {};
  if (hasElevatedRole(user.role)) {
    filter = {};
  } else if (user.role === "brand") {
    const brand = await Brand.findOne({ user: user._id }).select("_id").lean();
    if (!brand) return apiSuccess({ campaigns: [], pagination: { page, limit, total: 0, pages: 0 } });
    filter = { brand: brand._id };
  } else if (user.role === "creator") {
    const creator = await Creator.findOne({ user: user._id }).select("_id").lean();
    if (!creator) return apiSuccess({ campaigns: [], pagination: { page, limit, total: 0, pages: 0 } });
    filter = { selectedCreators: creator._id, status: { $in: ["approved", "active"] } };
  } else {
    throw new ApiError("You do not have permission to view campaigns.", 403);
  }
  const [campaigns, total] = await Promise.all([
    Campaign.find(filter)
      .select(hasElevatedRole(user.role) || user.role === "brand"
        ? "-__v"
        : "title description objective industry platforms contentTypes targetLocation startDate endDate status brand")
      .populate("brand", "companyName companyLogo")
      .populate("selectedCreators", "fullName profileImage primaryPlatform")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Campaign.countDocuments(filter),
  ]);
  return apiSuccess({ campaigns, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

export const POST = withApiErrors(async (request) => {
  validateMutationOrigin(request);
  const user = await getCurrentUser();
  if (user.role !== "brand" && !hasElevatedRole(user.role)) {
    throw new ApiError("You do not have permission to create campaigns.", 403);
  }
  const input = campaignCreateSchema.parse(await readJson(request));
  await connectToDatabase();

  let brandId = input.brandId;
  if (user.role === "brand") {
    const brand = await Brand.findOne({ user: user._id, status: "active" }).select("_id").lean();
    if (!brand) throw new ApiError("An approved brand profile is required to create campaigns.", 403);
    brandId = brand._id.toString();
  }
  if (!brandId) throw new ApiError("A brand profile is required for this campaign.", 400);
  const brandExists = await Brand.exists({ _id: brandId });
  if (!brandExists) throw new ApiError("Brand was not found.", 404);

  const campaign = await Campaign.create({
    title: input.title,
    brand: brandId,
    description: input.description,
    objective: input.objective,
    industry: input.industry,
    platforms: input.platforms,
    contentTypes: input.contentTypes,
    targetAudience: input.targetAudience,
    targetLocation: input.targetLocation,
    budget: input.budget,
    startDate: input.startDate,
    endDate: input.endDate,
    requiredCreators: input.requiredCreators,
    deliverables: input.deliverables,
    createdBy: user._id,
    status: "draft",
  });
  await recordCommittedActivity({
    actorId: user.id,
    action: "campaign.created",
    resourceType: "Campaign",
    resourceId: campaign.id,
    ipAddress: getClientAddress(request),
  });
  return apiSuccess({ id: campaign.id, title: campaign.title, status: campaign.status }, "Campaign draft created.", 201);
});
