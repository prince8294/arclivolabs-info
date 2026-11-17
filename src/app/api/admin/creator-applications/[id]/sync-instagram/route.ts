import { z } from "zod";
import { apiSuccess, withApiErrors } from "@/lib/api-response";
import { requireAdminPermission } from "@/lib/admin/permissions";
import { enforceRateLimit } from "@/lib/rate-limit";
import { readJson, validateMutationOrigin } from "@/lib/request";
import { syncCreatorApplicationInstagram } from "@/services/meta-instagram-sync.service";

type RouteContext = { params: Promise<{ id: string }> };

const syncRequestSchema = z.object({
  socialProfile: z.string().trim().max(2048).optional(),
}).strict();

export const POST = withApiErrors(async (request: Request, { params }: RouteContext) => {
  validateMutationOrigin(request);
  const actor = await requireAdminPermission("creator:manage");
  await enforceRateLimit({
    scope: "admin-creator-application-instagram-sync",
    identity: actor.id,
    limit: 10,
    windowMs: 60 * 60 * 1000,
  });

  const { id } = await params;
  const { socialProfile } = syncRequestSchema.parse(await readJson(request));
  const result = await syncCreatorApplicationInstagram(id, socialProfile);
  const message = result.warning
    ? `Instagram profile data synced. ${result.warning}`
    : "Instagram profile data synced successfully.";
  return apiSuccess(result, message);
});
