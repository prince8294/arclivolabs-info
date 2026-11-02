import { apiSuccess, withApiErrors } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/permissions";
import { readJson, validateMutationOrigin } from "@/lib/request";
import { changePasswordSchema } from "@/lib/validations/auth";
import { changeUserPassword } from "@/services/auth.service";

export const PATCH = withApiErrors(async (request) => {
  validateMutationOrigin(request);
  const body = changePasswordSchema.parse(await readJson(request));
  const user = await getCurrentUser();
  await changeUserPassword(user.id, body.currentPassword, body.newPassword);
  return apiSuccess({}, "Password updated successfully.");
});
