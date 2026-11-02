import { apiSuccess, ApiError, withApiErrors } from "@/lib/api-response";
import { connectToDatabase } from "@/lib/db";
import { objectId, requireOwnedCreator } from "@/lib/portal-access";
import { requireRole } from "@/lib/permissions";
import { readJson, validateMutationOrigin } from "@/lib/request";
import { portfolioItemSchema } from "@/lib/validations/portal";
import PortfolioItem from "@/models/PortfolioItem";

export const PATCH = withApiErrors(async (request, context: { params: Promise<{ id: string }> }) => {
  validateMutationOrigin(request);
  const user = await requireRole(["creator"]);
  const creator = await requireOwnedCreator(user);
  const { id } = await context.params;
  const body = portfolioItemSchema.partial().strict().parse(await readJson(request));
  await connectToDatabase();
  const item = await PortfolioItem.findOneAndUpdate({ _id: objectId(id), creator: creator._id }, { $set: body }, { returnDocument: "after", runValidators: true, strict: "throw" }).lean();
  if (!item) throw new ApiError("Portfolio item was not found.", 404);
  return apiSuccess({ item }, "Portfolio item updated.");
});

export const DELETE = withApiErrors(async (request, context: { params: Promise<{ id: string }> }) => {
  validateMutationOrigin(request);
  const user = await requireRole(["creator"]);
  const creator = await requireOwnedCreator(user);
  const { id } = await context.params;
  await connectToDatabase();
  const result = await PortfolioItem.findOneAndDelete({ _id: objectId(id), creator: creator._id });
  if (!result) throw new ApiError("Portfolio item was not found.", 404);
  return apiSuccess({ id }, "Portfolio item deleted.");
});
