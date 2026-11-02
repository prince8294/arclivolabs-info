import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { ContactForm } from "@/components/forms";
import { PageIntro } from "@/components/site";

export const metadata: Metadata = { title: "Contact", description: "Talk to our team about a creator marketing campaign." };

export default function ContactPage() {
  return <><PageIntro eyebrow="LET’S TALK" title={<>Every good thing<br />starts with <em>hello.</em></>} description="Tell us what you’re working on, what you’re curious about, or what you’d like to make happen." /><section className="contact-layout section-pad"><aside className="contact-aside"><span className="eyebrow">GET IN TOUCH</span><h2>We’re all<br /><em>ears.</em></h2><p>Share a little about your brand, campaign goals, or creator community. Our team will follow up with a practical next step.</p><div className="contact-detail"><ArrowUpRight size={17} /><span><b>A simple start</b><span>Send an enquiry using the form. It goes straight to the agency workspace.</span></span></div></aside><ContactForm /></section></>;
}
