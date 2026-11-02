import { connection } from "next/server";
import { connectToDatabase } from "@/lib/db";
import BlogPost from "@/models/BlogPost";
import Service from "@/models/Service";
import { articles as demoArticles, services as demoServices, type Service as PublicService } from "@/data/site-data";

export type PublicArticle = {
  slug: string;
  category: string;
  title: string;
  date: string;
  readTime: string;
  image: string;
  excerpt: string;
  content: string;
  isDemo: boolean;
};

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

function mapArticle(record: {
  slug: string; category: string; title: string; publishedAt?: Date | null; featuredImage?: string | null;
  excerpt: string; content: string; isDemo?: boolean;
}): PublicArticle {
  return {
    slug: record.slug,
    category: record.category,
    title: record.title,
    date: record.publishedAt ? new Date(record.publishedAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "Draft",
    readTime: `${Math.max(1, Math.ceil(record.content.split(/\s+/).length / 220))} min read`,
    image: record.featuredImage || "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=85",
    excerpt: record.excerpt,
    content: record.content,
    isDemo: Boolean(record.isDemo),
  };
}

export async function getPublishedArticles(): Promise<{ items: PublicArticle[]; source: "database" | "demo"; unavailable: boolean }> {
  await connection();
  try {
    await connectToDatabase();
    const records = await BlogPost.find({ isPublished: true, publishedAt: { $lte: new Date() } })
      .select("slug category title publishedAt featuredImage excerpt content isDemo")
      .sort({ publishedAt: -1 }).limit(100).lean();
    return { items: records.map(mapArticle), source: "database", unavailable: false };
  } catch (error) {
    console.error("Published insights could not be loaded from MongoDB.", error);
    const content = "This is placeholder content created to demonstrate the structure of an editorial page. In a future phase, it can be replaced with original, reviewed content and connected to a content-management workflow.";
    return {
      items: demoArticles.map((article) => ({ ...article, content, isDemo: true })),
      source: "demo",
      unavailable: true,
    };
  }
}

export async function getPublishedArticle(slug: string): Promise<PublicArticle | null> {
  await connection();
  try {
    await connectToDatabase();
    const record = await BlogPost.findOne({ slug, isPublished: true, publishedAt: { $lte: new Date() } })
      .select("slug category title publishedAt featuredImage excerpt content isDemo").lean();
    return record ? mapArticle(record) : null;
  } catch (error) {
    console.error("Published insight could not be loaded from MongoDB.", error);
    const demo = demoArticles.find((article) => article.slug === slug);
    return demo ? mapArticle({ ...demo, content: "Demo article text. This is placeholder editorial content.", isDemo: true }) : null;
  }
}

export async function getPublishedArticleMetadata(slug: string): Promise<Pick<PublicArticle, "title" | "excerpt"> | null> {
  try {
    await connectToDatabase();
    const record = await BlogPost.findOne({ slug, isPublished: true, publishedAt: { $lte: new Date() } })
      .select("title excerpt").lean();
    if (record) return { title: record.title, excerpt: record.excerpt };
  } catch (error) {
    console.error("Published insight metadata could not be loaded from MongoDB.", error);
  }
  const demo = demoArticles.find((article) => article.slug === slug);
  return demo ? { title: demo.title, excerpt: demo.excerpt } : null;
}
