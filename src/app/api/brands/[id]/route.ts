import { Types } from "mongoose";
import { apiSuccess, ApiError, withApiErrors } from "@/lib/api-response";
import { connectToDatabase } from "@/lib/db";
import { getCurrentUser, hasElevatedRole } from "@/lib/permissions";
import Brand from "@/models/Brand";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withApiErrors(async (_request, context: RouteContext) => {
  const user = await getCurrentUser();
  const { id } = await context.params;
  if (!Types.ObjectId.isValid(id)) throw new ApiError("Brand was not found.", 404);
  await connectToDatabase();
  const filter = hasElevatedRole(user.role)
    ? { _id: id }
    : { _id: id, user: user._id };
  const brand = await Brand.findOne(filter).select("-__v").lean();
  if (!brand) throw new ApiError("Brand was not found or is not accessible.", 404);
  return apiSuccess({
    brand: {
      id: brand._id.toString(),
      companyName: brand.companyName,
      contactPerson: brand.contactPerson,
      email: brand.email,
      phone: brand.phone,
      website: brand.website,
      industry: brand.industry,
      description: brand.description,
      companyLogo: brand.companyLogo,
      location: brand.location,
      country: brand.country,
      socialMediaLinks: brand.socialMediaLinks,
      status: brand.status,
      user: brand.user.toString(),
      createdAt: brand.createdAt,
      updatedAt: brand.updatedAt,
    },
  });
});
