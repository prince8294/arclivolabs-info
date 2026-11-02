import { Types } from "mongoose";
import { apiSuccess, ApiError, withApiErrors } from "@/lib/api-response";
import { connectToDatabase } from "@/lib/db";
import { getCurrentUser, hasElevatedRole } from "@/lib/permissions";
import Brand from "@/models/Brand";
import Campaign from "@/models/Campaign";
import Creator from "@/models/Creator";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withApiErrors(async (_request, context: RouteContext) => {
  const user = await getCurrentUser();
  const { id } = await context.params;
  if (!Types.ObjectId.isValid(id)) throw new ApiError("Campaign was not found.", 404);
  await connectToDatabase();

  let filter: Record<string, unknown> = { _id: id };
  const isManager = hasElevatedRole(user.role);
  if (user.role === "brand") {
    const brand = await Brand.findOne({ user: user._id }).select("_id").lean();
    if (!brand) throw new ApiError("Campaign was not found or is not accessible.", 404);
    filter = { _id: id, brand: brand._id };
  } else if (user.role === "creator") {
    const creator = await Creator.findOne({ user: user._id }).select("_id").lean();
    if (!creator) throw new ApiError("Campaign was not found or is not accessible.", 404);
    filter = { _id: id, selectedCreators: creator._id, status: { $in: ["approved", "active"] } };
  } else if (!isManager) {
    throw new ApiError("You do not have permission to view campaigns.", 403);
  }
  const campaign = await Campaign.findOne(filter)
    .select(isManager || user.role === "brand" ? "-__v" : "title description objective industry platforms contentTypes targetLocation startDate endDate status brand")
    .populate("brand", "companyName companyLogo")
    .populate("selectedCreators", "fullName profileImage primaryPlatform")
    .lean();
  if (!campaign) throw new ApiError("Campaign was not found or is not accessible.", 404);
  return apiSuccess({ campaign });
});
