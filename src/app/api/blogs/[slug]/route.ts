import { apiSuccess, ApiError, withApiErrors } from "@/lib/api-response";
import { connectToDatabase } from "@/lib/db";
import BlogPost from "@/models/BlogPost";

type RouteContext = { params: Promise<{ slug: string }> };

export const GET = withApiErrors(async (_request, context: RouteContext) => {
  await connectToDatabase();
  const { slug } = await context.params;
  const post = await BlogPost.findOne({ slug, isPublished: true, publishedAt: { $lte: new Date() } })
    .select("title slug excerpt content featuredImage category tags author publishedAt seo isDemo")
    .populate("author", "name profileImage")
    .lean();
  if (!post) throw new ApiError("Article was not found.", 404);
  return apiSuccess({ post });
});
