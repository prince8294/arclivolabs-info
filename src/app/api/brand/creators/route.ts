import { z } from "zod";
import { apiSuccess, withApiErrors } from "@/lib/api-response";
import { requireRole } from "@/lib/permissions";
import { requireOwnedBrand } from "@/lib/portal-access";
import { connectToDatabase } from "@/lib/db";
import Creator from "@/models/Creator";
import CreatorPackage from "@/models/CreatorPackage";

const querySchema = z.object({
  q: z.string().trim().max(100).optional(),
  category: z.string().trim().max(100).optional(),
  platform: z.string().trim().max(50).optional(),
  location: z.string().trim().max(120).optional(),
  language: z.string().trim().max(50).optional(),
  audienceLocation: z.string().trim().max(100).optional(),
  minFollowers: z.coerce.number().int().min(0).optional(),
  maxFollowers: z.coerce.number().int().min(0).optional(),
  minEngagement: z.coerce.number().min(0).max(100).optional(),
  maxEngagement: z.coerce.number().min(0).max(100).optional(),
  minBudget: z.coerce.number().min(0).optional(),
  maxBudget: z.coerce.number().min(0).optional(),
  sort: z.enum(["relevant", "followers", "engagement", "price", "recent"]).default("relevant"),
  page: z.coerce.number().int().min(1).max(100000).default(1),
  limit: z.coerce.number().int().min(1).max(48).default(12),
}).strict();

export const GET = withApiErrors(async (request) => {
  const user = await requireRole(["brand"]);
  await requireOwnedBrand(user, { active: true });
  await connectToDatabase();
  const query = querySchema.parse(Object.fromEntries(new URL(request.url).searchParams));
  if (query.minFollowers !== undefined && query.maxFollowers !== undefined && query.minFollowers > query.maxFollowers) {
    return apiSuccess({ creators: [], pagination: { page: query.page, limit: query.limit, total: 0, pages: 0 } });
  }
  const filter: Record<string, unknown> = { approvalStatus: "approved", availability: "available" };
  if (query.q) {
    const search = query.q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [
      { fullName: { $regex: search, $options: "i" } },
      { instagramUsername: { $regex: search, $options: "i" } },
      { youtubeChannel: { $regex: search, $options: "i" } },
    ];
  }
  if (query.category) filter.contentCategories = query.category;
  if (query.platform) filter.primaryPlatform = query.platform;
  if (query.location) filter.location = { $regex: query.location.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
  if (query.language) filter.languages = query.language;
  if (query.audienceLocation) filter["audienceDemographics.topCountries"] = query.audienceLocation;
  if (query.minFollowers !== undefined || query.maxFollowers !== undefined) {
    filter.followers = { ...(query.minFollowers !== undefined ? { $gte: query.minFollowers } : {}), ...(query.maxFollowers !== undefined ? { $lte: query.maxFollowers } : {}) };
  }
  if (query.minEngagement !== undefined || query.maxEngagement !== undefined) {
    filter.engagementRate = { ...(query.minEngagement !== undefined ? { $gte: query.minEngagement } : {}), ...(query.maxEngagement !== undefined ? { $lte: query.maxEngagement } : {}) };
  }

  const packageFilter: Record<string, unknown> = { isActive: true };
  if (query.minBudget !== undefined || query.maxBudget !== undefined) {
    packageFilter.price = { ...(query.minBudget !== undefined ? { $gte: query.minBudget } : {}), ...(query.maxBudget !== undefined ? { $lte: query.maxBudget } : {}) };
  }
  const priceRows = query.sort === "price" || query.minBudget !== undefined || query.maxBudget !== undefined
    ? await CreatorPackage.aggregate([{ $match: packageFilter }, { $group: { _id: "$creator", startingPrice: { $min: "$price" } } }, { $sort: { startingPrice: 1 } }])
    : [];
  if (query.minBudget !== undefined || query.maxBudget !== undefined || query.sort === "price") {
    filter._id = { $in: priceRows.map((row) => row._id) };
  }
  const sort: Record<string, 1 | -1> = query.sort === "followers" ? { followers: -1, createdAt: -1 }
    : query.sort === "engagement" ? { engagementRate: -1, createdAt: -1 }
      : query.sort === "recent" ? { createdAt: -1 }
        : { featured: -1, verificationStatus: -1, followers: -1 };
  const [records, total] = await Promise.all([
    Creator.find(filter).select("fullName profileImage instagramUsername youtubeChannel primaryPlatform contentCategories followers averageViews engagementRate location country languages audienceDemographics portfolioUrl availability verificationStatus metricsVerificationStatus featured createdAt").sort(sort).skip((query.page - 1) * query.limit).limit(query.limit).lean(),
    Creator.countDocuments(filter),
  ]);
  const startingPrices = new Map(priceRows.map((row) => [String(row._id), row.startingPrice as number]));
  const packages = await CreatorPackage.find({ creator: { $in: records.map((record) => record._id) }, isActive: true }).select("creator title platform price currency deliveryDays").sort({ price: 1 }).lean();
  const startingPriceByCreator = new Map<string, { amount: number; currency: string }>();
  for (const item of packages) if (!startingPriceByCreator.has(String(item.creator))) startingPriceByCreator.set(String(item.creator), { amount: item.price, currency: item.currency });
  return apiSuccess({
    creators: records.map((creator) => ({
      ...creator,
      startingPrice: startingPrices.has(String(creator._id))
        ? { amount: startingPrices.get(String(creator._id)), currency: packages.find((item) => String(item.creator) === String(creator._id))?.currency }
        : startingPriceByCreator.get(String(creator._id)) ?? null,
    })),
    pagination: { page: query.page, limit: query.limit, total, pages: Math.ceil(total / query.limit) },
  });
});
