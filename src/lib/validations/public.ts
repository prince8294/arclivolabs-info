import { z } from "zod";
import { cleanText, emailAddress, phoneNumber, safeUrl } from "@/lib/validations/common";

export const enquirySchema = z.object({
  name: cleanText(120, 2),
  company: cleanText(160, 2),
  email: emailAddress,
  phone: phoneNumber,
  service: cleanText(100, 2),
  budget: cleanText(80, 1),
  details: cleanText(5000, 20),
  preferredPlatform: cleanText(50, 1).optional().default("Not specified"),
  subject: cleanText(160, 2).optional(),
  website: z.string().max(0).optional(),
}).strict();

export const contactMessageSchema = z.object({
  name: cleanText(120, 2),
  email: emailAddress,
  phone: phoneNumber.optional(),
  subject: cleanText(160, 2).default("Website contact"),
  message: cleanText(5000, 10),
  website: z.string().max(0).optional(),
}).strict();

export const creatorApplicationSchema = z.object({
  name: cleanText(120, 2),
  email: emailAddress.optional(),
  phone: phoneNumber.optional(),
  socialProfile: cleanText(2048, 1),
  platform: z.enum(["Instagram", "TikTok", "YouTube", "Other"]),
  followers: z.coerce.number().int().min(0).max(1_000_000_000),
  website: z.string().max(0).optional(),
}).strict().refine((value) => Boolean(value.email || value.phone), {
  path: ["email"],
  message: "Add an email address or phone number so our team can contact you.",
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const creatorQuerySchema = paginationSchema.extend({
  search: z.string().trim().max(100).optional(),
  category: z.string().trim().max(100).optional(),
  platform: z.string().trim().max(50).optional(),
  location: z.string().trim().max(160).optional(),
  minFollowers: z.coerce.number().int().min(0).optional(),
  maxFollowers: z.coerce.number().int().min(0).optional(),
  sort: z.enum(["featured", "followers", "newest"]).default("featured"),
}).refine((value) => value.minFollowers === undefined || value.maxFollowers === undefined || value.minFollowers <= value.maxFollowers, {
  path: ["maxFollowers"],
  message: "Maximum followers must be greater than or equal to minimum followers.",
});

export const brandRegistrationSchema = z.object({
  companyName: cleanText(180, 2),
  contactPerson: cleanText(120, 2),
  email: emailAddress,
  phone: phoneNumber,
  website: safeUrl.optional(),
  industry: cleanText(100, 2),
  description: cleanText(3000, 10),
  location: cleanText(160, 2),
  country: cleanText(100, 2),
}).strict();
