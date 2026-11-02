import { model, models, Schema, type InferSchemaType, type Types } from "mongoose";

const contactMessageSchema = new Schema(
  {
    referenceId: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, lowercase: true, trim: true, maxlength: 254 },
    phone: { type: String, trim: true, maxlength: 32 },
    subject: { type: String, required: true, trim: true, maxlength: 160 },
    message: { type: String, required: true, trim: true, maxlength: 5000 },
    dedupeHash: { type: String, select: false },
    status: { type: String, enum: ["new", "read", "replied", "archived"], default: "new", index: true },
  },
  { timestamps: true, strict: "throw" },
);
contactMessageSchema.index({ email: 1, createdAt: -1 });
contactMessageSchema.index({ dedupeHash: 1 }, { unique: true, sparse: true });

export type ContactMessageRecord = InferSchemaType<typeof contactMessageSchema> & { _id: Types.ObjectId };
const ContactMessage = models.ContactMessage ?? model("ContactMessage", contactMessageSchema);
export default ContactMessage;
