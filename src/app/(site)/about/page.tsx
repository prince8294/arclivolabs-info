import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Sparkles } from "lucide-react";
import { SectionHeading } from "@/components/site";
import { CtaBand } from "@/components/cta-band";

export const metadata: Metadata = { title: "About", description: "Learn about our thoughtful, creator-first approach to influencer partnerships." };

const values = [["01", "Stay curious", "We keep listening: to audiences, creators, culture, and the details that change a brief."], ["02", "Make it mutual", "The best partnerships create value for the brand, the creator, and their community."], ["03", "Do the thoughtful thing", "Good work comes from care, clear communication, and respect for every point of view."], ["04", "Measure what matters", "We choose useful signals and share what we learn, without making promises the work cannot keep."]];

export default function AboutPage() {
  return (
    <>
      <section className="about-hero">
        <span className="about-hero-orbit" aria-hidden="true" />
        <div className="about-hero-copy">
          <span className="eyebrow"><span className="eyebrow-dot" />ABOUT ARCLIVO</span>
          <h1>Influence is a<br /><em>human thing.</em></h1>
          <p>We bring brands and creators together with care, creative thinking, and a clear point of view.</p>
          <div className="about-hero-actions">
            <Link className="home-button home-button-dark" href="/contact">
              Start a conversation <ArrowUpRight size={16} />
            </Link>
            <a className="about-hero-link" href="#story">
              Meet the studio <ArrowDownRight size={16} />
            </a>
          </div>
          <div className="about-hero-proof">
            <span className="about-hero-avatars" aria-hidden="true"><i>A</i><i>N</i><i>M</i><b>+</b></span>
            <span>Small team. Senior attention.<br /><b>One shared point of view.</b></span>
          </div>
        </div>
        <div className="about-hero-visual">
          <div className="about-hero-frame">
            <Image
              src="/images/studio-editorial.jpg"
              alt="Creator working in a warm, colourful studio"
              fill
              priority
              sizes="(max-width: 900px) 92vw, 42vw"
            />
            <span className="about-hero-tag">STUDIO NOTES / 001</span>
          </div>
          <div className="about-hero-card">
            <span className="about-hero-card-index">01</span>
            <div>
              <b>People over reach.</b>
              <small>Strategy, creative and delivery under one roof.</small>
            </div>
            <Sparkles size={17} aria-hidden="true" />
          </div>
          <span className="about-hero-caption">CREATOR-LED, ALWAYS</span>
        </div>
      </section>

      <section className="about-story section-pad" id="story">
        <div className="story-image">
          <Image src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1200&q=85" alt="Creative team collaborating around a table" fill sizes="(max-width: 760px) 90vw, 48vw" />
        </div>
        <div className="story-copy">
          <span className="eyebrow">OUR POINT OF VIEW</span>
          <h2>More than reach.<br /><em>Real resonance.</em></h2>
          <p>Arclivo is a hands-on influencer marketing agency. We help brands turn a clear idea into thoughtful creator partnerships and useful, well-managed campaigns.</p>
          <p>From creator discovery and brief development to approvals and campaign reporting, we keep the work practical, collaborative, and respectful of the people making it.</p>
        </div>
      </section>

      <section className="mission-section section-pad">
        <div>
          <span className="eyebrow">OUR MISSION</span>
          <h2>Make room for<br />better <em>connections.</em></h2>
          <p>Help brands and creators make culturally aware work that feels useful, honest, and human.</p>
        </div>
        <div>
          <span className="eyebrow">OUR APPROACH</span>
          <h2>A creator economy<br />built on <em>respect.</em></h2>
          <p>Partnerships where creative independence and meaningful brand goals can thrive together.</p>
        </div>
      </section>

      <section className="section-pad">
        <SectionHeading kicker="WHAT GUIDES US" title={<>Our values are<br /><em>how we work.</em></>} description="The principles we bring to every conversation and every campaign." />
        <div className="values-grid">
          {values.map(([no, title, copy]) => <article className="value-card" key={no}><span>{no}</span><h3>{title}</h3><p>{copy}</p></article>)}
        </div>
      </section>

      <section className="team-section section-pad">
        <div>
          <span className="eyebrow">THE PEOPLE BEHIND THE WORK</span>
          <h2>Small team.<br /><em>Hands-on work.</em></h2>
          <p>We keep our process close and collaborative, with one experienced team to guide every campaign from brief to wrap-up.</p>
          <span className="team-placeholder"><ArrowUpRight size={16} /> STRATEGY · CREATIVE · DELIVERY</span>
        </div>
        <div className="team-tiles">
          <div className="team-tile">PEOPLE FIRST</div>
          <div className="team-tile">IDEAS WITH INTENTION</div>
          <div className="team-tile">BUILT TOGETHER</div>
        </div>
      </section>

      <CtaBand title={<>Let’s make room<br />for <em>good work.</em></>} description="Have a big idea or a question? We’d love to hear what you’re thinking." />
    </>
  );
}
