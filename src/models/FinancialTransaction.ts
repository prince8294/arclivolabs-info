import { model, models, Schema, type InferSchemaType, type Types } from "mongoose";

const financialTransactionSchema = new Schema(
  {
    type: { type: String, required: true, enum: ["revenue", "expense"], index: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, uppercase: true, trim: true, minlength: 3, maxlength: 3 },
    description: { type: String, required: true, trim: true, maxlength: 500 },
    reference: { type: String, trim: true, maxlength: 120 },
    campaign: { type: Schema.Types.ObjectId, ref: "Campaign", index: true },
    recordedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    occurredAt: { type: Date, required: true, index: true },
  },
  { timestamps: true, strict: "throw" },
);
financialTransactionSchema.index({ type: 1, occurredAt: -1 });

export type FinancialTransactionRecord = InferSchemaType<typeof financialTransactionSchema> & { _id: Types.ObjectId };
const FinancialTransaction = models.FinancialTransaction ?? model("FinancialTransaction", financialTransactionSchema);
export default FinancialTransaction;
