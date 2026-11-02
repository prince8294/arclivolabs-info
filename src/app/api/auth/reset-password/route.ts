import { apiFailure, apiSuccess, withApiErrors } from "@/lib/api-response";
import { enforceRateLimit, getClientAddress } from "@/lib/rate-limit";
import { readJson, validateMutationOrigin } from "@/lib/request";
import { resetPasswordSchema } from "@/lib/validations/auth";
import { resetUserPassword } from "@/services/auth.service";

export const POST = withApiErrors(async (request) => {
  validateMutationOrigin(request);
  const { token, password } = resetPasswordSchema.parse(await readJson(request));
  await enforceRateLimit({ scope: "password-reset-ip", identity: getClientAddress(request), limit: 10, windowMs: 60 * 60 * 1000 });
  if (!(await resetUserPassword(token, password))) {
    return apiFailure("This password reset link is invalid or has expired.", 400);
  }
  return apiSuccess({}, "Password updated successfully.");
});
