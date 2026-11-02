import { apiSuccess, ApiError, withApiErrors } from "@/lib/api-response";
import { connectToDatabase } from "@/lib/db";
import Service from "@/models/Service";

type RouteContext = { params: Promise<{ slug: string }> };

export const GET = withApiErrors(async (_request, context: RouteContext) => {
  await connectToDatabase();
  const { slug } = await context.params;
  const service = await Service.findOne({ slug, isActive: true }).select("title slug description content icon featuredImage seo isDemo isFeatured").lean();
  if (!service) throw new ApiError("Service was not found.", 404);
  return apiSuccess({ service });
});
