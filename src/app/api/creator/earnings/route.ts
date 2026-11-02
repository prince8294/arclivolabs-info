import { apiSuccess, withApiErrors } from "@/lib/api-response";
import { connectToDatabase } from "@/lib/db";
import { requireOwnedCreator } from "@/lib/portal-access";
import { requireRole } from "@/lib/permissions";
import PaymentTransaction from "@/models/PaymentTransaction";

export const GET = withApiErrors(async () => {
  const user = await requireRole(["creator"]);
  const creator = await requireOwnedCreator(user);
  await connectToDatabase();
  const [transactions, summary] = await Promise.all([
    PaymentTransaction.find({ creator: creator._id }).select("campaign collaboration amount currency status reference paidAt createdAt history").populate("campaign", "title").sort({ createdAt: -1 }).limit(500).lean(),
    PaymentTransaction.aggregate([
      { $match: { creator: creator._id } },
      { $group: { _id: { status: "$status", currency: "$currency" }, total: { $sum: "$amount" }, count: { $sum: 1 } } },
      { $sort: { "_id.currency": 1, "_id.status": 1 } },
    ]),
  ]);
  const creatorTransactions = transactions.map((transaction) => {
    const history = (transaction.history ?? []) as Array<{ status: string; reference?: string; recordedAt: Date }>;
    return {
      ...transaction,
      history: history.map(({ status, reference, recordedAt }) => ({ status, reference, recordedAt })),
    };
  });
  return apiSuccess({ transactions: creatorTransactions, summary });
});
