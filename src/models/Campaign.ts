import { model, models, Schema, type InferSchemaType, type Types } from "mongoose";

const campaignSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 180 },
    brand: { type: Schema.Types.ObjectId, ref: "Brand", required: true, index: true },
    description: { type: String, required: true, trim: true, maxlength: 10000 },
    objective: { type: String, required: true, trim: true, maxlength: 2000 },
    industry: { type: String, required: true, trim: true, maxlength: 100 },
    platforms: { type: [String], required: true, validate: [(value: string[]) => value.length > 0, "At least one platform is required."] },
    contentTypes: { type: [String], default: [] },
    targetAudience: { type: String, trim: true, maxlength: 2000 },
    targetAgeRange: { type: String, trim: true, maxlength: 60 },
    targetGender: { type: String, trim: true, maxlength: 60 },
    audienceInterests: { type: [String], default: [] },
    audienceLanguages: { type: [String], default: [] },
    creatorCategories: { type: [String], default: [] },
    minimumEngagementRate: { type: Number, min: 0, max: 100 },
    minimumFollowers: { type: Number, min: 0 },
    maximumFollowers: { type: Number, min: 0 },
    budgetPerCreator: { type: Number, min: 0 },
    terms: { type: String, trim: true, maxlength: 5000 },
    brandFeedback: { type: String, trim: true, maxlength: 3000 },
    targetLocation: { type: [String], default: [] },
    budget: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, uppercase: true, default: "INR", minlength: 3, maxlength: 3 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    requiredCreators: { type: Number, required: true, min: 1, max: 10000 },
    selectedCreators: { type: [{ type: Schema.Types.ObjectId, ref: "Creator" }], default: [] },
    deliverables: { type: [{ description: { type: String, required: true }, quantity: { type: Number, required: true, min: 1 }, platform: String }], default: [] },
    status: { type: String, enum: ["draft", "pending", "approved", "active", "completed", "cancelled"], default: "draft", index: true },
    notes: { type: String, trim: true, maxlength: 5000 },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true, strict: "throw" },
);
campaignSchema.index({ status: 1, startDate: 1 });
campaignSchema.index({ brand: 1, createdAt: -1 });

export type CampaignRecord = InferSchemaType<typeof campaignSchema> & { _id: Types.ObjectId };
const Campaign = models.Campaign ?? model("Campaign", campaignSchema);
export default Campaign;
