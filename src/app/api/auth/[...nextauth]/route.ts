import NextAuth from "next-auth";
import { apiFailure, withApiErrors } from "@/lib/api-response";
import { authConfig } from "@/lib/auth";
import { enforceRateLimit, getClientAddress } from "@/lib/rate-limit";
import { NextRequest } from "next/server";

async function handleAuth(request: NextRequest) {
  const pathname = new URL(request.url).pathname;
  const nextauth = pathname.split("/").slice(3);
  return NextAuth(request, { params: { nextauth } }, authConfig);
}

export const GET = handleAuth;
export const POST = withApiErrors(async (request) => {
  const pathname = new URL(request.url).pathname;
  if (pathname.endsWith("/callback/credentials")) {
    const address = getClientAddress(request);
    await enforceRateLimit({ scope: "authjs-credentials-ip", identity: address, limit: 10, windowMs: 15 * 60 * 1000 });

    if (request.headers.get("content-type")?.includes("application/x-www-form-urlencoded")) {
      try {
        const formData = await request.clone().formData();
        const email = formData.get("email");
        if (typeof email === "string" && email.length <= 254) {
          await enforceRateLimit({ scope: "authjs-credentials-email", identity: email.trim().toLowerCase(), limit: 5, windowMs: 15 * 60 * 1000 });
        }
      } catch {
        return apiFailure("Invalid authentication request.", 400);
      }
    }
  }
  const response = await handleAuth(new NextRequest(request));
  if (response.status === 429) return apiFailure("Too many authentication attempts. Please try again later.", 429);
  return response;
});
