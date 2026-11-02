import { apiSuccess, ApiError, withApiErrors } from "@/lib/api-response";
import { connectToDatabase } from "@/lib/db";
import { requireRole } from "@/lib/permissions";
import { readJson, validateMutationOrigin } from "@/lib/request";
import { brandRegistrationSchema } from "@/lib/validations/public";
import Brand from "@/models/Brand";
import { getClientAddress } from "@/lib/rate-limit";
import { recordCommittedActivity } from "@/services/activity.service";

export const POST = withApiErrors(async (request) => {
  validateMutationOrigin(request);
  const user = await requireRole(["brand"]);
  const body = brandRegistrationSchema.parse(await readJson(request));
  if (body.email !== user.email) {
    throw new ApiError("Use the email address associated with your brand account.", 403);
  }
  await connectToDatabase();
  const brand = await Brand.create({
    ...body,
    user: user._id,
    status: "pending",
  });
  await recordCommittedActivity({
    actorId: user.id,
    action: "brand.registered",
    resourceType: "Brand",
    resourceId: brand.id,
    ipAddress: getClientAddress(request),
  });
  return apiSuccess({
    brand: { id: brand.id, companyName: brand.companyName, status: brand.status },
  }, "Brand registration submitted for review.", 201);
});
