import type { Metadata } from "next";
import "./globals.css";
import { ScrollActivity } from "@/components/scroll-activity";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: { default: "Arclivo — Influencer Marketing", template: "%s | Arclivo" },
  description: "A hands-on influencer marketing agency for thoughtful creator campaigns.",
  openGraph: {
    title: "Arclivo — Influencer Marketing",
    description: "Thoughtful creator campaigns, planned and managed by one hands-on team.",
    siteName: "Arclivo",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en"><body><ScrollActivity />{children}</body></html>
  );
}
