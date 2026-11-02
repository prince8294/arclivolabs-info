import EmailOutbox from "@/models/EmailOutbox";
import { z } from "zod";

const emailTemplateSchema = z.discriminatedUnion("template", [
  z.object({ template: z.literal("email_verification"), data: z.object({ name: z.string(), verificationUrl: z.string().url() }) }),
  z.object({ template: z.literal("campaign_invitation"), data: z.object({ name: z.string(), campaignTitle: z.string(), invitationUrl: z.string().url() }) }),
  z.object({ template: z.literal("password_reset"), data: z.object({ name: z.string(), resetUrl: z.string().url() }) }),
]);
type EmailTemplate = z.infer<typeof emailTemplateSchema>;

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character] ?? character);
}

function renderEmail({ template, data }: EmailTemplate) {
  const content = template === "email_verification"
    ? {
      subject: "Verify your ArcLivo Labs email",
      heading: "Verify your email address",
      text: `Hello ${data.name}, confirm your email address to activate your ArcLivo Labs account.`,
      action: "Verify email",
      url: data.verificationUrl,
    }
    : template === "campaign_invitation" ? {
      subject: "You have a new campaign invitation",
      heading: "Campaign invitation",
      text: `Hello ${data.name}, you have been invited to collaborate on ${data.campaignTitle}.`,
      action: "Review invitation",
      url: data.invitationUrl,
    } : {
      subject: "Reset your ArcLivo Labs password",
      heading: "Password reset",
      text: `Hello ${data.name}, use this secure link to choose a new password.`,
      action: "Reset password",
      url: data.resetUrl,
    };
  const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><body style="margin:0;background:#f4f6fb;font:16px Arial,sans-serif;color:#172033"><div style="max-width:560px;margin:32px auto;background:#fff;border-radius:12px;padding:32px"><p style="font-weight:bold;color:#6558d3">ARCLIVO LABS</p><h1 style="font-size:24px">${escapeHtml(content.heading)}</h1><p>${escapeHtml(content.text)}</p><p style="margin:28px 0"><a href="${escapeHtml(content.url)}" style="background:#6558d3;color:#fff;text-decoration:none;padding:12px 20px;border-radius:6px">${escapeHtml(content.action)}</a></p><p style="color:#687386;font-size:13px">If you did not expect this message, you can ignore it.</p></div></body></html>`;
  const text = `${content.heading}\n\n${content.text}\n\n${content.url}`;
  return { subject: content.subject, html, text };
}

export async function enqueueEmail(to: string, dedupeKey: string, message: EmailTemplate) {
  const urlString = message.template === "email_verification" ? message.data.verificationUrl
    : message.template === "campaign_invitation" ? message.data.invitationUrl
      : message.data.resetUrl;
  const url = new URL(urlString);
  if (url.protocol !== "https:" && url.hostname !== "localhost") throw new Error("Email action URL must use HTTPS outside localhost.");
  await EmailOutbox.updateOne(
    { dedupeKey },
    {
      $setOnInsert: {
        to: to.toLowerCase(),
        template: message.template,
        data: message.data,
        dedupeKey,
        status: "pending",
        nextAttemptAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 86400000),
      },
    },
    { upsert: true },
  );
}

export async function dispatchPendingEmails(batchSize = 25) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM?.trim();
  if (!apiKey || !from) {
    return { sent: 0, failed: 0, blocked: true };
  }

  let sent = 0;
  let failed = 0;
  for (let index = 0; index < batchSize; index += 1) {
    const now = new Date();
    const email = await EmailOutbox.findOneAndUpdate(
      {
        status: { $in: ["pending", "failed", "processing"] },
        nextAttemptAt: { $lte: now },
        expiresAt: { $gt: now },
        $or: [{ lockUntil: { $exists: false } }, { lockUntil: { $lte: now } }],
        attempts: { $lt: 5 },
      },
      { $set: { status: "processing", lockUntil: new Date(Date.now() + 2 * 60 * 1000) }, $inc: { attempts: 1 } },
      { sort: { createdAt: 1 }, returnDocument: "after" },
    );
    if (!email) break;
    try {
      const parsed = emailTemplateSchema.safeParse({ template: email.template, data: email.data });
      if (!parsed.success) {
        email.status = "blocked";
        email.lastErrorCode = "invalid_template_data";
        email.lockUntil = undefined;
        await email.save();
        failed += 1;
        continue;
      }
      const { subject, html, text } = renderEmail(parsed.data);
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key": email.dedupeKey,
        },
        body: JSON.stringify({ from, to: [email.to], subject, html, text }),
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) {
        email.status = "failed";
        email.lastErrorCode = `provider_http_${response.status}`;
        email.nextAttemptAt = new Date(Date.now() + Math.min(60, 2 ** email.attempts) * 60000);
        email.lockUntil = undefined;
        await email.save();
        failed += 1;
        continue;
      }
      const result = await response.json() as { id?: string };
      email.status = "sent";
      email.providerMessageId = result.id;
      email.sentAt = new Date();
      email.lockUntil = undefined;
      email.lastErrorCode = undefined;
      await email.save();
      sent += 1;
    } catch (error) {
      email.status = "failed";
      email.lastErrorCode = error instanceof Error && error.name === "TimeoutError" ? "provider_timeout" : "provider_request_failed";
      email.nextAttemptAt = new Date(Date.now() + Math.min(60, 2 ** email.attempts) * 60000);
      email.lockUntil = undefined;
      await email.save();
      failed += 1;
    }
  }
  await EmailOutbox.updateMany(
    { status: { $in: ["pending", "failed"] }, attempts: { $gte: 5 } },
    { $set: { status: "blocked", lastErrorCode: "retry_limit_reached" } },
  );
  return { sent, failed, blocked: false };
}
