import { model, models, Schema, type InferSchemaType, type Types } from "mongoose";

const conversationSchema = new Schema(
  {
    participants: { type: [{ type: Schema.Types.ObjectId, ref: "User" }], required: true, validate: [(ids: Types.ObjectId[]) => ids.length >= 2 && ids.length <= 10, "A conversation needs 2-10 participants."] },
    brand: { type: Schema.Types.ObjectId, ref: "Brand", index: true },
    creator: { type: Schema.Types.ObjectId, ref: "Creator", index: true },
    campaign: { type: Schema.Types.ObjectId, ref: "Campaign", index: true },
    lastMessageAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true, strict: "throw" },
);
conversationSchema.index({ participants: 1, lastMessageAt: -1 });
conversationSchema.index({ brand: 1, creator: 1, campaign: 1 }, { unique: true, partialFilterExpression: { campaign: { $exists: true } } });

export type ConversationRecord = InferSchemaType<typeof conversationSchema> & { _id: Types.ObjectId };
const Conversation = models.Conversation ?? model("Conversation", conversationSchema);
export default Conversation;
