import type { Metadata } from "next";
import { ArrowUpRight, HeartHandshake, Lightbulb, MessagesSquare } from "lucide-react";
import Link from "next/link";
import { CreatorForm } from "@/components/forms";
import { PageIntro } from "@/components/site";

export const metadata: Metadata = { title: "Join as a Creator", description: "Register your interest in joining our creator partnership network." };

export default function JoinCreatorPage() {
  return <><PageIntro eyebrow="FOR CREATORS, BY DESIGN" title={<>Your voice is<br /><em>your superpower.</em></>} description="We’re building a network of thoughtful creators who care about the work and the communities behind it." /><section className="join-layout section-pad"><div className="join-benefits"><span className="eyebrow">A BETTER KIND OF PARTNERSHIP</span><h2>Bring your whole<br /><em>point of view.</em></h2><p>We want to make brand partnerships feel more collaborative, more considered, and more respectful of the creative work you do.</p><div className="benefit-item"><HeartHandshake size={20} /><span><b>Partnership, not placement</b><small>Work with brands whose goals and values align with your voice.</small></span></div><div className="benefit-item"><Lightbulb size={20} /><span><b>Creative room to make</b><small>Bring your expertise and community perspective to the brief.</small></span></div><div className="benefit-item"><MessagesSquare size={20} /><span><b>Clear communication</b><small>Thoughtful processes and transparent expectations at every step.</small></span></div><Link className="text-link" href="/creators">Explore demo profiles <ArrowUpRight size={15} /></Link></div><CreatorForm /></section></>;
}
