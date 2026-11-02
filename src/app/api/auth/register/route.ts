import { apiSuccess, withApiErrors } from "@/lib/api-response";
import { connectToDatabase } from "@/lib/db";
import { validateMutationOrigin, readJson } from "@/lib/request";
import { enforceRateLimit, getClientAddress } from "@/lib/rate-limit";
import { issueEmailVerification, registerUser } from "@/services/auth.service";
import { recordCommittedActivity } from "@/services/activity.service";
import { enqueueEmail } from "@/services/email.service";
import { registerSchema } from "@/lib/validations/auth";

export const POST = withApiErrors(async (request) => {
  validateMutationOrigin(request);
  const address = getClientAddress(request);
  await enforceRateLimit({ scope: "register-ip", identity: address, limit: 5, windowMs: 60 * 60 * 1000 });
  const body = registerSchema.parse(await readJson(request));
  await enforceRateLimit({ scope: "register-email", identity: body.email, limit: 3, windowMs: 60 * 60 * 1000 });
  await connectToDatabase();
  const user = await registerUser(body);
  const verificationToken = await issueEmailVerification(user.id);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL;
  let emailQueued = false;
  if (appUrl) {
    try {
      await enqueueEmail(
        body.email,
        `email-verification:${user.id}`,
        {
          template: "email_verification",
          data: { name: body.name, verificationUrl: `${appUrl.replace(/\/$/, "")}/verify-email?token=${encodeURIComponent(verificationToken)}` },
        },
      );
      emailQueued = true;
    } catch (error) {
      console.error("Email verification could not be queued.", error);
    }
  }
  await recordCommittedActivity({
    actorId: user.id,
    action: "user.registered",
    resourceType: "User",
    resourceId: user.id,
    ipAddress: address,
  });
  return apiSuccess(
    {
      user,
      emailVerificationRequired: true,
      emailQueued,
      ...(process.env.NODE_ENV === "development" ? { verificationTokenForDevelopment: verificationToken } : {}),
    },
    emailQueued ? "Account created. Verification email is queued for delivery." : "Account created, but verification email could not be queued. Contact support.",
    201,
  );
});
