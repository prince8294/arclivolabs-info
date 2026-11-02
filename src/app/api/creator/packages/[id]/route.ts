import { apiSuccess, ApiError, withApiErrors } from "@/lib/api-response";
import { connectToDatabase } from "@/lib/db";
import { objectId, requireOwnedCreator } from "@/lib/portal-access";
import { requireRole } from "@/lib/permissions";
import { readJson, validateMutationOrigin } from "@/lib/request";
import { creatorPackageSchema } from "@/lib/validations/portal";
import CreatorPackage from "@/models/CreatorPackage";

export const PATCH = withApiErrors(async (request, context: { params: Promise<{ id: string }> }) => {
  validateMutationOrigin(request);
  const user = await requireRole(["creator"]);
  const creator = await requireOwnedCreator(user);
  const { id } = await context.params;
  const body = creatorPackageSchema.partial().strict().parse(await readJson(request));
  if (!Object.keys(body).length) throw new ApiError("Provide package fields to update.", 400);
  await connectToDatabase();
  const packageRecord = await CreatorPackage.findOneAndUpdate({ _id: objectId(id), creator: creator._id }, { $set: body }, { returnDocument: "after", runValidators: true, strict: "throw" }).lean();
  if (!packageRecord) throw new ApiError("Package was not found.", 404);
  return apiSuccess({ package: packageRecord }, "Collaboration package updated.");
});

export const DELETE = withApiErrors(async (request, context: { params: Promise<{ id: string }> }) => {
  validateMutationOrigin(request);
  const user = await requireRole(["creator"]);
  const creator = await requireOwnedCreator(user);
  const { id } = await context.params;
  await connectToDatabase();
  const result = await CreatorPackage.findOneAndDelete({ _id: objectId(id), creator: creator._id });
  if (!result) throw new ApiError("Package was not found.", 404);
  return apiSuccess({ id }, "Collaboration package deleted.");
});
