import { apiSuccess, withApiErrors } from "@/lib/api-response";
import { requireRole } from "@/lib/permissions";
import { validateMutationOrigin } from "@/lib/request";
import { respondToCampaignInvitation } from "@/services/collaboration.service";

export const POST = withApiErrors(async (request, context: { params: Promise<{ id: string }> }) => {
  validateMutationOrigin(request);
  const user = await requireRole(["creator"]);
  const { id } = await context.params;
  const result = await respondToCampaignInvitation(user, id, "accepted");
  return apiSuccess({ invitation: result.invitation, collaboration: result.collaboration }, "Campaign invitation accepted.");
});
