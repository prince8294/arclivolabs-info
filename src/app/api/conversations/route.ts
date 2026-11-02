import { z } from "zod";
import { apiSuccess, ApiError, withApiErrors } from "@/lib/api-response";
import { connectToDatabase } from "@/lib/db";
import { getCurrentUser, requireRole } from "@/lib/permissions";
import { objectId, requireOwnedBrand } from "@/lib/portal-access";
import { readJson, validateMutationOrigin } from "@/lib/request";
import Campaign from "@/models/Campaign";
import Conversation from "@/models/Conversation";
import Creator from "@/models/Creator";
import Notification from "@/models/Notification";

const createConversationSchema = z.object({ creatorId: z.string().trim().min(1), campaignId: z.string().trim().min(1) }).strict();

export const GET = withApiErrors(async (request) => {
  const user = await getCurrentUser();
  await connectToDatabase();
  const url = new URL(request.url);
  const page = Math.max(1, Math.min(100000, Number(url.searchParams.get("page") ?? 1)));
  const limit = Math.max(1, Math.min(100, Number(url.searchParams.get("limit") ?? 25)));
  const conversations = await Conversation.find({ participants: user._id })
    .populate("participants", "name profileImage role")
    .populate("campaign", "title").populate("brand", "companyName companyLogo").populate("creator", "fullName profileImage")
    .sort({ lastMessageAt: -1 }).skip((page - 1) * limit).limit(limit).lean();
  const total = await Conversation.countDocuments({ participants: user._id });
  return apiSuccess({ conversations, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

export const POST = withApiErrors(async (request) => {
  validateMutationOrigin(request);
  const user = await requireRole(["brand"]);
  const brand = await requireOwnedBrand(user, { active: true });
  const body = createConversationSchema.parse(await readJson(request));
  await connectToDatabase();
  const [campaign, creator] = await Promise.all([
    Campaign.findOne({ _id: objectId(body.campaignId), brand: brand._id, status: { $in: ["approved", "active"] } }).select("_id"),
    Creator.findOne({ _id: objectId(body.creatorId), approvalStatus: "approved", user: { $exists: true } }).select("_id user"),
  ]);
  if (!campaign || !creator?.user) throw new ApiError("A valid active campaign and a creator account are required.", 404);
  const conversation = await Conversation.findOneAndUpdate(
    { brand: brand._id, creator: creator._id, campaign: campaign._id },
    { $setOnInsert: { participants: [user._id, creator.user], brand: brand._id, creator: creator._id, campaign: campaign._id, lastMessageAt: new Date() } },
    { returnDocument: "after", upsert: true, runValidators: true, setDefaultsOnInsert: true },
  );
  await Notification.create({
    recipient: creator.user,
    type: "new_message",
    title: "Brand opened a campaign conversation",
    message: "A brand started a conversation about a campaign.",
    data: { href: "/creator/messages", conversationId: conversation.id },
  });
  return apiSuccess({ conversation: { id: conversation.id } }, "Conversation opened.", 201);
});
