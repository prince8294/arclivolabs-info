import { apiSuccess, withApiErrors } from "@/lib/api-response";
import { connectToDatabase } from "@/lib/db";
import { requireRole } from "@/lib/permissions";
import { requireOwnedBrand } from "@/lib/portal-access";
import Campaign from "@/models/Campaign";
import PaymentTransaction from "@/models/PaymentTransaction";

export const GET = withApiErrors(async () => {
  const user = await requireRole(["brand"]);
  const brand = await requireOwnedBrand(user);
  await connectToDatabase();
  const [campaignBudget, payments, totals] = await Promise.all([
    Campaign.aggregate([
      { $match: { brand: brand._id } },
      { $group: { _id: { $ifNull: ["$currency", "INR"] }, total: { $sum: "$budget" }, campaigns: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    PaymentTransaction.find({ brand: brand._id })
      .select("campaign creator amount currency status reference paidAt createdAt")
      .populate("campaign", "title")
      .populate("creator", "fullName")
      .sort({ createdAt: -1 })
      .limit(500)
      .lean(),
    PaymentTransaction.aggregate([
      { $match: { brand: brand._id } },
      { $group: { _id: { status: "$status", currency: "$currency" }, total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]),
  ]);
  return apiSuccess({
    campaignBudget: campaignBudget[0] ?? { total: 0, campaigns: 0 },
    payments,
    totals,
  });
});
