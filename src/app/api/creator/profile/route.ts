import { apiSuccess, withApiErrors } from "@/lib/api-response";
import { connectToDatabase } from "@/lib/db";
import { findOwnedCreator } from "@/lib/portal-access";
import { requireRole } from "@/lib/permissions";
import { readJson, validateMutationOrigin } from "@/lib/request";
import { creatorProfileSchema } from "@/lib/validations/portal";
import Creator from "@/models/Creator";
import CreatorApplication from "@/models/CreatorApplication";

function plainRecord(value: unknown): Record<string, unknown> {
  if (value instanceof Map) return Object.fromEntries(value);
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function samePercentages(submitted: Record<string, number> | undefined, current: unknown) {
  const left = submitted ?? {};
  const right = plainRecord(current);
  const keys = Object.keys(left);
  return keys.length === Object.keys(right).length && keys.every((key) => Number(left[key]) === Number(right[key]));
}

function sameAudience(submitted: NonNullable<ReturnType<typeof creatorProfileSchema.parse>["audienceDemographics"]>, current: unknown) {
  const existing = plainRecord(current);
  const submittedCountries = submitted.topCountries ?? [];
  const existingCountries = Array.isArray(existing.topCountries) ? existing.topCountries : [];
  return samePercentages(submitted.ageRanges, existing.ageRanges)
    && samePercentages(submitted.gender, existing.gender)
    && submittedCountries.length === existingCountries.length
    && submittedCountries.every((country, index) => country === existingCountries[index]);
}

export const GET = withApiErrors(async () => {
  const user = await requireRole(["creator"]);
  await connectToDatabase();
  const [creator, application] = await Promise.all([
    findOwnedCreator(user),
    CreatorApplication.findOne({ $or: [{ user: user._id }, { email: user.email }] }).select("referenceId approvalStatus").sort({ createdAt: -1 }).lean(),
  ]);
  return apiSuccess({ creator, application, metricsAreVerified: creator?.metricsVerificationStatus === "verified" });
});

export const PATCH = withApiErrors(async (request) => {
  validateMutationOrigin(request);
  const user = await requireRole(["creator"]);
  const body = creatorProfileSchema.parse(await readJson(request));
  await connectToDatabase();
  let creator = await findOwnedCreator(user);
  const metricsChanged = !creator || body.followers !== creator.followers
    || (body.averageViews !== undefined && body.averageViews !== creator.averageViews)
    || (body.engagementRate !== undefined && body.engagementRate !== creator.engagementRate)
    || (body.audienceDemographics !== undefined
      && !sameAudience(body.audienceDemographics, creator.audienceDemographics));
  if (!creator) {
    creator = await Creator.create({
      ...body,
      email: user.email,
      user: user._id,
      approvalStatus: "pending",
      verificationStatus: "unverified",
      metricsVerificationStatus: metricsChanged ? "pending" : "unverified",
      ...(metricsChanged ? { metricsVerificationRequestedAt: new Date() } : {}),
    });
  } else {
    creator.set(body);
    if (metricsChanged) {
      creator.metricsVerificationStatus = "pending";
      creator.metricsVerificationRequestedAt = new Date();
      creator.metricsLastVerifiedAt = undefined;
    }
    await creator.save();
  }
  return apiSuccess({ creator, metricsAreVerified: creator.metricsVerificationStatus === "verified" }, "Creator profile saved. Submitted metrics remain unverified until an admin reviews them.");
});
