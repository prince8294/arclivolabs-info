import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Camera, ChartNoAxesCombined, Handshake, Search, Share2, Sparkles } from "lucide-react";
import type { CaseStudy, Creator, ServiceIconName } from "@/data/site-data";
import { Reveal } from "@/components/reveal";

const icons = { sparkles: Sparkles, search: Search, camera: Camera, share: Share2, handshake: Handshake, chart: ChartNoAxesCombined };

export function SectionHeading({ kicker, title, description, linkHref, linkText, dark = false }: { kicker: string; title: React.ReactNode; description?: string; linkHref?: string; linkText?: string; dark?: boolean }) {
  return <Reveal className={`section-heading${dark ? " section-heading-dark" : ""}`}><div><span className="eyebrow">{kicker}</span><h2>{title}</h2></div>{description && <p>{description}</p>}{linkHref && linkText && <Link className="text-link section-heading-link" href={linkHref}>{linkText}<ArrowUpRight size={15} /></Link>}</Reveal>;
}

export function CreatorCard({ creator }: { creator: Creator }) {
  return <Reveal className="reveal-card"><article className="creator-card"><Link className="creator-profile-link" href={`/creators/${creator.slug}`} aria-label={`View creator profile: ${creator.name}`}><div className="creator-image"><Image src={creator.image} alt={`${creator.name}${creator.isDemo ? ", illustrative demo profile" : ", creator profile"}`} fill sizes="(max-width: 700px) 90vw, (max-width: 1100px) 45vw, 30vw" /><span>{creator.isDemo ? "SAMPLE PROFILE" : "CREATOR PROFILE"}</span></div><div className="creator-card-info"><div><h3>{creator.name}</h3><p>{creator.category} · {creator.location}</p></div><span className="creator-arrow"><ArrowUpRight size={17} /></span></div></Link><div className="creator-meta"><span>{creator.platform}</span><span>{creator.followers}{creator.isDemo ? " · sample figure" : ""}</span></div><Link className="text-link creator-view-link" href={`/creators/${creator.slug}`}>View Profile <ArrowUpRight size={14} /></Link></article></Reveal>;
}

export function CaseCard({ study }: { study: CaseStudy }) {
  return <Reveal className="reveal-card"><article className="case-card"><Link className="case-image-link" href={`/case-studies/${study.slug}`}><div className={`case-image ${study.tone}`}><Image src={study.image} alt={`${study.industry} campaign concept photograph`} fill sizes="(max-width: 700px) 90vw, 45vw" /><span>CAMPAIGN CONCEPT</span></div></Link><div className="case-content"><span className="case-industry">{study.industry} · {study.brand}</span><h3>{study.objective}</h3><p>{study.result}</p><Link className="text-link" href={`/case-studies/${study.slug}`}>View concept <ArrowRight size={15} /></Link></div></article></Reveal>;
}

export function ServiceIcon({ name }: { name: ServiceIconName }) {
  const Icon = icons[name];
  return <Icon size={20} strokeWidth={1.6} aria-hidden="true" />;
}

export function ServiceLink({ title, icon }: { title: string; icon: keyof typeof icons }) {
  return <Link className="service-list-link" href="/services"><span><ServiceIcon name={icon} />{title}</span><ArrowUpRight size={16} /></Link>;
}

export function PageIntro({ eyebrow, title, description }: { eyebrow: string; title: React.ReactNode; description: string }) {
  return <section className="page-intro"><span className="eyebrow"><span className="eyebrow-dot" />{eyebrow}</span><h1>{title}</h1><p>{description}</p></section>;
}

export function DemoNotice({ children = "Sample content for design demonstration only. No real client relationships or verified performance results are represented." }: { children?: string }) {
  return <p className="demo-notice">{children}</p>;
}
