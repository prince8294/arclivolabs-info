import { z } from "zod";
import { apiSuccess, ApiError, withApiErrors } from "@/lib/api-response";
import { connectToDatabase } from "@/lib/db";
import { objectId, requireOwnedBrand } from "@/lib/portal-access";
import { requireRole } from "@/lib/permissions";
import { readJson, validateMutationOrigin } from "@/lib/request";
import Deliverable from "@/models/Deliverable";
import Collaboration from "@/models/Collaboration";
import Creator from "@/models/Creator";
import Notification from "@/models/Notification";
import { recordCommittedActivity } from "@/services/activity.service";

const reviewSchema = z.object({
  status: z.enum(["approved", "revision_requested"]),
  feedback: z.string().trim().max(2000).optional(),
}).strict().refine((value) => value.status !== "revision_requested" || Boolean(value.feedback), {
  path: ["feedback"],
  message: "Feedback is required when requesting revisions.",
});

export const PATCH = withApiErrors(async (request, context: { params: Promise<{ id: string }> }) => {
  validateMutationOrigin(request);
  const user = await requireRole(["brand"]);
  const brand = await requireOwnedBrand(user, { active: true });
  const { id } = await context.params;
  const body = reviewSchema.parse(await readJson(request));
  await connectToDatabase();
  const deliverable = await Deliverable.findOne({ _id: objectId(id), brand: brand._id, status: "submitted" });
  if (!deliverable) throw new ApiError("A submitted deliverable for this brand was not found.", 404);
  deliverable.revisionHistory.push({
    url: deliverable.submissionUrl,
    caption: deliverable.caption,
    feedback: body.feedback,
    submittedAt: deliverable.submittedAt,
    reviewer: user._id,
    status: body.status,
  });
  deliverable.status = body.status;
  deliverable.feedback = body.feedback;
  deliverable.reviewer = user._id;
  if (body.status === "approved") deliverable.approvedAt = new Date();
  await deliverable.save();
  if (body.status === "revision_requested") {
    await Collaboration.updateOne({ _id: deliverable.collaboration, brand: brand._id }, { $set: { status: "revision_requested" } });
  } else {
    const remaining = await Deliverable.countDocuments({ collaboration: deliverable.collaboration, status: { $ne: "approved" } });
    if (remaining === 0) await Collaboration.updateOne({ _id: deliverable.collaboration, brand: brand._id }, { $set: { status: "approved" } });
  }
  const creator = await Creator.findById(deliverable.creator).select("user").lean();
  if (creator?.user) await Notification.create({
    recipient: creator.user,
    type: body.status === "approved" ? "content_approved" : "revision_requested",
    title: body.status === "approved" ? "Content approved" : "Revision requested",
    message: body.status === "approved" ? "Your submitted content was approved." : body.feedback ?? "Please revise your submitted content.",
    data: { href: `/creator/deliverables`, deliverableId: deliverable.id },
  });
  await recordCommittedActivity({ actorId: user.id, action: `deliverable.${body.status}`, resourceType: "Deliverable", resourceId: deliverable.id });
  return apiSuccess({ deliverable }, body.status === "approved" ? "Deliverable approved." : "Revision requested.");
});
