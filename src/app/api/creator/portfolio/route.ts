import { apiSuccess, withApiErrors } from "@/lib/api-response";
import { connectToDatabase } from "@/lib/db";
import { requireOwnedCreator } from "@/lib/portal-access";
import { requireRole } from "@/lib/permissions";
import { readJson, validateMutationOrigin } from "@/lib/request";
import { portfolioItemSchema } from "@/lib/validations/portal";
import PortfolioItem from "@/models/PortfolioItem";

export const GET = withApiErrors(async () => {
  const user = await requireRole(["creator"]);
  const creator = await requireOwnedCreator(user);
  await connectToDatabase();
  const items = await PortfolioItem.find({ creator: creator._id }).sort({ sortOrder: 1, createdAt: -1 }).lean();
  return apiSuccess({ items });
});

export const POST = withApiErrors(async (request) => {
  validateMutationOrigin(request);
  const user = await requireRole(["creator"]);
  const creator = await requireOwnedCreator(user);
  const body = portfolioItemSchema.parse(await readJson(request));
  await connectToDatabase();
  const item = await PortfolioItem.create({ ...body, creator: creator._id });
  return apiSuccess({ item }, "Portfolio item added.", 201);
});
