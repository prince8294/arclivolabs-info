import { Suspense } from "react";
import { redirect } from "next/navigation";
import { ApiError } from "@/lib/api-response";
import { requireRole } from "@/lib/permissions";
import { PortalShell } from "@/components/portal/portal-shell";
import { BrandLoader } from "@/components/brand-loader";

async function getBrandUser() {
  try {
    return await requireRole(["brand"]);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) redirect("/login?callbackUrl=%2Fbrand%2Fdashboard");
    if (error instanceof ApiError && error.status === 403) redirect("/");
    throw error;
  }
}

async function ProtectedBrand({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getBrandUser();
  return <PortalShell kind="brand" name={user.name}>{children}</PortalShell>;
}

export default function BrandLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <Suspense fallback={<BrandLoader label="Opening your brand workspace" />}><ProtectedBrand>{children}</ProtectedBrand></Suspense>;
}
