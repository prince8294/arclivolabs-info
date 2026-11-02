import { model, models, Schema } from "mongoose";

const rateLimitSchema = new Schema(
  {
    _id: { type: String, required: true },
    count: { type: Number, required: true, default: 0, min: 0 },
    expiresAt: { type: Date, required: true },
  },
  { versionKey: false },
);
rateLimitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const RateLimit = models.RateLimit ?? model("RateLimit", rateLimitSchema);
export default RateLimit;
