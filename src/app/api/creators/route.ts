import { apiSuccess, withApiErrors } from "@/lib/api-response";
import { connectToDatabase } from "@/lib/db";
import { creatorQuerySchema } from "@/lib/validations/public";
import Creator from "@/models/Creator";
import type { SortOrder } from "mongoose";

export const GET = withApiErrors(async (request) => {
  await connectToDatabase();
  const url = new URL(request.url);
  const query = creatorQuerySchema.parse(Object.fromEntries(url.searchParams));
  const filters: Record<string, unknown> = { approvalStatus: "approved" };
  if (query.category) filters.contentCategories = query.category;
  if (query.platform) filters.primaryPlatform = query.platform;
  if (query.location) filters.location = { $regex: escapeRegex(query.location), $options: "i" };
  if (query.minFollowers !== undefined || query.maxFollowers !== undefined) {
    filters.followers = {
      ...(query.minFollowers !== undefined ? { $gte: query.minFollowers } : {}),
      ...(query.maxFollowers !== undefined ? { $lte: query.maxFollowers } : {}),
    };
  }
  if (query.search) {
    const search = new RegExp(escapeRegex(query.search), "i");
    filters.$or = [{ fullName: search }, { contentCategories: search }, { location: search }];
  }
  const sort: Record<string, SortOrder> = query.sort === "followers"
    ? { followers: -1 }
    : query.sort === "newest"
      ? { createdAt: -1 }
      : { featured: -1, createdAt: -1 };

  const [profiles, total] = await Promise.all([
    Creator.find(filters)
      .select("fullName primaryPlatform contentCategories followers location profileImage featured isDemo instagramUsername bio languages engagementRate averageReelViews averageLikes averageComments")
      .sort(sort)
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .lean(),
    Creator.countDocuments(filters),
  ]);
  return apiSuccess({
    creators: profiles.map((creator) => {
      // Calculate engagement rate if not stored: ((avgLikes + avgComments) / followers) * 100
      const storedEng = creator.engagementRate ?? 0;
      let computedEng: number | null = null;
      if (!storedEng && creator.followers > 0 && (creator.averageLikes !== undefined || creator.averageComments !== undefined)) {
        const likes = creator.averageLikes ?? 0;
        const comments = creator.averageComments ?? 0;
        computedEng = ((likes + comments) / creator.followers) * 100;
      }
      return {
        id: creator._id.toString(),
        fullName: creator.fullName,
        primaryPlatform: creator.primaryPlatform,
        contentCategories: creator.contentCategories,
        followers: creator.followers,
        location: creator.location,
        profileImage: creator.profileImage,
        featured: creator.featured,
        isDemo: creator.isDemo,
        instagramUsername: creator.instagramUsername,
        bio: creator.bio,
        languages: creator.languages ?? [],
        engagementRate: storedEng || computedEng,
        averageReelViews: creator.averageReelViews ?? creator.averageViews ?? null,
      };
    }),
    pagination: { page: query.page, limit: query.limit, total, pages: Math.ceil(total / query.limit) },
  });
});

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
