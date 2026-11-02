import { model, models, Schema, type InferSchemaType, type Types } from "mongoose";

const enquirySchema = new Schema(
  {
    referenceId: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    company: { type: String, required: true, trim: true, maxlength: 160 },
    email: { type: String, required: true, lowercase: true, trim: true, maxlength: 254 },
    phone: { type: String, required: true, trim: true, maxlength: 32 },
    serviceRequired: { type: String, required: true, trim: true, maxlength: 100 },
    budget: { type: String, required: true, trim: true, maxlength: 80 },
    details: { type: String, required: true, trim: true, maxlength: 5000 },
    preferredPlatform: { type: String, default: "Not specified", maxlength: 50 },
    subject: { type: String, trim: true, maxlength: 160 },
    status: { type: String, enum: ["new", "contacted", "qualified", "proposal_sent", "negotiation", "converted", "rejected"], default: "new", index: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User", index: true },
    followUpAt: { type: Date },
    dedupeHash: { type: String, select: false },
    submittedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true, strict: "throw" },
);
enquirySchema.index({ dedupeHash: 1 }, { unique: true, sparse: true });
enquirySchema.index({ email: 1, createdAt: -1 });

export type EnquiryRecord = InferSchemaType<typeof enquirySchema> & { _id: Types.ObjectId };
const Enquiry = models.Enquiry ?? model("Enquiry", enquirySchema, "brandEnquiries");
export default Enquiry;
