import { apiSuccess, withApiErrors } from "@/lib/api-response";
import { connectToDatabase } from "@/lib/db";
import { requireOwnedCreator } from "@/lib/portal-access";
import { requireRole } from "@/lib/permissions";
import { readJson, validateMutationOrigin } from "@/lib/request";
import { creatorPackageSchema } from "@/lib/validations/portal";
import CreatorPackage from "@/models/CreatorPackage";

export const GET = withApiErrors(async () => {
  const user = await requireRole(["creator"]);
  const creator = await requireOwnedCreator(user);
  await connectToDatabase();
  const packages = await CreatorPackage.find({ creator: creator._id }).sort({ createdAt: -1 }).lean();
  return apiSuccess({ packages });
});

export const POST = withApiErrors(async (request) => {
  validateMutationOrigin(request);
  const user = await requireRole(["creator"]);
  const creator = await requireOwnedCreator(user);
  const body = creatorPackageSchema.parse(await readJson(request));
  await connectToDatabase();
  const packageRecord = await CreatorPackage.create({ ...body, currency: body.currency.toUpperCase(), creator: creator._id });
  return apiSuccess({ package: packageRecord }, "Collaboration package created.", 201);
});
