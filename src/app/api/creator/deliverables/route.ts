import { z } from "zod";
import { apiSuccess, ApiError, withApiErrors } from "@/lib/api-response";
import { connectToDatabase } from "@/lib/db";
import { objectId, requireOwnedCreator } from "@/lib/portal-access";
import { requireRole } from "@/lib/permissions";
import { readJson, validateMutationOrigin } from "@/lib/request";
import Deliverable from "@/models/Deliverable";
import Collaboration from "@/models/Collaboration";
import Brand from "@/models/Brand";
import Notification from "@/models/Notification";
import { recordCommittedActivity } from "@/services/activity.service";

const submissionSchema = z.object({
  deliverableId: z.string().trim().min(1),
  submissionUrl: z.string().trim().url().max(2048).refine((value) => ["https:", "http:"].includes(new URL(value).protocol)),
  caption: z.string().trim().max(5000).optional(),
}).strict();

export const GET = withApiErrors(async () => {
  const user = await requireRole(["creator"]);
  const creator = await requireOwnedCreator(user);
  await connectToDatabase();
  const deliverables = await Deliverable.find({ creator: creator._id })
    .populate("campaign", "title").populate("brand", "companyName").sort({ dueAt: 1 }).limit(300).lean();
  return apiSuccess({ deliverables });
});

export const POST = withApiErrors(async (request) => {
  validateMutationOrigin(request);
  const user = await requireRole(["creator"]);
  const creator = await requireOwnedCreator(user);
  const body = submissionSchema.parse(await readJson(request));
  await connectToDatabase();
  const deliverable = await Deliverable.findOne({ _id: objectId(body.deliverableId), creator: creator._id });
  if (!deliverable) throw new ApiError("Deliverable was not found.", 404);
  if (!["pending", "revision_requested"].includes(deliverable.status)) throw new ApiError("This deliverable is not ready for submission or revision.", 409);

  if (deliverable.submissionUrl) {
    deliverable.revisionHistory.push({
      url: deliverable.submissionUrl,
      caption: deliverable.caption,
      feedback: deliverable.feedback,
      submittedAt: deliverable.submittedAt,
      reviewer: deliverable.reviewer,
      status: deliverable.status,
    });
    if (deliverable.status === "revision_requested") deliverable.revisionCount += 1;
  }
  deliverable.submissionUrl = body.submissionUrl;
  deliverable.caption = body.caption;
  deliverable.submittedAt = new Date();
  deliverable.status = "submitted";
  deliverable.feedback = undefined;
  deliverable.reviewer = undefined;
  await deliverable.save();
  await Collaboration.updateOne({ _id: deliverable.collaboration, creator: creator._id }, { $set: { status: "content_submitted" } });
  const brand = await Brand.findById(deliverable.brand).select("user").lean();
  if (brand?.user) await Notification.create({
    recipient: brand.user,
    type: "content_submitted",
    title: "Creator submitted content",
    message: "A creator submitted campaign content for review.",
    data: { href: `/brand/campaigns/${deliverable.campaign}`, deliverableId: deliverable.id },
  });
  await recordCommittedActivity({ actorId: user.id, action: "deliverable.submitted", resourceType: "Deliverable", resourceId: deliverable.id });
  return apiSuccess({ deliverable }, "Content submitted for brand review.");
});
