import { apiSuccess, ApiError, withApiErrors } from "@/lib/api-response";
import {
  adminResources,
  deleteAdminResource,
  getAdminResource,
  permissionForResource,
  type AdminResource,
  updateAdminResource,
} from "@/lib/admin/resources";
import { requireAdminPermission } from "@/lib/admin/permissions";
import { readJson, validateMutationOrigin } from "@/lib/request";

type RouteContext = { params: Promise<{ resource: string; id: string }> };

function parseResource(value: string): AdminResource {
  if ((adminResources as readonly string[]).includes(value)) return value as AdminResource;
  throw new ApiError("Admin resource not found.", 404);
}

export const GET = withApiErrors(async (_request: Request, { params }: RouteContext) => {
  const { resource: rawResource, id } = await params;
  const resource = parseResource(rawResource);
  const actor = await requireAdminPermission(permissionForResource(resource, "read"));
  const data = await getAdminResource(resource, id, { id: actor.id, role: actor.role });
  if (!data) throw new ApiError("Record not found.", 404);
  return apiSuccess(data);
});

export const PATCH = withApiErrors(async (request: Request, { params }: RouteContext) => {
  validateMutationOrigin(request);
  const { resource: rawResource, id } = await params;
  const resource = parseResource(rawResource);
  const actor = await requireAdminPermission(permissionForResource(resource, "manage"));
  const data = await updateAdminResource(resource, id, await readJson(request), { id: actor.id, role: actor.role });
  return apiSuccess(data, "Record updated successfully.");
});

export const DELETE = withApiErrors(async (request: Request, { params }: RouteContext) => {
  validateMutationOrigin(request);
  const { resource: rawResource, id } = await params;
  const resource = parseResource(rawResource);
  const actor = await requireAdminPermission(permissionForResource(resource, "manage"));
  const data = await deleteAdminResource(resource, id, { id: actor.id, role: actor.role });
  return apiSuccess(data, "Record removed successfully.");
});
