import { apiSuccess, withApiErrors } from "@/lib/api-response";
import { getAdminReport } from "@/lib/admin/analytics";
import { requireAdminPermission } from "@/lib/admin/permissions";

export const GET = withApiErrors(async (request) => {
  const actor = await requireAdminPermission("analytics:read");
  const report = await getAdminReport(new URL(request.url).searchParams, actor.role, actor.permissions);
  const format = new URL(request.url).searchParams.get("format");
  if (format !== "csv") return apiSuccess(report);
  const rows: Array<[string, string | number]> = [
    ["Report", "Influencer Agency Metrics"],
    ["From", report.range.from.toISOString()],
    ["To", report.range.to.toISOString()],
    ["Creator registrations", report.creatorGrowth.reduce((sum, item) => sum + item.count, 0)],
    ["Brand registrations", report.brandGrowth.reduce((sum, item) => sum + item.count, 0)],
    ["Contact messages", report.contactMessages],
    ...report.campaignStatuses.map((item) => [`Campaigns: ${item._id}`, item.count] as [string, number]),
    ...report.enquiryStatuses.map((item) => [`Enquiries: ${item._id}`, item.count] as [string, number]),
    ...(report.recordedTransactions ?? []).map((item) => [`Recorded ${item._id.type} (${item._id.currency})`, item.amount] as [string, number]),
  ];
  const csv = rows.map(([key, value]) => `"${String(key).replace(/"/g, '""')}","${String(value).replace(/"/g, '""')}"`).join("\r\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="agency-report.csv"',
      "Cache-Control": "private, no-store",
    },
  });
});
