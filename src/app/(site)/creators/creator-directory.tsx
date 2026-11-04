"use client";

import { useEffect, useMemo, useState } from "react";
import { CreatorCard } from "@/components/site";
import { BrandLoader } from "@/components/brand-loader";
import { creators as demoCreators, type Creator } from "@/data/site-data";

const portraitImages = [
  "/images/creator-amara.jpg",
  "/images/creator-noah.jpg",
  "/images/creator-mina.jpg",
  "/images/creator-elias.jpg",
  "/images/creator-sofia.jpg",
  "/images/creator-kai.jpg",
];
const followerRanges = {
  "Under 50K": { maxFollowers: "49999" },
  "50K–100K": { minFollowers: "50000", maxFollowers: "100000" },
  "100K+": { minFollowers: "100001" },
} as const;

type DirectoryResponse = {
  success: true;
  data: {
    creators: Array<{
      id: string;
      fullName: string;
      primaryPlatform: string;
      contentCategories: string[];
      followers: number;
      location: string;
      profileImage?: string;
      isDemo: boolean;
    }>;
  };
};

function isDirectoryResponse(value: unknown): value is DirectoryResponse {
  if (typeof value !== "object" || value === null || !("success" in value) || value.success !== true || !("data" in value)) return false;
  const data = value.data;
  return typeof data === "object" && data !== null && "creators" in data && Array.isArray(data.creators);
}

function formatFollowers(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (count >= 1000) return `${Math.round(count / 1000)}K`;
  return String(count);
}

function toCreator(record: DirectoryResponse["data"]["creators"][number], index: number): Creator {
  return {
    slug: record.id,
    name: record.fullName,
    category: record.contentCategories[0] ?? "Creator",
    platform: record.primaryPlatform,
    followers: formatFollowers(record.followers),
    location: record.location,
    image: record.profileImage || portraitImages[index % portraitImages.length],
    isDemo: record.isDemo,
  };
}

function parseFollowers(value: string): number {
  const match = /^([\d.]+)\s*([KM]?)$/i.exec(value.replace(/,/g, ""));
  if (!match) return 0;
  const amount = Number.parseFloat(match[1]);
  const multiplier = match[2].toUpperCase() === "M" ? 1_000_000 : match[2].toUpperCase() === "K" ? 1000 : 1;
  return amount * multiplier;
}

export function CreatorDirectory() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All categories");
  const [platform, setPlatform] = useState("All platforms");
  const [location, setLocation] = useState("All locations");
  const [followerRange, setFollowerRange] = useState("All audience sizes");
  const [sort, setSort] = useState("Featured");
  const [profiles, setProfiles] = useState<Creator[]>(demoCreators);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const loadProfiles = async () => {
      setLoading(true);
      setLoadError("");
      const params = new URLSearchParams({ page: "1", limit: "100", sort: sort === "Audience size" ? "followers" : sort === "Name A–Z" ? "newest" : "featured" });
      if (query.trim()) params.set("search", query.trim());
      if (category !== "All categories") params.set("category", category);
      if (platform !== "All platforms") params.set("platform", platform);
      if (location !== "All locations") params.set("location", location);
      if (followerRange in followerRanges) {
        Object.entries(followerRanges[followerRange as keyof typeof followerRanges]).forEach(([key, value]) => params.set(key, value));
      }

      try {
        const response = await fetch(`/api/creators?${params}`, { signal: controller.signal, cache: "no-store" });
        const result: unknown = await response.json();
        if (!response.ok || !isDirectoryResponse(result)) {
          throw new Error("The live creator directory is currently unavailable.");
        }
        setProfiles(result.data.creators.map(toCreator));
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setLoadError("Showing clearly marked demo profiles because the live creator directory could not be loaded.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    void loadProfiles();
    return () => controller.abort();
  }, [category, followerRange, location, platform, query, sort]);

  const visibleProfiles = useMemo(() => {
    const matches = profiles.filter((creator) => {
      const count = parseFollowers(creator.followers);
      const matchesRange = followerRange === "All audience sizes" || (followerRange === "Under 50K" && count < 50_000) || (followerRange === "50K–100K" && count >= 50_000 && count <= 100_000) || (followerRange === "100K+" && count > 100_000);
      return creator.name.toLowerCase().includes(query.toLowerCase())
        && (category === "All categories" || creator.category === category)
        && (platform === "All platforms" || creator.platform === platform)
        && (location === "All locations" || creator.location.toLowerCase().includes(location.toLowerCase()))
        && matchesRange;
    });
    if (sort === "Name A–Z") matches.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "Audience size") matches.sort((a, b) => parseFollowers(b.followers) - parseFollowers(a.followers));
    return matches;
  }, [category, followerRange, location, platform, profiles, query, sort]);

  const categories = Array.from(new Set([...demoCreators.map((creator) => creator.category), ...profiles.map((creator) => creator.category)]));
  const platforms = Array.from(new Set([...demoCreators.map((creator) => creator.platform), ...profiles.map((creator) => creator.platform)]));
  const locations = Array.from(new Set([...demoCreators.map((creator) => creator.location.split(", ").pop() ?? ""), ...profiles.map((creator) => creator.location.split(", ").pop() ?? "")]));

  return <>
    <div className="creator-directory-toolbar">
      <div className="creator-directory-heading">
        <div><span className="eyebrow">MEET THE CREATORS</span><h2>Find a fresh <em>perspective.</em></h2></div>
        <p>Search by what they make, where they are, and how they reach their community.</p>
      </div>
      <div className="directory-controls">
        <label className="search-field"><span className="sr-only">Search creators</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search creators by name" /></label>
        <label><span className="sr-only">Category</span><select value={category} onChange={(event) => setCategory(event.target.value)}><option>All categories</option>{categories.map((option) => <option key={option}>{option}</option>)}</select></label>
        <label><span className="sr-only">Platform</span><select value={platform} onChange={(event) => setPlatform(event.target.value)}><option>All platforms</option>{platforms.map((option) => <option key={option}>{option}</option>)}</select></label>
        <label><span className="sr-only">Audience size</span><select value={followerRange} onChange={(event) => setFollowerRange(event.target.value)}><option>All audience sizes</option><option>Under 50K</option><option>50K–100K</option><option>100K+</option></select></label>
        <label><span className="sr-only">Location</span><select value={location} onChange={(event) => setLocation(event.target.value)}><option>All locations</option>{locations.map((option) => <option key={option}>{option}</option>)}</select></label>
        <label><span className="sr-only">Sort creators</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option>Featured</option><option>Name A–Z</option><option>Audience size</option></select></label>
      </div>
    </div>
    {loading ? <BrandLoader variant="inline" label="Loading approved creator profiles" /> : <p className="directory-result">{`${visibleProfiles.length} profiles · Public directory shows approved creators only.`}</p>}
    {loadError && <p className="demo-notice" role="status">{loadError}</p>}
    {visibleProfiles.length ? <div className="creator-grid">{visibleProfiles.map((creator) => <CreatorCard creator={creator} key={creator.slug} />)}</div> : <div className="empty-state">No approved creator profiles match those filters yet.</div>}
    <p className="demo-notice">Sample profiles, when shown, are illustrative demo content—not agency talent. Audience figures are unverified.</p>
  </>;
}
