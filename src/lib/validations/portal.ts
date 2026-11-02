import { z } from "zod";
import { cleanText, objectId } from "@/lib/validations/common";

const httpUrl = z.string().trim().url().max(2048).refine((value) => ["http:", "https:"].includes(new URL(value).protocol), "URL must use HTTP or HTTPS.");

export const brandProfileSchema = z.object({
  companyName: cleanText(180, 2),
  contactPerson: cleanText(120, 2),
  phone: cleanText(32, 7),
  website: httpUrl.or(z.literal("")).optional(),
  industry: cleanText(100, 2),
  description: cleanText(3000, 2),
  companyLogo: httpUrl.optional(),
  location: cleanText(160, 2),
  country: cleanText(100, 2),
  socialMediaLinks: z.array(z.object({ platform: cleanText(50, 1), url: httpUrl }).strict()).max(20).optional(),
}).strict();

export const creatorProfileSchema = z.object({
  fullName: cleanText(120, 2),
  phone: cleanText(32, 7),
  profileImage: httpUrl.optional(),
  bio: cleanText(3000, 1).optional(),
  instagramUsername: cleanText(64, 1).optional(),
  instagramUrl: httpUrl.optional(),
  youtubeChannel: cleanText(250, 1).optional(),
  youtubeUrl: httpUrl.optional(),
  otherSocialPlatforms: z.array(z.object({ platform: cleanText(50, 1), username: cleanText(100, 1), url: httpUrl.optional() }).strict()).max(20).optional(),
  primaryPlatform: cleanText(50, 1),
  contentCategories: z.array(cleanText(100, 1)).min(1).max(30),
  followers: z.coerce.number().int().min(0).max(1_000_000_000),
  averageViews: z.coerce.number().int().min(0).max(1_000_000_000).optional(),
  engagementRate: z.coerce.number().min(0).max(100).optional(),
  location: cleanText(160, 2),
  country: cleanText(100, 2).optional(),
  languages: z.array(cleanText(50, 1)).max(30).optional(),
  audienceDemographics: z.object({
    ageRanges: z.record(z.string(), z.number().min(0).max(100)).optional(),
    gender: z.record(z.string(), z.number().min(0).max(100)).optional(),
    topCountries: z.array(cleanText(100, 1)).max(30).optional(),
  }).strict().optional(),
  portfolioUrl: httpUrl.optional(),
  availability: z.enum(["available", "unavailable"]).optional(),
}).strict();

export const shortlistCreateSchema = z.object({ name: cleanText(120, 2) }).strict();
export const shortlistUpdateSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("rename"), name: cleanText(120, 2) }).strict(),
  z.object({ action: z.literal("add"), creatorId: objectId, note: cleanText(1000, 1).optional() }).strict(),
  z.object({ action: z.literal("remove"), creatorId: objectId }).strict(),
  z.object({ action: z.literal("note"), creatorId: objectId, note: cleanText(1000, 1).optional() }).strict(),
]);

export const campaignPortalSchema = z.object({
  title: cleanText(180, 2),
  description: cleanText(10000, 20),
  objective: cleanText(2000, 5),
  industry: cleanText(100, 2),
  platforms: z.array(cleanText(50, 1)).min(1).max(10),
  contentTypes: z.array(cleanText(100, 1)).max(20).default([]),
  targetAudience: cleanText(2000, 1).optional(),
  targetAgeRange: cleanText(60, 1).optional(),
  targetGender: cleanText(60, 1).optional(),
  targetLocation: z.array(cleanText(160, 1)).max(50).default([]),
  audienceInterests: z.array(cleanText(100, 1)).max(50).default([]),
  audienceLanguages: z.array(cleanText(50, 1)).max(30).default([]),
  creatorCategories: z.array(cleanText(100, 1)).max(30).default([]),
  minimumEngagementRate: z.coerce.number().min(0).max(100).optional(),
  minimumFollowers: z.coerce.number().int().min(0).optional(),
  maximumFollowers: z.coerce.number().int().min(0).optional(),
  budgetPerCreator: z.coerce.number().min(0).optional(),
  budget: z.coerce.number().min(0).max(1_000_000_000),
  currency: z.string().trim().regex(/^[A-Za-z]{3}$/).default("INR"),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  requiredCreators: z.coerce.number().int().min(1).max(10000),
  deliverables: z.array(z.object({ description: cleanText(500, 2), quantity: z.coerce.number().int().min(1).max(10000), platform: cleanText(50, 1).optional() }).strict()).max(100).default([]),
  terms: cleanText(5000, 1).optional(),
}).strict().refine((value) => value.endDate >= value.startDate, { path: ["endDate"], message: "End date must be on or after the start date." })
  .refine((value) => value.maximumFollowers === undefined || value.minimumFollowers === undefined || value.maximumFollowers >= value.minimumFollowers, { path: ["maximumFollowers"], message: "Maximum followers must be greater than or equal to minimum followers." });

export const creatorPackageSchema = z.object({
  title: cleanText(120, 2),
  platform: cleanText(50, 1),
  description: cleanText(1000, 1).optional(),
  price: z.coerce.number().min(0).max(1_000_000_000),
  currency: z.string().trim().regex(/^[A-Za-z]{3}$/),
  deliveryDays: z.coerce.number().int().min(1).max(365),
  isActive: z.boolean().optional(),
}).strict();

export const socialAccountSchema = z.object({
  platform: cleanText(50, 1),
  username: cleanText(120, 1),
  profileUrl: httpUrl,
  followers: z.coerce.number().int().min(0).max(1_000_000_000),
  averageViews: z.coerce.number().int().min(0).max(1_000_000_000).optional(),
}).strict();

export const portfolioItemSchema = z.object({
  title: cleanText(160, 2),
  description: cleanText(2000, 1).optional(),
  mediaUrl: httpUrl,
  mediaType: z.enum(["image", "video", "link"]),
  categories: z.array(cleanText(100, 1)).max(30).default([]),
  sortOrder: z.coerce.number().int().min(0).max(10000).optional(),
}).strict();
