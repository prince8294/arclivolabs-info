import Image from "next/image";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Check,
  Eye,
  Mail,
  MapPin,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { creators, services } from "@/data/site-data";
import { ServiceIcon } from "@/components/site";
import { CtaBand } from "@/components/cta-band";
import { Reveal } from "@/components/reveal";
import { connectToDatabase } from "@/lib/db";
import Creator from "@/models/Creator";

function formatFollowers(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (count >= 1000) return `${Math.round(count / 1000)}K`;
  return String(count);
}

function formatViews(views: number | null | undefined): string {
  if (views === null || views === undefined || views <= 0) return "N/A";
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (views >= 1000) return `${Math.round(views / 1000)}K`;
  return String(views);
}

function HomeCreatorRow({ creator }: { creator: any }) {
  const profileSlug = creator._id ? creator._id.toString() : creator.slug;
  const category = (creator.contentCategories && creator.contentCategories[0]) || creator.category || "Creator";
  const hasImage = Boolean(creator.profileImage && creator.profileImage.trim().length > 0);

  let followersCount = 0;
  if (typeof creator.followers === "number") {
    followersCount = creator.followers;
  } else if (typeof creator.followers === "string") {
    const match = /^([\d.]+)\s*([KM]?)$/i.exec(creator.followers.replace(/,/g, ""));
    if (match) {
      const amount = Number.parseFloat(match[1]);
      const mult = match[2].toUpperCase() === "M" ? 1_000_000 : match[2].toUpperCase() === "K" ? 1000 : 1;
      followersCount = amount * mult;
    }
  }
  const followersFormatted = formatFollowers(followersCount);

  let engagementFormatted = "N/A";
  if (creator.engagementRate) {
    engagementFormatted = `${creator.engagementRate.toFixed(1)}%`;
  } else if (followersCount > 0 && (creator.averageLikes || creator.averageComments)) {
    const likes = creator.averageLikes || 0;
    const comments = creator.averageComments || 0;
    engagementFormatted = `${(((likes + comments) / followersCount) * 100).toFixed(1)}%`;
  }

  const viewsFormatted = creator.averageReelViews ? formatViews(creator.averageReelViews) : "N/A";
  const displayName = creator.fullName || creator.name || "Creator";

  return (
    <article className="creator-row" aria-label={`Creator profile: ${displayName}`}>
      {/* LEFT — identity */}
      <div className="creator-row-left">
        {hasImage && (
          <div className="creator-row-avatar">
            <Image
              src={creator.profileImage}
              alt={`${displayName}, creator profile`}
              fill
              sizes="72px"
              className="creator-row-avatar-img"
            />
          </div>
        )}
        <div className="creator-row-identity">
          <div className="creator-row-name-line">
            <h3 className="creator-row-name">{displayName}</h3>
          </div>
          <div className="creator-row-subline">
            {creator.instagramUsername && (
              <span className="creator-row-handle">
                {creator.instagramUsername.startsWith("@") ? creator.instagramUsername : `@${creator.instagramUsername}`}
              </span>
            )}
            <span className="creator-row-category-badge">{category}</span>
          </div>
          <div className="creator-row-meta-tags">
            {creator.location && (
              <span className="creator-row-tag">
                <MapPin size={11} />
                {creator.location}
              </span>
            )}
          </div>
          {creator.bio && (
            <p className="creator-row-bio">{creator.bio.length > 110 ? `${creator.bio.slice(0, 110)}…` : creator.bio}</p>
          )}
        </div>
      </div>

      {/* CENTER — stats */}
      <div className="creator-row-stats">
        <div className="creator-row-stat">
          <div className="creator-row-stat-head">
            <Users size={12} />
            <span className="creator-row-stat-label">Followers</span>
          </div>
          <span className="creator-row-stat-value">{followersFormatted}</span>
        </div>
        <div className="creator-row-stat">
          <div className="creator-row-stat-head">
            <TrendingUp size={12} />
            <span className="creator-row-stat-label">Engagement</span>
          </div>
          <span className="creator-row-stat-value">{engagementFormatted}</span>
        </div>
        <div className="creator-row-stat">
          <div className="creator-row-stat-head">
            <Eye size={12} />
            <span className="creator-row-stat-label">Avg Views</span>
          </div>
          <span className="creator-row-stat-value">{viewsFormatted}</span>
        </div>
      </div>

      {/* RIGHT — actions */}
      <div className="creator-row-actions-col">
        <Link className="creator-row-btn creator-row-btn-primary" href={`/creators/${profileSlug}`}>
          View Profile <ArrowUpRight size={13} />
        </Link>
        <Link className="creator-row-btn creator-row-btn-secondary" href="/contact">
          <Mail size={13} />
          Contact Creator
        </Link>
        <span className="creator-row-platform-badge">{creator.primaryPlatform || "INSTAGRAM"}</span>
      </div>
    </article>
  );
}

const process = [
  ["01", "Find the signal", "We get to know your audience, ambition, and the moment your brand wants to make."],
  ["02", "Shape the story", "A thoughtful brief gives the right creators room to make it their own."],
  ["03", "Make it happen", "One close-knit team keeps the creative, people, and moving pieces in sync."],
  ["04", "Learn what lasts", "Clear reporting turns what happened into a smarter next move."],
];

const capabilities = [
  "CREATOR STRATEGY",
  "CULTURE FIRST",
  "CREATIVE PRODUCTION",
  "MEANINGFUL MEASUREMENT",
];

export default async function Home() {
  let liveCreators: any[] = [];
  try {
    await connectToDatabase();
    liveCreators = await Creator.find({ approvalStatus: "approved" })
      .select("fullName primaryPlatform contentCategories followers location profileImage bio instagramUsername averageReelViews engagementRate averageLikes averageComments")
      .sort({ featured: -1, createdAt: -1 })
      .limit(3)
      .lean();
  } catch (error) {
    console.error("Failed to load featured creators on home page:", error);
  }

  const creatorsToShow = liveCreators.length > 0 ? liveCreators : creators.slice(0, 3);
  return (
    <main className="home-page">
      <section className="home-hero">
        <div className="home-hero-glow" aria-hidden="true" />
        <div className="home-hero-copy">
          <span className="home-kicker"><span /> THE CREATOR-FIRST MARKETING STUDIO</span>
          <h1>
            Culture moves<br />
            through <em>people.</em>
          </h1>
          <p>
            We bring ambitious brands and distinctive creators together to make
            work people actually want to spend time with.
          </p>
          <div className="home-hero-actions">
            <Link className="home-button home-button-light" href="/contact">
              Let&apos;s make something <ArrowUpRight size={17} />
            </Link>
            <Link className="home-button home-button-creator" href="/join-as-creator">
              Join as a creator <ArrowUpRight size={16} />
            </Link>
            <Link className="home-text-link home-text-link-light" href="/services">
              Meet your new creative partner <ArrowRight size={16} />
            </Link>
          </div>
          <div className="home-hero-proof">
            <span className="home-proof-avatars" aria-hidden="true">
              <i>A</i><i>N</i><i>M</i><b>+</b>
            </span>
            <span>Good ideas start with good people.</span>
          </div>
        </div>

        <div className="home-hero-art" aria-label="Original Arclivo creator campaign editorial portrait">
          <div className="home-art-halo" aria-hidden="true" />
          <div className="home-art-frame">
            <Image
              src="/images/studio-editorial.jpg"
              alt="Editorial portrait of a creator in a warm, colourful studio"
              fill
              priority
              sizes="(max-width: 760px) 90vw, 46vw"
            />
            <span className="home-art-index">ARCLIVO STUDIO / 001</span>
          </div>
          <div className="home-art-note">
            <span className="home-art-note-icon"><Sparkles size={16} /></span>
            <span><b>Made with people in mind</b><small>Strategy, creativity, connection</small></span>
            <ArrowUpRight size={16} />
          </div>
          <span className="home-art-caption">STUDIO EDITORIAL · ARCLIVO</span>
        </div>

        <Link className="home-scroll-cue" href="#studio">
          <span>SCROLL TO EXPLORE</span><ArrowDownRight size={15} />
        </Link>
        <span className="home-hero-index" aria-hidden="true">01 / 04</span>
      </section>

      <div className="home-marquee" aria-label="Good people, great ideas, culture in motion">
        <div className="home-marquee-track" aria-hidden="true">
          {[0, 1].map((loop) => (
            <span className="home-marquee-group" key={loop}>
              {["GOOD PEOPLE", "GREAT IDEAS", "CULTURE IN MOTION", "WORK WITH MEANING"].map((item) => (
                <span key={item}><i />{item}</span>
              ))}
            </span>
          ))}
        </div>
      </div>

      <section className="home-intro home-section" id="studio">
        <Reveal className="home-intro-copy">
          <span className="home-section-kicker">A DIFFERENT KIND OF PARTNER</span>
          <h2>Not just seen.<br /><em>Actually felt.</em></h2>
        </Reveal>
        <Reveal className="home-intro-aside" delay={0.12}>
          <p>
            The best creator marketing doesn&apos;t interrupt the conversation.
            It gives people something worth talking about. We build thoughtful
            partnerships where brand ambition and creator instinct meet.
          </p>
          <Link className="home-text-link" href="/about">
            Get to know us <ArrowUpRight size={16} />
          </Link>
        </Reveal>
        <div className="home-capability-line">
          {capabilities.map((capability, index) => (
            <span key={capability}><i>0{index + 1}</i>{capability}</span>
          ))}
        </div>
      </section>

      <section className="home-services home-section">
        <Reveal className="home-section-heading">
          <div>
            <span className="home-section-kicker">WHAT WE BRING TO THE TABLE</span>
            <h2>One idea.<br /><em>All the right people.</em></h2>
          </div>
          <div>
            <p>From the first spark to the final story, every detail has a person behind it.</p>
            <Link className="home-text-link" href="/services">See everything we do <ArrowUpRight size={16} /></Link>
          </div>
        </Reveal>
        <div className="home-service-grid">
          {services.slice(0, 6).map((service, index) => (
            <Reveal className="home-service-reveal" delay={index * 0.06} key={service.title}>
              <Link className="home-service-card" href="/services">
                <span className="home-service-number">0{index + 1}</span>
                <span className="home-service-icon"><ServiceIcon name={service.icon} /></span>
                <span className="home-service-title">{service.title}</span>
                <span className="home-service-description">{service.description}</span>
                <span className="home-service-arrow"><ArrowUpRight size={17} /></span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="home-feature">
        <div className="home-feature-image">
          <Image
            src="/images/concept-living.jpg"
            alt="Photograph of a thoughtful home collection campaign concept"
            fill
            sizes="(max-width: 760px) 100vw, 55vw"
          />
          <span className="home-image-badge"><Sparkles size={14} /> A CAMPAIGN, IMAGINED</span>
          <span className="home-feature-image-caption">CONCEPT VISUAL / 001</span>
        </div>
        <Reveal className="home-feature-copy">
          <span className="home-section-kicker">GOOD STORIES HAVE A POINT OF VIEW</span>
          <h2>Make room<br />for <em>real life.</em></h2>
          <p>
            Start with something people care about. Find the creators who already
            live it. Give them a brief worth making their own.
          </p>
          <ul>
            <li><Check size={15} /> Built around your real audience</li>
            <li><Check size={15} /> Creative that feels native, never forced</li>
            <li><Check size={15} /> Managed by one thoughtful team</li>
          </ul>
          <Link className="home-button home-button-dark" href="/contact">
            Start a campaign <ArrowUpRight size={16} />
          </Link>
        </Reveal>
      </section>

      <section className="home-process home-section">
        <Reveal className="home-section-heading">
          <div>
            <span className="home-section-kicker">THE WORK, WITHOUT THE RUNAROUND</span>
            <h2>Clear steps.<br /><em>Better work.</em></h2>
          </div>
          <p>Thoughtful at every stage. Human all the way through.</p>
        </Reveal>
        <div className="home-process-grid">
          {process.map(([number, title, description], index) => (
            <Reveal className="home-process-reveal" delay={index * 0.08} key={number}>
              <article className="home-process-card">
                <span className="home-process-number">{number}</span>
                <span className="home-process-marker" aria-hidden="true"><i /></span>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="home-creators home-section">
        <Reveal className="home-section-heading">
          <div>
            <span className="home-section-kicker">A FEW OF THE VOICES</span>
            <h2>Distinct people.<br /><em>Natural matches.</em></h2>
          </div>
          <div>
            <p>Creator partnerships begin with a point of view, not a follower-count filter.</p>
            <Link className="home-text-link" href="/creators">Explore our creator directory <ArrowUpRight size={16} /></Link>
          </div>
        </Reveal>
        <div className="creator-rows-list home-creator-rows">
          {creatorsToShow.map((creator) => (
            <HomeCreatorRow creator={creator} key={creator._id ? creator._id.toString() : creator.slug} />
          ))}
        </div>
        <div className="home-creators-bottom-cta">
          <Link className="button button-dark" href="/creators">
            Explore All Creators <ArrowUpRight size={16} />
          </Link>
        </div>
      </section>

      <CtaBand
        title={<>Your next big idea<br /><em>starts with a hello.</em></>}
        description="Tell us what you want to make matter. We’ll bring the right people into the conversation."
      />
    </main>
  );
}
