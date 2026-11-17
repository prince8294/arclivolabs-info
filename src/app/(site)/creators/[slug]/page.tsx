import type { Metadata } from "next";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Types } from "mongoose";
import {
  Activity,
  AtSign,
  ArrowLeft,
  ArrowUpRight,
  BadgeCheck,
  Eye,
  Heart,
  Images,
  Languages,
  MapPin,
  MessageCircle,
  RefreshCw,
  UserPlus,
  UsersRound,
} from "lucide-react";
import { CtaBand } from "@/components/cta-band";
import { creators } from "@/data/site-data";
import { connectToDatabase } from "@/lib/db";
import Creator from "@/models/Creator";

type RouteContext = { params: Promise<{ slug: string }> };
export const instant = false;

type RecentMediaItem = {
  mediaId: string;
  caption?: string;
  likesCount: number;
  commentsCount: number;
  viewsCount?: number;
  mediaType?: string;
  mediaProductType?: string;
  permalink?: string;
  publishedAt?: Date;
};
type Profile = {
  id: string;
  name: string;
  categories: string[];
  platform: string;
  followers: number;
  followingCount: number | null;
  postsCount: number | null;
  averageLikes: number | null;
  averageComments: number | null;
  averageReelViews: number | null;
  engagementRate: number | null;
  location: string;
  country?: string;
  image: string;
  bio?: string;
  languages: string[];
  instagramUsername?: string;
  instagramUrl?: string;
  lastUpdated?: Date;
  availability: "available" | "unavailable";
  isDemo: boolean;
  verified: boolean;
  metricsVerified: boolean;
  recentMedia: RecentMediaItem[];
};

export function generateStaticParams() {
  return creators.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: RouteContext): Promise<Metadata> {
  const { slug } = await params;
  const demo = creators.find((item) => item.slug === slug);
  if (demo) {
    return { title: `${demo.name} · Demo Creator`, description: `Illustrative creator profile: ${demo.category}, ${demo.platform}.` };
  }
  if (Types.ObjectId.isValid(slug)) {
    await connection();
    await connectToDatabase();
    const record = await Creator.findOne({ _id: slug, approvalStatus: "approved" }).select("fullName bio").lean();
    if (record) return { title: `${record.fullName} · Creator`, description: record.bio || `Explore ${record.fullName}'s approved creator profile.` };
  }
  return { title: "Creator Profile", description: "Approved creator profile." };
}

export default async function CreatorProfile({ params }: RouteContext) {
  const { slug } = await params;
  const profile = await getProfile(slug);
  if (!profile) notFound();

  const categoryLabel = profile.categories.join(" · ") || "Creator";
  const profileStatus = profile.isDemo
    ? "Demo profile"
    : profile.verified
      ? "Verified creator"
      : "Approved creator";

  return <>
    <main className="creator-profile-page">
      <section className="profile-hero creator-profile-hero section-pad">
        <div className="creator-profile-media">
          {profile.image ? (
            <div className="profile-photo creator-profile-photo">
              <Image src={profile.image} alt={`${profile.name}${profile.isDemo ? ", illustrative demo profile" : ", creator profile"}`} fill priority sizes="(max-width: 760px) 92vw, 42vw" />
            </div>
          ) : (
            <div className="profile-photo creator-profile-photo creator-profile-placeholder" aria-label={`${profile.name} profile image placeholder`}>
              <span>{initials(profile.name)}</span>
            </div>
          )}
          <div className="creator-profile-media-status">
            <span className={`creator-profile-status ${profile.availability === "available" ? "is-available" : ""}`}>
              {profile.availability === "available" ? "Available for collaborations" : "Currently unavailable"}
            </span>
            <span>{profileStatus}</span>
          </div>
        </div>

        <div className="profile-copy creator-profile-copy">
          <Link className="text-link" href="/creators"><ArrowLeft size={15} /> Back to creators</Link>
          <div className="creator-profile-kicker">
            <span className="eyebrow">{profile.isDemo ? "ILLUSTRATIVE CREATOR PROFILE" : "CREATOR PROFILE"}</span>
            {profile.verified && <span className="creator-verified-mark"><BadgeCheck size={14} /> Verified</span>}
          </div>
          <h1>{profile.name}</h1>
          <p className="profile-category">{categoryLabel} · {profile.location}</p>
          {profile.instagramUsername && <a className="creator-instagram-handle" href={profile.instagramUrl} target="_blank" rel="noreferrer"><AtSign size={15} /> {profile.instagramUsername}<ArrowUpRight size={13} /></a>}
          <p>{profile.bio ?? (profile.isDemo
            ? "This sample profile demonstrates how creator details can be presented. Its content is illustrative only."
            : "This creator is part of the approved ArclivoLabs network.")}</p>

          <div className="creator-profile-metrics" aria-label="Creator analytics">
            <Metric icon={<UsersRound size={17} />} label="Followers" value={formatNumber(profile.followers)} note="Instagram audience" />
            <Metric icon={<UserPlus size={17} />} label="Following" value={profile.followingCount === null ? "N/A" : formatNumber(profile.followingCount)} note="Synced from Meta" />
            <Metric icon={<Images size={17} />} label="Total posts" value={profile.postsCount === null ? "N/A" : formatNumber(profile.postsCount)} note="Instagram media count" />
            <Metric icon={<Activity size={17} />} label="Reel engagement rate" value={profile.metricsVerified && profile.engagementRate !== null ? `${profile.engagementRate.toFixed(2)}%` : "N/A"} note={profile.metricsVerified ? "Verified reel sample" : "Awaiting analytics sync"} />
            <Metric icon={<Eye size={17} />} label="Average reel views" value={profile.metricsVerified && profile.averageReelViews !== null ? formatNumber(profile.averageReelViews) : "N/A"} note={profile.metricsVerified ? "Verified reel sample" : "Awaiting analytics sync"} />
            <Metric icon={<Heart size={17} />} label="Average interactions" value={profile.metricsVerified && profile.averageLikes !== null && profile.averageComments !== null ? formatNumber(profile.averageLikes + profile.averageComments) : "N/A"} note={profile.metricsVerified ? `${formatNumber(profile.averageLikes ?? 0)} likes · ${formatNumber(profile.averageComments ?? 0)} comments` : "Awaiting analytics sync"} />
          </div>

          <div className="creator-profile-details">
            <div><MapPin size={15} /><span><small>Location</small><b>{formatLocation(profile.location, profile.country)}</b></span></div>
            <div><Languages size={15} /><span><small>Languages</small><b>{profile.languages.length ? profile.languages.join(", ") : "Not listed"}</b></span></div>
            <div><RefreshCw size={15} /><span><small>Profile data updated</small><b>{formatSyncDate(profile.lastUpdated)}</b></span></div>
          </div>

          <div className="creator-profile-actions">
            <Link className="button button-dark" href="/contact">Enquire about a partnership <ArrowUpRight size={16} /></Link>
            {profile.instagramUsername && <a className="button creator-profile-outline-button" href={profile.instagramUrl} target="_blank" rel="noreferrer"><AtSign size={15} /> View Instagram</a>}
          </div>
          {!profile.isDemo && <p className="creator-profile-data-note">Approved profile data is loaded directly from the ArclivoLabs creator database. Creators can submit or update their information through the creator portal.</p>}
        </div>
      </section>
      {!profile.isDemo && profile.recentMedia.length > 0 && <section className="creator-recent-media section-pad" aria-labelledby="recent-instagram-heading">
        <div className="creator-recent-media-heading">
          <div><span className="eyebrow">META-SYNCED CONTENT</span><h2 id="recent-instagram-heading">Recent posts &amp; reels</h2></div>
          <p>Latest available Instagram content and interactions. View counts appear when Meta provides them.</p>
        </div>
        <div className="creator-recent-media-grid">
          {profile.recentMedia.map((item) => {
            const content = <>
              <div className="creator-media-card-top"><span>{item.mediaProductType || item.mediaType || "Post"}</span>{item.publishedAt && <time>{formatMediaDate(item.publishedAt)}</time>}</div>
              <p>{item.caption || "Instagram content"}</p>
              <div className="creator-media-card-stats"><span><Heart size={13} /> {formatNumber(item.likesCount)}</span><span><MessageCircle size={13} /> {formatNumber(item.commentsCount)}</span>{typeof item.viewsCount === "number" && <span><Eye size={13} /> {formatNumber(item.viewsCount)}</span>}</div>
            </>;
            return item.permalink
              ? <a className="creator-media-card" href={item.permalink} target="_blank" rel="noreferrer" key={item.mediaId}>{content}<ArrowUpRight className="creator-media-card-arrow" size={15} /></a>
              : <article className="creator-media-card" key={item.mediaId}>{content}</article>;
          })}
        </div>
      </section>}
    </main>
    <CtaBand title={<>Looking for a voice<br /><em>of your own?</em></>} description="Tell us about your audience and campaign goals. We’ll shape a considered creator shortlist together." />
  </>;
}

function Metric({ icon, label, value, note }: { icon: ReactNode; label: string; value: string; note: string }) {
  return <article className="creator-profile-metric"><span>{icon}</span><small>{label}</small><b>{value}</b><p>{note}</p></article>;
}

async function getProfile(slug: string): Promise<Profile | undefined> {
  const demo = creators.find((item) => item.slug === slug);
  if (demo) {
    return {
      id: demo.slug,
      name: demo.name,
      categories: [demo.category],
      platform: demo.platform,
      followers: parseFormattedNumber(demo.followers),
      followingCount: null,
      postsCount: null,
      averageLikes: null,
      averageComments: null,
      averageReelViews: null,
      engagementRate: null,
      location: demo.location,
      image: demo.image,
      languages: [],
      availability: "available",
      isDemo: true,
      verified: false,
      metricsVerified: false,
      recentMedia: [],
    };
  }
  if (!Types.ObjectId.isValid(slug)) return undefined;

  await connection();
  await connectToDatabase();
  const record = await Creator.findOne({ _id: slug, approvalStatus: "approved" })
    .select("fullName bio profileImage instagramUsername instagramUrl primaryPlatform contentCategories followers followingCount postsCount averageLikes averageComments averageReelViews engagementRate instagramMedia metricsVerificationStatus location country languages availability verificationStatus lastProfileSyncAt profileImageLastSyncedAt metricsLastVerifiedAt updatedAt isDemo")
    .lean();
  if (!record) return undefined;
  const username = record.instagramUsername?.replace(/^@/, "");
  return {
    id: record._id.toString(),
    name: record.fullName,
    categories: record.contentCategories,
    platform: record.primaryPlatform,
    followers: record.followers,
    followingCount: typeof record.followingCount === "number" ? record.followingCount : null,
    postsCount: typeof record.postsCount === "number" ? record.postsCount : null,
    averageLikes: typeof record.averageLikes === "number" ? record.averageLikes : null,
    averageComments: typeof record.averageComments === "number" ? record.averageComments : null,
    averageReelViews: typeof record.averageReelViews === "number" ? record.averageReelViews : null,
    engagementRate: typeof record.engagementRate === "number" ? record.engagementRate : null,
    location: record.location,
    country: record.country,
    image: record.profileImage || "",
    bio: record.bio,
    languages: record.languages ?? [],
    instagramUsername: username,
    instagramUrl: record.instagramUrl || (username ? `https://www.instagram.com/${encodeURIComponent(username)}/` : undefined),
    lastUpdated: record.lastProfileSyncAt || record.metricsLastVerifiedAt || record.profileImageLastSyncedAt || record.updatedAt,
    availability: record.availability,
    isDemo: record.isDemo,
    verified: record.verificationStatus === "verified",
    metricsVerified: record.metricsVerificationStatus === "verified",
    recentMedia: (record.instagramMedia ?? []).slice(0, 12).map((item: RecentMediaItem) => ({
      mediaId: item.mediaId,
      caption: item.caption,
      likesCount: item.likesCount ?? 0,
      commentsCount: item.commentsCount ?? 0,
      viewsCount: item.viewsCount,
      mediaType: item.mediaType,
      mediaProductType: item.mediaProductType,
      permalink: item.permalink,
      publishedAt: item.publishedAt,
    })),
  };
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function parseFormattedNumber(value: string): number {
  const match = /^([\d.]+)\s*([KM]?)$/i.exec(value.replace(/,/g, ""));
  if (!match) return 0;
  const multiplier = match[2].toUpperCase() === "M" ? 1_000_000 : match[2].toUpperCase() === "K" ? 1_000 : 1;
  return Number.parseFloat(match[1]) * multiplier;
}

function formatSyncDate(value?: Date): string {
  if (!value) return "Not synced yet";
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }).format(value);
}

function formatMediaDate(value: Date): string {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }).format(value);
}

function formatLocation(location: string, country?: string): string {
  if (!country || location.toLowerCase().includes(country.toLowerCase())) return location;
  return `${location}, ${country}`;
}

function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
}
