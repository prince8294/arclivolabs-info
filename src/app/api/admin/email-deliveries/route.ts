import { z } from "zod";
import { enforceRateLimit } from "@/lib/rate-limit";
import { apiSuccess, ApiError, withApiErrors } from "@/lib/api-response";
import { requireAdminPermission } from "@/lib/admin/permissions";
import { connectToDatabase } from "@/lib/db";
import { readJson, validateMutationOrigin } from "@/lib/request";
import EmailOutbox from "@/models/EmailOutbox";
import { recordCommittedActivity } from "@/services/activity.service";

const retrySchema = z.object({ id: z.string().regex(/^[a-f\d]{24}$/i) }).strict();
const querySchema = z.object({
  page: z.coerce.number().int().min(1).max(100000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  status: z.enum(["pending", "processing", "sent", "failed", "blocked"]).optional(),
}).strict();

export const GET = withApiErrors(async (request) => {
  const actor = await requireAdminPermission("settings:manage");
  await connectToDatabase();
  await enforceRateLimit({ scope: "admin-email-deliveries", identity: actor.id, limit: 60, windowMs: 60 * 1000 });
  const url = new URL(request.url);
  const query = querySchema.parse(Object.fromEntries(url.searchParams.entries()));
  const filter = query.status ? { status: query.status } : {};
  const [deliveries, total] = await Promise.all([
    EmailOutbox.find(filter).select("template dedupeKey status attempts nextAttemptAt providerMessageId lastErrorCode sentAt createdAt").sort({ createdAt: -1 }).skip((query.page - 1) * query.limit).limit(query.limit).lean(),
    EmailOutbox.countDocuments(filter),
  ]);
  return apiSuccess({ deliveries, pagination: { page: query.page, limit: query.limit, total, pages: Math.ceil(total / query.limit) } });
});

export const POST = withApiErrors(async (request) => {
  validateMutationOrigin(request);
  const actor = await requireAdminPermission("settings:manage");
  const body = retrySchema.parse(await readJson(request));
  await connectToDatabase();
  await enforceRateLimit({ scope: "admin-email-retry", identity: actor.id, limit: 20, windowMs: 60 * 60 * 1000 });
  const delivery = await EmailOutbox.findOneAndUpdate(
    { _id: body.id, status: "blocked", expiresAt: { $gt: new Date() } },
    { $set: { status: "pending", attempts: 0, nextAttemptAt: new Date(), lastErrorCode: undefined, lockUntil: undefined } },
    { returnDocument: "after" },
  );
  if (!delivery) throw new ApiError("An unexpired blocked email delivery was not found.", 404);
  await recordCommittedActivity({ actorId: actor.id, action: "email.delivery.retried", resourceType: "EmailOutbox", resourceId: delivery.id });
  return apiSuccess({ id: delivery.id, status: delivery.status }, "Email delivery queued for retry.");
});
