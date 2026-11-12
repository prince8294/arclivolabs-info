import { model, models, Schema, type InferSchemaType, type Types } from "mongoose";

const auditEntrySchema = new Schema(
  {
    action: { type: String, required: true },
    performedBy: { type: Schema.Types.ObjectId, ref: "User" },
    performedByName: { type: String },
    timestamp: { type: Date, default: Date.now },
    details: { type: String },
  },
  { _id: false },
);

const studentReferralSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    referralCode: { type: String, required: true, uppercase: true, trim: true, index: true },
    creatorName: { type: String, required: true, trim: true, maxlength: 120 },
    creatorHandle: { type: String, required: true, lowercase: true, trim: true },
    platform: { type: String, default: "Instagram", trim: true, maxlength: 50 },
    category: { type: String, default: "General", trim: true, maxlength: 100 },
    followers: { type: Number, default: 0, min: 0 },
    confirmedFollowers: { type: Number, min: 0 },
    status: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
      index: true,
    },
    verifiedAt: { type: Date },
    verifiedBy: { type: Schema.Types.ObjectId, ref: "User" },
    rejectionReason: { type: String, trim: true, maxlength: 500 },
    commissionEarned: { type: Number, default: 0, min: 0 },
    commissionApproved: { type: Boolean, default: false },
    commissionApprovedAt: { type: Date },
    commissionTierLabel: { type: String, trim: true },
    currency: { type: String, default: "INR" },
    registrationDate: { type: Date, default: Date.now },
    creatorApplication: { type: Schema.Types.ObjectId, ref: "CreatorApplication" },
    notes: { type: String, trim: true, maxlength: 500 },
    auditLog: { type: [auditEntrySchema], default: [] },
  },
  { timestamps: true, strict: "throw" },
);

studentReferralSchema.index({ student: 1, status: 1 });
studentReferralSchema.index({ creatorHandle: 1 }, { unique: true });
studentReferralSchema.index({ referralCode: 1, createdAt: -1 });

export type StudentReferralRecord = InferSchemaType<typeof studentReferralSchema> & { _id: Types.ObjectId };
const StudentReferral = models.StudentReferral ?? model("StudentReferral", studentReferralSchema);
export default StudentReferral;
