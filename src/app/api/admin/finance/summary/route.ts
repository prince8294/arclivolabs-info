import { z } from "zod";
import { apiSuccess, ApiError, withApiErrors } from "@/lib/api-response";
import { requireAdminPermission } from "@/lib/admin/permissions";
import { connectToDatabase } from "@/lib/db";
import { objectId } from "@/lib/portal-access";
import Campaign from "@/models/Campaign";
import PaymentTransaction from "@/models/PaymentTransaction";
import { enforceRateLimit } from "@/lib/rate-limit";

const querySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  brand: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  campaign: z.string().regex(/^[a-f\d]{24}$/i).optional(),
}).strict();

export const GET = withApiErrors(async (request) => {
  const actor = await requireAdminPermission("finance:read");
  const query = querySchema.parse(Object.fromEntries(new URL(request.url).searchParams.entries()));
  const from = query.from ? new Date(query.from) : undefined;
  const to = query.to ? new Date(query.to) : undefined;
  if (from && to && from > to) throw new ApiError("The start date must be before the end date.", 400);
  await connectToDatabase();
  await enforceRateLimit({ scope: "admin-finance-summary", identity: actor.id, limit: 60, windowMs: 60 * 1000 });

  const createdAt: Record<string, Date> = {};
  if (from) createdAt.$gte = from;
  if (to) createdAt.$lte = to;
  const [payouts, campaignBudgets] = await Promise.all([
    PaymentTransaction.aggregate([
      { $match: {
        ...(query.brand ? { brand: objectId(query.brand) } : {}),
        ...(query.campaign ? { campaign: objectId(query.campaign) } : {}),
        ...(Object.keys(createdAt).length ? { createdAt } : {}),
      } },
      { $group: { _id: { status: "$status", currency: "$currency" }, totalAmount: { $sum: "$amount" }, count: { $sum: 1 } } },
      { $sort: { "_id.currency": 1, "_id.status": 1 } },
    ]),
    Campaign.aggregate([
      { $match: {
        ...(query.brand ? { brand: objectId(query.brand) } : {}),
        ...(query.campaign ? { _id: objectId(query.campaign) } : {}),
        ...(Object.keys(createdAt).length ? { createdAt } : {}),
      } },
      { $group: { _id: { $ifNull: ["$currency", "INR"] }, budget: { $sum: "$budget" }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
  ]);
  return apiSuccess({
    creatorPayables: payouts,
    campaignBudgets,
    notes: {
      creatorPayables: "Creator payment records are maintained manually by authorized finance staff.",
      campaignBudgets: "Campaign budgets are planning amounts and are not confirmed payments.",
    },
  });
});
