import { apiSuccess, withApiErrors } from "@/lib/api-response";
import { connectToDatabase } from "@/lib/db";
import { requireRole } from "@/lib/permissions";
import Notification from "@/models/Notification";
import { validateMutationOrigin } from "@/lib/request";

export const PATCH = withApiErrors(async (request) => {
  validateMutationOrigin(request);
  const user = await requireRole(["brand", "creator"]);
  await connectToDatabase();
  const result = await Notification.updateMany({ recipient: user._id, readAt: { $exists: false } }, { $set: { readAt: new Date() } });
  return apiSuccess({ modified: result.modifiedCount }, "Notifications marked as read.");
});
