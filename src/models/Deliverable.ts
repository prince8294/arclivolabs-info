import { model, models, Schema, type InferSchemaType, type Types } from "mongoose";

const deliverableSchema = new Schema(
  {
    collaboration: { type: Schema.Types.ObjectId, ref: "Collaboration", required: true, index: true },
    campaign: { type: Schema.Types.ObjectId, ref: "Campaign", required: true, index: true },
    brand: { type: Schema.Types.ObjectId, ref: "Brand", required: true, index: true },
    creator: { type: Schema.Types.ObjectId, ref: "Creator", required: true, index: true },
    description: { type: String, required: true, trim: true, maxlength: 500 },
    dueAt: { type: Date, required: true },
    status: { type: String, enum: ["pending", "submitted", "revision_requested", "approved"], default: "pending", index: true },
    submissionUrl: { type: String, trim: true, maxlength: 2048 },
    caption: { type: String, trim: true, maxlength: 5000 },
    submittedAt: { type: Date },
    reviewer: { type: Schema.Types.ObjectId, ref: "User" },
    feedback: { type: String, trim: true, maxlength: 2000 },
    revisionCount: { type: Number, default: 0, min: 0 },
    revisionHistory: { type: [{ url: String, caption: String, feedback: String, submittedAt: Date, reviewer: { type: Schema.Types.ObjectId, ref: "User" }, status: String }], default: [] },
    approvedAt: { type: Date },
  },
  { timestamps: true, strict: "throw" },
);
deliverableSchema.index({ collaboration: 1, dueAt: 1 });
deliverableSchema.index({ brand: 1, status: 1 });
deliverableSchema.index({ creator: 1, status: 1 });

export type DeliverableRecord = InferSchemaType<typeof deliverableSchema> & { _id: Types.ObjectId };
const Deliverable = models.Deliverable ?? model("Deliverable", deliverableSchema);
export default Deliverable;
