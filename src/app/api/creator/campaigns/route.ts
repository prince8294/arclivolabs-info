import { apiSuccess, withApiErrors } from "@/lib/api-response";
import { connectToDatabase } from "@/lib/db";
import { requireOwnedCreator } from "@/lib/portal-access";
import { requireRole } from "@/lib/permissions";
import Collaboration from "@/models/Collaboration";

export const GET = withApiErrors(async () => {
  const user = await requireRole(["creator"]);
  const creator = await requireOwnedCreator(user);
  await connectToDatabase();
  const collaborations = await Collaboration.find({ creator: creator._id })
    .populate("campaign", "title objective industry platforms contentTypes startDate endDate status")
    .populate("brand", "companyName companyLogo industry")
    .sort({ updatedAt: -1 }).limit(200).lean();
  return apiSuccess({ collaborations });
});
