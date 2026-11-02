import { apiSuccess, ApiError, withApiErrors } from "@/lib/api-response";
import { connectToDatabase } from "@/lib/db";
import { objectId } from "@/lib/portal-access";
import { requireRole } from "@/lib/permissions";
import Notification from "@/models/Notification";
import { validateMutationOrigin } from "@/lib/request";

export const PATCH = withApiErrors(async (request, context: { params: Promise<{ id: string }> }) => {
  validateMutationOrigin(request);
  const user = await requireRole(["brand", "creator"]);
  const { id } = await context.params;
  await connectToDatabase();
  const notification = await Notification.findOneAndUpdate(
    { _id: objectId(id), recipient: user._id },
    { $set: { readAt: new Date() } },
    { returnDocument: "after" },
  ).lean();
  if (!notification) throw new ApiError("Notification was not found.", 404);
  return apiSuccess({ notification }, "Notification marked as read.");
});
