import { createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { apiSuccess, ApiError, withApiErrors } from "@/lib/api-response";
import { connectToDatabase } from "@/lib/db";
import { readJson, validateMutationOrigin } from "@/lib/request";
import { enforceRateLimit, getClientAddress } from "@/lib/rate-limit";
import TeamInvitation from "@/models/TeamInvitation";
import User from "@/models/User";
import { recordCommittedActivity } from "@/services/activity.service";
import { z } from "zod";

const acceptSchema = z.object({
  token: z.string().min(32).max(256),
  password: z.string().min(12).max(128).regex(/[a-z]/).regex(/[A-Z]/).regex(/[0-9]/).regex(/[^A-Za-z0-9]/),
}).strict();

export const POST = withApiErrors(async (request) => {
  validateMutationOrigin(request);
  await enforceRateLimit({ scope: "team-invitation-accept", identity: getClientAddress(request), limit: 10, windowMs: 60 * 60 * 1000 });
  const body = acceptSchema.parse(await readJson(request));
  await connectToDatabase();
  const tokenHash = createHash("sha256").update(body.token).digest("hex");
  const invitation = await TeamInvitation.findOne({
    tokenHash,
    acceptedAt: null,
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  }).select("+tokenHash");
  if (!invitation) throw new ApiError("Invitation is invalid or has expired.", 400);
  const existingUser = await User.exists({ email: invitation.email });
  if (existingUser) throw new ApiError("An account already exists for this invitation.", 409);

  const user = await User.create({
    name: invitation.name,
    email: invitation.email,
    passwordHash: await bcrypt.hash(body.password, 12),
    role: invitation.role,
    status: "active",
  });
  invitation.acceptedAt = new Date();
  await invitation.save();
  await recordCommittedActivity({
    actorId: user.id,
    action: "team.invitation_accepted",
    resourceType: "User",
    resourceId: user.id,
  });
  return apiSuccess({ email: user.email, role: user.role }, "Invitation accepted. You can now sign in.", 201);
});
