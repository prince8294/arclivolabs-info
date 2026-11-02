import { model, models, Schema, type InferSchemaType, type Types } from "mongoose";

const agencySettingsSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: "agency" },
    agencyName: { type: String, trim: true, maxlength: 180, default: "ArcLivo Labs" },
    logoUrl: { type: String, trim: true, maxlength: 2048 },
    contactEmail: { type: String, trim: true, maxlength: 254 },
    contactPhone: { type: String, trim: true, maxlength: 32 },
    website: { type: String, trim: true, maxlength: 2048 },
    socialLinks: { type: [{ platform: String, url: String }], default: [] },
    currency: { type: String, uppercase: true, default: "INR", minlength: 3, maxlength: 3 },
    timeZone: { type: String, default: "UTC", maxlength: 80 },
    notificationPreferences: {
      creatorApplications: { type: Boolean, default: true },
      brandEnquiries: { type: Boolean, default: true },
      contactMessages: { type: Boolean, default: true },
      campaignUpdates: { type: Boolean, default: true },
    },
  },
  { timestamps: true, strict: "throw" },
);

export type AgencySettingsRecord = InferSchemaType<typeof agencySettingsSchema> & { _id: Types.ObjectId };
const AgencySettings = models.AgencySettings ?? model("AgencySettings", agencySettingsSchema);
export default AgencySettings;
