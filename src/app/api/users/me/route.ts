import { apiSuccess, withApiErrors } from "@/lib/api-response";
import { connectToDatabase } from "@/lib/db";
import { getCurrentUser } from "@/lib/permissions";
import { readJson, validateMutationOrigin } from "@/lib/request";
import { updateUserSchema } from "@/lib/validations/auth";
import { toPublicUser } from "@/services/auth.service";

export const GET = withApiErrors(async () => {
  const user = await getCurrentUser();
  return apiSuccess({ user: toPublicUser(user) });
});

export const PATCH = withApiErrors(async (request) => {
  validateMutationOrigin(request);
  const changes = updateUserSchema.parse(await readJson(request));
  const user = await getCurrentUser();
  await connectToDatabase();
  Object.assign(user, changes);
  await user.save();
  return apiSuccess({ user: toPublicUser(user) }, "Profile updated successfully.");
});
