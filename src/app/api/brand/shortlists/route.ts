import { apiSuccess, withApiErrors } from "@/lib/api-response";
import { requireRole } from "@/lib/permissions";
import { requireOwnedBrand } from "@/lib/portal-access";
import { readJson, validateMutationOrigin } from "@/lib/request";
import { connectToDatabase } from "@/lib/db";
import { shortlistCreateSchema } from "@/lib/validations/portal";
import CreatorShortlist from "@/models/CreatorShortlist";

export const GET = withApiErrors(async () => {
  const user = await requireRole(["brand"]);
  const brand = await requireOwnedBrand(user);
  await connectToDatabase();
  const shortlists = await CreatorShortlist.find({ brand: brand._id })
    .populate("creators.creator", "fullName profileImage primaryPlatform contentCategories followers engagementRate location verificationStatus")
    .sort({ updatedAt: -1 }).lean();
  return apiSuccess({ shortlists });
});

export const POST = withApiErrors(async (request) => {
  validateMutationOrigin(request);
  const user = await requireRole(["brand"]);
  const brand = await requireOwnedBrand(user);
  const body = shortlistCreateSchema.parse(await readJson(request));
  await connectToDatabase();
  const shortlist = await CreatorShortlist.create({ brand: brand._id, name: body.name, creators: [] });
  return apiSuccess({ shortlist }, "Shortlist created.", 201);
});
