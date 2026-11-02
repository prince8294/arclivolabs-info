import { apiSuccess, withApiErrors } from "@/lib/api-response";
import { connectToDatabase } from "@/lib/db";
import { requireRole } from "@/lib/permissions";
import { requireOwnedBrand } from "@/lib/portal-access";
import Collaboration from "@/models/Collaboration";
import Deliverable from "@/models/Deliverable";

export const GET = withApiErrors(async () => {
  const user = await requireRole(["brand"]);
  const brand = await requireOwnedBrand(user);
  await connectToDatabase();
  const collaborations = await Collaboration.find({ brand: brand._id })
    .populate("creator", "fullName profileImage primaryPlatform")
    .populate("campaign", "title status")
    .sort({ updatedAt: -1 }).limit(300).lean();
  const collaborationIds = collaborations.map((item) => item._id);
  const deliverables = collaborationIds.length
    ? await Deliverable.find({ brand: brand._id, collaboration: { $in: collaborationIds } }).select("collaboration description status dueAt submissionUrl feedback").sort({ dueAt: 1 }).lean()
    : [];
  return apiSuccess({ collaborations, deliverables });
});
