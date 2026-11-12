import { apiSuccess, withApiErrors } from "@/lib/api-response";
import { requireAdminPermission } from "@/lib/admin/permissions";
import { connectToDatabase } from "@/lib/db";
import StudentReferral from "@/models/StudentReferral";
import Student from "@/models/Student";
import { getOrInitializeCommissionRules, calculateCommissionForFollowers } from "@/lib/commission";

export const GET = withApiErrors(async (request) => {
  await requireAdminPermission("student:read");
  await connectToDatabase();

  const url = new URL(request.url);
  const search = url.searchParams.get("search")?.trim().slice(0, 100) ?? "";
  const status = url.searchParams.get("status")?.trim() ?? "";
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") ?? "20", 10) || 20));
  const skip = (page - 1) * limit;

  const safeSearch = search ? search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") : "";
  const rx = safeSearch ? new RegExp(safeSearch, "i") : null;

  // Find matching students if search is by student name
  let studentIds: unknown[] = [];
  if (rx) {
    const matchedStudents = await Student.find({
      $or: [{ name: rx }, { studentId: rx }, { referralCode: rx }, { email: rx }],
    }).select("_id").lean();
    studentIds = matchedStudents.map((s) => s._id);
  }

  const filter: Record<string, unknown> = {
    ...(status && ["pending", "verified", "rejected"].includes(status) ? { status } : {}),
    ...(rx
      ? {
          $or: [
            { creatorName: rx },
            { creatorHandle: rx },
            { referralCode: rx },
            ...(studentIds.length > 0 ? [{ student: { $in: studentIds } }] : []),
          ],
        }
      : {}),
  };

  const [items, total, totalCount, pendingCount, verifiedCount, rejectedCount, rules] = await Promise.all([
    StudentReferral.find(filter)
      .populate("student", "name email studentId referralCode")
      .populate("verifiedBy", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    StudentReferral.countDocuments(filter),
    StudentReferral.countDocuments({}),
    StudentReferral.countDocuments({ status: "pending" }),
    StudentReferral.countDocuments({ status: "verified" }),
    StudentReferral.countDocuments({ status: "rejected" }),
    getOrInitializeCommissionRules(),
  ]);

  // Enhance items with simulated estimated commission if pending
  const enhancedItems = items.map((item) => {
    const followers = item.confirmedFollowers ?? item.followers ?? 0;
    const calc = calculateCommissionForFollowers(followers, rules);
    return {
      ...item,
      estimatedCommission: item.status === "verified" ? item.commissionEarned : calc.amount,
      applicableTier: item.commissionTierLabel || calc.label,
    };
  });

  return apiSuccess({
    items: enhancedItems,
    total,
    page,
    pages: Math.max(1, Math.ceil(total / limit)),
    stats: {
      totalCount,
      pendingCount,
      verifiedCount,
      rejectedCount,
    },
    rules,
  });
});

