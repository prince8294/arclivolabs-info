import { model, models, Schema, type InferSchemaType, type Types } from "mongoose";

const creatorApplicationSchema = new Schema(
  {
    referenceId: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, lowercase: true, trim: true, maxlength: 254 },
    phone: { type: String, trim: true, maxlength: 32 },
    socialProfile: { type: String, trim: true, maxlength: 2048 },
    instagramUsername: { type: String, trim: true, lowercase: true, maxlength: 64 },
    instagramBio: { type: String, trim: true, maxlength: 3000 },
    profileImage: { type: String, trim: true, maxlength: 2048 },
    profileImagePublicId: { type: String, trim: true, maxlength: 500 },
    profileImageSourceUrl: { type: String, trim: true, maxlength: 2048 },
    profileImageSourceHash: { type: String, trim: true, lowercase: true, maxlength: 64 },
    profileImageLastSyncedAt: { type: Date },
    youtubeChannel: { type: String, trim: true, lowercase: true, maxlength: 250 },
    primaryPlatform: { type: String, required: true, maxlength: 50 },
    contentCategory: { type: String, trim: true, maxlength: 100 },
    followers: { type: Number, min: 0 },
    followingCount: { type: Number, min: 0 },
    postsCount: { type: Number, min: 0 },
    averageLikes: { type: Number, min: 0 },
    averageComments: { type: Number, min: 0 },
    averageViews: { type: Number, min: 0 },
    engagementRate: { type: Number, min: 0, max: 100 },
    recentInstagramMedia: {
      type: [{
        mediaId: { type: String, required: true, trim: true, maxlength: 100 },
        caption: { type: String, trim: true, maxlength: 5000 },
        mediaType: { type: String, trim: true, maxlength: 50 },
        mediaProductType: { type: String, trim: true, maxlength: 50 },
        permalink: { type: String, trim: true, maxlength: 2048 },
        thumbnailUrl: { type: String, trim: true, maxlength: 2048 },
        publishedAt: { type: Date },
        likesCount: { type: Number, min: 0 },
        commentsCount: { type: Number, min: 0 },
        viewsCount: { type: Number, min: 0 },
      }],
      default: [],
    },
    instagramLastSyncedAt: { type: Date },
    instagramSyncStatus: { type: String, enum: ["succeeded", "partial", "failed"] },
    instagramSyncError: { type: String, trim: true, maxlength: 1000 },
    location: { type: String, trim: true, maxlength: 160 },
    languages: { type: [String], default: [] },
    portfolioUrl: { type: String, trim: true, maxlength: 2048 },
    collaborationCharges: { type: String, trim: true, maxlength: 1000 },
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
