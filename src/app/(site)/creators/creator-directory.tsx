"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, MapPin, Globe, Users, Mail, ChevronLeft, ChevronRight } from "lucide-react";
import { BrandLoader } from "@/components/brand-loader";
import { creators as demoCreators, type Creator } from "@/data/site-data";

const PAGE_SIZE = 20;

const followerRanges = {
  "Under 50K": { maxFollowers: "49999" },
  "50K–100K": { minFollowers: "50000", maxFollowers: "100000" },
  "100K+": { minFollowers: "100001" },
} as const;

type DirectoryCreator = {
  id: string;
  fullName: string;
  primaryPlatform: string;
  contentCategories: string[];
  followers: number;
  location: string;
  profileImage?: string;
  isDemo: boolean;
  instagramUsername?: string;
  bio?: string;
  languages?: string[];
};

type DirectoryResponse = {
  success: true;
  data: {
    creators: DirectoryCreator[];
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

function toLiveCreator(record: DirectoryCreator): DirectoryCreator {
  return record;
}

function demoToDirectoryCreator(demo: Creator): DirectoryCreator {
  return {
    id: demo.slug,
    fullName: demo.name,
    primaryPlatform: demo.platform,
    contentCategories: [demo.category],
    followers: parseFollowers(demo.followers),
    location: demo.location,
    profileImage: undefined,
    isDemo: true,
    instagramUsername: undefined,
    bio: undefined,
    languages: [],
  };
}

function CreatorAvatar({ src, name, isDemo }: { src?: string; name: string; isDemo?: boolean }) {
  const [error, setError] = useState(false);
  if (!src || error || src.trim().length === 0) return null;

  return (
    <div className="creator-row-avatar">
      <Image
        src={src}
        alt={`${name}${isDemo ? ", illustrative demo profile" : ", creator profile"}`}
        fill
        sizes="72px"
        className="creator-row-avatar-img"
        onError={() => setError(true)}
      />
    </div>
  );
}

function parseFollowers(value: string): number {
  const match = /^([\d.]+)\s*([KM]?)$/i.exec(value.replace(/,/g, ""));
  if (!match) return 0;
  const amount = Number.parseFloat(match[1]);
  const multiplier = match[2].toUpperCase() === "M" ? 1_000_000 : match[2].toUpperCase() === "K" ? 1000 : 1;
  return amount * multiplier;
}

function CreatorRow({ creator }: { creator: DirectoryCreator }) {
  const profileSlug = creator.id;
  const category = creator.contentCategories[0] ?? "Creator";
  const languages = creator.languages?.length ? creator.languages.join(", ") : null;

  return (
    <article className="creator-row" aria-label={`Creator profile: ${creator.fullName}`}>
      {/* LEFT — identity */}
      <div className="creator-row-left">
        <CreatorAvatar src={creator.profileImage} name={creator.fullName} isDemo={creator.isDemo} />
        <div className="creator-row-identity">
          <div className="creator-row-name-line">
            <h3 className="creator-row-name">{creator.fullName}</h3>
            {creator.isDemo && <span className="creator-row-demo-badge">DEMO</span>}
          </div>
          <div className="creator-row-subline">
            {creator.instagramUsername && (
              <span className="creator-row-handle">@{creator.instagramUsername}</span>
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
            {languages && (
              <span className="creator-row-tag">
                <Globe size={11} />
                {languages}
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
          <span className="creator-row-stat-value">
            {formatFollowers(creator.followers)}
          </span>
        </div>
      </div>

      {/* RIGHT — actions */}
      <div className="creator-row-actions-col">
        <Link className="creator-row-btn creator-row-btn-primary" href={`/creators/${profileSlug}`} aria-label={`View full profile of ${creator.fullName}`}>
          View Profile <ArrowUpRight size={13} />
        </Link>
        <Link className="creator-row-btn creator-row-btn-secondary" href="/contact" aria-label={`Contact ${creator.fullName}`}>
          <Mail size={13} />
          Contact Creator
        </Link>
        <span className="creator-row-platform-badge">{creator.primaryPlatform}</span>
      </div>
    </article>
  );
}

export function CreatorDirectory() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All categories");
  const [platform, setPlatform] = useState("All platforms");
  const [location, setLocation] = useState("All locations");
  const [followerRange, setFollowerRange] = useState("All audience sizes");
  const [sort, setSort] = useState("Featured");
  const [page, setPage] = useState(1);
  const [creators, setCreators] = useState<DirectoryCreator[]>(demoCreators.map(demoToDirectoryCreator));
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const loadProfiles = async () => {
      setLoading(true);
      setLoadError("");
      const params = new URLSearchParams({
        page: "1",
        limit: "100",
        sort: sort === "Audience size" ? "followers" : sort === "Name A–Z" ? "newest" : "featured",
      });
      if (query.trim()) params.set("search", query.trim());
      if (category !== "All categories") params.set("category", category);
      if (platform !== "All platforms") params.set("platform", platform);
      if (location !== "All locations") params.set("location", location);
      if (followerRange in followerRanges) {
        Object.entries(followerRanges[followerRange as keyof typeof followerRanges]).forEach(([key, value]) =>
          params.set(key, value),
        );
      }

      try {
        const response = await fetch(`/api/creators?${params}`, { signal: controller.signal, cache: "no-store" });
        const result: unknown = await response.json();
        if (!response.ok || !isDirectoryResponse(result)) {
          throw new Error("The live creator directory is currently unavailable.");
        }
        setCreators(result.data.creators.map(toLiveCreator));
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setLoadError("Showing clearly marked demo profiles because the live creator directory could not be loaded.");
        setCreators(demoCreators.map(demoToDirectoryCreator));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    void loadProfiles();
    return () => controller.abort();
  }, [category, followerRange, location, platform, query, sort]);

  const visibleCreators = useMemo(() => {
    const matches = creators.filter((creator) => {
      const count = creator.followers;
      const matchesRange =
        followerRange === "All audience sizes" ||
        (followerRange === "Under 50K" && count < 50_000) ||
        (followerRange === "50K–100K" && count >= 50_000 && count <= 100_000) ||
        (followerRange === "100K+" && count > 100_000);
      const categoryLabel = creator.contentCategories[0] ?? "";
      return (
        creator.fullName.toLowerCase().includes(query.toLowerCase()) &&
        (category === "All categories" || categoryLabel === category) &&
        (platform === "All platforms" || creator.primaryPlatform === platform) &&
        (location === "All locations" || creator.location.toLowerCase().includes(location.toLowerCase())) &&
        matchesRange
      );
    });
    if (sort === "Name A–Z") matches.sort((a, b) => a.fullName.localeCompare(b.fullName));
    if (sort === "Audience size") matches.sort((a, b) => b.followers - a.followers);
    return matches;
  }, [category, followerRange, location, platform, creators, query, sort]);

  // Strict 20 items per page limit
  const totalPages = Math.max(1, Math.ceil(visibleCreators.length / PAGE_SIZE));
  const pagedCreators = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return visibleCreators.slice(start, start + PAGE_SIZE);
  }, [visibleCreators, page]);

  const categories = Array.from(new Set(creators.map((c) => c.contentCategories[0] ?? "").filter(Boolean)));
  const platforms = Array.from(new Set(creators.map((c) => c.primaryPlatform).filter(Boolean)));
  const locations = Array.from(new Set(creators.map((c) => c.location.split(", ").pop() ?? "").filter(Boolean)));

  const handleFilterChange = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setter(e.target.value);
    setPage(1);
  };

  return (
    <>
      {/* Toolbar */}
      <div className="creator-directory-toolbar">
        <div className="creator-directory-heading">
          <div>
            <span className="eyebrow">MEET THE CREATORS</span>
            <h2>Find a fresh <em>perspective.</em></h2>
          </div>
          <p>Search by what they make, where they are, and how they reach their community.</p>
        </div>
        <div className="directory-controls">
          <label className="search-field">
            <span className="sr-only">Search creators</span>
            <input
              value={query}
              onChange={handleFilterChange(setQuery)}
              placeholder="Search creators by name"
            />
          </label>
          <label>
            <span className="sr-only">Category</span>
            <select value={category} onChange={handleFilterChange(setCategory)}>
              <option>All categories</option>
              {categories.map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>
          <label>
            <span className="sr-only">Platform</span>
            <select value={platform} onChange={handleFilterChange(setPlatform)}>
              <option>All platforms</option>
              {platforms.map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>
          <label>
            <span className="sr-only">Audience size</span>
            <select value={followerRange} onChange={handleFilterChange(setFollowerRange)}>
              <option>All audience sizes</option>
              <option>Under 50K</option>
              <option>50K–100K</option>
              <option>100K+</option>
            </select>
          </label>
          <label>
            <span className="sr-only">Location</span>
            <select value={location} onChange={handleFilterChange(setLocation)}>
              <option>All locations</option>
              {locations.map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>
          <label>
            <span className="sr-only">Sort creators</span>
            <select value={sort} onChange={handleFilterChange(setSort)}>
              <option>Featured</option>
              <option>Name A–Z</option>
              <option>Audience size</option>
            </select>
          </label>
        </div>
      </div>

      {/* Status line */}
      {loading ? (
        <BrandLoader variant="inline" label="Loading approved creator profiles" />
      ) : (
        <p className="directory-result">
          {visibleCreators.length > PAGE_SIZE
            ? `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, visibleCreators.length)} of ${visibleCreators.length} creators (max 20 per page)`
            : `${visibleCreators.length} profile${visibleCreators.length === 1 ? "" : "s"} · Public directory shows approved creators only.`}
        </p>
      )}
      {loadError && <p className="demo-notice" role="status">{loadError}</p>}

      {/* Creator rows — strictly at most 20 */}
      {pagedCreators.length ? (
        <div className="creator-rows-list">
          {pagedCreators.map((creator) => (
            <CreatorRow creator={creator} key={creator.id} />
          ))}
        </div>
      ) : (
        <div className="empty-state">No approved creator profiles match those filters yet.</div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="creator-directory-pagination" aria-label="Creator list pagination">
          <span className="creator-directory-pagination-info">
            Page <b>{page}</b> of <b>{totalPages}</b> (Total <b>{visibleCreators.length}</b> creators)
          </span>
          <div className="creator-directory-pagination-controls">
            <button
              type="button"
              className="creator-pagination-btn"
              disabled={page <= 1}
              onClick={() => {
                setPage((p) => Math.max(1, p - 1));
                document.getElementById("creator-directory")?.scrollIntoView({ behavior: "smooth" });
              }}
              aria-label="Previous page"
            >
              <ChevronLeft size={14} /> Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                type="button"
                className={`creator-pagination-btn ${pageNum === page ? "active" : ""}`}
                onClick={() => {
                  setPage(pageNum);
                  document.getElementById("creator-directory")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                {pageNum}
              </button>
            ))}
            <button
              type="button"
              className="creator-pagination-btn"
              disabled={page >= totalPages}
              onClick={() => {
                setPage((p) => Math.min(totalPages, p + 1));
                document.getElementById("creator-directory")?.scrollIntoView({ behavior: "smooth" });
              }}
              aria-label="Next page"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      <p className="creator-directory-notice">Sample profiles, when shown, are illustrative demo content—not agency talent. Audience figures are unverified.</p>
    </>
  );
}
