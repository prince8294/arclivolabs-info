import { model, models, Schema } from "mongoose";

const scheduledJobRunSchema = new Schema(
  {
    jobType: { type: String, required: true, trim: true, maxlength: 100 },
    periodKey: { type: String, required: true, trim: true, maxlength: 100 },
    status: { type: String, enum: ["processing", "succeeded", "failed"], default: "processing", index: true },
    startedAt: { type: Date, required: true, default: Date.now },
    completedAt: { type: Date },
    processedCount: { type: Number, min: 0, default: 0 },
    errorCode: { type: String, trim: true, maxlength: 120 },
  },
  { timestamps: true, strict: "throw" },
);
scheduledJobRunSchema.index({ jobType: 1, periodKey: 1 }, { unique: true });

const ScheduledJobRun = models.ScheduledJobRun ?? model("ScheduledJobRun", scheduledJobRunSchema);
export default ScheduledJobRun;
