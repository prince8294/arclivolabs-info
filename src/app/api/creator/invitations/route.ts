import { apiSuccess, withApiErrors } from "@/lib/api-response";
import { connectToDatabase } from "@/lib/db";
import { requireOwnedCreator } from "@/lib/portal-access";
import { requireRole } from "@/lib/permissions";
import CampaignInvitation from "@/models/CampaignInvitation";

export const GET = withApiErrors(async () => {
  const user = await requireRole(["creator"]);
  const creator = await requireOwnedCreator(user);
  await connectToDatabase();
  const now = new Date();
  await CampaignInvitation.updateMany({ creator: creator._id, status: "pending", expiresAt: { $lte: now } }, { $set: { status: "expired" } });
  const invitations = await CampaignInvitation.find({ creator: creator._id })
    .populate("campaign", "title objective industry platforms startDate endDate status")
    .populate("brand", "companyName companyLogo industry")
    .sort({ createdAt: -1 }).limit(200).lean();
  return apiSuccess({ invitations });
});
