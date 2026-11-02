import { apiSuccess, withApiErrors } from "@/lib/api-response";
import { getDashboardStats } from "@/lib/admin/analytics";
import { requireAdminPermission } from "@/lib/admin/permissions";

export const GET = withApiErrors(async () => {
  const actor = await requireAdminPermission("dashboard:view");
  return apiSuccess(await getDashboardStats(actor.role, actor.permissions));
});
