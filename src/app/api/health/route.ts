import mongoose from "mongoose";
import { apiFailure, apiSuccess, withApiErrors } from "@/lib/api-response";
import { connectToDatabase } from "@/lib/db";
import { validateServerEnvironment } from "@/lib/env";

export const GET = withApiErrors(async () => {
  if (process.env.NODE_ENV === "production") {
    try {
      validateServerEnvironment();
    } catch {
      return apiFailure("Required server environment is incomplete.", 503);
    }
  }
  try {
    await connectToDatabase();
    await mongoose.connection.db?.admin().ping();
  } catch {
    return apiFailure("Database health check failed.", 503);
  }
  return apiSuccess({
    status: "ready",
    services: {
      database: "connected",
      email: process.env.RESEND_API_KEY && process.env.EMAIL_FROM ? "configured" : "unconfigured",
      storage: process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET
        && process.env.CLOUDINARY_IMAGE_UPLOAD_PRESET && process.env.CLOUDINARY_MEDIA_UPLOAD_PRESET ? "configured" : "unconfigured",
      scheduledJobs: process.env.CRON_SECRET ? "configured" : "unconfigured",
    },
  });
});
