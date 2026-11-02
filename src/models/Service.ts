import { model, models, Schema, type InferSchemaType, type Types } from "mongoose";

const serviceSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 180 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 180 },
    description: { type: String, required: true, trim: true, maxlength: 1000 },
    content: { type: String, required: true, maxlength: 20000 },
    icon: { type: String, trim: true, maxlength: 50 },
    featuredImage: { type: String, trim: true, maxlength: 2048 },
    isActive: { type: Boolean, default: false, index: true },
    isFeatured: { type: Boolean, default: false, index: true },
    isDemo: { type: Boolean, default: false },
    seo: { title: { type: String, maxlength: 180 }, description: { type: String, maxlength: 320 } },
  },
  { timestamps: true, strict: "throw" },
);
serviceSchema.index({ isActive: 1, title: 1 });

export type ServiceRecord = InferSchemaType<typeof serviceSchema> & { _id: Types.ObjectId };
const Service = models.Service ?? model("Service", serviceSchema);
export default Service;
