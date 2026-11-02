import { apiSuccess, withApiErrors } from "@/lib/api-response";
import { getDashboardAnalytics } from "@/lib/admin/analytics";
import { requireAdminPermission } from "@/lib/admin/permissions";

export const GET = withApiErrors(async (request) => {
  const actor = await requireAdminPermission("analytics:read");
  return apiSuccess(await getDashboardAnalytics(new URL(request.url).searchParams, actor.role, actor.permissions));
});
