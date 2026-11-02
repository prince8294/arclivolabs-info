import { apiSuccess, ApiError, withApiErrors } from "@/lib/api-response";
import { requireRole } from "@/lib/permissions";
import { objectId, requireOwnedBrand } from "@/lib/portal-access";
import { connectToDatabase } from "@/lib/db";
import Creator from "@/models/Creator";
import CreatorPackage from "@/models/CreatorPackage";
import PortfolioItem from "@/models/PortfolioItem";
import SocialAccount from "@/models/SocialAccount";
import Campaign from "@/models/Campaign";

export const GET = withApiErrors(async (_request, context: { params: Promise<{ id: string }> }) => {
  const user = await requireRole(["brand"]);
  await requireOwnedBrand(user, { active: true });
  const { id } = await context.params;
  await connectToDatabase();
  const creator = await Creator.findOne({ _id: objectId(id), approvalStatus: "approved", availability: "available" })
    .select("fullName profileImage bio instagramUsername instagramUrl youtubeChannel youtubeUrl otherSocialPlatforms primaryPlatform contentCategories followers averageViews engagementRate metricsVerificationStatus location country languages audienceDemographics portfolioUrl availability verificationStatus")
    .lean();
  if (!creator) throw new ApiError("Creator was not found or is unavailable.", 404);
  const [socialAccounts, packages, portfolio, examples] = await Promise.all([
    SocialAccount.find({ creator: creator._id }).select("platform username profileUrl followers averageViews verificationStatus lastVerifiedAt").lean(),
    CreatorPackage.find({ creator: creator._id, isActive: true }).select("title platform description price currency deliveryDays").sort({ price: 1 }).lean(),
    PortfolioItem.find({ creator: creator._id, isVisible: true }).select("title description mediaUrl mediaType categories sortOrder").sort({ sortOrder: 1, createdAt: -1 }).limit(30).lean(),
    Campaign.find({ selectedCreators: creator._id, status: "completed" }).select("title industry platforms endDate").sort({ endDate: -1 }).limit(10).lean(),
  ]);
  return apiSuccess({ creator, socialAccounts, packages, portfolio, completedCampaignExamples: examples });
});
