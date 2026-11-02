import { apiSuccess, withApiErrors } from "@/lib/api-response";
import { connectToDatabase } from "@/lib/db";
import { paginationSchema } from "@/lib/validations/public";
import Service from "@/models/Service";

export const GET = withApiErrors(async (request) => {
  await connectToDatabase();
  const { page, limit } = paginationSchema.parse(Object.fromEntries(new URL(request.url).searchParams));
  const filter = { isActive: true };
  const [services, total] = await Promise.all([
    Service.find(filter).select("title slug description content icon featuredImage seo isDemo isFeatured").sort({ isFeatured: -1, title: 1 }).skip((page - 1) * limit).limit(limit).lean(),
    Service.countDocuments(filter),
  ]);
  return apiSuccess({ services, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});
