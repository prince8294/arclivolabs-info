import { model, models, Schema, type InferSchemaType, type Types } from "mongoose";
import { adminPermissions } from "@/types/admin";

export const userRoles = [
  "super_admin",
  "admin",
  "manager",
  "campaign_manager",
  "creator_manager",
  "sales_executive",
  "finance_manager",
  "brand",
  "creator",
  "student",
] as const;
export type UserRole = typeof userRoles[number];
export const accountStatuses = ["active", "pending", "suspended", "deactivated"] as const;
export type AccountStatus = typeof accountStatuses[number];

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
    email: { type: String, required: true, lowercase: true, trim: true, maxlength: 254 },
    passwordHash: { type: String, required: true, select: false },
    phone: { type: String, trim: true, maxlength: 32 },
    role: { type: String, required: true, enum: userRoles, default: "brand" },
    permissions: { type: [String], enum: adminPermissions, default: undefined },
    profileImage: { type: String, trim: true, maxlength: 2048 },
    status: { type: String, enum: accountStatuses, default: "active", index: true },
    isEmailVerified: { type: Boolean, default: false },
    emailVerifiedAt: { type: Date },
    lastLoginAt: { type: Date },
    sessionVersion: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true, strict: "throw" },
);
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1, status: 1 });

export type UserRecord = InferSchemaType<typeof userSchema> & { _id: Types.ObjectId };
const User = models.User ?? model("User", userSchema);
export default User;
