import { cookies } from "next/headers";
import { encode } from "next-auth/jwt";
import { apiFailure, apiSuccess, withApiErrors } from "@/lib/api-response";
import { authConfig, sessionCookieName, sessionMaxAge } from "@/lib/auth";
import { loginSchema } from "@/lib/validations/auth";
import { enforceRateLimit, getClientAddress } from "@/lib/rate-limit";
import { validateMutationOrigin, readJson } from "@/lib/request";
import { verifyCredentials } from "@/services/auth.service";

export const POST = withApiErrors(async (request) => {
  validateMutationOrigin(request);
  const address = getClientAddress(request);
  await enforceRateLimit({ scope: "login-ip", identity: address, limit: 10, windowMs: 15 * 60 * 1000 });
  const body = loginSchema.parse(await readJson(request));
  await enforceRateLimit({ scope: "login-email", identity: body.email, limit: 5, windowMs: 15 * 60 * 1000 });

  const user = await verifyCredentials(body);
  if (!user) return apiFailure("Invalid email or password.", 401);

  const secret = authConfig.secret;
  if (!secret) throw new Error("AUTH_SECRET must be configured before signing in.");
  const token = await encode({
    token: {
      sub: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      sessionVersion: user.sessionVersion,
    },
    secret,
    maxAge: sessionMaxAge,
  });
  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: sessionMaxAge,
  });
  return apiSuccess({ authenticated: true }, "Signed in successfully.");
});
