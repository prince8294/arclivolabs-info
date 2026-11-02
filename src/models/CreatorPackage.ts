import { model, models, Schema, type InferSchemaType, type Types } from "mongoose";

const creatorPackageSchema = new Schema(
  {
    creator: { type: Schema.Types.ObjectId, ref: "Creator", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    platform: { type: String, required: true, trim: true, maxlength: 50 },
    description: { type: String, trim: true, maxlength: 1000 },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, uppercase: true, minlength: 3, maxlength: 3 },
    deliveryDays: { type: Number, required: true, min: 1, max: 365 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, strict: "throw" },
);
creatorPackageSchema.index({ creator: 1, isActive: 1 });

export type CreatorPackageRecord = InferSchemaType<typeof creatorPackageSchema> & { _id: Types.ObjectId };
const CreatorPackage = models.CreatorPackage ?? model("CreatorPackage", creatorPackageSchema);
export default CreatorPackage;
