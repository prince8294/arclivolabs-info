import { timingSafeEqual } from "node:crypto";
import { apiSuccess, ApiError, withApiErrors } from "@/lib/api-response";
import { connectToDatabase } from "@/lib/db";
import CampaignInvitation from "@/models/CampaignInvitation";
import EmailOutbox from "@/models/EmailOutbox";
import ScheduledJobRun from "@/models/ScheduledJobRun";
import { dispatchPendingEmails } from "@/services/email.service";

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");
  if (!secret || !authorization?.startsWith("Bearer ")) return false;
  const provided = Buffer.from(authorization.slice(7));
  const expected = Buffer.from(secret);
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}

export const GET = withApiErrors(async (request) => {
  if (!isAuthorized(request)) throw new ApiError("Scheduled job authorization failed.", process.env.CRON_SECRET ? 401 : 503);
  await connectToDatabase();
  const now = new Date();
  const periodKey = now.toISOString().slice(0, 10);
  const jobType = "expire-campaign-invitations";
  const job = await ScheduledJobRun.findOneAndUpdate(
    { jobType, periodKey },
    { $setOnInsert: { jobType, periodKey, status: "failed", startedAt: now } },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  );
  if (job.status === "succeeded") {
    const emailDispatch = await dispatchPendingEmails();
    return apiSuccess({ invitationExpiry: "already_completed", emailDispatch });
  }
  if (job.status === "processing" && job.startedAt.getTime() > Date.now() - 5 * 60 * 1000) {
    const emailDispatch = await dispatchPendingEmails();
    return apiSuccess({ invitationExpiry: "already_running", emailDispatch });
  }
  const claimed = await ScheduledJobRun.findOneAndUpdate(
    {
      _id: job._id,
      $or: [
        { status: "failed" },
        { status: "processing", startedAt: { $lte: new Date(Date.now() - 5 * 60 * 1000) } },
      ],
    },
    { $set: { status: "processing", startedAt: now, errorCode: undefined } },
    { returnDocument: "after" },
  );
  if (!claimed) {
    const emailDispatch = await dispatchPendingEmails();
    return apiSuccess({ invitationExpiry: "already_running", emailDispatch });
  }

  try {
    const expired = await CampaignInvitation.updateMany(
      { status: "pending", expiresAt: { $lte: now } },
      { $set: { status: "expired" } },
    );
    const emailDispatch = await dispatchPendingEmails();
    const pendingEmails = await EmailOutbox.countDocuments({ status: { $in: ["pending", "failed", "blocked"] } });
    claimed.status = "succeeded";
    claimed.completedAt = new Date();
    claimed.processedCount = expired.modifiedCount + emailDispatch.sent;
    await claimed.save();
    return apiSuccess({
      invitationExpiry: { expired: expired.modifiedCount },
      emailDispatch,
      pendingEmailCount: pendingEmails,
    });
  } catch (error) {
    claimed.status = "failed";
    claimed.errorCode = "scheduled_job_failed";
    claimed.completedAt = new Date();
    await claimed.save();
    throw error;
  }
});
