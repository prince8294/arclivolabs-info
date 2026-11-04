import { Types } from "mongoose";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { ApiError } from "@/lib/api-response";
import { connectToDatabase } from "@/lib/db";
import ActivityLog from "@/models/ActivityLog";
import AgencySettings from "@/models/AgencySettings";
import BlogPost from "@/models/BlogPost";
import Brand from "@/models/Brand";
import Campaign from "@/models/Campaign";
import ContactMessage from "@/models/ContactMessage";
import Creator from "@/models/Creator";
import CreatorApplication from "@/models/CreatorApplication";
import Enquiry from "@/models/Enquiry";
import FinancialTransaction from "@/models/FinancialTransaction";
import InternalNote from "@/models/InternalNote";
import Notification from "@/models/Notification";
import Service from "@/models/Service";
import TeamInvitation from "@/models/TeamInvitation";
import User, { userRoles, type UserRole } from "@/models/User";
import { recordCommittedActivity } from "@/services/activity.service";
import { getRolePermissions } from "@/lib/admin/permissions";
import { adminPermissions } from "@/types/admin";

export const adminResources = [
  "creators", "creator-applications", "brands", "campaigns", "enquiries", "contact-messages", "team",
  "services", "blogs", "notifications", "activity-logs", "settings", "transactions",
] as const;
export type AdminResource = typeof adminResources[number];
const manageableTeamRoles = userRoles.filter((role) => !["super_admin", "brand", "creator"].includes(role)) as [UserRole, ...UserRole[]];

export const creatorAdminSchema = z.object({
  fullName: z.string().trim().min(2).max(120).optional(),
  email: z.string().trim().email().max(254).optional(),
  phone: z.string().trim().min(7).max(32).optional(),
  profileImage: z.string().trim().max(2048).optional(),
  bio: z.string().trim().max(3000).optional(),
  instagramUsername: z.string().trim().max(64).optional(),
  instagramUrl: z.string().trim().url().max(2048).optional(),
  youtubeChannel: z.string().trim().max(250).optional(),
  youtubeUrl: z.string().trim().url().max(2048).optional(),
  primaryPlatform: z.string().trim().min(2).max(50).optional(),
  contentCategories: z.array(z.string().trim().min(1).max(80)).max(30).optional(),
  followers: z.number().int().min(0).optional(),
  averageViews: z.number().int().min(0).optional(),
  engagementRate: z.number().min(0).max(100).optional(),
  location: z.string().trim().min(2).max(160).optional(),
  country: z.string().trim().max(100).optional(),
  portfolioUrl: z.string().trim().url().max(2048).optional(),
  approvalStatus: z.enum(["pending", "approved", "rejected"]).optional(),
  verificationStatus: z.enum(["unverified", "verified"]).optional(),
  metricsVerificationStatus: z.enum(["unverified", "pending", "verified"]).optional(),
  featured: z.boolean().optional(),
  availability: z.enum(["available", "unavailable"]).optional(),
}).strict();

const creatorApplicationAdminSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  email: z.string().trim().email().max(254).nullable().optional(),
  phone: z.string().trim().min(7).max(32).nullable().optional(),
  socialProfile: z.string().trim().min(1).max(2048).optional(),
  primaryPlatform: z.string().trim().min(2).max(50).optional(),
  contentCategory: z.string().trim().min(2).max(100).nullable().optional(),
  followers: z.number().int().min(0).max(1_000_000_000).nullable().optional(),
  location: z.string().trim().min(2).max(160).nullable().optional(),
  portfolioUrl: z.string().trim().url().max(2048).nullable().optional(),
  introduction: z.string().trim().min(2).max(3000).nullable().optional(),
  approvalStatus: z.enum(["pending", "contacted", "qualified", "approved", "rejected"]).optional(),
}).strict();

export const brandAdminSchema = z.object({
  companyName: z.string().trim().min(2).max(180),
  contactPerson: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().min(7).max(32),
  website: z.string().trim().url().max(2048).or(z.literal("")).optional(),
  industry: z.string().trim().min(2).max(100),
  description: z.string().trim().min(2).max(3000),
  companyLogo: z.string().trim().max(2048).optional(),
  location: z.string().trim().min(2).max(160),
  country: z.string().trim().min(2).max(100),
  status: z.enum(["active", "pending", "suspended"]).optional(),
  socialMediaLinks: z.array(z.object({ platform: z.string().max(50), url: z.string().url().max(2048) })).max(20).optional(),
  user: z.string().regex(/^[a-f\d]{24}$/i).optional(),
}).strict();

export const campaignAdminSchema = z.object({
  title: z.string().trim().min(2).max(180).optional(),
  brand: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  description: z.string().trim().min(2).max(10000).optional(),
  objective: z.string().trim().min(2).max(2000).optional(),
  industry: z.string().trim().min(2).max(100).optional(),
  platforms: z.array(z.string().trim().min(1).max(50)).min(1).max(10).optional(),
  contentTypes: z.array(z.string().trim().max(80)).max(30).optional(),
  targetAudience: z.string().trim().max(2000).optional(),
  targetLocation: z.array(z.string().trim().max(100)).max(30).optional(),
  budget: z.number().min(0).max(1_000_000_000).optional(),
  currency: z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  requiredCreators: z.number().int().min(1).max(10000).optional(),
  selectedCreators: z.array(z.string().regex(/^[a-f\d]{24}$/i)).max(10000).optional(),
  deliverables: z.array(z.object({
    description: z.string().trim().min(1).max(1000),
    quantity: z.number().int().min(1).max(10000),
    platform: z.string().max(50).optional(),
  })).max(100).optional(),
  status: z.enum(["draft", "pending", "approved", "active", "completed", "cancelled"]).optional(),
  notes: z.string().trim().max(5000).optional(),
}).strict();

export const serviceAdminSchema = z.object({
  title: z.string().trim().min(2).max(180),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(180),
  description: z.string().trim().min(2).max(1000),
  content: z.string().min(2).max(20000),
  icon: z.string().trim().max(50).optional(),
  featuredImage: z.string().trim().url().max(2048).optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  seo: z.object({ title: z.string().max(180).optional(), description: z.string().max(320).optional() }).optional(),
}).strict();

export const blogAdminSchema = z.object({
  title: z.string().trim().min(2).max(240),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(240),
  excerpt: z.string().trim().min(2).max(1000),
  content: z.string().min(2).max(50000),
  featuredImage: z.string().trim().url().max(2048).optional(),
  category: z.string().trim().min(2).max(100),
  tags: z.array(z.string().trim().max(50)).max(30).optional(),
  isPublished: z.boolean().optional(),
  publishedAt: z.coerce.date().nullable().optional(),
  seo: z.object({ title: z.string().max(180).optional(), description: z.string().max(320).optional() }).optional(),
}).strict();

export const enquiryAdminSchema = z.object({
  status: z.enum(["new", "contacted", "qualified", "proposal_sent", "converted", "rejected"]).optional(),
  assignedTo: z.string().regex(/^[a-f\d]{24}$/i).nullable().optional(),
  followUpAt: z.coerce.date().nullable().optional(),
}).strict();

export const noteSchema = z.object({
  entityType: z.enum(["creator", "brand", "campaign", "enquiry", "contact"]),
  entityId: z.string().regex(/^[a-f\d]{24}$/i),
  body: z.string().trim().min(1).max(5000),
});

export const transactionSchema = z.object({
  type: z.enum(["revenue", "expense"]),
  amount: z.number().positive().max(1_000_000_000),
  currency: z.string().trim().regex(/^[A-Z]{3}$/),
  description: z.string().trim().min(2).max(500),
  reference: z.string().trim().max(120).optional(),
  campaign: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  occurredAt: z.coerce.date(),
});

const pageSchema = z.coerce.number().int().min(1).max(100000).default(1);
const pageSizeSchema = z.coerce.number().int().min(1).max(100).default(20);

type ListParams = {
  page: number;
  limit: number;
  q: string;
  status: string;
  sort: string;
  order: 1 | -1;
  skip: number;
};

function getListParams(searchParams: URLSearchParams): ListParams {
  const page = pageSchema.parse(searchParams.get("page") ?? 1);
  const limit = pageSizeSchema.parse(searchParams.get("limit") ?? 20);
  const order = searchParams.get("order") === "asc" ? 1 : -1;
  return {
    page,
    limit,
    q: (searchParams.get("q") ?? "").trim().slice(0, 100),
    status: (searchParams.get("status") ?? "").trim().slice(0, 40),
    sort: (searchParams.get("sort") ?? "createdAt").slice(0, 40),
    order,
    skip: (page - 1) * limit,
  };
}

function regex(value: string) {
  return new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
}

function optionalNumber(value: string | null): number | undefined {
  if (value === null || value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function pageResult(data: unknown[], total: number, params: ListParams) {
  return { items: data, pagination: { page: params.page, limit: params.limit, total, pages: Math.ceil(total / params.limit) } };
}

function idOrThrow(id: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(id)) throw new ApiError("Record not found.", 404);
  return new Types.ObjectId(id);
}

function normalizeProfile(value: string): string {
  const normalized = value.trim().replace(/^@/, "").toLowerCase();
  const profileHandle = normalized.match(/^https?:\/\/(?:www\.)?[^/]+\/(?:@|channel\/|c\/|user\/)?([^/?#]+)/);
  return profileHandle?.[1] ?? normalized;
}

export function permissionForResource(resource: AdminResource, operation: "read" | "manage"): import("@/lib/admin/permissions").AdminPermission {
  const permissions: Record<AdminResource, { read: import("@/lib/admin/permissions").AdminPermission; manage: import("@/lib/admin/permissions").AdminPermission }> = {
    creators: { read: "creator:read", manage: "creator:manage" },
    "creator-applications": { read: "creator:read", manage: "creator:manage" },
    brands: { read: "brand:read", manage: "brand:manage" },
    campaigns: { read: "campaign:read", manage: "campaign:manage" },
    enquiries: { read: "enquiry:read", manage: "enquiry:manage" },
    "contact-messages": { read: "contact:read", manage: "contact:manage" },
    team: { read: "team:read", manage: "team:manage" },
    services: { read: "content:read", manage: "content:manage" },
    blogs: { read: "content:read", manage: "content:manage" },
    notifications: { read: "notification:read", manage: "notification:read" },
    "activity-logs": { read: "activity:read", manage: "activity:read" },
    settings: { read: "settings:read", manage: "settings:manage" },
    transactions: { read: "finance:read", manage: "finance:manage" },
  };
  return permissions[resource][operation];
}

export async function listAdminResource(resource: AdminResource, searchParams: URLSearchParams, actor: { id: string; role: UserRole }) {
  await connectToDatabase();
  const p = getListParams(searchParams);
  const sortField = ["createdAt", "updatedAt", "followers", "engagementRate", "budget", "title", "companyName", "fullName", "amount", "occurredAt"].includes(p.sort) ? p.sort : "createdAt";
  const sort = { [sortField]: p.order };
  const rx = p.q ? regex(p.q) : null;
  switch (resource) {
    case "creators": {
      const category = searchParams.get("category")?.slice(0, 80);
      const platform = searchParams.get("platform")?.slice(0, 50);
      const location = searchParams.get("location")?.slice(0, 100);
      const minFollowers = optionalNumber(searchParams.get("minFollowers"));
      const maxFollowers = optionalNumber(searchParams.get("maxFollowers"));
      const followerRange = {
        ...(minFollowers !== undefined ? { $gte: minFollowers } : {}),
        ...(maxFollowers !== undefined ? { $lte: maxFollowers } : {}),
      };
      const filter = {
        ...(p.status ? { approvalStatus: p.status } : {}),
        ...(category ? { contentCategories: category } : {}),
        ...(platform ? { primaryPlatform: platform } : {}),
        ...(location ? { location: regex(location) } : {}),
        ...(Object.keys(followerRange).length > 0 ? { followers: followerRange } : {}),
        ...(rx ? { $or: [{ fullName: rx }, { email: rx }, { instagramUsername: rx }, { location: rx }] } : {}),
      };
      const [items, total, pendingApplications] = await Promise.all([
        Creator.find(filter).sort(sort).skip(p.skip).limit(p.limit).lean(),
        Creator.countDocuments(filter),
        CreatorApplication.countDocuments({ approvalStatus: "pending" }),
      ]);
      return { ...pageResult(items, total, p), pendingApplications };
    }
    case "creator-applications": {
      const filter = { ...(p.status ? { approvalStatus: p.status } : {}), ...(rx ? { $or: [{ name: rx }, { referenceId: rx }, { email: rx }, { instagramUsername: rx }, { location: rx }] } : {}) };
      const [items, total] = await Promise.all([CreatorApplication.find(filter).sort(sort).skip(p.skip).limit(p.limit).lean(), CreatorApplication.countDocuments(filter)]);
      return pageResult(items.map((item) => ({
        ...item,
        socialProfile: item.socialProfile ?? (item.instagramUsername ? `@${item.instagramUsername}` : item.youtubeChannel ? `@${item.youtubeChannel}` : undefined),
      })), total, p);
    }
    case "brands": {
      const industry = searchParams.get("industry")?.slice(0, 100);
      const filter = { ...(p.status ? { status: p.status } : {}), ...(industry ? { industry } : {}), ...(rx ? { $or: [{ companyName: rx }, { contactPerson: rx }, { email: rx }, { industry: rx }] } : {}) };
      const [items, total] = await Promise.all([Brand.find(filter).sort(sort).skip(p.skip).limit(p.limit).lean(), Brand.countDocuments(filter)]);
      return pageResult(items, total, p);
    }
    case "campaigns": {
      const filter = { ...(p.status ? { status: p.status } : {}), ...(rx ? { $or: [{ title: rx }, { objective: rx }, { industry: rx }] } : {}) };
      const [items, total] = await Promise.all([Campaign.find(filter).populate("brand", "companyName companyLogo").populate("selectedCreators", "fullName profileImage primaryPlatform").sort(sort).skip(p.skip).limit(p.limit).lean(), Campaign.countDocuments(filter)]);
      return pageResult(items, total, p);
    }
    case "enquiries": {
      const filter = { ...(p.status ? { status: p.status } : {}), ...(actor.role === "sales_executive" ? { assignedTo: idOrThrow(actor.id) } : {}), ...(rx ? { $or: [{ referenceId: rx }, { name: rx }, { company: rx }, { email: rx }, { serviceRequired: rx }] } : {}) };
      const [items, total] = await Promise.all([Enquiry.find(filter).sort(sort).skip(p.skip).limit(p.limit).lean(), Enquiry.countDocuments(filter)]);
      return pageResult(items, total, p);
    }
    case "contact-messages": {
      const filter = { ...(p.status ? { status: p.status } : {}), ...(rx ? { $or: [{ referenceId: rx }, { name: rx }, { email: rx }, { subject: rx }] } : {}) };
      const [items, total] = await Promise.all([ContactMessage.find(filter).sort(sort).skip(p.skip).limit(p.limit).lean(), ContactMessage.countDocuments(filter)]);
      return pageResult(items, total, p);
    }
    case "team": {
      const roles = userRoles.filter((role) => !["brand", "creator"].includes(role));
      const filter = { role: { $in: roles }, ...(p.status ? { status: p.status } : {}), ...(rx ? { $or: [{ name: rx }, { email: rx }, { role: rx }] } : {}) };
      const [items, total] = await Promise.all([User.find(filter).select("-passwordHash -sessionVersion").sort(sort).skip(p.skip).limit(p.limit).lean(), User.countDocuments(filter)]);
      const invites = await TeamInvitation.find({ acceptedAt: null, revokedAt: null, expiresAt: { $gt: new Date() } }).select("email name role expiresAt createdAt").sort({ createdAt: -1 }).limit(50).lean();
      return { ...pageResult(items, total, p), invitations: invites };
    }
    case "services": {
      const filter = { ...(p.status ? { isActive: p.status === "active" } : {}), ...(rx ? { $or: [{ title: rx }, { slug: rx }] } : {}) };
      const [items, total] = await Promise.all([Service.find(filter).sort(sort).skip(p.skip).limit(p.limit).lean(), Service.countDocuments(filter)]);
      return pageResult(items, total, p);
    }
    case "blogs": {
      const filter = { ...(p.status ? { isPublished: p.status === "published" } : {}), ...(rx ? { $or: [{ title: rx }, { slug: rx }, { category: rx }] } : {}) };
      const [items, total] = await Promise.all([BlogPost.find(filter).populate("author", "name").sort(sort).skip(p.skip).limit(p.limit).lean(), BlogPost.countDocuments(filter)]);
      return pageResult(items, total, p);
    }
    case "notifications": {
      const filter = { recipient: idOrThrow(actor.id), ...(p.status === "unread" ? { readAt: { $exists: false } } : {}) };
      const [items, total] = await Promise.all([Notification.find(filter).sort({ createdAt: -1 }).skip(p.skip).limit(p.limit).lean(), Notification.countDocuments(filter)]);
      return pageResult(items, total, p);
    }
    case "activity-logs": {
      const filter = rx ? { $or: [{ action: rx }, { resourceType: rx }] } : {};
      const [items, total] = await Promise.all([ActivityLog.find(filter).populate("actor", "name email role").sort({ createdAt: -1 }).skip(p.skip).limit(p.limit).lean(), ActivityLog.countDocuments(filter)]);
      return pageResult(items, total, p);
    }
    case "transactions": {
      const filter = p.status ? { type: p.status } : {};
      const [items, total] = await Promise.all([FinancialTransaction.find(filter).populate("campaign", "title").populate("recordedBy", "name").sort(sort).skip(p.skip).limit(p.limit).lean(), FinancialTransaction.countDocuments(filter)]);
      return pageResult(items, total, p);
    }
    case "settings": {
      const settings = await AgencySettings.findOneAndUpdate(
        { key: "agency" },
        { $setOnInsert: { key: "agency" } },
        { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
      ).lean();
      const row = {
        ...settings,
        emailProviderStatus: process.env.RESEND_API_KEY && process.env.EMAIL_FROM ? "configured" : "unconfigured",
        storageProviderStatus: process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET
          && process.env.CLOUDINARY_IMAGE_UPLOAD_PRESET && process.env.CLOUDINARY_MEDIA_UPLOAD_PRESET ? "configured" : "unconfigured",
        scheduledJobsStatus: process.env.CRON_SECRET ? "configured" : "unconfigured",
      };
      return { items: [row], pagination: { page: 1, limit: 1, total: 1, pages: 1 } };
    }
  }
}

export async function getAdminResource(resource: AdminResource, id: string, actor: { id: string; role: UserRole }) {
  await connectToDatabase();
  const _id = idOrThrow(id);
  switch (resource) {
    case "creators": {
      const [creator, campaigns, activity] = await Promise.all([
        Creator.findById(_id).lean(),
        Campaign.find({ selectedCreators: _id }).select("title status startDate endDate brand").populate("brand", "companyName").sort({ startDate: -1 }).limit(50).lean(),
        ActivityLog.find({ resourceType: "Creator", resourceId: _id }).sort({ createdAt: -1 }).limit(50).lean(),
      ]);
      return creator ? { ...creator, campaignHistory: campaigns, activityHistory: activity } : null;
    }
    case "creator-applications": {
      const application = await CreatorApplication.findById(_id).populate("user", "name email").lean();
      return application ? {
        ...application,
        socialProfile: application.socialProfile ?? (application.instagramUsername ? `@${application.instagramUsername}` : application.youtubeChannel ? `@${application.youtubeChannel}` : undefined),
      } : null;
    }
    case "brands": {
      const brand = await Brand.findById(_id).lean();
      if (!brand) return null;
      const [campaigns, enquiries] = await Promise.all([
        Campaign.find({ brand: _id }).select("title status budget startDate endDate").sort({ createdAt: -1 }).limit(100).lean(),
        Enquiry.find({ $or: [{ company: brand.companyName }, { email: brand.email }] }).select("referenceId serviceRequired budget status createdAt").sort({ createdAt: -1 }).limit(100).lean(),
      ]);
      return brand ? { ...brand, campaignHistory: campaigns, enquiries } : null;
    }
    case "campaigns": return Campaign.findById(_id).populate("brand").populate("selectedCreators").populate("createdBy", "name").lean();
    case "enquiries": return Enquiry.findOne({ _id, ...(actor.role === "sales_executive" ? { assignedTo: idOrThrow(actor.id) } : {}) }).populate("assignedTo", "name email").lean();
    case "contact-messages": return ContactMessage.findById(_id).lean();
    case "team": return User.findOne({ _id, role: { $nin: ["brand", "creator"] } }).select("-passwordHash -sessionVersion").lean();
    case "services": return Service.findById(_id).lean();
    case "blogs": return BlogPost.findById(_id).populate("author", "name").lean();
    case "notifications": return Notification.findOne({ _id, recipient: idOrThrow(actor.id) }).lean();
    case "activity-logs": return ActivityLog.findById(_id).populate("actor", "name email role").lean();
    case "transactions": return FinancialTransaction.findById(_id).lean();
    case "settings": return AgencySettings.findById(_id).lean();
  }
}

const campaignTransitions: Record<string, readonly string[]> = {
  draft: ["pending", "cancelled"],
  pending: ["approved", "draft", "cancelled"],
  approved: ["active", "cancelled"],
  active: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};
const enquiryTransitions: Record<string, readonly string[]> = {
  new: ["contacted", "rejected"],
  contacted: ["qualified", "rejected"],
  qualified: ["proposal_sent", "rejected"],
  proposal_sent: ["qualified", "negotiation", "converted", "rejected"],
  negotiation: ["proposal_sent", "converted", "rejected"],
  converted: [],
  rejected: ["contacted"],
};

export async function updateAdminResource(resource: AdminResource, id: string, input: unknown, actor: { id: string; role: UserRole }) {
  await connectToDatabase();
  const _id = idOrThrow(id);
  const now = new Date();
  let updated: unknown;
  let action = `${resource}.updated`;
  switch (resource) {
    case "creators": {
      const body = creatorAdminSchema.parse(input);
      const current = await Creator.findById(_id);
      if (!current) throw new ApiError("Creator not found.", 404);
      updated = await Creator.findByIdAndUpdate(_id, {
        $set: {
          ...body,
          ...(body.metricsVerificationStatus === "verified" ? { metricsLastVerifiedAt: now } : {}),
        },
        ...(body.metricsVerificationStatus === "unverified" ? { $unset: { metricsLastVerifiedAt: 1 } } : {}),
      }, { returnDocument: "after", runValidators: true, strict: "throw" }).lean();
      if (body.approvalStatus) action = `creator.${body.approvalStatus}`;
      else if (body.metricsVerificationStatus) action = `creator.metrics_${body.metricsVerificationStatus}`;
      else if (body.verificationStatus) action = `creator.${body.verificationStatus}`;
      break;
    }
    case "creator-applications": {
      const body = creatorApplicationAdminSchema.parse(input);
      const application = await CreatorApplication.findById(_id);
      if (!application) throw new ApiError("Creator application not found.", 404);
      if (body.email && await CreatorApplication.exists({ _id: { $ne: _id }, email: body.email })) {
        throw new ApiError("Another creator application already uses this email address.", 409);
      }
      const nextEmail = body.email === null ? undefined : body.email ?? application.email;
      const nextPhone = body.phone === null ? undefined : body.phone ?? application.phone;
      if (!nextEmail && !nextPhone) {
        throw new ApiError("Add an email address or phone number so the applicant can be contacted.", 400);
      }
      for (const [key, value] of Object.entries(body)) {
        if (key === "approvalStatus") continue;
        application.set(key, value === null ? undefined : value);
      }
      if (body.approvalStatus) application.approvalStatus = body.approvalStatus;
      if (body.approvalStatus === "approved") {
        const socialProfile = application.socialProfile ?? application.instagramUsername ?? application.youtubeChannel;
        if (!application.email || !application.phone || !application.contentCategory
          || application.followers === undefined || !application.location || !socialProfile) {
          throw new ApiError("Before approval, add the applicant's email, phone, category, follower count, and location.", 400);
        }
      }
      await application.save();
      if (body.approvalStatus === "approved") {
        const socialProfile = application.socialProfile ?? application.instagramUsername ?? application.youtubeChannel ?? "";
        const socialUrl = /^https?:\/\//i.test(socialProfile) ? socialProfile : undefined;
        const socialHandle = socialProfile.replace(/^@/, "");
        const socialFields = application.primaryPlatform === "Instagram"
          ? {
            instagramUsername: application.instagramUsername ?? normalizeProfile(socialProfile),
            ...(socialUrl ? { instagramUrl: socialUrl } : {}),
          }
          : application.primaryPlatform === "YouTube"
            ? {
              youtubeChannel: application.youtubeChannel ?? socialHandle,
              ...(socialUrl ? { youtubeUrl: socialUrl } : {}),
            }
            : {
              otherSocialPlatforms: [{
                platform: application.primaryPlatform,
                username: socialHandle,
                ...(socialUrl ? { url: socialUrl } : {}),
              }],
            };
        await Creator.findOneAndUpdate(
          { email: application.email },
          {
            $set: { approvalStatus: "approved" },
            $setOnInsert: {
              fullName: application.name,
              email: application.email,
              phone: application.phone,
              ...socialFields,
              primaryPlatform: application.primaryPlatform,
              contentCategories: [application.contentCategory],
              followers: application.followers,
              location: application.location,
              portfolioUrl: application.portfolioUrl,
              bio: application.introduction,
              user: application.user,
            },
          },
          { upsert: true, returnDocument: "after", runValidators: true, setDefaultsOnInsert: true },
        );
      }
      updated = application.toObject();
      if (body.approvalStatus) action = `creator.application_${body.approvalStatus}`;
      break;
    }
    case "brands": {
      const body = brandAdminSchema.partial().strict().parse(input);
      updated = await Brand.findByIdAndUpdate(_id, { $set: body }, { returnDocument: "after", runValidators: true, strict: "throw" }).lean();
      break;
    }
    case "campaigns": {
      const body = campaignAdminSchema.parse(input);
      const current = await Campaign.findById(_id);
      if (!current) throw new ApiError("Campaign not found.", 404);
      if (body.status && body.status !== current.status && !campaignTransitions[current.status]?.includes(body.status)) {
        throw new ApiError(`Campaign cannot transition from ${current.status} to ${body.status}.`, 400);
      }
      if (body.startDate && body.endDate && body.endDate <= body.startDate) throw new ApiError("End date must be after start date.", 400);
      const update = { ...body, ...(body.brand ? { brand: idOrThrow(body.brand) } : {}), ...(body.selectedCreators ? { selectedCreators: body.selectedCreators.map(idOrThrow) } : {}) };
      updated = await Campaign.findByIdAndUpdate(_id, { $set: update }, { returnDocument: "after", runValidators: true, strict: "throw" }).populate("brand", "companyName").populate("selectedCreators", "fullName").lean();
      if (body.status) action = "campaign.status_changed";
      break;
    }
    case "enquiries": {
      const body = enquiryAdminSchema.parse(input);
      const current = await Enquiry.findById(_id);
      if (!current) throw new ApiError("Enquiry not found.", 404);
      if (actor.role === "sales_executive" && current.assignedTo?.toString() !== actor.id) throw new ApiError("Enquiry not found.", 404);
      if (body.status && body.status !== current.status && !enquiryTransitions[current.status]?.includes(body.status)) {
        throw new ApiError(`Enquiry cannot transition from ${current.status} to ${body.status}.`, 400);
      }
      updated = await Enquiry.findByIdAndUpdate(_id, { $set: body }, { returnDocument: "after", runValidators: true }).lean();
      if (body.status) action = "enquiry.status_changed";
      break;
    }
    case "contact-messages": {
      const body = z.object({ status: z.enum(["new", "read", "replied", "archived"]) }).strict().parse(input);
      updated = await ContactMessage.findByIdAndUpdate(_id, { $set: body }, { returnDocument: "after", runValidators: true }).lean();
      action = `contact.${body.status}`;
      break;
    }
    case "team": {
      const body = z.object({
        status: z.enum(["active", "suspended", "deactivated"]).optional(),
        role: z.enum(manageableTeamRoles).optional(),
        permissions: z.array(z.enum(adminPermissions)).max(adminPermissions.length).optional(),
      }).strict().refine((value) => value.status !== undefined || value.role !== undefined || value.permissions !== undefined, "Provide at least one team change.").parse(input);
      const target = await User.findById(_id);
      if (!target || ["brand", "creator"].includes(target.role)) throw new ApiError("Team member not found.", 404);
      if (target.role === "super_admin" && actor.role !== "super_admin") throw new ApiError("Only a super admin may manage a super admin.", 403);
      if (target.id === actor.id && body.status !== "active") throw new ApiError("You cannot deactivate your own account.", 400);
      if (body.role === "admin" && actor.role !== "super_admin") throw new ApiError("Only a super admin may assign the admin role.", 403);
      if (body.permissions && actor.role !== "super_admin") throw new ApiError("Only a super admin may edit custom permissions.", 403);
      const nextRole = body.role ?? target.role as UserRole;
      if (body.permissions?.some((permission) => !getRolePermissions(nextRole).includes(permission))) {
        throw new ApiError("Custom permissions cannot exceed the assigned role's capabilities.", 400);
      }
      if (body.status) target.status = body.status;
      if (body.role) {
        target.role = body.role as UserRole;
        if (!body.permissions) target.permissions = undefined;
      }
      if (body.permissions) target.permissions = body.permissions;
      target.sessionVersion += 1;
      await target.save();
      updated = await User.findById(_id).select("-passwordHash -sessionVersion").lean();
      action = body.role ? "team.role_changed" : "team.status_changed";
      break;
    }
    case "services": {
      const body = serviceAdminSchema.partial().strict().parse(input);
      updated = await Service.findByIdAndUpdate(_id, { $set: body }, { returnDocument: "after", runValidators: true, strict: "throw" }).lean();
      break;
    }
    case "blogs": {
      const body = blogAdminSchema.partial().strict().parse(input);
      const changes = { ...body, ...(body.isPublished === true && !body.publishedAt ? { publishedAt: now } : {}) };
      updated = await BlogPost.findByIdAndUpdate(_id, { $set: changes }, { returnDocument: "after", runValidators: true, strict: "throw" }).populate("author", "name").lean();
      break;
    }
    case "notifications": {
      updated = await Notification.findOneAndUpdate({ _id, recipient: idOrThrow(actor.id) }, { $set: { readAt: now } }, { returnDocument: "after" }).lean();
      break;
    }
    case "settings": {
      const body = agencySettingsSchemaForUpdate.parse(input);
      updated = await AgencySettings.findByIdAndUpdate(_id, { $set: body }, { returnDocument: "after", runValidators: true, strict: "throw" }).lean();
      break;
    }
    case "transactions": throw new ApiError("Financial records are immutable after creation.", 405);
    case "activity-logs": throw new ApiError("Activity logs are append-only.", 405);
  }
  if (!updated) throw new ApiError("Record not found.", 404);
  await recordCommittedActivity({ actorId: actor.id, action, resourceType: resource, resourceId: id });
  return updated;
}

export const agencySettingsSchemaForUpdate = z.object({
  agencyName: z.string().trim().min(2).max(180).optional(),
  logoUrl: z.string().trim().url().max(2048).optional(),
  contactEmail: z.string().trim().email().max(254).optional(),
  contactPhone: z.string().trim().max(32).optional(),
  website: z.string().trim().url().max(2048).optional(),
  currency: z.string().regex(/^[A-Z]{3}$/).optional(),
  timeZone: z.string().trim().min(1).max(80).optional(),
  socialLinks: z.array(z.object({ platform: z.string().max(50), url: z.string().url().max(2048) })).max(20).optional(),
  notificationPreferences: z.object({
    creatorApplications: z.boolean().optional(),
    brandEnquiries: z.boolean().optional(),
    contactMessages: z.boolean().optional(),
    campaignUpdates: z.boolean().optional(),
  }).optional(),
}).strict();

export async function createAdminResource(resource: AdminResource, input: unknown, actor: { id: string; role: UserRole }) {
  await connectToDatabase();
  let created: unknown;
  switch (resource) {
    case "creators": {
      const body = z.object({
        fullName: z.string().trim().min(2).max(120),
        email: z.string().trim().email().max(254),
        phone: z.string().trim().min(7).max(32),
        primaryPlatform: z.string().trim().min(2).max(50),
        contentCategories: z.array(z.string().trim().min(1).max(80)).min(1).max(30),
        followers: z.number().int().min(0),
        location: z.string().trim().min(2).max(160),
        bio: z.string().trim().max(3000).optional(),
        instagramUsername: z.string().trim().max(64).optional(),
        youtubeChannel: z.string().trim().max(250).optional(),
        approvalStatus: z.enum(["pending", "approved", "rejected"]).optional(),
      }).strict().parse(input);
      created = await Creator.create(body);
      break;
    }
    case "brands": {
      const body = brandAdminSchema.omit({ user: true }).parse(input);
      created = await Brand.create({ ...body, status: body.status ?? "active" });
      break;
    }
    case "campaigns": {
      const body = campaignAdminSchema.extend({
        title: z.string().trim().min(2).max(180),
        brand: z.string().regex(/^[a-f\d]{24}$/i),
        description: z.string().trim().min(2).max(10000),
        objective: z.string().trim().min(2).max(2000),
        industry: z.string().trim().min(2).max(100),
        platforms: z.array(z.string().trim().min(1)).min(1),
        budget: z.number().min(0),
        startDate: z.coerce.date(),
        endDate: z.coerce.date(),
        requiredCreators: z.number().int().min(1),
      }).parse(input);
      if (body.endDate <= body.startDate) throw new ApiError("End date must be after start date.", 400);
      created = await Campaign.create({ ...body, brand: idOrThrow(body.brand), selectedCreators: body.selectedCreators?.map(idOrThrow), createdBy: idOrThrow(actor.id) });
      break;
    }
    case "enquiries": {
      const body = z.object({
        name: z.string().trim().min(2).max(120),
        company: z.string().trim().min(2).max(160),
        email: z.string().trim().email().max(254),
        phone: z.string().trim().min(7).max(32),
        serviceRequired: z.string().trim().min(2).max(100),
        budget: z.string().trim().min(1).max(80),
        details: z.string().trim().min(20).max(5000),
        preferredPlatform: z.string().max(50).optional(),
        status: z.enum(["new", "contacted", "qualified", "proposal_sent", "negotiation", "converted", "rejected"]).optional(),
      }).strict().parse(input);
      created = await Enquiry.create({
        ...body,
        referenceId: `ENQ-${randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`,
        assignedTo: idOrThrow(actor.id),
      });
      break;
    }
    case "services": created = await Service.create(serviceAdminSchema.parse(input)); break;
    case "blogs": created = await BlogPost.create({ ...blogAdminSchema.parse(input), author: idOrThrow(actor.id) }); break;
    case "transactions": {
      const body = transactionSchema.parse(input);
      created = await FinancialTransaction.create({ ...body, campaign: body.campaign ? idOrThrow(body.campaign) : undefined, recordedBy: idOrThrow(actor.id) });
      break;
    }
    case "settings": {
      const body = agencySettingsSchemaForUpdate.parse(input);
      created = await AgencySettings.findOneAndUpdate({ key: "agency" }, { $set: body, $setOnInsert: { key: "agency" } }, { upsert: true, returnDocument: "after", runValidators: true });
      break;
    }
    default: throw new ApiError("This resource cannot be created through this endpoint.", 405);
  }
  const createdDoc = created as { _id: Types.ObjectId };
  await recordCommittedActivity({ actorId: actor.id, action: `${resource}.created`, resourceType: resource, resourceId: createdDoc._id.toString() });
  return created;
}

export async function deleteAdminResource(resource: AdminResource, id: string, actor: { id: string; role: UserRole }) {
  await connectToDatabase();
  const _id = idOrThrow(id);
  let deleted: unknown;
  switch (resource) {
    case "creators": deleted = await Creator.findByIdAndDelete(_id).select("_id"); break;
    case "creator-applications": deleted = await CreatorApplication.findByIdAndDelete(_id).select("_id"); break;
    case "brands": deleted = await Brand.findByIdAndDelete(_id).select("_id"); break;
    case "campaigns": deleted = await Campaign.findByIdAndDelete(_id).select("_id"); break;
    case "enquiries":     if (actor.role === "sales_executive") throw new ApiError("Only a sales manager may remove enquiries.", 403);
    deleted = await Enquiry.findByIdAndDelete(_id).select("_id"); break;
    case "contact-messages": deleted = await ContactMessage.findByIdAndDelete(_id).select("_id"); break;
    case "services": deleted = await Service.findByIdAndDelete(_id).select("_id"); break;
    case "blogs": deleted = await BlogPost.findByIdAndDelete(_id).select("_id"); break;
    case "notifications": deleted = await Notification.findOneAndDelete({ _id, recipient: idOrThrow(actor.id) }).select("_id"); break;
    case "team": {
      const target = await User.findById(_id);
      if (!target || ["brand", "creator"].includes(target.role)) break;
      if (target.role === "super_admin" && actor.role !== "super_admin") throw new ApiError("Only a super admin may revoke a super admin.", 403);
      if (target.id === actor.id) throw new ApiError("You cannot revoke your own access.", 400);
      target.status = "deactivated";
      target.sessionVersion += 1;
      await target.save();
      deleted = target;
      break;
    }
    case "transactions": throw new ApiError("Financial records cannot be deleted.", 405);
    case "activity-logs": throw new ApiError("Activity logs are append-only.", 405);
    case "settings": throw new ApiError("Agency settings cannot be deleted.", 405);
  }
  if (!deleted) throw new ApiError("Record not found.", 404);
  await recordCommittedActivity({ actorId: actor.id, action: `${resource}.deleted`, resourceType: resource, resourceId: id });
  return { id };
}

export async function createInternalNote(input: unknown, actorId: string) {
  await connectToDatabase();
  const body = noteSchema.parse(input);
  const entityId = idOrThrow(body.entityId);
  const exists = await ({
    creator: Creator.exists({ _id: entityId }),
    brand: Brand.exists({ _id: entityId }),
    campaign: Campaign.exists({ _id: entityId }),
    enquiry: Enquiry.exists({ _id: entityId }),
    contact: ContactMessage.exists({ _id: entityId }),
  })[body.entityType];
  if (!exists) throw new ApiError("Record not found.", 404);
  return InternalNote.create({ ...body, entityId, author: idOrThrow(actorId) });
}

export async function inviteTeamMember(input: unknown, actor: { id: string; role: UserRole }) {
  await connectToDatabase();
  const body = z.object({
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().email().max(254),
    role: z.enum(manageableTeamRoles),
  }).strict().parse(input);
  if (body.role === "admin" && actor.role !== "super_admin") throw new ApiError("Only a super admin may invite an admin.", 403);
  if (await User.exists({ email: body.email.toLowerCase() })) throw new ApiError("An account already uses this email.", 409);
  await TeamInvitation.updateMany({ email: body.email.toLowerCase(), acceptedAt: null, revokedAt: null }, { $set: { revokedAt: new Date() } });
  const { createHash, randomBytes } = await import("node:crypto");
  const token = randomBytes(32).toString("base64url");
  const invite = await TeamInvitation.create({
    ...body,
    email: body.email.toLowerCase(),
    tokenHash: createHash("sha256").update(token).digest("hex"),
    invitedBy: idOrThrow(actor.id),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });
  await recordCommittedActivity({ actorId: actor.id, action: "team.invited", resourceType: "TeamInvitation", resourceId: invite.id, metadata: { role: body.role } });
  return {
    id: invite.id,
    email: invite.email,
    role: invite.role,
    expiresAt: invite.expiresAt,
    ...(process.env.NODE_ENV === "development" ? { invitationTokenForDevelopment: token } : {}),
  };
}
