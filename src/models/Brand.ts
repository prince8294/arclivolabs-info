import { model, models, Schema, type InferSchemaType, type Types } from "mongoose";

const brandSchema = new Schema(
  {
    companyName: { type: String, required: true, trim: true, maxlength: 180 },
    contactPerson: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, lowercase: true, trim: true, maxlength: 254 },
    phone: { type: String, required: true, trim: true, maxlength: 32 },
    website: { type: String, trim: true, maxlength: 2048 },
    industry: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, required: true, trim: true, maxlength: 3000 },
    companyLogo: { type: String, trim: true, maxlength: 2048 },
    location: { type: String, required: true, trim: true, maxlength: 160 },
    country: { type: String, required: true, trim: true, maxlength: 100 },
    socialMediaLinks: { type: [{ platform: String, url: String }], default: [] },
    status: { type: String, enum: ["active", "pending", "suspended"], default: "pending", index: true },
    user: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, strict: "throw" },
);
brandSchema.index({ email: 1 });
brandSchema.index({ industry: 1, country: 1 });
brandSchema.index({ user: 1 }, { unique: true, sparse: true });

export type BrandRecord = InferSchemaType<typeof brandSchema> & { _id: Types.ObjectId };
const Brand = models.Brand ?? model("Brand", brandSchema);
export default Brand;
