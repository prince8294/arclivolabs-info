import { ApiError } from "@/lib/api-response";
import { connectToDatabase } from "@/lib/db";
import BlogPost from "@/models/BlogPost";
import ActivityLog from "@/models/ActivityLog";
import Brand from "@/models/Brand";
import Campaign from "@/models/Campaign";
import ContactMessage from "@/models/ContactMessage";
import Creator from "@/models/Creator";
import CreatorApplication from "@/models/CreatorApplication";
import Enquiry from "@/models/Enquiry";
import FinancialTransaction from "@/models/FinancialTransaction";
import { roleHasPermission } from "@/lib/admin/permissions";
import type { UserRole } from "@/models/User";
import type { Model } from "mongoose";

type DateRange = { from: Date; to: Date; previousFrom: Date; previousTo: Date; unit: "day" | "month" };

export function parseDateRange(searchParams: URLSearchParams): DateRange {
  const to = searchParams.get("to") ? new Date(searchParams.get("to") as string) : new Date();
  const fromValue = searchParams.get("from");
  const preset = searchParams.get("range") ?? "30d";
  const daysByPreset: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90, "12m": 365 };
  const from = fromValue ? new Date(fromValue) : new Date(to.getTime() - (daysByPreset[preset] ?? 30) * 86400000);
  if (!Number.isFinite(from.getTime()) || !Number.isFinite(to.getTime()) || from >= to) {
    throw new ApiError("Invalid analytics date range.", 400);
  }
  const duration = to.getTime() - from.getTime();
  if (duration > 366 * 86400000) throw new ApiError("Date range cannot exceed 12 months.", 400);
  return {
    from,
    to,
    previousFrom: new Date(from.getTime() - duration),
    previousTo: from,
    unit: duration > 100 * 86400000 ? "month" : "day",
  };
}

async function countDelta<T>(model: Model<T>, from: Date, to: Date, previousFrom: Date, previousTo: Date) {
  const [current, previous] = await Promise.all([
    model.countDocuments({ createdAt: { $gte: from, $lt: to } }),
    model.countDocuments({ createdAt: { $gte: previousFrom, $lt: previousTo } }),
  ]);
  return { current, previous, change: previous === 0 ? null : Math.round(((current - previous) / previous) * 100) };
}

export async function getDashboardStats(role: UserRole, permissions?: readonly string[]) {
  await connectToDatabase();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const [
    creators,
    pendingApplications,
    brands,
    activeCampaigns,
    completedCampaigns,
    newEnquiries,
    budgetByCurrency,
    monthlyRevenue,
    recentActivity,
  ] = await Promise.all([
    Creator.countDocuments(),
    CreatorApplication.countDocuments({ approvalStatus: "pending" }),
    Brand.countDocuments(),
    Campaign.countDocuments({ status: "active" }),
    Campaign.countDocuments({ status: "completed" }),
    Enquiry.countDocuments({ status: "new" }),
    Campaign.aggregate([
      { $group: { _id: { $ifNull: ["$currency", "INR"] }, total: { $sum: "$budget" } } },
      { $sort: { _id: 1 } },
    ]),
    roleHasPermission(role, "finance:read", permissions)
      ? FinancialTransaction.aggregate([
          { $match: { type: "revenue", occurredAt: { $gte: monthStart, $lte: now } } },
          { $group: { _id: "$currency", total: { $sum: "$amount" }, count: { $sum: 1 } } },
          { $sort: { _id: 1 } },
        ])
      : Promise.resolve(null),
    roleHasPermission(role, "activity:read", permissions)
      ? ActivityLog.find().populate("actor", "name").sort({ createdAt: -1 }).limit(7).lean()
      : Promise.resolve([]),
  ]);
  const comparisons = {
    creators: await countDelta(Creator, monthStart, now, previousMonthStart, monthStart),
    brands: await countDelta(Brand, monthStart, now, previousMonthStart, monthStart),
    campaigns: await countDelta(Campaign, monthStart, now, previousMonthStart, monthStart),
    enquiries: await countDelta(Enquiry, monthStart, now, previousMonthStart, monthStart),
  };
  return {
    totals: {
      creators,
      pendingCreatorApplications: pendingApplications,
      brands,
      activeCampaigns,
      completedCampaigns,
      newEnquiries,
      campaignBudgetsByCurrency: budgetByCurrency,
      monthlyRevenue,
    },
    comparisons,
    recentActivity,
    financeAccess: roleHasPermission(role, "finance:read", permissions),
  };
}

export async function getDashboardAnalytics(searchParams: URLSearchParams, role: UserRole, permissions?: readonly string[]) {
  await connectToDatabase();
  const range = parseDateRange(searchParams);
  const format = range.unit === "month" ? "%Y-%m" : "%Y-%m-%d";
  const dateGroup = (field: string) => ({ $dateToString: { format, date: field, timezone: "UTC" } });
  const dateMatch = { $gte: range.from, $lte: range.to };
  const [creatorGrowth, brandGrowth, enquiryTrend, campaignStatuses, campaignCategories, revenueTrend] = await Promise.all([
    Creator.aggregate([
      { $match: { createdAt: dateMatch } },
      { $group: { _id: dateGroup("$createdAt"), count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Brand.aggregate([
      { $match: { createdAt: dateMatch } },
      { $group: { _id: dateGroup("$createdAt"), count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Enquiry.aggregate([
      { $match: { createdAt: dateMatch } },
      { $group: { _id: dateGroup("$createdAt"), count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Campaign.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
    Campaign.aggregate([
      { $group: { _id: { industry: "$industry", currency: { $ifNull: ["$currency", "INR"] } }, count: { $sum: 1 }, budget: { $sum: "$budget" } } },
      { $sort: { count: -1 } },
      { $limit: 12 },
    ]),
    roleHasPermission(role, "finance:read", permissions) ? FinancialTransaction.aggregate([
      { $match: { type: "revenue", occurredAt: dateMatch } },
      { $group: { _id: { date: dateGroup("$occurredAt"), currency: "$currency" }, total: { $sum: "$amount" } } },
      { $sort: { "_id.date": 1 } },
    ]) : Promise.resolve(null),
  ]);
  return { range: { from: range.from, to: range.to, unit: range.unit }, creatorGrowth, brandGrowth, enquiryTrend, campaignStatuses, campaignCategories, revenueTrend };
}

export async function getAdminReport(searchParams: URLSearchParams, role: UserRole, permissions?: readonly string[]) {
  await connectToDatabase();
  const range = parseDateRange(searchParams);
  const [creatorGrowth, brandGrowth, campaignStatuses, enquiryStatuses, recordedTransactions, activity] = await Promise.all([
    Creator.aggregate([{ $match: { createdAt: { $gte: range.from, $lte: range.to } } }, { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "UTC" } }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
    Brand.aggregate([{ $match: { createdAt: { $gte: range.from, $lte: range.to } } }, { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "UTC" } }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
    Campaign.aggregate([
      { $match: { createdAt: { $gte: range.from, $lte: range.to } } },
      { $group: { _id: { status: "$status", currency: { $ifNull: ["$currency", "INR"] } }, count: { $sum: 1 }, budget: { $sum: "$budget" } } },
    ]),
    Enquiry.aggregate([{ $match: { createdAt: { $gte: range.from, $lte: range.to } } }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
    roleHasPermission(role, "finance:read", permissions) ? FinancialTransaction.aggregate([{ $match: { occurredAt: { $gte: range.from, $lte: range.to } } }, { $group: { _id: { type: "$type", currency: "$currency" }, amount: { $sum: "$amount" }, count: { $sum: 1 } } }, { $sort: { "_id.type": 1, "_id.currency": 1 } }]) : Promise.resolve(null),
    ContactMessage.countDocuments({ createdAt: { $gte: range.from, $lte: range.to } }),
  ]);
  return { range: { from: range.from, to: range.to }, creatorGrowth, brandGrowth, campaignStatuses, enquiryStatuses, recordedTransactions, contactMessages: activity, financeAccess: roleHasPermission(role, "finance:read", permissions) };
}

export async function getContentCounts() {
  await connectToDatabase();
  return Promise.all([
    BlogPost.countDocuments({ isPublished: true }),
    ContactMessage.countDocuments({ status: "new" }),
  ]);
}
