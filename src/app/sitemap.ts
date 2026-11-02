import type { MetadataRoute } from "next";
import { articles, caseStudies, creators } from "@/data/site-data";

const routes = [
  "", "/about", "/services", "/creators", "/case-studies", "/contact", "/join-as-creator", "/insights", "/privacy-policy", "/terms", "/login", "/register", "/forgot-password", "/reset-password", "/verify-email",
  ...creators.map(({ slug }) => `/creators/${slug}`),
  ...caseStudies.map(({ slug }) => `/case-studies/${slug}`),
  ...articles.map(({ slug }) => `/insights/${slug}`),
];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route) => ({
    url: new URL(route, process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").toString(),
    lastModified: new Date(),
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.7,
  }));
}
