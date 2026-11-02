import { cookies } from "next/headers";
import { auth, sessionCookieName } from "@/lib/auth";
import { ApiError } from "@/lib/api-response";
import { connectToDatabase } from "@/lib/db";
import User, { type UserRole } from "@/models/User";

export async function getCurrentUser() {
  const cookieStore = await cookies();
  if (!cookieStore.has(sessionCookieName)) throw new ApiError("Authentication is required.", 401);
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new ApiError("Authentication is required.", 401);

  await connectToDatabase();
  const user = await User.findById(userId).select("-passwordHash");
  if (!user || user.status !== "active" || user.sessionVersion !== session.user.sessionVersion) {
    throw new ApiError("Your account is not available.", 401);
  }
  return user;
}

export async function requireRole(roles: readonly UserRole[]) {
  const user = await getCurrentUser();
  if (!roles.includes(user.role)) {
    throw new ApiError("You do not have permission to perform this action.", 403);
  }
  return user;
}

export const elevatedRoles = ["super_admin", "admin", "manager"] as const satisfies readonly UserRole[];

export function hasElevatedRole(role: UserRole): boolean {
  return elevatedRoles.some((elevatedRole) => elevatedRole === role);
}
