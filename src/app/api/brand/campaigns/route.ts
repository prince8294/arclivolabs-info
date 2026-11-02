import { apiSuccess, ApiError, withApiErrors } from "@/lib/api-response";
import { requireRole } from "@/lib/permissions";
import { requireOwnedBrand } from "@/lib/portal-access";
import { readJson, validateMutationOrigin } from "@/lib/request";
import { connectToDatabase } from "@/lib/db";
import { campaignPortalSchema } from "@/lib/validations/portal";
import Campaign from "@/models/Campaign";

export const GET = withApiErrors(async (request) => {
  const user = await requireRole(["brand"]);
  const brand = await requireOwnedBrand(user);
  await connectToDatabase();
  const url = new URL(request.url);
  const page = Math.max(1, Math.min(100000, Number(url.searchParams.get("page") ?? 1)));
  const limit = Math.max(1, Math.min(50, Number(url.searchParams.get("limit") ?? 20)));
  const [campaigns, total] = await Promise.all([
    Campaign.find({ brand: brand._id }).select("-notes -__v").populate("selectedCreators", "fullName profileImage primaryPlatform").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Campaign.countDocuments({ brand: brand._id }),
  ]);
  return apiSuccess({ campaigns, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

export const POST = withApiErrors(async (request) => {
  validateMutationOrigin(request);
  const user = await requireRole(["brand"]);
  const brand = await requireOwnedBrand(user, { active: true });
  const body = campaignPortalSchema.parse(await readJson(request));
  await connectToDatabase();
  const campaign = await Campaign.create({ ...body, brand: brand._id, createdBy: user._id, status: "pending", selectedCreators: [] });
  return apiSuccess({ campaign: { id: campaign.id, title: campaign.title, status: campaign.status } }, "Campaign submitted for admin review.", 201);
});

export const PATCH = withApiErrors(async (request) => {
  validateMutationOrigin(request);
  const user = await requireRole(["brand"]);
  const brand = await requireOwnedBrand(user);
  const input = await readJson(request) as Record<string, unknown>;
  const id = typeof input.id === "string" ? input.id : "";
  delete input.id;
  const body = campaignPortalSchema.partial().strict().parse(input);
  if (!Object.keys(body).length) throw new ApiError("Provide campaign fields to update.", 400);
  await connectToDatabase();
  const campaign = await Campaign.findOneAndUpdate(
    { _id: id, brand: brand._id, status: "draft" },
    { $set: body },
    { returnDocument: "after", runValidators: true, strict: "throw" },
  ).select("-notes -__v").lean();
  if (!campaign) throw new ApiError("Only your draft campaigns can be edited.", 404);
  return apiSuccess({ campaign }, "Campaign draft updated.");
});
