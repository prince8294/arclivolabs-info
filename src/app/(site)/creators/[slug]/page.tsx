import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Types } from "mongoose";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { CtaBand } from "@/components/cta-band";
import { creators } from "@/data/site-data";
import { connectToDatabase } from "@/lib/db";
import Creator from "@/models/Creator";

type RouteContext = { params: Promise<{ slug: string }> };
type Profile = {
  name: string;
  category: string;
  platform: string;
  followers: string;
  location: string;
  image: string;
  bio?: string;
  isDemo: boolean;
  verified: boolean;
};

export function generateStaticParams() {
  return creators.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: RouteContext): Promise<Metadata> {
  const { slug } = await params;
  const demo = creators.find((item) => item.slug === slug);
  return demo
    ? { title: `${demo.name} · Demo Creator`, description: `Illustrative creator profile: ${demo.category}, ${demo.platform}.` }
    : { title: "Creator Profile", description: "Approved creator profile." };
}

export default async function CreatorProfile({ params }: RouteContext) {
  const { slug } = await params;
  const demo = creators.find((item) => item.slug === slug);
  let profile: Profile | undefined = demo ? {
    name: demo.name,
    category: demo.category,
    platform: demo.platform,
    followers: demo.followers,
    location: demo.location,
    image: demo.image,
    isDemo: true,
    verified: false,
  } : undefined;

  if (!profile && Types.ObjectId.isValid(slug)) {
    await connectToDatabase();
    const record = await Creator.findOne({ _id: slug, approvalStatus: "approved" })
      .select("fullName bio profileImage primaryPlatform contentCategories followers location verificationStatus isDemo")
      .lean();
    if (record) {
      profile = {
        name: record.fullName,
        category: record.contentCategories[0] ?? "Creator",
        platform: record.primaryPlatform,
        followers: formatFollowers(record.followers),
        location: record.location,
        image: record.profileImage || "/images/creator-amara.jpg",
        bio: record.bio,
        isDemo: record.isDemo,
        verified: record.verificationStatus === "verified",
      };
    }
  }
  if (!profile) notFound();

  return <>
    <section className="profile-hero section-pad">
      <div className="profile-photo"><Image src={profile.image} alt={`${profile.name}${profile.isDemo ? ", illustrative demo profile" : ", creator profile"}`} fill sizes="(max-width: 760px) 90vw, 40vw" /><span>{profile.isDemo ? "DEMO PROFILE · ILLUSTRATIVE CONTENT" : profile.verified ? "VERIFIED CREATOR" : "APPROVED CREATOR PROFILE"}</span></div>
      <div className="profile-copy"><Link className="text-link" href="/creators"><ArrowLeft size={15} /> Back to creators</Link><span className="eyebrow">{profile.isDemo ? "ILLUSTRATIVE CREATOR PROFILE" : "APPROVED CREATOR PROFILE"}</span><h1>{profile.name}</h1><p className="profile-category">{profile.category} · {profile.location}</p><p>{profile.bio ?? (profile.isDemo ? "This sample profile demonstrates how creator details could be presented. Names, category, location, platform, audience, and imagery are illustrative placeholders only." : "This creator profile has been approved for public listing.")}</p><div className="profile-facts"><div><span>PRIMARY PLATFORM</span><b>{profile.platform}</b></div><div><span>{profile.isDemo ? "DEMO AUDIENCE" : "FOLLOWERS"}</span><b>{profile.followers}{profile.isDemo ? " · unverified" : ""}</b></div><div><span>LOCATION</span><b>{profile.location}</b></div></div><Link className="button button-dark" href="/contact">Enquire about a partnership <ArrowUpRight size={16} /></Link></div>
    </section>
    <CtaBand title={<>Looking for a voice<br /><em>of your own?</em></>} description="Tell us about your audience and campaign goals. We’ll shape a considered creator shortlist together." />
  </>;
}

function formatFollowers(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (count >= 1000) return `${Math.round(count / 1000)}K`;
  return String(count);
}
