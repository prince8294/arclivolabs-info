import { model, models, Schema, type InferSchemaType, type Types } from "mongoose";

const portfolioItemSchema = new Schema(
  {
    creator: { type: Schema.Types.ObjectId, ref: "Creator", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, trim: true, maxlength: 2000 },
    mediaUrl: { type: String, required: true, trim: true, maxlength: 2048 },
    mediaType: { type: String, enum: ["image", "video", "link"], required: true },
    categories: { type: [String], default: [] },
    sortOrder: { type: Number, default: 0 },
    isVisible: { type: Boolean, default: true },
  },
  { timestamps: true, strict: "throw" },
);
portfolioItemSchema.index({ creator: 1, sortOrder: 1 });

export type PortfolioItemRecord = InferSchemaType<typeof portfolioItemSchema> & { _id: Types.ObjectId };
const PortfolioItem = models.PortfolioItem ?? model("PortfolioItem", portfolioItemSchema);
export default PortfolioItem;
