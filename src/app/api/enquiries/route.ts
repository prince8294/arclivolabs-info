import { createHash, randomUUID } from "node:crypto";
import { apiSuccess, ApiError, withApiErrors } from "@/lib/api-response";
import { connectToDatabase } from "@/lib/db";
import { enforceRateLimit, getClientAddress } from "@/lib/rate-limit";
import { readJson, validateMutationOrigin } from "@/lib/request";
import { enquirySchema } from "@/lib/validations/public";
import Enquiry from "@/models/Enquiry";
import { recordCommittedActivity } from "@/services/activity.service";
import { notifyAdminUsers } from "@/services/notification.service";

export const POST = withApiErrors(async (request) => {
  validateMutationOrigin(request);
  const address = getClientAddress(request);
  await enforceRateLimit({ scope: "enquiry-ip", identity: address, limit: 5, windowMs: 60 * 60 * 1000 });
  const body = enquirySchema.parse(await readJson(request));
  if ("website" in body && body.website) throw new ApiError("Unable to process this request.", 400);
  await enforceRateLimit({ scope: "enquiry-email", identity: body.email, limit: 3, windowMs: 24 * 60 * 60 * 1000 });
  await connectToDatabase();

  const dedupeHash = createHash("sha256")
    .update([body.email, body.company, body.details, Math.floor(Date.now() / (10 * 60 * 1000))].join("|").toLowerCase())
    .digest("hex");
  if (await Enquiry.exists({ dedupeHash })) {
    throw new ApiError("A similar enquiry was already received.", 409);
  }
  const enquiry = await Enquiry.create({
    referenceId: `ENQ-${randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`,
    name: body.name,
    company: body.company,
    email: body.email,
    phone: body.phone,
    serviceRequired: body.service,
    budget: body.budget,
    details: body.details,
    preferredPlatform: body.preferredPlatform,
    subject: body.subject,
    dedupeHash,
  });
  await recordCommittedActivity({
    action: "enquiry.received",
    resourceType: "BrandEnquiry",
    resourceId: enquiry.id,
    ipAddress: address,
  });
  await notifyAdminUsers({
    type: "brand_enquiry",
    title: "New brand enquiry",
    message: `${enquiry.company} sent a campaign enquiry.`,
    href: "/admin/enquiries",
    data: { referenceId: enquiry.referenceId },
  });
  return apiSuccess({ referenceId: enquiry.referenceId, status: enquiry.status }, "Your enquiry was received.", 201);
});
