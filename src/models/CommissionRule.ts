import { model, models, Schema, type InferSchemaType, type Types } from "mongoose";

const commissionRuleSchema = new Schema(
  {
    tierKey: { type: String, required: true, unique: true, trim: true },
    minFollowers: { type: Number, required: true, min: 0 },
    maxFollowers: { type: Number, min: 0, default: null },
    label: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "INR", trim: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, strict: "throw" },
);

commissionRuleSchema.index({ order: 1 });
commissionRuleSchema.index({ minFollowers: 1 });

export type CommissionRuleRecord = InferSchemaType<typeof commissionRuleSchema> & { _id: Types.ObjectId };
const CommissionRule = models.CommissionRule ?? model("CommissionRule", commissionRuleSchema);
export default CommissionRule;

