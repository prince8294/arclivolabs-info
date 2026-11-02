import { model, models, Schema, type InferSchemaType, type Types } from "mongoose";

const collaborationSchema = new Schema(
  {
    invitation: { type: Schema.Types.ObjectId, ref: "CampaignInvitation", required: true, unique: true },
    campaign: { type: Schema.Types.ObjectId, ref: "Campaign", required: true, index: true },
    brand: { type: Schema.Types.ObjectId, ref: "Brand", required: true, index: true },
    creator: { type: Schema.Types.ObjectId, ref: "Creator", required: true, index: true },
    agreedCompensation: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, uppercase: true, minlength: 3, maxlength: 3 },
    deliverables: { type: [{ description: { type: String, required: true }, quantity: { type: Number, required: true, min: 1 }, platform: String }], default: [] },
    deadline: { type: Date, required: true },
    status: { type: String, enum: ["invited", "accepted", "in_progress", "content_submitted", "revision_requested", "approved", "completed", "cancelled"], default: "accepted", index: true },
    agreementStatus: { type: String, enum: ["pending", "accepted"], default: "pending" },
  },
  { timestamps: true, strict: "throw" },
);
collaborationSchema.index({ brand: 1, status: 1, createdAt: -1 });
collaborationSchema.index({ creator: 1, status: 1, createdAt: -1 });

export type CollaborationRecord = InferSchemaType<typeof collaborationSchema> & { _id: Types.ObjectId };
const Collaboration = models.Collaboration ?? model("Collaboration", collaborationSchema);
export default Collaboration;
