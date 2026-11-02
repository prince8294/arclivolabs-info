import { apiSuccess, ApiError, withApiErrors } from "@/lib/api-response";
import {
  adminResources,
  createAdminResource,
  listAdminResource,
  permissionForResource,
  type AdminResource,
} from "@/lib/admin/resources";
import { requireAdminPermission } from "@/lib/admin/permissions";
import { readJson, validateMutationOrigin } from "@/lib/request";
import { enforceRateLimit } from "@/lib/rate-limit";

type RouteContext = { params: Promise<{ resource: string }> };

function parseResource(value: string): AdminResource {
  if ((adminResources as readonly string[]).includes(value)) return value as AdminResource;
  throw new ApiError("Admin resource not found.", 404);
}

export const GET = withApiErrors(async (request: Request, { params }: RouteContext) => {
  const { resource: rawResource } = await params;
  const resource = parseResource(rawResource);
  const actor = await requireAdminPermission(permissionForResource(resource, "read"));
  const data = await listAdminResource(resource, new URL(request.url).searchParams, { id: actor.id, role: actor.role });
  return apiSuccess(data);
});

export const POST = withApiErrors(async (request: Request, { params }: RouteContext) => {
  validateMutationOrigin(request);
  const { resource: rawResource } = await params;
  const resource = parseResource(rawResource);
  const actor = await requireAdminPermission(permissionForResource(resource, "manage"));
  await enforceRateLimit({ scope: `admin-create-${resource}`, identity: actor.id, limit: 60, windowMs: 60 * 60 * 1000 });
  const data = await createAdminResource(resource, await readJson(request), { id: actor.id, role: actor.role });
  return apiSuccess(data, "Record created successfully.", 201);
});
