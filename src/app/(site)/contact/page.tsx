import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Sparkles } from "lucide-react";
import { ContactForm } from "@/components/forms";

export const metadata: Metadata = { title: "Contact", description: "Talk to our team about a creator marketing campaign." };

export default function ContactPage() {
  return <main className="contact-page">
    <section className="contact-hero">
      <div className="contact-hero-copy">
        <span className="eyebrow"><span className="eyebrow-dot" />A GOOD IDEA STARTS SOMEWHERE</span>
        <h1>Tell us what<br />you&apos;re <em>thinking.</em></h1>
        <p>Have a campaign in mind, a question, or just a hunch? Start here. We&apos;ll help you find the next step.</p>
        <a className="contact-hero-scroll" href="#contact-form">START A CONVERSATION <ArrowDownRight size={15} /></a>
      </div>
      <div className="contact-hero-note" aria-hidden="true">
        <span className="contact-hero-note-icon"><Sparkles size={18} /></span>
        <span className="contact-hero-note-label">NO DECK REQUIRED</span>
        <span className="contact-hero-note-copy">Just bring the<br />beginning of an idea.</span>
        <span className="contact-hero-note-mark">ARCLIVO <i /> STUDIO</span>
      </div>
      <span className="contact-hero-orbit" aria-hidden="true" />
    </section>

    <section className="contact-content" id="contact-form">
      <aside className="contact-aside">
        <span className="eyebrow">FIRST, THE BASICS</span>
        <h2>Let&apos;s make<br /><em>it useful.</em></h2>
        <p>A little context helps us bring the right people and ideas to the table. Tell us what you can; we can work out the rest together.</p>
        <div className="contact-aside-rule" />
        <div className="contact-detail">
          <span className="contact-detail-index">01</span>
          <span><b>What happens next</b><span>Your enquiry goes to our agency team so we can review the brief and plan a practical next step.</span></span>
          <ArrowUpRight size={16} aria-hidden="true" />
        </div>
        <Link className="contact-creator-link" href="/join-as-creator">A creator looking to join us? <span>Apply here <ArrowUpRight size={14} /></span></Link>
      </aside>
      <ContactForm />
    </section>
  </main>;
}
