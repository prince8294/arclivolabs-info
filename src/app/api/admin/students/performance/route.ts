import { apiSuccess, withApiErrors } from "@/lib/api-response";
import { requireAdminPermission } from "@/lib/admin/permissions";
import { connectToDatabase } from "@/lib/db";
import Student from "@/models/Student";
import StudentReferral from "@/models/StudentReferral";
import StudentPayment from "@/models/StudentPayment";

export const GET = withApiErrors(async (request: Request) => {
  await requireAdminPermission("student:read");
  await connectToDatabase();

  const url = new URL(request.url);
  const search = url.searchParams.get("search")?.trim().slice(0, 100) ?? "";
  const statusFilter = url.searchParams.get("status")?.trim() ?? ""; // "active" | "deactivated" | ""
  const sortBy = url.searchParams.get("sortBy")?.trim() ?? "recent"; // "verified" | "earnings" | "referred" | "recent"
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") ?? "20", 10) || 20));
  const skip = (page - 1) * limit;

  const safeSearch = search ? search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") : "";
  const rx = safeSearch ? new RegExp(safeSearch, "i") : null;

  const filter: Record<string, unknown> = {
    ...(statusFilter && ["active", "deactivated"].includes(statusFilter)
      ? { status: statusFilter }
      : {}),
    ...(rx
      ? {
          $or: [
            { name: rx },
            { email: rx },
            { studentId: rx },
            { referralCode: rx },
          ],
        }
      : {}),
  };

  // Determine base sort for MongoDB query
  let sortOption: Record<string, 1 | -1> = { createdAt: -1 };
  if (sortBy === "verified") {
    sortOption = { verifiedCreators: -1, totalEarnings: -1 };
  } else if (sortBy === "earnings") {
    sortOption = { totalEarnings: -1, verifiedCreators: -1 };
  } else if (sortBy === "referred") {
    sortOption = { totalCreatorsReferred: -1 };
  }

  const [students, total, allStudentsCount, activeCount, inactiveCount] = await Promise.all([
    Student.find(filter).sort(sortOption).skip(skip).limit(limit).lean(),
    Student.countDocuments(filter),
    Student.countDocuments({}),
    Student.countDocuments({ status: "active" }),
    Student.countDocuments({ status: "deactivated" }),
  ]);

  // Aggregate live referrals and payments per student in the current page
  const studentIds = students.map((s) => s._id);

  const [referralStats, paymentStats] = await Promise.all([
    StudentReferral.aggregate<{
      _id: { student: unknown; status: string };
      count: number;
      commissionSum: number;
    }>([
      { $match: { student: { $in: studentIds } } },
      {
        $group: {
          _id: { student: "$student", status: "$status" },
          count: { $sum: 1 },
          commissionSum: { $sum: "$commissionEarned" },
        },
      },
    ]),
    StudentPayment.aggregate<{
      _id: { student: unknown; status: string };
      totalPaid: number;
    }>([
      { $match: { student: { $in: studentIds } } },
      {
        $group: {
          _id: { student: "$student", status: "$status" },
          totalPaid: { $sum: "$amount" },
        },
      },
    ]),
  ]);

  // Map aggregates to each student
  const performanceItems = students.map((s) => {
    const sIdStr = s._id.toString();

    let totalReferred = 0;
    let verifiedCount = 0;
    let pendingCount = 0;
    let rejectedCount = 0;
    let totalCommissionEarned = 0;

    for (const row of referralStats) {
      if (row._id.student?.toString() === sIdStr) {
        totalReferred += row.count;
        if (row._id.status === "verified") {
          verifiedCount += row.count;
          totalCommissionEarned += row.commissionSum;
        } else if (row._id.status === "pending") {
          pendingCount += row.count;
        } else if (row._id.status === "rejected") {
          rejectedCount += row.count;
        }
      }
    }

    let totalAmountPaid = 0;
    for (const pRow of paymentStats) {
      if (pRow._id.student?.toString() === sIdStr && pRow._id.status === "paid") {
        totalAmountPaid += pRow.totalPaid;
      }
    }

    // Fall back to stored metrics if stored is higher (for seed/manual records)
    const finalTotalReferred = Math.max(s.totalCreatorsReferred || 0, totalReferred);
    const finalVerified = Math.max(s.verifiedCreators || 0, verifiedCount);
    const finalPending = Math.max(s.pendingVerification || 0, pendingCount);
    const finalRejected = rejectedCount;
    const finalCommission = Math.max(s.totalEarnings || 0, totalCommissionEarned);
    const finalPaid = Math.max(s.paidAmount || 0, totalAmountPaid);
    const pendingPayment = Math.max(0, finalCommission - finalPaid);

    return {
      _id: s._id,
      name: s.name,
      studentId: s.studentId,
      referralCode: s.referralCode,
      email: s.email,
      phone: s.phone,
      institution: s.institution,
      status: s.status,
      hasCustomCommissionRates: s.hasCustomCommissionRates,
      customCommissionRates: s.customCommissionRates,
      totalCreatorsReferred: finalTotalReferred,
      verifiedCreators: finalVerified,
      pendingVerification: finalPending,
      rejectedCreators: finalRejected,
      totalCommissionEarned: finalCommission,
      totalAmountPaid: finalPaid,
      pendingPayment,
      currency: s.currency || "INR",
      createdAt: s.createdAt,
    };
  });

  return apiSuccess({
    items: performanceItems,
    total,
    page,
    pages: Math.ceil(total / limit) || 1,
    summary: {
      allStudentsCount,
      activeCount,
      inactiveCount,
    },
  });
});

