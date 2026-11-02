import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { ApiError } from "@/lib/api-response";
import { connectToDatabase } from "@/lib/db";
import type { LoginInput } from "@/lib/validations/auth";
import User, { type UserRole } from "@/models/User";
import PasswordResetToken from "@/models/PasswordResetToken";
import EmailVerificationToken from "@/models/EmailVerificationToken";
import type { RegisterInput } from "@/types/auth";

let dummyHashPromise: Promise<string> | undefined;

export async function registerUser(input: RegisterInput) {
  await connectToDatabase();
  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await User.create({
    name: input.name,
    email: input.email,
    passwordHash,
    phone: input.phone,
    role: input.role,
    status: "active",
  });
  return toPublicUser(user);
}

export async function verifyCredentials(input: LoginInput) {
  await connectToDatabase();
  const user = await User.findOne({ email: input.email }).select("+passwordHash");
  const passwordHash = user?.passwordHash ?? await getDummyPasswordHash();
  const passwordMatches = await bcrypt.compare(input.password, passwordHash);
  if (!user || !passwordMatches || user.status !== "active") return null;

  user.lastLoginAt = new Date();
  await user.save();
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    sessionVersion: user.sessionVersion,
  };
}

export async function changeUserPassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
  await connectToDatabase();
  const user = await User.findById(userId).select("+passwordHash");
  if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
    throw new ApiError("Current password is incorrect.", 400);
  }
  user.passwordHash = await bcrypt.hash(newPassword, 12);
  user.sessionVersion += 1;
  await user.save();
  await PasswordResetToken.deleteMany({ user: user._id });
}

export async function issuePasswordReset(email: string): Promise<string | null> {
  await connectToDatabase();
  const user = await User.findOne({ email, status: "active" });
  if (!user) return null;
  const token = randomBytes(32).toString("base64url");
  await PasswordResetToken.deleteMany({ user: user._id });
  await PasswordResetToken.create({
    user: user._id,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + 30 * 60 * 1000),
  });
  return token;
}

export async function resetUserPassword(token: string, password: string): Promise<boolean> {
  await connectToDatabase();
  const now = new Date();
  const tokenRecord = await PasswordResetToken.findOneAndUpdate({
    tokenHash: hashToken(token),
    usedAt: { $exists: false },
    expiresAt: { $gt: now },
  }, { $set: { usedAt: now } }, { returnDocument: "after" });
  if (!tokenRecord) return false;
  const user = await User.findById(tokenRecord.user);
  if (!user || user.status !== "active") return false;
  user.passwordHash = await bcrypt.hash(password, 12);
  user.sessionVersion += 1;
  await user.save();
  await PasswordResetToken.deleteMany({ user: user._id, _id: { $ne: tokenRecord._id } });
  return true;
}

export async function issueEmailVerification(userId: string): Promise<string> {
  await connectToDatabase();
  const token = randomBytes(32).toString("base64url");
  await EmailVerificationToken.deleteMany({ user: userId });
  await EmailVerificationToken.create({
    user: userId,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });
  return token;
}

export async function verifyUserEmail(token: string): Promise<boolean> {
  await connectToDatabase();
  const now = new Date();
  const tokenRecord = await EmailVerificationToken.findOneAndUpdate({
    tokenHash: hashToken(token),
    usedAt: { $exists: false },
    expiresAt: { $gt: now },
  }, { $set: { usedAt: now } }, { returnDocument: "after" });
  if (!tokenRecord) return false;
  const result = await User.updateOne({ _id: tokenRecord.user }, { $set: { isEmailVerified: true, emailVerifiedAt: now } });
  return result.matchedCount === 1;
}

export function toPublicUser(user: {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  profileImage?: string;
  status: string;
  isEmailVerified: boolean;
  createdAt: Date;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    profileImage: user.profileImage,
    status: user.status,
    isEmailVerified: user.isEmailVerified,
    createdAt: user.createdAt,
  };
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

async function getDummyPasswordHash(): Promise<string> {
  dummyHashPromise ??= bcrypt.hash(randomBytes(32).toString("hex"), 12);
  return dummyHashPromise;
}
