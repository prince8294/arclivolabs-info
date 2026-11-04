import { Suspense } from "react";
import { redirect } from "next/navigation";
import { ApiError } from "@/lib/api-response";
import { requireRole } from "@/lib/permissions";
import { PortalShell } from "@/components/portal/portal-shell";
import { BrandLoader } from "@/components/brand-loader";

async function getCreatorUser() {
  try {
    return await requireRole(["creator"]);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) redirect("/login?callbackUrl=%2Fcreator%2Fdashboard");
    if (error instanceof ApiError && error.status === 403) redirect("/");
    throw error;
  }
}

async function ProtectedCreator({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getCreatorUser();
  return <PortalShell kind="creator" name={user.name}>{children}</PortalShell>;
}

export default function CreatorLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <Suspense fallback={<BrandLoader label="Opening your creator workspace" />}><ProtectedCreator>{children}</ProtectedCreator></Suspense>;
}
