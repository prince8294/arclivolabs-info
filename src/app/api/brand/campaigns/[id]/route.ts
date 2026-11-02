import { apiSuccess, ApiError, withApiErrors } from "@/lib/api-response";
import { requireRole } from "@/lib/permissions";
import { objectId, requireOwnedBrand } from "@/lib/portal-access";
import { connectToDatabase } from "@/lib/db";
import Campaign from "@/models/Campaign";
import CampaignInvitation from "@/models/CampaignInvitation";
import Collaboration from "@/models/Collaboration";
import Deliverable from "@/models/Deliverable";
import { campaignPortalSchema } from "@/lib/validations/portal";
import { readJson, validateMutationOrigin } from "@/lib/request";

export const GET = withApiErrors(async (_request, context: { params: Promise<{ id: string }> }) => {
  const user = await requireRole(["brand"]);
  const brand = await requireOwnedBrand(user);
  const { id } = await context.params;
  await connectToDatabase();
  const campaign = await Campaign.findOne({ _id: objectId(id), brand: brand._id }).select("-notes -__v").populate("selectedCreators", "fullName profileImage primaryPlatform").lean();
  if (!campaign) throw new ApiError("Campaign was not found.", 404);
  const [invitations, collaborations, deliverables] = await Promise.all([
    CampaignInvitation.find({ campaign: campaign._id, brand: brand._id }).populate("creator", "fullName profileImage primaryPlatform").sort({ createdAt: -1 }).lean(),
    Collaboration.find({ campaign: campaign._id, brand: brand._id }).populate("creator", "fullName profileImage primaryPlatform").sort({ createdAt: -1 }).lean(),
    Deliverable.find({ campaign: campaign._id, brand: brand._id }).select("-revisionHistory").populate("creator", "fullName").sort({ dueAt: 1 }).lean(),
  ]);
  return apiSuccess({ campaign, invitations, collaborations, deliverables });
});

export const PATCH = withApiErrors(async (request, context: { params: Promise<{ id: string }> }) => {
  validateMutationOrigin(request);
  const user = await requireRole(["brand"]);
  const brand = await requireOwnedBrand(user);
  const { id } = await context.params;
  const input = await readJson(request);
  if (typeof input !== "object" || input === null || Array.isArray(input)) throw new ApiError("A JSON object is required.", 400);
  const payload = input as Record<string, unknown>;
  if (payload.status === "pending") {
    if (Object.keys(payload).length !== 1) throw new ApiError("Campaign approval fields cannot be changed by a brand.", 403);
    const campaign = await Campaign.findOneAndUpdate(
      { _id: objectId(id), brand: brand._id, status: "draft" },
      { $set: { status: "pending" } },
      { returnDocument: "after", runValidators: true },
    ).select("-notes -__v").lean();
    if (!campaign) throw new ApiError("Campaign was not found or is no longer an editable draft.", 404);
    return apiSuccess({ campaign }, "Campaign submitted for review.");
  }
  if ("status" in payload || "brand" in payload || "selectedCreators" in payload || "brandFeedback" in payload) {
    throw new ApiError("Brands cannot change campaign approval, ownership, creator assignment, or admin feedback fields.", 403);
  }
  const body = campaignPortalSchema.parse(payload);
  const campaign = await Campaign.findOneAndUpdate(
    { _id: objectId(id), brand: brand._id, status: "draft" },
    { $set: body },
    { returnDocument: "after", runValidators: true, strict: "throw" },
  ).select("-notes -__v").lean();
  if (!campaign) throw new ApiError("Campaign was not found or is no longer an editable draft.", 404);
  return apiSuccess({ campaign }, "Campaign draft updated.");
});
