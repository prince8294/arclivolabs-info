import { cookies } from "next/headers";
import { auth, sessionCookieName } from "@/lib/auth";
import { apiSuccess, withApiErrors } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/permissions";
import { toPublicUser } from "@/services/auth.service";

export const GET = withApiErrors(async () => {
  const cookieStore = await cookies();
  if (!cookieStore.has(sessionCookieName)) {
    return apiSuccess({ authenticated: false, user: null });
  }
  const session = await auth();
  const currentUser = session?.user?.id ? await getCurrentUser() : null;
  return apiSuccess({
    authenticated: Boolean(currentUser),
    user: currentUser ? toPublicUser(currentUser) : null,
  });
});
