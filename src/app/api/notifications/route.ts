import { apiSuccess, withApiErrors } from "@/lib/api-response";
import { connectToDatabase } from "@/lib/db";
import { requireRole } from "@/lib/permissions";
import Notification from "@/models/Notification";

export const GET = withApiErrors(async (request) => {
  const user = await requireRole(["brand", "creator"]);
  await connectToDatabase();
  const url = new URL(request.url);
  const unreadOnly = url.searchParams.get("unread") === "true";
  const page = Math.max(1, Math.min(100000, Number(url.searchParams.get("page") ?? 1)));
  const limit = Math.max(1, Math.min(100, Number(url.searchParams.get("limit") ?? 25)));
  const filter = { recipient: user._id, ...(unreadOnly ? { readAt: { $exists: false } } : {}) };
  const [notifications, total, unread] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ recipient: user._id, readAt: { $exists: false } }),
  ]);
  return apiSuccess({ notifications, unread, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});
