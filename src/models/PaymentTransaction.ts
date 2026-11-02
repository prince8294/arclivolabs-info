import { model, models, Schema, type InferSchemaType, type Types } from "mongoose";

const payoutHistorySchema = new Schema(
  {
    status: { type: String, enum: ["pending", "paid", "failed"], required: true },
    reference: { type: String, trim: true, maxlength: 120 },
    recordedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    recordedAt: { type: Date, required: true },
  },
  { _id: false, strict: "throw" },
);

const paymentTransactionSchema = new Schema(
  {
    creator: { type: Schema.Types.ObjectId, ref: "Creator", required: true, index: true },
    brand: { type: Schema.Types.ObjectId, ref: "Brand", required: true, index: true },
    campaign: { type: Schema.Types.ObjectId, ref: "Campaign", required: true, index: true },
    collaboration: { type: Schema.Types.ObjectId, ref: "Collaboration", index: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, uppercase: true, minlength: 3, maxlength: 3 },
    status: { type: String, enum: ["pending", "paid", "failed"], default: "pending", index: true },
    reference: { type: String, trim: true, maxlength: 120 },
    recordedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    paidAt: { type: Date },
    history: { type: [payoutHistorySchema], default: [] },
  },
  { timestamps: true, strict: "throw" },
);
paymentTransactionSchema.index({ creator: 1, status: 1, createdAt: -1 });
paymentTransactionSchema.index({ brand: 1, status: 1, createdAt: -1 });

export type PaymentTransactionRecord = InferSchemaType<typeof paymentTransactionSchema> & { _id: Types.ObjectId };
const PaymentTransaction = models.PaymentTransaction ?? model("PaymentTransaction", paymentTransactionSchema);
export default PaymentTransaction;
