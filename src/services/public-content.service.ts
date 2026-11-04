import { connection } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Service from "@/models/Service";
import { services as demoServices, type Service as PublicService } from "@/data/site-data";

const serviceIcons = new Set(["sparkles", "search", "camera", "share", "handshake", "chart"]);

export async function getPublishedServices(): Promise<{ items: PublicService[]; source: "database" | "demo"; unavailable: boolean }> {
  await connection();
  try {
    await connectToDatabase();
    const records = await Service.find({ isActive: true }).select("title description content icon isDemo").sort({ isFeatured: -1, title: 1 }).limit(50).lean();
    return {
      items: records.map((service) => ({
        title: service.title,
        description: service.description,
        detail: service.content,
        icon: serviceIcons.has(service.icon ?? "") ? service.icon as PublicService["icon"] : "sparkles",
      })),
      source: "database",
      unavailable: false,
    };
  } catch (error) {
    console.error("Published services could not be loaded from MongoDB.", error);
    return { items: demoServices, source: "demo", unavailable: true };
  }
}
