import { Suspense } from "react";
import type { Metadata } from "next";
import { PageIntro } from "@/components/site";
import { InsightsList } from "./insights-list";
import { getPublishedArticles } from "@/services/public-content.service";

export const metadata: Metadata = { title: "Insights", description: "Placeholder articles on creator strategy and influencer marketing." };

async function PublishedInsights() {
  const { items, unavailable } = await getPublishedArticles();
  return <>{unavailable && <p className="demo-notice">Showing clearly labeled sample insights because the content database is not configured.</p>}<section className="section-pad insights-section"><InsightsList articles={items} /></section></>;
}

export default function InsightsPage() {
  return <><PageIntro eyebrow="THINKING OUT LOUD" title={<>Notes from the<br /><em>creator economy.</em></>} description="Ideas, questions, and perspectives on how creator partnerships are changing." /><Suspense fallback={<section className="section-pad insights-section" role="status">Loading insights…</section>}><PublishedInsights /></Suspense></>;
}
