import { model, models, Schema, type InferSchemaType, type Types } from "mongoose";

const emailOutboxSchema = new Schema(
  {
    to: { type: String, required: true, lowercase: true, trim: true, maxlength: 254 },
    template: { type: String, required: true, trim: true, maxlength: 80 },
    data: { type: Schema.Types.Mixed, required: true },
    dedupeKey: { type: String, required: true, unique: true, trim: true, maxlength: 180 },
    status: { type: String, enum: ["pending", "processing", "sent", "failed", "blocked"], default: "pending", index: true },
    attempts: { type: Number, required: true, default: 0, min: 0 },
    nextAttemptAt: { type: Date, required: true, default: Date.now, index: true },
    lockUntil: { type: Date },
    providerMessageId: { type: String, trim: true, maxlength: 200 },
    lastErrorCode: { type: String, trim: true, maxlength: 120 },
    sentAt: { type: Date },
    expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
  },
  { timestamps: true, strict: "throw" },
);
emailOutboxSchema.index({ status: 1, nextAttemptAt: 1, createdAt: 1 });

export type EmailOutboxRecord = InferSchemaType<typeof emailOutboxSchema> & { _id: Types.ObjectId };
const EmailOutbox = models.EmailOutbox ?? model("EmailOutbox", emailOutboxSchema);
export default EmailOutbox;
