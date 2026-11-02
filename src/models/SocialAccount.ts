import { model, models, Schema, type InferSchemaType, type Types } from "mongoose";

const socialAccountSchema = new Schema(
  {
    creator: { type: Schema.Types.ObjectId, ref: "Creator", required: true, index: true },
    platform: { type: String, required: true, trim: true, lowercase: true, maxlength: 50 },
    username: { type: String, required: true, trim: true, lowercase: true, maxlength: 120 },
    profileUrl: { type: String, required: true, trim: true, maxlength: 2048 },
    followers: { type: Number, required: true, min: 0 },
    averageViews: { type: Number, min: 0 },
    verificationStatus: { type: String, enum: ["unverified", "pending", "verified"], default: "unverified" },
    lastVerifiedAt: { type: Date },
  },
  { timestamps: true, strict: "throw" },
);
socialAccountSchema.index({ creator: 1, platform: 1, username: 1 }, { unique: true });

export type SocialAccountRecord = InferSchemaType<typeof socialAccountSchema> & { _id: Types.ObjectId };
const SocialAccount = models.SocialAccount ?? model("SocialAccount", socialAccountSchema);
export default SocialAccount;
