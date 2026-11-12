import { model, models, Schema, type InferSchemaType, type Types } from "mongoose";

const certificateAuditSchema = new Schema(
  {
    action: { type: String, required: true },
    performedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    performedByName: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    details: { type: String, required: true },
  },
  { _id: false, strict: "throw" }
);

const studentCertificateSchema = new Schema(
  {
    certificateId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    student: { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    studentUser: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    studentName: { type: String, required: true, trim: true },
    studentEmail: { type: String, required: true, lowercase: true, trim: true },
    studentId: { type: String, required: true, uppercase: true, trim: true },
    title: { type: String, required: true, trim: true, minlength: 3, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 1000 },
    issueDate: { type: Date, required: true, index: true },
    fileUrl: { type: String, required: true, trim: true },
    fileName: { type: String, required: true, trim: true },
    fileType: { type: String, required: true, trim: true },
    fileSize: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["published", "revoked"],
      default: "published",
      index: true,
    },
    issuedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    issuedByName: { type: String, required: true },
    revokedAt: { type: Date },
    revokedBy: { type: Schema.Types.ObjectId, ref: "User" },
    auditLog: { type: [certificateAuditSchema], default: [] },
  },
  { timestamps: true, strict: "throw" }
);

studentCertificateSchema.index({ student: 1, status: 1 });
studentCertificateSchema.index({ createdAt: -1 });

export type StudentCertificateRecord = InferSchemaType<typeof studentCertificateSchema> & {
  _id: Types.ObjectId;
};

const StudentCertificate =
  models.StudentCertificate ?? model("StudentCertificate", studentCertificateSchema);
export default StudentCertificate;

