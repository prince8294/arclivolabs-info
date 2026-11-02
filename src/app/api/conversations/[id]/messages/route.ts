import { z } from "zod";
import { Types } from "mongoose";
import { apiSuccess, ApiError, withApiErrors } from "@/lib/api-response";
import { connectToDatabase } from "@/lib/db";
import { objectId } from "@/lib/portal-access";
import { getCurrentUser } from "@/lib/permissions";
import { readJson, validateMutationOrigin } from "@/lib/request";
import { enforceRateLimit } from "@/lib/rate-limit";
import Conversation from "@/models/Conversation";
import Message from "@/models/Message";
import Notification from "@/models/Notification";

const messageSchema = z.object({
  body: z.string().trim().max(5000).optional(),
  attachments: z.array(z.object({
    url: z.string().trim().url().max(2048).refine((value) => ["https:", "http:"].includes(new URL(value).protocol)),
    name: z.string().trim().min(1).max(200),
    mimeType: z.string().trim().min(1).max(100),
    size: z.coerce.number().int().min(0).max(25 * 1024 * 1024),
  }).strict()).max(5).default([]),
}).strict().refine((value) => Boolean(value.body) || value.attachments.length > 0, "A message or attachment is required.");

export const GET = withApiErrors(async (request, context: { params: Promise<{ id: string }> }) => {
  const user = await getCurrentUser();
  const { id } = await context.params;
  await connectToDatabase();
  const conversation = await Conversation.findOne({ _id: objectId(id), participants: user._id }).select("_id");
  if (!conversation) throw new ApiError("Conversation was not found.", 404);
  const url = new URL(request.url);
  const limit = Math.max(1, Math.min(100, Number(url.searchParams.get("limit") ?? 50)));
  const before = url.searchParams.get("before");
  const filter = { conversation: conversation._id, ...(before ? { createdAt: { $lt: new Date(before) } } : {}) };
  const [messages, total] = await Promise.all([
    Message.find(filter).populate("sender", "name profileImage role").sort({ createdAt: -1 }).limit(limit).lean(),
    Message.countDocuments(filter),
  ]);
  await Message.updateMany({ conversation: conversation._id, sender: { $ne: user._id }, "readBy.user": { $ne: user._id } }, { $addToSet: { readBy: { user: user._id, readAt: new Date() } } });
  return apiSuccess({ messages: messages.reverse(), total });
});

export const POST = withApiErrors(async (request, context: { params: Promise<{ id: string }> }) => {
  validateMutationOrigin(request);
  const user = await getCurrentUser();
  const { id } = await context.params;
  const body = messageSchema.parse(await readJson(request));
  await enforceRateLimit({ scope: "conversation-message", identity: user.id, limit: 120, windowMs: 60 * 60 * 1000 });
  await connectToDatabase();
  const conversation = await Conversation.findOne({ _id: objectId(id), participants: user._id });
  if (!conversation) throw new ApiError("Conversation was not found.", 404);
  const message = await Message.create({ conversation: conversation._id, sender: user._id, body: body.body, attachments: body.attachments, readBy: [{ user: user._id, readAt: new Date() }] });
  conversation.lastMessageAt = message.createdAt;
  await conversation.save();
  const recipients = conversation.participants.filter((participant: Types.ObjectId) => participant.toString() !== user._id.toString());
  if (recipients.length) await Notification.insertMany(recipients.map((recipient: Types.ObjectId) => ({
    recipient, type: "new_message", title: "New message",
    message: body.body?.slice(0, 180) || "You received an attachment.",
    data: { href: user.role === "brand" ? "/creator/messages" : "/brand/messages", conversationId: conversation.id },
  })));
  return apiSuccess({ message }, "Message sent.", 201);
});
