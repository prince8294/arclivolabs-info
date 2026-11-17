import { apiSuccess, withApiErrors } from "@/lib/api-response";
import { requireAdminPermission } from "@/lib/admin/permissions";
import {
  getMetaInstagramSyncInfo,
  runWeeklyMetaInstagramSync,
} from "@/services/meta-instagram-sync.service";
import { enforceRateLimit } from "@/lib/rate-limit";
import { validateMutationOrigin } from "@/lib/request";

export const GET = withApiErrors(async () => {
  await requireAdminPermission("creator:read");
  return apiSuccess(await getMetaInstagramSyncInfo());
});

export const POST = withApiErrors(async (request) => {
  validateMutationOrigin(request);
  const actor = await requireAdminPermission("creator:read");
  await enforceRateLimit({
    scope: "admin-meta-instagram-sync",
    identity: actor.id,
    limit: 10,
    windowMs: 60 * 60 * 1000,
  });

  const summary = await runWeeklyMetaInstagramSync({ force: true });
  const firstFailure = summary.details.find((item) => item.status === "failed")?.error;
  const message = !summary.executed && summary.reason === "not_configured"
    ? "Meta API is not configured. Add META_ACCESS_TOKEN and META_INSTAGRAM_ACCOUNT_ID."
    : summary.failedCount === summary.processedCount && firstFailure
      ? `Meta sync failed: ${firstFailure}`
    : summary.failedCount
      ? `Meta sync completed: ${summary.updatedCount} updated, ${summary.unchangedCount} unchanged, ${summary.failedCount} failed.`
      : `Meta sync completed: ${summary.updatedCount} updated, ${summary.unchangedCount} unchanged.`;
  return apiSuccess(summary, message);
});

