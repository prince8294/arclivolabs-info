import { notFound } from "next/navigation";
import { AdminWorkspace } from "@/components/admin/admin-workspace";
import { getCurrentUser } from "@/lib/permissions";

const detailSections = new Set([
  "creators", "brands", "campaigns", "enquiries", "contact-messages",
  "team", "services", "blogs", "notifications", "activity-logs",
]);

export default async function AdminRecordPage({
  params,
  searchParams,
}: {
  params: Promise<{ section: string; id: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  const [{ section, id }, query, user] = await Promise.all([params, searchParams, getCurrentUser()]);
  if (!detailSections.has(section)) notFound();
  const resource = query.type ?? section;
  if (resource !== section && !(section === "creators" && resource === "creator-applications")) notFound();
  return <AdminWorkspace section={section} role={user.role} recordId={id} />;
}
