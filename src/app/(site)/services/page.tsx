import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { PageIntro, ServiceIcon } from "@/components/site";
import { CtaBand } from "@/components/cta-band";
import { getPublishedServices } from "@/services/public-content.service";

export const metadata: Metadata = { title: "Services", description: "Influencer marketing, creator discovery, UGC production, and campaign management." };

const steps = ["Brief & goals", "Creator shortlist", "Content & publishing", "Learn & optimize"];
async function PublishedServices() {
  const { items, unavailable } = await getPublishedServices();
  return <>{unavailable && <p className="demo-notice">Showing clearly labeled sample services because the content database is not configured.</p>}<section className="service-detail-list section-pad">{items.map((service, index) => <article className="service-detail" id={`service-${index}`} key={service.title}><div className="service-detail-top"><span className="service-index">{String(index + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}</span><span className="service-detail-icon"><ServiceIcon name={service.icon} /></span></div><div className="service-detail-body"><div><h2>{service.title}</h2><p>{service.detail}</p></div><div className="service-benefits"><span className="eyebrow">A THOUGHTFUL PROCESS</span>{steps.map((step) => <span key={step}><Check size={14} />{step}</span>)}</div></div><Link href="/contact" className="text-link">Talk about this service <ArrowRight size={15} /></Link></article>)}</section></>;
}

export default function ServicesPage() {
  return <><PageIntro eyebrow="WHAT WE CAN DO TOGETHER" title={<>The right people.<br /><em>The right idea.</em></>} description="Thoughtful creator marketing, shaped around your goals and built to fit the way your audience actually lives online." /><Suspense fallback={<section className="service-detail-list section-pad" role="status">Loading services…</section>}><PublishedServices /></Suspense><CtaBand title={<>Have a brief in<br /><em>mind already?</em></>} description="Let’s talk about your audience, your ambition, and the kind of partnership that could bring them together." /></>;
}
