import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowUpRight, Sparkles } from "lucide-react";
import { CreatorDirectory } from "./creator-directory";
import { CtaBand } from "@/components/cta-band";

export const metadata: Metadata = { title: "Creators", description: "Explore a demo creator directory with searchable profiles and filters." };

export default function CreatorsPage() {
  return <main className="creators-page">
    <section className="creators-hero">
      <div className="creators-hero-copy">
        <span className="eyebrow"><span className="eyebrow-dot" />THE CREATOR COMMUNITY</span>
        <h1>Different voices.<br /><em>One good fit.</em></h1>
        <p>Discover people with a point of view. We look beyond the numbers to find the creators whose stories make sense for your brand.</p>
        <div className="creators-hero-actions">
          <a className="button creators-hero-button" href="#creator-directory">Find your people <ArrowDown size={16} /></a>
          <Link className="creators-join-link" href="/join-as-creator">Are you a creator? <span>Join our network <ArrowUpRight size={14} /></span></Link>
        </div>
        <div className="creators-hero-foot"><Sparkles size={15} /><span>Curiosity first. Community always.</span></div>
      </div>
      <div className="creators-hero-visual" aria-label="Illustrative creator portraits">
        <div className="creators-hero-image creators-hero-image-main">
          <Image src="/images/creator-amara.jpg" alt="Illustrative creator portrait" fill priority sizes="(max-width: 760px) 72vw, 35vw" />
          <span className="creators-image-label">STYLE · CULTURE</span>
        </div>
        <div className="creators-hero-image creators-hero-image-small">
          <Image src="/images/creator-mina.jpg" alt="Illustrative creator portrait" fill sizes="160px" />
        </div>
        <div className="creators-hero-image creators-hero-image-side">
          <Image src="/images/creator-sofia.jpg" alt="Illustrative creator portrait" fill sizes="180px" />
        </div>
        <div className="creators-hero-stamp"><b>GOOD<br />CHEMISTRY</b><span>makes good work</span></div>
        <span className="creators-hero-visual-caption">A FEW OF THE MANY WAYS TO SEE THE WORLD</span>
      </div>
    </section>
    <section className="directory-section creators-directory-section" id="creator-directory">
      <CreatorDirectory />
    </section>
    <section className="creators-join">
      <div className="creators-join-copy">
        <span className="eyebrow">CREATORS, THIS PART IS FOR YOU</span>
        <h2>Your perspective<br />belongs <em>in the room.</em></h2>
        <p>We build partnerships around the people doing the creating. Bring your voice, your ideas, and the community you care about.</p>
      </div>
      <Link className="creators-join-button" href="/join-as-creator">Meet Arclivo <ArrowUpRight size={17} /></Link>
      <span className="creators-join-orbit" aria-hidden="true" />
    </section>
    <CtaBand title={<>Looking for your<br /><em>next collaborator?</em></>} description="Tell us what you’re looking for and we’ll start a thoughtful search." />
  </main>;
}
