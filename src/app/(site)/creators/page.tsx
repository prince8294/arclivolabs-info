import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/site";
import { CreatorDirectory } from "./creator-directory";
import { CtaBand } from "@/components/cta-band";

export const metadata: Metadata = { title: "Creators", description: "Explore a demo creator directory with searchable profiles and filters." };

export default function CreatorsPage() {
  return <><PageIntro eyebrow="THE CREATOR COMMUNITY" title={<>A chorus of<br /><em>distinct voices.</em></>} description="Explore a sample directory built to make creator discovery feel human. Every profile and audience figure here is demo content." /><section className="section-pad directory-section"><CreatorDirectory /></section><section className="join-note section-pad"><div><span className="eyebrow">CREATORS, WE’D LOVE TO MEET YOU</span><h2>Your point of view<br />belongs <em>here.</em></h2></div><Link className="button button-dark" href="/join-as-creator">Join the network <span>↗</span></Link></section><CtaBand title={<>Looking for your<br /><em>next collaborator?</em></>} description="Tell us what you’re looking for and we’ll start a thoughtful search." /></>;
}
