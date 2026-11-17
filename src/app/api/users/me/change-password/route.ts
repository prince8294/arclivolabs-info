import { apiSuccess, withApiErrors } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/permissions";
import { readJson, validateMutationOrigin } from "@/lib/request";
import { changePasswordSchema } from "@/lib/validations/auth";
import { changeUserPassword } from "@/services/auth.service";
import { enforceRateLimit } from "@/lib/rate-limit";

export const PATCH = withApiErrors(async (request) => {
  validateMutationOrigin(request);
  const body = changePasswordSchema.parse(await readJson(request));
  const user = await getCurrentUser();
  await enforceRateLimit({ scope: "password-change", identity: user.id, limit: 5, windowMs: 15 * 60 * 1000 });
  await changeUserPassword(user.id, body.currentPassword, body.newPassword);
  return apiSuccess({}, "Password updated successfully.");
});
