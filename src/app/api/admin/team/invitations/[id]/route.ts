import { apiSuccess, ApiError, withApiErrors } from "@/lib/api-response";
import { requireAdminPermission } from "@/lib/admin/permissions";
import { connectToDatabase } from "@/lib/db";
import TeamInvitation from "@/models/TeamInvitation";
import { validateMutationOrigin } from "@/lib/request";
import { recordCommittedActivity } from "@/services/activity.service";

export const DELETE = withApiErrors(async (request, { params }: { params: Promise<{ id: string }> }) => {
  validateMutationOrigin(request);
  const actor = await requireAdminPermission("team:manage");
  await connectToDatabase();
  const { id } = await params;
  const invitation = await TeamInvitation.findOneAndUpdate(
    { _id: id, acceptedAt: null, revokedAt: null },
    { $set: { revokedAt: new Date() } },
    { returnDocument: "after" },
  ).select("_id email");
  if (!invitation) throw new ApiError("Invitation not found.", 404);
  await recordCommittedActivity({ actorId: actor.id, action: "team.invitation_revoked", resourceType: "team_invitation", resourceId: invitation.id, metadata: { email: invitation.email } });
  return apiSuccess({ id: invitation.id }, "Invitation revoked.");
});
