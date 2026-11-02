import { model, models, Schema, type InferSchemaType, type Types } from "mongoose";

const internalNoteSchema = new Schema(
  {
    entityType: { type: String, required: true, enum: ["creator", "brand", "campaign", "enquiry", "contact"], index: true },
    entityId: { type: Schema.Types.ObjectId, required: true, index: true },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    body: { type: String, required: true, trim: true, maxlength: 5000 },
  },
  { timestamps: { createdAt: true, updatedAt: false }, strict: "throw" },
);
internalNoteSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });

export type InternalNoteRecord = InferSchemaType<typeof internalNoteSchema> & { _id: Types.ObjectId };
const InternalNote = models.InternalNote ?? model("InternalNote", internalNoteSchema);
export default InternalNote;
