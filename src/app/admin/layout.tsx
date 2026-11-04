import { Suspense } from "react";
import { redirect } from "next/navigation";
import { DM_Sans, Fraunces } from "next/font/google";
import { cookies } from "next/headers";
import { ApiError } from "@/lib/api-response";
import { auth, sessionCookieName } from "@/lib/auth";
import { roleHasPermission } from "@/lib/admin/permissions";
import { getCurrentUser } from "@/lib/permissions";
import { AdminShell } from "@/components/admin/admin-shell";
import { BrandLoader } from "@/components/brand-loader";

const adminSans = DM_Sans({
  subsets: ["latin"],
  weight: "variable",
  variable: "--font-admin-sans",
  display: "swap",
});

const adminSerif = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-admin-serif",
  display: "swap",
});

async function ProtectedAdmin({ children }: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  if (!cookieStore.has(sessionCookieName)) redirect("/login?callbackUrl=%2Fadmin%2Fdashboard");
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=%2Fadmin%2Fdashboard");

  let user;
  try {
    user = await getCurrentUser();
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) redirect("/login?callbackUrl=%2Fadmin%2Fdashboard");
    if (error instanceof ApiError && error.status === 403) redirect("/");
    throw error;
  }
  if (!roleHasPermission(user.role, "dashboard:view", user.permissions)) redirect("/");
  return <AdminShell name={user.name} role={user.role} permissions={user.permissions}>{children}</AdminShell>;
}

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className={`${adminSans.variable} ${adminSerif.variable}`}>
    <Suspense fallback={<BrandLoader label="Securing your workspace" className="admin-brand-loader" />}><ProtectedAdmin>{children}</ProtectedAdmin></Suspense>
  </div>;
}
