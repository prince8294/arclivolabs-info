import { apiSuccess, ApiError, withApiErrors } from "@/lib/api-response";
import { connectToDatabase } from "@/lib/db";
import { objectId, requireOwnedCreator } from "@/lib/portal-access";
import { requireRole } from "@/lib/permissions";
import Collaboration from "@/models/Collaboration";
import Deliverable from "@/models/Deliverable";

export const GET = withApiErrors(async (_request, context: { params: Promise<{ id: string }> }) => {
  const user = await requireRole(["creator"]);
  const creator = await requireOwnedCreator(user);
  const { id } = await context.params;
  await connectToDatabase();
  const collaboration = await Collaboration.findOne({ _id: objectId(id), creator: creator._id })
    .populate("campaign", "title description objective industry platforms contentTypes targetAudience targetLocation startDate endDate status deliverables")
    .populate("brand", "companyName companyLogo industry")
    .lean();
  if (!collaboration) throw new ApiError("Collaboration was not found.", 404);
  const deliverables = await Deliverable.find({ collaboration: collaboration._id, creator: creator._id }).select("-revisionHistory").sort({ dueAt: 1 }).lean();
  return apiSuccess({ collaboration, deliverables });
});
