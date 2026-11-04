import { model, models, Schema, type InferSchemaType, type Types } from "mongoose";

const creatorApplicationSchema = new Schema(
  {
    referenceId: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, lowercase: true, trim: true, maxlength: 254 },
    phone: { type: String, trim: true, maxlength: 32 },
    socialProfile: { type: String, trim: true, maxlength: 2048 },
    instagramUsername: { type: String, trim: true, lowercase: true, maxlength: 64 },
    youtubeChannel: { type: String, trim: true, lowercase: true, maxlength: 250 },
    primaryPlatform: { type: String, required: true, maxlength: 50 },
    contentCategory: { type: String, trim: true, maxlength: 100 },
    followers: { type: Number, min: 0 },
    location: { type: String, trim: true, maxlength: 160 },
    portfolioUrl: { type: String, trim: true, maxlength: 2048 },
    introduction: { type: String, trim: true, maxlength: 3000 },
    approvalStatus: { type: String, enum: ["pending", "contacted", "qualified", "approved", "rejected"], default: "pending", index: true },
    user: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, strict: "throw" },
);
creatorApplicationSchema.index({ email: 1 }, { unique: true, sparse: true });
creatorApplicationSchema.index({ socialProfile: 1 }, { unique: true, sparse: true });
creatorApplicationSchema.index({ instagramUsername: 1 }, { unique: true, sparse: true });
creatorApplicationSchema.index({ youtubeChannel: 1 }, { unique: true, sparse: true });

export type CreatorApplicationRecord = InferSchemaType<typeof creatorApplicationSchema> & { _id: Types.ObjectId };
const CreatorApplication = models.CreatorApplication ?? model("CreatorApplication", creatorApplicationSchema);
export default CreatorApplication;
