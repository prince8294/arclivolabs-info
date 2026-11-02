import { model, models, Schema, type InferSchemaType, type Types } from "mongoose";

const campaignInvitationSchema = new Schema(
  {
    campaign: { type: Schema.Types.ObjectId, ref: "Campaign", required: true, index: true },
    brand: { type: Schema.Types.ObjectId, ref: "Brand", required: true, index: true },
    creator: { type: Schema.Types.ObjectId, ref: "Creator", required: true, index: true },
    invitedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    deliverables: { type: [{ description: { type: String, required: true, maxlength: 500 }, quantity: { type: Number, required: true, min: 1 }, platform: { type: String, maxlength: 50 } }], default: [] },
    compensation: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, uppercase: true, minlength: 3, maxlength: 3 },
    deadline: { type: Date, required: true },
    message: { type: String, trim: true, maxlength: 2000 },
    expiresAt: { type: Date, required: true, index: true },
    status: { type: String, enum: ["pending", "accepted", "rejected", "expired", "cancelled"], default: "pending", index: true },
    respondedAt: { type: Date },
  },
  { timestamps: true, strict: "throw" },
);
campaignInvitationSchema.index({ campaign: 1, creator: 1, status: 1 }, { unique: true, partialFilterExpression: { status: "pending" } });
campaignInvitationSchema.index({ creator: 1, status: 1, createdAt: -1 });

export type CampaignInvitationRecord = InferSchemaType<typeof campaignInvitationSchema> & { _id: Types.ObjectId };
const CampaignInvitation = models.CampaignInvitation ?? model("CampaignInvitation", campaignInvitationSchema);
export default CampaignInvitation;
