import { apiFailure, apiSuccess, withApiErrors } from "@/lib/api-response";
import { readJson, validateMutationOrigin } from "@/lib/request";
import { z } from "zod";
import { enforceRateLimit, getClientAddress } from "@/lib/rate-limit";
import { verifyUserEmail } from "@/services/auth.service";

export const POST = withApiErrors(async (request) => {
  validateMutationOrigin(request);
  const { token } = z.object({ token: z.string().min(32).max(256) }).parse(await readJson(request));
  await enforceRateLimit({ scope: "email-verification-ip", identity: getClientAddress(request), limit: 10, windowMs: 60 * 60 * 1000 });
  if (!(await verifyUserEmail(token))) {
    return apiFailure("This verification link is invalid or has expired.", 400);
  }
  return apiSuccess({}, "Email address verified successfully.");
});
