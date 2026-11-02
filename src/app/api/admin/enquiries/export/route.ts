import { withApiErrors } from "@/lib/api-response";
import { requireAdminPermission } from "@/lib/admin/permissions";
import { connectToDatabase } from "@/lib/db";
import Enquiry from "@/models/Enquiry";
import { enforceRateLimit } from "@/lib/rate-limit";

export const GET = withApiErrors(async (request) => {
  const actor = await requireAdminPermission("enquiry:read");
  await enforceRateLimit({ scope: "enquiry-export", identity: actor.id, limit: 10, windowMs: 60 * 60 * 1000 });
  await connectToDatabase();
  const params = new URL(request.url).searchParams;
  const status = params.get("status");
  const search = params.get("q")?.trim().slice(0, 100);
  const safeSearch = search?.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const filter = {
    ...(status ? { status } : {}),
    ...(actor.role === "sales_executive" ? { assignedTo: actor._id } : {}),
    ...(safeSearch ? { $or: [{ referenceId: new RegExp(safeSearch, "i") }, { name: new RegExp(safeSearch, "i") }, { company: new RegExp(safeSearch, "i") }, { email: new RegExp(safeSearch, "i") }] } : {}),
  };
  const enquiries = await Enquiry.find(filter).sort({ createdAt: -1 }).limit(5000).lean();
  const columns = ["referenceId", "name", "company", "email", "phone", "serviceRequired", "budget", "status", "assignedTo", "followUpAt", "createdAt"];
  const rows = [columns, ...enquiries.map((item) => columns.map((key) => String(item[key as keyof typeof item] ?? "")))];
  const csv = rows.map((row) => row.map((field) => {
    const safeField = /^[\t\r\n ]*[=+\-@]/.test(field) ? `'${field}` : field;
    return `"${safeField.replace(/"/g, '""')}"`;
  }).join(",")).join("\r\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="brand-enquiries.csv"',
      "Cache-Control": "private, no-store",
    },
  });
});
