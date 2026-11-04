import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDown, ArrowRight, ArrowUpRight, Check, Sparkles } from "lucide-react";
import { ServiceIcon } from "@/components/site";
import { BrandLoader } from "@/components/brand-loader";
import { CtaBand } from "@/components/cta-band";
import { getPublishedServices } from "@/services/public-content.service";

export const metadata: Metadata = { title: "Services", description: "Influencer marketing, creator discovery, UGC production, and campaign management." };

const steps = [
  ["01", "Get clear", "We start with your goals, audience, and what success should actually look like."],
  ["02", "Find the fit", "We bring the right creators and creative direction into the conversation."],
  ["03", "Make it happen", "We keep briefs, timelines, approvals, and publishing moving smoothly."],
  ["04", "Learn together", "We close the loop with useful reporting and clear next steps."],
];

async function PublishedServices() {
  const { items, unavailable } = await getPublishedServices();
  return <>
    {unavailable && <p className="demo-notice services-demo-notice">Showing clearly labeled sample services because the content database is not configured.</p>}
    <section className="services-catalog" id="our-services">
      <div className="services-section-heading">
        <div>
          <span className="eyebrow">HOW WE CAN HELP</span>
          <h2>Built around the<br /><em>work you need.</em></h2>
        </div>
        <p>Bring us a single brief or the whole campaign. We’ll shape the right mix of strategy, people, and production around it.</p>
        <span className="services-count">{String(items.length).padStart(2, "0")} <i>WAYS TO WORK TOGETHER</i></span>
      </div>
      <div className="services-card-grid">
        {items.map((service, index) => <article className="services-card" key={service.title}>
          <div className="services-card-top">
            <span className="services-card-index">0{index + 1}</span>
            <span className="services-card-icon"><ServiceIcon name={service.icon} /></span>
          </div>
          <h3>{service.title}</h3>
          <p className="services-card-summary">{service.description}</p>
          <p className="services-card-detail">{service.detail}</p>
          <Link href="/contact" className="services-card-link">Let’s talk about it <ArrowUpRight size={16} /></Link>
        </article>)}
      </div>
    </section>
  </>;
}

export default function ServicesPage() {
  return <main className="services-page">
    <section className="services-hero">
      <div className="services-hero-copy">
        <span className="eyebrow"><span className="eyebrow-dot" />CREATOR PARTNERSHIPS, MADE THOUGHTFUL</span>
        <h1>Good ideas deserve<br /><em>the right people.</em></h1>
        <p>We bring brands and creators together to make work that feels natural, thoughtful, and worth paying attention to.</p>
        <div className="services-hero-actions">
          <Link className="button services-primary-button" href="/contact">Tell us what you’re planning <ArrowUpRight size={16} /></Link>
          <a className="services-secondary-link" href="#our-services">Explore our services <ArrowDown size={15} /></a>
        </div>
      </div>
      <div className="services-hero-art" aria-hidden="true">
        <div className="services-art-orbit services-art-orbit-one" />
        <div className="services-art-orbit services-art-orbit-two" />
        <div className="services-art-core"><Sparkles size={27} strokeWidth={1.4} /></div>
        <div className="services-art-note services-art-note-top"><span>01</span> PEOPLE FIRST</div>
        <div className="services-art-note services-art-note-side"><span>02</span> IDEAS WITH INTENTION</div>
        <div className="services-art-caption">STRATEGY <i /> CREATIVITY <i /> PARTNERSHIP</div>
      </div>
    </section>

    <Suspense fallback={<BrandLoader variant="section" label="Loading services" />}>
      <PublishedServices />
    </Suspense>

    <section className="services-process">
      <div className="services-process-heading">
        <span className="eyebrow">A GOOD PROCESS MAKES GOOD WORK</span>
        <h2>Clear at every<br /><em>step of the way.</em></h2>
        <p>No mystery hand-offs. No unnecessary layers. Just a considered process and a team that stays close to the work.</p>
      </div>
      <div className="services-process-list">
        {steps.map(([number, title, description]) => <article className="services-process-step" key={number}>
          <span className="services-process-number">{number}</span>
          <div><h3>{title}</h3><p>{description}</p></div>
          <Check size={17} aria-hidden="true" />
        </article>)}
      </div>
      <Link className="services-process-link" href="/contact">Start with a conversation <ArrowRight size={16} /></Link>
    </section>

    <CtaBand title={<>Have a brief in<br /><em>mind already?</em></>} description="Let’s talk about your audience, your ambition, and the kind of partnership that could bring them together." />
  </main>;
}
