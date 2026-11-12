import { model, models, Schema, type InferSchemaType, type Types } from "mongoose";

const ticketMessageSchema = new Schema(
  {
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    senderRole: { type: String, enum: ["student", "admin"], required: true },
    senderName: { type: String, required: true },
    message: { type: String, required: true, trim: true, maxlength: 3000 },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true, strict: "throw" }
);

const studentSupportTicketSchema = new Schema(
  {
    ticketNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    student: { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    studentUser: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    studentName: { type: String, required: true, trim: true },
    studentEmail: { type: String, required: true, lowercase: true, trim: true },
    studentId: { type: String, required: true, uppercase: true, trim: true },
    category: {
      type: String,
      enum: [
        "Commission & Payouts",
        "Referral Tracking",
        "Creator Verification",
        "Account & Profile",
        "General Support",
      ],
      default: "General Support",
      required: true,
    },
    subject: { type: String, required: true, trim: true, minlength: 3, maxlength: 200 },
    status: {
      type: String,
      enum: ["open", "in_progress", "resolved", "closed"],
      default: "open",
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    messages: { type: [ticketMessageSchema], default: [] },
    lastReplyAt: { type: Date, default: Date.now, index: true },
    lastReplyBy: { type: String, enum: ["student", "admin"], default: "student" },
    resolvedAt: { type: Date },
    resolvedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, strict: "throw" }
);

studentSupportTicketSchema.index({ student: 1, createdAt: -1 });
studentSupportTicketSchema.index({ status: 1, createdAt: -1 });

export type StudentSupportTicketRecord = InferSchemaType<typeof studentSupportTicketSchema> & {
  _id: Types.ObjectId;
};

const StudentSupportTicket =
  models.StudentSupportTicket ?? model("StudentSupportTicket", studentSupportTicketSchema);
export default StudentSupportTicket;
