import { apiSuccess, withApiErrors } from "@/lib/api-response";
import { requireAdminPermission } from "@/lib/admin/permissions";
import { inviteTeamMember } from "@/lib/admin/resources";
import { readJson, validateMutationOrigin } from "@/lib/request";
import { enforceRateLimit } from "@/lib/rate-limit";

export const POST = withApiErrors(async (request) => {
  validateMutationOrigin(request);
  const actor = await requireAdminPermission("team:manage");
  await enforceRateLimit({ scope: "team-invite", identity: actor.id, limit: 20, windowMs: 60 * 60 * 1000 });
  const invitation = await inviteTeamMember(await readJson(request), { id: actor.id, role: actor.role });
  return apiSuccess(invitation, "Team invitation created. Email delivery is not configured.", 201);
});
