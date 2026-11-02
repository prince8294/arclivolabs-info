import { notFound } from "next/navigation";
import { AdminAnalyticsPage, AdminProfile, AdminWorkspace } from "@/components/admin/admin-workspace";
import { getCurrentUser } from "@/lib/permissions";

const resourceSections = new Set([
  "creators", "brands", "campaigns", "enquiries", "contact-messages", "team",
  "services", "blogs", "notifications", "activity-logs", "settings",
]);

export default async function AdminSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const user = await getCurrentUser();
  if (section === "analytics" || section === "reports") return <AdminAnalyticsPage section={section} />;
  if (section === "profile") return <AdminProfile />;
  if (!resourceSections.has(section)) notFound();
  return <AdminWorkspace section={section} role={user.role} />;
}
