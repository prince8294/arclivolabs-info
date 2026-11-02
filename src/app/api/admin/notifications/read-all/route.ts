import { apiSuccess, withApiErrors } from "@/lib/api-response";
import { requireAdminPermission } from "@/lib/admin/permissions";
import { connectToDatabase } from "@/lib/db";
import Notification from "@/models/Notification";
import { validateMutationOrigin } from "@/lib/request";

export const POST = withApiErrors(async (request) => {
  validateMutationOrigin(request);
  const actor = await requireAdminPermission("notification:read");
  await connectToDatabase();
  const result = await Notification.updateMany({ recipient: actor._id, readAt: { $exists: false } }, { $set: { readAt: new Date() } });
  return apiSuccess({ modified: result.modifiedCount }, "Notifications marked as read.");
});
