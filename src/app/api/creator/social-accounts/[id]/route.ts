import { apiSuccess, ApiError, withApiErrors } from "@/lib/api-response";
import { connectToDatabase } from "@/lib/db";
import { objectId, requireOwnedCreator } from "@/lib/portal-access";
import { requireRole } from "@/lib/permissions";
import { readJson, validateMutationOrigin } from "@/lib/request";
import { socialAccountSchema } from "@/lib/validations/portal";
import SocialAccount from "@/models/SocialAccount";

export const PATCH = withApiErrors(async (request, context: { params: Promise<{ id: string }> }) => {
  validateMutationOrigin(request);
  const user = await requireRole(["creator"]);
  const creator = await requireOwnedCreator(user);
  const { id } = await context.params;
  const body = socialAccountSchema.parse(await readJson(request));
  await connectToDatabase();
  const account = await SocialAccount.findOneAndUpdate(
    { _id: objectId(id), creator: creator._id },
    { $set: { ...body, verificationStatus: "pending" }, $unset: { lastVerifiedAt: 1 } },
    { returnDocument: "after", runValidators: true, strict: "throw" },
  ).lean();
  if (!account) throw new ApiError("Social account was not found.", 404);
  return apiSuccess({ account }, "Social account updated. Verification must be reviewed again.");
});

export const DELETE = withApiErrors(async (request, context: { params: Promise<{ id: string }> }) => {
  validateMutationOrigin(request);
  const user = await requireRole(["creator"]);
  const creator = await requireOwnedCreator(user);
  const { id } = await context.params;
  await connectToDatabase();
  const result = await SocialAccount.findOneAndDelete({ _id: objectId(id), creator: creator._id });
  if (!result) throw new ApiError("Social account was not found.", 404);
  return apiSuccess({ id }, "Social account removed.");
});
