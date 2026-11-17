import { describe, expect, it } from "vitest";
import bcrypt from "bcryptjs";
import User from "@/models/User";
import { passwordSchema, registerSchema, updateUserSchema } from "@/lib/validations/auth";
import { campaignCreateSchema, creatorProfileUpdateSchema } from "@/lib/validations/campaign";
import { contactMessageSchema, creatorApplicationSchema, enquirySchema } from "@/lib/validations/public";
import { campaignPortalSchema, creatorProfileSchema, shortlistUpdateSchema } from "@/lib/validations/portal";
import { safeUrl } from "@/lib/validations/common";
import { agencySettingsSchemaForUpdate, brandAdminSchema, creatorAdminSchema } from "@/lib/admin/resources";

describe("authentication validation", () => {
  it("normalizes registration emails and only permits public account roles", () => {
    const valid = registerSchema.safeParse({
      name: "Sample Brand",
      email: "  HELLO@example.com ",
      password: "A-secure-Password-123!",
      role: "brand",
    });
    expect(valid.success).toBe(true);
    if (valid.success) expect(valid.data.email).toBe("hello@example.com");
    expect(registerSchema.safeParse({
      name: "Escalation",
      email: "admin@example.com",
      password: "A-secure-Password-123!",
      role: "super_admin",
    }).success).toBe(false);
  });

  it("drops protected profile fields from user updates", () => {
    expect(updateUserSchema.safeParse({ name: "Updated" }).success).toBe(true);
    expect(updateUserSchema.safeParse({ role: "admin" }).success).toBe(false);
    expect(updateUserSchema.safeParse({ status: "active" }).success).toBe(false);
  });

  it("hashes passwords and never selects hashes by default", async () => {
    const password = "A-secure-Password-123!";
    const hash = await bcrypt.hash(password, 4);
    expect(hash).not.toBe(password);
    expect(await bcrypt.compare(password, hash)).toBe(true);
    expect(User.schema.path("passwordHash").options.select).toBe(false);
    expect(User.schema.path("password")).toBeUndefined();
  });

  it("enforces the same strong password policy for every account flow", () => {
    expect(passwordSchema.safeParse("A-secure-Password-123!").success).toBe(true);
    expect(passwordSchema.safeParse("short1A!").success).toBe(false);
    expect(passwordSchema.safeParse("alllowercase123!").success).toBe(false);
    expect(passwordSchema.safeParse("NOLOWERCASE123!").success).toBe(false);
    expect(passwordSchema.safeParse("NoNumbersHere!").success).toBe(false);
    expect(passwordSchema.safeParse("NoSymbolsHere123").success).toBe(false);
  });
});

describe("URL validation", () => {
  it("only accepts HTTP and HTTPS URLs", () => {
    expect(safeUrl.safeParse("https://example.com/profile").success).toBe(true);
    expect(safeUrl.safeParse("http://localhost:3000/profile").success).toBe(true);
    expect(safeUrl.safeParse("javascript:alert(1)").success).toBe(false);
    expect(safeUrl.safeParse("data:text/html,<script>alert(1)</script>").success).toBe(false);
    expect(safeUrl.safeParse("ftp://example.com/file").success).toBe(false);
  });

  it("applies safe URL rules to public and admin-managed links", () => {
    expect(creatorProfileUpdateSchema.safeParse({ portfolioUrl: "javascript:alert(1)" }).success).toBe(false);
    expect(updateUserSchema.safeParse({ profileImage: "data:image/svg+xml,<svg/>" }).success).toBe(false);
    expect(creatorAdminSchema.safeParse({ instagramUrl: "javascript:alert(1)" }).success).toBe(false);
    expect(brandAdminSchema.safeParse({
      companyName: "Example Brand",
      contactPerson: "Casey Doe",
      email: "casey@example.com",
      phone: "+1 555 123 4567",
      website: "javascript:alert(1)",
      industry: "Lifestyle",
      description: "Example description",
      location: "London",
      country: "United Kingdom",
    }).success).toBe(false);
    expect(agencySettingsSchemaForUpdate.safeParse({ website: "data:text/html,unsafe" }).success).toBe(false);
  });
});

describe("public form validation", () => {
  it("rejects privileged creator status changes and campaign mass assignment", () => {
    expect(creatorProfileUpdateSchema.safeParse({ bio: "A thoughtful creator profile" }).success).toBe(true);
    expect(creatorProfileUpdateSchema.safeParse({ verificationStatus: "verified" }).success).toBe(false);
    expect(campaignCreateSchema.safeParse({
      title: "Launch",
      description: "A campaign description long enough for validation.",
      objective: "Introduce a product",
      industry: "Lifestyle",
      platforms: ["Instagram"],
      budget: 10000,
      startDate: "2027-01-01",
      endDate: "2027-01-10",
      requiredCreators: 2,
      status: "approved",
      selectedCreators: [],
    }).success).toBe(false);
  });

  it("keeps portal metric verification and shortlist ownership fields server-controlled", () => {
    const profile = {
      fullName: "Sample Creator", phone: "+1 555 123 4567", primaryPlatform: "Instagram",
      contentCategories: ["Design"], followers: 12000, location: "London",
    };
    expect(creatorProfileSchema.safeParse(profile).success).toBe(true);
    expect(creatorProfileSchema.safeParse({ ...profile, metricsVerificationStatus: "verified" }).success).toBe(false);
    expect(shortlistUpdateSchema.safeParse({ action: "add", creatorId: "507f1f77bcf86cd799439011" }).success).toBe(true);
    expect(shortlistUpdateSchema.safeParse({ action: "add", creatorId: "507f1f77bcf86cd799439011", brandId: "507f1f77bcf86cd799439012" }).success).toBe(false);
    const campaign = {
      title: "Creator launch", objective: "Product awareness", description: "A creator-led product launch brief.",
      industry: "Lifestyle", platforms: ["Instagram"], budget: 10000, startDate: "2027-01-01",
      endDate: "2027-01-10", requiredCreators: 2,
    };
    expect(campaignPortalSchema.safeParse(campaign).success).toBe(true);
    expect(campaignPortalSchema.safeParse({ ...campaign, status: "approved" }).success).toBe(false);
  });

  it("accepts short creator applications with one contact method and rejects honeypot submissions", () => {
    const application = {
      name: "Sample Creator",
      platform: "Instagram",
      socialProfile: "@samplecreator",
      followers: 25000,
      email: "creator@example.com",
    };
    expect(creatorApplicationSchema.safeParse(application).success).toBe(true);
    expect(creatorApplicationSchema.safeParse({ ...application, website: "spam" }).success).toBe(false);
    expect(creatorApplicationSchema.safeParse({ ...application, email: undefined }).success).toBe(false);
    expect(creatorApplicationSchema.safeParse({ ...application, email: undefined, phone: "+1 555 123 4567" }).success).toBe(true);
    expect(creatorApplicationSchema.safeParse({ ...application, socialProfile: "" }).success).toBe(false);
    expect(creatorApplicationSchema.safeParse({ ...application, followers: -1 }).success).toBe(false);
    expect(creatorApplicationSchema.safeParse({ ...application, category: "Beauty" }).success).toBe(false);
  });

  it("rejects missing enquiry fields and invalid contact messages", () => {
    expect(enquirySchema.safeParse({ name: "A", email: "not-an-email" }).success).toBe(false);
    expect(contactMessageSchema.safeParse({
      name: "Casey Doe",
      email: "casey@example.com",
      subject: "Partnership",
      message: "I would like to discuss a creator campaign.",
    }).success).toBe(true);
  });
});
