import { createHash, randomUUID } from "node:crypto";
import { apiSuccess, ApiError, withApiErrors } from "@/lib/api-response";
import { connectToDatabase } from "@/lib/db";
import { enforceRateLimit, getClientAddress } from "@/lib/rate-limit";
import { readJson, validateMutationOrigin } from "@/lib/request";
import { contactMessageSchema } from "@/lib/validations/public";
import ContactMessage from "@/models/ContactMessage";
import { recordCommittedActivity } from "@/services/activity.service";
import { notifyAdminUsers } from "@/services/notification.service";

export const POST = withApiErrors(async (request) => {
  validateMutationOrigin(request);
  const address = getClientAddress(request);
  await enforceRateLimit({ scope: "contact-ip", identity: address, limit: 10, windowMs: 60 * 60 * 1000 });
  const body = contactMessageSchema.parse(await readJson(request));
  if (body.website) throw new ApiError("Unable to process this request.", 400);
  await enforceRateLimit({ scope: "contact-email", identity: body.email, limit: 5, windowMs: 60 * 60 * 1000 });
  await connectToDatabase();

  const dedupeHash = createHash("sha256")
    .update([body.email, body.subject, body.message, Math.floor(Date.now() / (10 * 60 * 1000))].join("|").toLowerCase())
    .digest("hex");
  if (await ContactMessage.exists({ dedupeHash })) {
    throw new ApiError("A similar message was already received.", 409);
  }
  const message = await ContactMessage.create({
    referenceId: `MSG-${randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`,
    name: body.name,
    email: body.email,
    phone: body.phone,
    subject: body.subject,
    message: body.message,
    dedupeHash,
  });
  await recordCommittedActivity({
    action: "contact.received",
    resourceType: "ContactMessage",
    resourceId: message.id,
    ipAddress: address,
  });
  await notifyAdminUsers({
    type: "contact_message",
    title: "New contact message",
    message: `${message.name} sent a message: ${message.subject}`,
    href: "/admin/contact-messages",
    data: { referenceId: message.referenceId },
  });
  return apiSuccess({ referenceId: message.referenceId, status: message.status }, "Your message was received.", 201);
});
