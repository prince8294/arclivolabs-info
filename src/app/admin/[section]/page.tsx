import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { BrandLoader } from "@/components/brand-loader";
import { AdminAnalyticsPage, AdminProfile, AdminWorkspace } from "@/components/admin/admin-workspace";
import { getCurrentUser } from "@/lib/permissions";

const resourceSections = new Set([
  "creators", "brands", "campaigns", "enquiries", "contact-messages", "team",
  "services", "blogs", "notifications", "activity-logs", "settings",
]);

export default function AdminSectionPage({ params }: { params: Promise<{ section: string }> }) {
  return <Suspense fallback={<BrandLoader label="Loading admin workspace" variant="section" className="admin-brand-loader" />}>
    <AdminSectionContent params={params} />
  </Suspense>;
}

async function AdminSectionContent({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  await connection();
  const user = await getCurrentUser();
  if (section === "analytics" || section === "reports") return <AdminAnalyticsPage section={section} />;
  if (section === "profile") return <AdminProfile />;
  if (!resourceSections.has(section)) notFound();
  return <AdminWorkspace section={section} role={user.role} />;
}
