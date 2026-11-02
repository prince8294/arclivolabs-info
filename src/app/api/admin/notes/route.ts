import { apiSuccess, withApiErrors } from "@/lib/api-response";
import { requireAdminPermission } from "@/lib/admin/permissions";
import { createInternalNote, noteSchema } from "@/lib/admin/resources";
import { connectToDatabase } from "@/lib/db";
import InternalNote from "@/models/InternalNote";
import { readJson, validateMutationOrigin } from "@/lib/request";
import { z } from "zod";

export const GET = withApiErrors(async (request) => {
  const query = z.object({
    entityType: z.enum(["creator", "brand", "campaign", "enquiry", "contact"]),
    entityId: z.string().regex(/^[a-f\d]{24}$/i),
  }).parse(Object.fromEntries(new URL(request.url).searchParams));
  const permission = `${query.entityType === "creator" ? "creator" : query.entityType === "brand" ? "brand" : query.entityType === "campaign" ? "campaign" : query.entityType === "enquiry" ? "enquiry" : "contact"}:read`;
  const actor = await requireAdminPermission(permission as "creator:read" | "brand:read" | "campaign:read" | "enquiry:read" | "contact:read");
  await connectToDatabase();
  const items = await InternalNote.find(query).populate("author", "name").sort({ createdAt: -1 }).limit(100).lean();
  return apiSuccess({ items, actorId: actor.id });
});

export const POST = withApiErrors(async (request) => {
  validateMutationOrigin(request);
  const body = noteSchema.parse(await readJson(request));
  const permission = `${body.entityType === "creator" ? "creator" : body.entityType === "brand" ? "brand" : body.entityType === "campaign" ? "campaign" : body.entityType === "enquiry" ? "enquiry" : "contact"}:manage`;
  const actor = await requireAdminPermission(permission as "creator:manage" | "brand:manage" | "campaign:manage" | "enquiry:manage" | "contact:manage");
  const note = await createInternalNote(body, actor.id);
  return apiSuccess(note, "Internal note added.", 201);
});
