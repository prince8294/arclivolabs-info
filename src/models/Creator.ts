import { model, models, Schema, type Types, type InferSchemaType } from "mongoose";

const creatorSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, lowercase: true, trim: true, maxlength: 254 },
    phone: { type: String, required: true, trim: true, maxlength: 32 },
    profileImage: { type: String, trim: true, maxlength: 2048 },
    profileImagePublicId: { type: String, trim: true, maxlength: 500 },
    profileImageSourceUrl: { type: String, trim: true, maxlength: 2048 },
    profileImageSourceHash: { type: String, trim: true, lowercase: true, maxlength: 64 },
    profileImageLastSyncedAt: { type: Date },
    bio: { type: String, trim: true, maxlength: 3000 },
    instagramUsername: { type: String, trim: true, lowercase: true, maxlength: 64 },
    instagramUrl: { type: String, trim: true, maxlength: 2048 },
    instagramAccountId: { type: String, trim: true, maxlength: 100 },
    instagramWebsite: { type: String, trim: true, maxlength: 2048 },
    followingCount: { type: Number, min: 0 },
    postsCount: { type: Number, min: 0 },
    instagramDataSource: { type: String, enum: ["meta", "manual"], default: "manual" },
    instagramMedia: {
      type: [{
        mediaId: { type: String, required: true, trim: true, maxlength: 100 },
        caption: { type: String, trim: true, maxlength: 5000 },
        hashtags: { type: [String], default: [] },
        commentsCount: { type: Number, min: 0 },
        likesCount: { type: Number, min: 0 },
        viewsCount: { type: Number, min: 0 },
        mediaType: { type: String, trim: true, maxlength: 50 },
        mediaProductType: { type: String, trim: true, maxlength: 50 },
        permalink: { type: String, trim: true, maxlength: 2048 },
        thumbnailUrl: { type: String, trim: true, maxlength: 2048 },
        publishedAt: { type: Date },
      }],
      default: [],
    },
    youtubeChannel: { type: String, trim: true, maxlength: 250 },
    youtubeUrl: { type: String, trim: true, maxlength: 2048 },
    otherSocialPlatforms: {
      type: [{ platform: { type: String, required: true }, username: { type: String, required: true }, url: String }],
      default: [],
    },
    primaryPlatform: { type: String, required: true, trim: true, maxlength: 50 },
    contentCategories: { type: [String], required: true, validate: [(value: string[]) => value.length > 0, "At least one category is required."] },
    followers: { type: Number, required: true, min: 0 },
    averageViews: { type: Number, min: 0, default: 0 },
    averageLikes: { type: Number, min: 0 },
    averageComments: { type: Number, min: 0 },
    averageReelViews: { type: Number, min: 0 },
    engagementRate: { type: Number, min: 0, max: 100, default: 0 },
    audienceLocation: { type: String, trim: true, maxlength: 300 },
    collaborationTypes: { type: [String], default: [] },
    pastBrandCollaborations: { type: [String], default: [] },
    location: { type: String, required: true, trim: true, maxlength: 160 },
    country: { type: String, trim: true, maxlength: 100 },
    languages: { type: [String], default: [] },
    audienceDemographics: {
      ageRanges: { type: Map, of: Number, default: {} },
      gender: { type: Map, of: Number, default: {} },
      topCountries: { type: [String], default: [] },
    },
    collaborationCharges: { type: Map, of: Number, default: {} },
    portfolioUrl: { type: String, trim: true, maxlength: 2048 },
    availability: { type: String, enum: ["available", "unavailable"], default: "available" },
    verificationStatus: { type: String, enum: ["unverified", "verified"], default: "unverified" },
    metricsVerificationStatus: { type: String, enum: ["unverified", "pending", "verified"], default: "unverified" },
    metricsVerificationRequestedAt: { type: Date },
    metricsLastVerifiedAt: { type: Date },
    lastFollowersSyncedAt: { type: Date },
    lastProfileSyncAt: { type: Date },
    lastMediaSyncAt: { type: Date },
    instagramSyncStatus: { type: String, enum: ["pending", "succeeded", "partial", "failed"] },
    instagramSyncError: { type: String, trim: true, maxlength: 1000 },
    analyzedReels: { type: Number, min: 0, default: 0 },
    viewsSampleSize: { type: Number, min: 0, default: 0 },
    engagementSampleSize: { type: Number, min: 0, default: 0 },
    approvalStatus: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    featured: { type: Boolean, default: false },
    isDemo: { type: Boolean, default: false },
    user: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, strict: "throw" },
);

creatorSchema.index({ approvalStatus: 1, featured: -1, createdAt: -1 });
creatorSchema.index({ contentCategories: 1, primaryPlatform: 1, location: 1, followers: 1 });
creatorSchema.index({ email: 1 }, { unique: true });
creatorSchema.index({ instagramUsername: 1 }, { unique: true, sparse: true });
creatorSchema.index({ profileImageLastSyncedAt: 1, instagramUsername: 1 });
creatorSchema.index({ lastProfileSyncAt: 1, instagramUsername: 1 });
creatorSchema.index({ profileImagePublicId: 1 }, { sparse: true });
creatorSchema.index({ youtubeChannel: 1 }, { unique: true, sparse: true });
creatorSchema.index({ user: 1 }, { unique: true, sparse: true });

export type CreatorRecord = InferSchemaType<typeof creatorSchema> & { _id: Types.ObjectId };
const Creator = models.Creator ?? model("Creator", creatorSchema);
export default Creator;
