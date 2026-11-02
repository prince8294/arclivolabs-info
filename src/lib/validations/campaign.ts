import { z } from "zod";
import { cleanText, objectId } from "@/lib/validations/common";

export const campaignCreateSchema = z.object({
  title: cleanText(180, 2),
  brandId: objectId.optional(),
  description: cleanText(10000, 20),
  objective: cleanText(2000, 5),
  industry: cleanText(100, 2),
  platforms: z.array(cleanText(50, 1)).min(1).max(10),
  contentTypes: z.array(cleanText(100, 1)).max(20).default([]),
  targetAudience: cleanText(2000, 1).optional(),
  targetLocation: z.array(cleanText(160, 1)).max(50).default([]),
  budget: z.coerce.number().min(0).max(1_000_000_000),
  currency: z.string().trim().regex(/^[A-Za-z]{3}$/).default("INR"),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  requiredCreators: z.coerce.number().int().min(1).max(10000),
  deliverables: z.array(z.object({
    description: cleanText(500, 2),
    quantity: z.coerce.number().int().min(1).max(10000),
    platform: cleanText(50, 1).optional(),
  })).max(100).default([]),
}).strict().refine((value) => value.endDate >= value.startDate, {
  path: ["endDate"],
  message: "End date must be on or after the start date.",
});

export const creatorProfileUpdateSchema = z.object({
  fullName: cleanText(120, 2).optional(),
  phone: cleanText(32, 7).optional(),
  profileImage: z.string().trim().url().max(2048).optional(),
  bio: cleanText(3000, 1).optional(),
  instagramUsername: cleanText(64, 1).optional(),
  instagramUrl: z.string().trim().url().max(2048).optional(),
  youtubeChannel: cleanText(250, 1).optional(),
  youtubeUrl: z.string().trim().url().max(2048).optional(),
  otherSocialPlatforms: z.array(z.object({
    platform: cleanText(50, 1),
    username: cleanText(100, 1),
    url: z.string().trim().url().max(2048).optional(),
  })).max(20).optional(),
  primaryPlatform: cleanText(50, 1).optional(),
  contentCategories: z.array(cleanText(100, 1)).min(1).max(30).optional(),
  followers: z.coerce.number().int().min(0).max(1_000_000_000).optional(),
  averageViews: z.coerce.number().int().min(0).max(1_000_000_000).optional(),
  location: cleanText(160, 2).optional(),
  country: cleanText(100, 2).optional(),
  languages: z.array(cleanText(50, 1)).max(30).optional(),
  portfolioUrl: z.string().trim().url().max(2048).optional(),
  availability: z.enum(["available", "unavailable"]).optional(),
}).strict();

export const creatorProfileAdminUpdateSchema = creatorProfileUpdateSchema.extend({
  verificationStatus: z.enum(["unverified", "verified"]).optional(),
  approvalStatus: z.enum(["pending", "approved", "rejected"]).optional(),
  featured: z.boolean().optional(),
  user: objectId.optional(),
}).strict();
