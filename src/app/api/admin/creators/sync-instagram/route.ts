import { apiSuccess, withApiErrors } from "@/lib/api-response";
import { requireAdminPermission } from "@/lib/admin/permissions";
import {
  getLastInstagramSyncInfo,
  syncAllInstagramFollowers,
} from "@/services/instagram-sync.service";
import { enforceRateLimit } from "@/lib/rate-limit";

export const GET = withApiErrors(async () => {
  await requireAdminPermission("creator:read");
  const info = await getLastInstagramSyncInfo();
  return apiSuccess(info);
});

export const POST = withApiErrors(async () => {
  const actor = await requireAdminPermission("creator:read");
  // Rate limit manual syncs to prevent spamming external APIs (max 20 per hour per admin)
  await enforceRateLimit({
    scope: "admin-instagram-sync",
    identity: actor.id,
    limit: 20,
    windowMs: 60 * 60 * 1000,
  });

  const summary = await syncAllInstagramFollowers(actor.id);
  return apiSuccess(summary, summary.message);
});

