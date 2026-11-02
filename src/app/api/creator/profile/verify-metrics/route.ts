import { ApiError, apiSuccess, withApiErrors } from "@/lib/api-response";
import { connectToDatabase } from "@/lib/db";
import { findOwnedCreator } from "@/lib/portal-access";
import { requireRole } from "@/lib/permissions";
import { validateMutationOrigin } from "@/lib/request";

export const POST = withApiErrors(async (request) => {
  validateMutationOrigin(request);
  const user = await requireRole(["creator"]);
  await connectToDatabase();
  const creator = await findOwnedCreator(user);
  if (!creator) throw new ApiError("Save your creator profile before requesting metric verification.", 409);
  if (creator.metricsVerificationStatus === "verified") throw new ApiError("Your audience metrics are already verified.", 409);
  if (creator.metricsVerificationStatus === "pending") throw new ApiError("Your metric verification request is already awaiting review.", 409);
  creator.metricsVerificationStatus = "pending";
  creator.metricsVerificationRequestedAt = new Date();
  await creator.save();
  return apiSuccess({ metricsVerificationStatus: creator.metricsVerificationStatus, requestedAt: creator.metricsVerificationRequestedAt }, "Metric verification requested. Your figures will remain unverified until the agency reviews them.");
});
