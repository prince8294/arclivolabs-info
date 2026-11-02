import { model, models, Schema, type InferSchemaType, type Types } from "mongoose";

const notificationSchema = new Schema(
  {
    recipient: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, required: true, trim: true, maxlength: 80 },
    title: { type: String, required: true, trim: true, maxlength: 180 },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    data: { type: Schema.Types.Mixed },
    readAt: { type: Date },
    dedupeKey: { type: String, trim: true, maxlength: 180 },
  },
  { timestamps: true, strict: "throw" },
);
notificationSchema.index({ recipient: 1, readAt: 1, createdAt: -1 });
notificationSchema.index({ dedupeKey: 1 }, { unique: true, sparse: true });

export type NotificationRecord = InferSchemaType<typeof notificationSchema> & { _id: Types.ObjectId };
const Notification = models.Notification ?? model("Notification", notificationSchema);
export default Notification;
