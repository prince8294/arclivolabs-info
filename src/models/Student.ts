import { model, models, Schema, type InferSchemaType, type Types } from "mongoose";

const customRateSchema = new Schema(
  {
    minFollowers: { type: Number, required: true },
    maxFollowers: { type: Number, default: null },
    amount: { type: Number, required: true },
    label: { type: String, required: true },
  },
  { _id: false }
);

const studentSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, lowercase: true, trim: true, maxlength: 254 },
    studentId: { type: String, required: true, unique: true, uppercase: true, trim: true },
    referralCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
    phone: { type: String, trim: true, maxlength: 32 },
    institution: { type: String, trim: true, maxlength: 200 },
    status: { type: String, enum: ["active", "deactivated"], default: "active", index: true },
    notes: { type: String, trim: true, maxlength: 1000 },
    totalCreatorsReferred: { type: Number, default: 0, min: 0 },
    verifiedCreators: { type: Number, default: 0, min: 0 },
    pendingVerification: { type: Number, default: 0, min: 0 },
    totalEarnings: { type: Number, default: 0, min: 0 },
    paidAmount: { type: Number, default: 0, min: 0 },
    pendingPayment: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: "INR" },
    hasCustomCommissionRates: { type: Boolean, default: false },
    customCommissionRates: { type: [customRateSchema], default: [] },
  },
  { timestamps: true, strict: "throw" }
);

studentSchema.index({ email: 1 });
studentSchema.index({ studentId: 1 }, { unique: true });
studentSchema.index({ referralCode: 1 }, { unique: true });
studentSchema.index({ status: 1 });

export type CustomCommissionRate = {
  minFollowers: number;
  maxFollowers: number | null;
  amount: number;
  label: string;
};

export type StudentRecord = InferSchemaType<typeof studentSchema> & { _id: Types.ObjectId };
const Student = models.Student ?? model("Student", studentSchema);
export default Student;
