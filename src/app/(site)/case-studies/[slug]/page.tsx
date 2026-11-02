import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { CtaBand } from "@/components/cta-band";
import { caseStudies } from "@/data/site-data";

export function generateStaticParams() {
  return caseStudies.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const study = caseStudies.find((item) => item.slug === slug);
  return study ? { title: `${study.brand} · Demo Case Study`, description: study.objective } : {};
}

export default async function CaseStudyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const study = caseStudies.find((item) => item.slug === slug);
  if (!study) notFound();
  return <><article className="case-detail"><Link className="text-link" href="/case-studies"><ArrowLeft size={15} /> Back to case studies</Link><span className="eyebrow">{study.industry} · FICTIONAL CAMPAIGN CONCEPT</span><h1>{study.brand}</h1><p className="article-lede">{study.objective}</p><div className="case-detail-image"><Image src={study.image} alt={`${study.industry} campaign concept, demo image`} fill sizes="(max-width: 900px) 92vw, 1100px" unoptimized /></div><div className="case-detail-grid"><section><span className="eyebrow">THE IDEA</span><h2>A starting point for a story.</h2><p>This fictional concept illustrates how a brand could work with creators to introduce a product through relevant, creator-led storytelling. The brand and campaign shown here are placeholders, not actual client work.</p></section><section><span className="eyebrow">THE OUTCOME</span><h2>Results are not available.</h2><p>{study.result} No performance data is invented or implied. This detail layout is ready to be populated with approved case study information in a later phase.</p></section></div></article><CtaBand title={<>Let’s build your<br /><em>next campaign.</em></>} description="Start with the objective. We’ll help shape an idea and the creator partnerships behind it." /></>;
}
