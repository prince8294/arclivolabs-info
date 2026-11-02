import { cookies } from "next/headers";
import { apiSuccess, withApiErrors } from "@/lib/api-response";
import { sessionCookieName } from "@/lib/auth";
import { validateMutationOrigin } from "@/lib/request";

export const POST = withApiErrors(async (request) => {
  validateMutationOrigin(request);
  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return apiSuccess({ authenticated: false }, "Signed out successfully.");
});
