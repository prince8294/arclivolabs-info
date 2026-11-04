import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { creators, services } from "@/data/site-data";
import { connectToDatabase } from "@/lib/db";
import Creator from "@/models/Creator";
import Service from "@/models/Service";
import User from "@/models/User";

async function seed(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  const authSecret = process.env.AUTH_SECRET;
  const adminEmail = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (process.env.NODE_ENV === "production") {
    throw new Error("The development seed script cannot run in production.");
  }
  if (!uri) throw new Error("Set MONGODB_URI before running the seed script.");
  if (!authSecret || authSecret.length < 32) throw new Error("Set AUTH_SECRET to a random value of at least 32 characters.");
  if (!adminEmail || !adminPassword || adminPassword.length < 20) {
    throw new Error("Set SEED_ADMIN_EMAIL and a unique SEED_ADMIN_PASSWORD of at least 20 characters.");
  }
  if (!/[A-Z]/.test(adminPassword) || !/[a-z]/.test(adminPassword) || !/[0-9]/.test(adminPassword) || !/[^A-Za-z0-9]/.test(adminPassword)) {
    throw new Error("SEED_ADMIN_PASSWORD must contain upper- and lowercase letters, a number, and a symbol.");
  }

  await connectToDatabase();
  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    admin = await User.create({
      name: "Development Administrator",
      email: adminEmail,
      passwordHash: await bcrypt.hash(adminPassword, 12),
      role: "super_admin",
      status: "active",
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
    });
  } else if (admin.role !== "super_admin" || admin.status !== "active") {
    throw new Error("SEED_ADMIN_EMAIL already exists and is not an active super administrator. No account was changed.");
  }

  for (const [index, creator] of creators.entries()) {
    await Creator.updateOne(
      { email: `demo-creator-${index + 1}@example.invalid` },
      {
        $set: {
          fullName: creator.name,
          email: `demo-creator-${index + 1}@example.invalid`,
          phone: "+10000000000",
          primaryPlatform: creator.platform,
          contentCategories: [creator.category],
          followers: parseFollowers(creator.followers),
          location: creator.location,
          profileImage: creator.image,
          approvalStatus: "approved",
          verificationStatus: "unverified",
          featured: true,
          isDemo: true,
        },
      },
      { upsert: true, runValidators: true },
    );
  }

  for (const service of services) {
    await Service.updateOne(
      { slug: toSlug(service.title) },
      { $set: {
        title: service.title,
        slug: toSlug(service.title),
        description: service.description,
        content: service.detail,
        icon: service.icon,
        isActive: true,
        isDemo: true,
      } },
      { upsert: true, runValidators: true },
    );
  }

  console.info("Demo services, creator profiles, and the configured development administrator are ready.");
}

function parseFollowers(value: string): number {
  const count = Number.parseFloat(value);
  if (value.endsWith("M")) return Math.round(count * 1_000_000);
  if (value.endsWith("K")) return Math.round(count * 1000);
  return count;
}

function toSlug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

seed()
  .catch((error: unknown) => {
    console.error("Seed script failed.", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await mongoose.disconnect();
    } catch (error) {
      console.error("Seed database connection could not be closed.", error);
      process.exitCode = 1;
    }
  });
