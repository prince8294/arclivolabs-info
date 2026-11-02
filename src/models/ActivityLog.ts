import { model, models, Schema, type InferSchemaType, type Types } from "mongoose";

const activityLogSchema = new Schema(
  {
    actor: { type: Schema.Types.ObjectId, ref: "User", index: true },
    action: { type: String, required: true, trim: true, maxlength: 100 },
    resourceType: { type: String, required: true, trim: true, maxlength: 80 },
    resourceId: { type: Schema.Types.ObjectId },
    metadata: { type: Schema.Types.Mixed },
    ipHash: { type: String, maxlength: 64 },
  },
  { timestamps: { createdAt: true, updatedAt: false }, strict: "throw" },
);
activityLogSchema.index({ resourceType: 1, resourceId: 1, createdAt: -1 });

export type ActivityLogRecord = InferSchemaType<typeof activityLogSchema> & { _id: Types.ObjectId };
const ActivityLog = models.ActivityLog ?? model("ActivityLog", activityLogSchema);
export default ActivityLog;
