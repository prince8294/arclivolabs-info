import { apiSuccess, withApiErrors } from "@/lib/api-response";
import { requireAdminPermission } from "@/lib/admin/permissions";
import { connectToDatabase } from "@/lib/db";
import StudentSupportTicket from "@/models/StudentSupportTicket";

export const GET = withApiErrors(async (request: Request) => {
  await requireAdminPermission("student:read");
  await connectToDatabase();

  const url = new URL(request.url);
  const search = url.searchParams.get("search")?.trim().slice(0, 100) ?? "";
  const status = url.searchParams.get("status")?.trim() ?? "";
  const category = url.searchParams.get("category")?.trim() ?? "";
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") ?? "20", 10) || 20));
  const skip = (page - 1) * limit;

  const safeSearch = search ? search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") : "";
  const rx = safeSearch ? new RegExp(safeSearch, "i") : null;

  const filter: Record<string, unknown> = {
    ...(status && ["open", "in_progress", "resolved"].includes(status) ? { status } : {}),
    ...(category ? { category } : {}),
    ...(rx
      ? {
          $or: [
            { ticketNumber: rx },
            { subject: rx },
            { studentName: rx },
            { studentEmail: rx },
            { studentId: rx },
          ],
        }
      : {}),
  };

  const [items, total, openCount, inProgressCount, resolvedCount, totalCount] = await Promise.all([
    StudentSupportTicket.find(filter)
      .populate("student", "name email studentId referralCode")
      .sort({ lastReplyAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    StudentSupportTicket.countDocuments(filter),
    StudentSupportTicket.countDocuments({ status: "open" }),
    StudentSupportTicket.countDocuments({ status: "in_progress" }),
    StudentSupportTicket.countDocuments({ status: "resolved" }),
    StudentSupportTicket.countDocuments({}),
  ]);

  return apiSuccess({
    items,
    total,
    page,
    pages: Math.ceil(total / limit) || 1,
    stats: {
      total: totalCount,
      open: openCount,
      inProgress: inProgressCount,
      resolved: resolvedCount,
    },
  });
});

