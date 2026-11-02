import { apiSuccess, withApiErrors } from "@/lib/api-response";
import { connectToDatabase } from "@/lib/db";
import { paginationSchema } from "@/lib/validations/public";
import BlogPost from "@/models/BlogPost";

export const GET = withApiErrors(async (request) => {
  await connectToDatabase();
  const { page, limit } = paginationSchema.parse(Object.fromEntries(new URL(request.url).searchParams));
  const filter = { isPublished: true, publishedAt: { $lte: new Date() } };
  const [posts, total] = await Promise.all([
    BlogPost.find(filter).select("title slug excerpt featuredImage category tags author publishedAt seo isDemo").populate("author", "name profileImage").sort({ publishedAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    BlogPost.countDocuments(filter),
  ]);
  return apiSuccess({ posts, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});
