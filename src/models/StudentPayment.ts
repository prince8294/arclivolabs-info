import { model, models, Schema, type InferSchemaType, type Types } from "mongoose";

const studentPaymentAuditSchema = new Schema(
  {
    action: { type: String, required: true },
    performedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    performedByName: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    details: { type: String, required: true },
  },
  { _id: false, strict: "throw" }
);

const studentPaymentSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    studentUser: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    amount: { type: Number, required: true, min: 0.01 },
    currency: { type: String, default: "INR", uppercase: true },
    paymentDate: { type: Date, required: true, index: true },
    paymentMethod: {
      type: String,
      enum: ["UPI", "Bank Transfer", "Other"],
      required: true,
    },
    transactionReference: { type: String, trim: true, maxlength: 120 },
    internalNote: { type: String, trim: true, maxlength: 1000 },
    status: {
      type: String,
      enum: ["pending", "processing", "paid", "rejected"],
      default: "pending",
      index: true,
    },
    paidAt: { type: Date },
    recordedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    recordedByName: { type: String, required: true },
    auditLog: { type: [studentPaymentAuditSchema], default: [] },
  },
  { timestamps: true, strict: "throw" }
);

studentPaymentSchema.index({ student: 1, paymentDate: -1 });
studentPaymentSchema.index({ student: 1, status: 1 });
studentPaymentSchema.index({ transactionReference: 1 }, { sparse: true });

export type StudentPaymentRecord = InferSchemaType<typeof studentPaymentSchema> & {
  _id: Types.ObjectId;
};

const StudentPayment = models.StudentPayment ?? model("StudentPayment", studentPaymentSchema);
export default StudentPayment;
