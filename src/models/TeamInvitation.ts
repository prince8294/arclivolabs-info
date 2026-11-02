import { model, models, Schema, type InferSchemaType, type Types } from "mongoose";
import { userRoles } from "@/models/User";

const invitationRoles = userRoles.filter((role) => role !== "super_admin" && role !== "brand" && role !== "creator");

const teamInvitationSchema = new Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true, maxlength: 254 },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    role: { type: String, enum: invitationRoles, required: true },
    tokenHash: { type: String, required: true, select: false, unique: true },
    invitedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
    acceptedAt: { type: Date },
    revokedAt: { type: Date },
  },
  { timestamps: true, strict: "throw" },
);
teamInvitationSchema.index({ email: 1, acceptedAt: 1, revokedAt: 1 });

export type TeamInvitationRecord = InferSchemaType<typeof teamInvitationSchema> & { _id: Types.ObjectId };
const TeamInvitation = models.TeamInvitation ?? model("TeamInvitation", teamInvitationSchema);
export default TeamInvitation;
