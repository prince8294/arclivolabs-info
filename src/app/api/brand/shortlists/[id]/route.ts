import { apiSuccess, ApiError, withApiErrors } from "@/lib/api-response";
import { Types } from "mongoose";
import { requireRole } from "@/lib/permissions";
import { objectId, requireOwnedBrand } from "@/lib/portal-access";
import { connectToDatabase } from "@/lib/db";
import { readJson, validateMutationOrigin } from "@/lib/request";
import { shortlistUpdateSchema } from "@/lib/validations/portal";
import Creator from "@/models/Creator";
import CreatorShortlist from "@/models/CreatorShortlist";

export const GET = withApiErrors(async (_request, context: { params: Promise<{ id: string }> }) => {
  const user = await requireRole(["brand"]);
  const brand = await requireOwnedBrand(user);
  const { id } = await context.params;
  await connectToDatabase();
  const shortlist = await CreatorShortlist.findOne({ _id: objectId(id), brand: brand._id })
    .populate("creators.creator", "fullName profileImage primaryPlatform contentCategories followers averageViews engagementRate location verificationStatus")
    .lean();
  if (!shortlist) throw new ApiError("Shortlist was not found.", 404);
  return apiSuccess({ shortlist });
});

export const PATCH = withApiErrors(async (request, context: { params: Promise<{ id: string }> }) => {
  validateMutationOrigin(request);
  const user = await requireRole(["brand"]);
  const brand = await requireOwnedBrand(user);
  const { id } = await context.params;
  const body = shortlistUpdateSchema.parse(await readJson(request));
  await connectToDatabase();
  const filter = { _id: objectId(id), brand: brand._id };
  const existing = await CreatorShortlist.findOne(filter);
  if (!existing) throw new ApiError("Shortlist was not found.", 404);

  if (body.action === "rename") existing.name = body.name;
  if (body.action === "add") {
    const creator = await Creator.findOne({ _id: body.creatorId, approvalStatus: "approved", availability: "available" }).select("_id");
    if (!creator) throw new ApiError("Creator was not found or is unavailable.", 404);
    if (!existing.creators.some((entry: { creator: Types.ObjectId }) => entry.creator.toString() === body.creatorId)) {
      existing.creators.push({ creator: creator._id, note: body.note });
    }
  }
  if (body.action === "remove") {
    existing.creators = existing.creators.filter((entry: { creator: Types.ObjectId }) => entry.creator.toString() !== body.creatorId);
  }
  if (body.action === "note") {
    const entry = existing.creators.find((item: { creator: Types.ObjectId; note?: string }) => item.creator.toString() === body.creatorId);
    if (!entry) throw new ApiError("Creator is not in this shortlist.", 404);
    entry.note = body.note;
  }
  await existing.save();
  return apiSuccess({ shortlist: existing }, "Shortlist updated.");
});

export const DELETE = withApiErrors(async (request, context: { params: Promise<{ id: string }> }) => {
  validateMutationOrigin(request);
  const user = await requireRole(["brand"]);
  const brand = await requireOwnedBrand(user);
  const { id } = await context.params;
  await connectToDatabase();
  const result = await CreatorShortlist.findOneAndDelete({ _id: objectId(id), brand: brand._id });
  if (!result) throw new ApiError("Shortlist was not found.", 404);
  return apiSuccess({ id }, "Shortlist deleted.");
});
