import { apiSuccess, withApiErrors } from "@/lib/api-response";
import { readJson, validateMutationOrigin } from "@/lib/request";
import { enforceRateLimit, getClientAddress } from "@/lib/rate-limit";
import { forgotPasswordSchema } from "@/lib/validations/auth";
import { issuePasswordReset } from "@/services/auth.service";
import { enqueueEmail } from "@/services/email.service";
import User from "@/models/User";

export const POST = withApiErrors(async (request) => {
  validateMutationOrigin(request);
  const address = getClientAddress(request);
  await enforceRateLimit({ scope: "forgot-password-ip", identity: address, limit: 5, windowMs: 60 * 60 * 1000 });
  const { email } = forgotPasswordSchema.parse(await readJson(request));
  await enforceRateLimit({ scope: "forgot-password-email", identity: email, limit: 3, windowMs: 60 * 60 * 1000 });
  const token = await issuePasswordReset(email);
  if (token) {
    try {
      const user = await User.findOne({ email }).select("name").lean();
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL;
      if (user && appUrl) {
        await enqueueEmail(email, `password-reset:${token}`, {
          template: "password_reset",
          data: { name: user.name, resetUrl: `${appUrl.replace(/\/$/, "")}/reset-password?token=${encodeURIComponent(token)}` },
        });
      }
    } catch (error) {
      console.error("Password reset email could not be queued.", error);
    }
  }
  return apiSuccess(
    process.env.NODE_ENV === "development" && token ? { resetToken: token } : {},
    "If this email belongs to an active account, password reset instructions will be sent when email delivery is configured.",
    202,
  );
});
