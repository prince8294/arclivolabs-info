import { model, models, Schema, type InferSchemaType, type Types } from "mongoose";

const messageSchema = new Schema(
  {
    conversation: { type: Schema.Types.ObjectId, ref: "Conversation", required: true, index: true },
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    body: { type: String, required: true, trim: true, maxlength: 5000 },
    attachments: { type: [{ url: { type: String, required: true, maxlength: 2048 }, name: { type: String, required: true, maxlength: 200 }, mimeType: { type: String, required: true, maxlength: 100 }, size: { type: Number, required: true, min: 0 } }], default: [] },
    readBy: { type: [{ user: { type: Schema.Types.ObjectId, ref: "User", required: true }, readAt: { type: Date, required: true } }], default: [] },
  },
  { timestamps: true, strict: "throw" },
);
messageSchema.index({ conversation: 1, createdAt: -1 });

export type MessageRecord = InferSchemaType<typeof messageSchema> & { _id: Types.ObjectId };
const Message = models.Message ?? model("Message", messageSchema);
export default Message;
