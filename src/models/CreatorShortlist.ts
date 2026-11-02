import { model, models, Schema, type InferSchemaType, type Types } from "mongoose";

const creatorShortlistSchema = new Schema(
  {
    brand: { type: Schema.Types.ObjectId, ref: "Brand", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    creators: {
      type: [{
        creator: { type: Schema.Types.ObjectId, ref: "Creator", required: true },
        note: { type: String, trim: true, maxlength: 1000 },
        addedAt: { type: Date, default: Date.now },
      }],
      default: [],
    },
  },
  { timestamps: true, strict: "throw" },
);
creatorShortlistSchema.index({ brand: 1, name: 1 }, { unique: true });

export type CreatorShortlistRecord = InferSchemaType<typeof creatorShortlistSchema> & { _id: Types.ObjectId };
const CreatorShortlist = models.CreatorShortlist ?? model("CreatorShortlist", creatorShortlistSchema);
export default CreatorShortlist;
