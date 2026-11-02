"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { ArrowDown, ArrowRight, ArrowUp, Bell, BriefcaseBusiness, Check, CircleDollarSign, Clock3, MessageSquareText, Star, Users } from "lucide-react";
import {
  formatPortalDate, formatPortalNumber, PortalEmpty, PortalError, PortalFileUpload, PortalHeading, PortalLoading,
  portalRequest, recordText, usePortalData,
} from "@/components/portal/portal-shared";

type Row = Record<string, unknown>;
type BrandDashboard = {
  brand: { id: string; companyName: string; status: string } | null;
  totals: { campaigns: number; activeCampaigns: number; completedCampaigns: number; pendingCreatorResponses: number; hiredCreators: number; campaignBudgetByCurrency: Array<{ _id: string; total: number }>; pendingApprovals: number } | null;
  campaigns: Row[];
  collaborations: Row[];
  deliverables: Row[];
  notifications: Row[];
  recentMessages: Row[];
};
type DiscoverResponse = { creators: Row[]; pagination: { page: number; pages: number; total: number } };

function object(value: unknown): Row {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Row : {};
}
function array(value: unknown): Row[] {
  return Array.isArray(value) ? value.map(object) : [];
}
function id(value: unknown) {
  if (typeof value === "string") return value;
  return String(object(value)._id ?? object(value).id ?? "");
}
function displayName(value: unknown, fallback = "Creator") {
  const record = object(value);
  return String(record.fullName ?? record.companyName ?? record.title ?? record.name ?? fallback);
}
function Button({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={`portal-button ${props.className ?? ""}`} {...props}>{children}</button>;
}

export function BrandPortalPage({ section, recordId }: { section: string; recordId?: string }) {
  if (recordId && section === "creators") return <CreatorProfile recordId={recordId} />;
  if (recordId && section === "campaigns") return <BrandCampaignDetail recordId={recordId} />;
  if (recordId) return <PortalEmpty title="Page not found" description="This brand workspace page is not available." />;
  switch (section) {
    case "dashboard": return <BrandDashboardPage />;
    case "profile": return <BrandProfilePage />;
    case "discover-creators": return <CreatorDiscoveryPage />;
    case "campaigns": return <BrandCampaignsPage />;
    case "shortlists": return <BrandShortlistsPage />;
    case "collaborations": return <BrandCollaborationsPage />;
    case "messages": return <PortalMessages />;
    case "notifications": return <PortalNotifications />;
    case "billing": return <BrandBillingPage />;
    case "settings": return <PortalSettingsPage kind="brand" />;
    case "support": return <SupportPage />;
    default: return <PortalEmpty title="Page not found" description="This brand workspace page is not available." />;
  }
}

function BrandDashboardPage() {
  const { data, error, loading, reload } = usePortalData<BrandDashboard>("/api/brand/dashboard");
  if (loading) return <PortalLoading count={6} />;
  if (error) return <PortalError message={error} retry={() => void reload()} />;
  const totals = data?.totals;
  const cards = [
    { title: "Total campaigns", value: totals?.campaigns ?? 0, icon: BriefcaseBusiness, href: "/brand/campaigns" },
    { title: "Active campaigns", value: totals?.activeCampaigns ?? 0, icon: Clock3, href: "/brand/campaigns" },
    { title: "Completed campaigns", value: totals?.completedCampaigns ?? 0, icon: Check, href: "/brand/collaborations" },
    { title: "Creator responses", value: totals?.pendingCreatorResponses ?? 0, icon: Bell, href: "/brand/campaigns" },
    { title: "Creators hired", value: totals?.hiredCreators ?? 0, icon: Users, href: "/brand/collaborations" },
    { title: "Campaign budget", value: totals?.campaignBudgetByCurrency?.length === 1 ? `${formatPortalNumber(totals.campaignBudgetByCurrency[0].total)} ${totals.campaignBudgetByCurrency[0]._id}` : `${totals?.campaignBudgetByCurrency?.length ?? 0} currencies`, icon: CircleDollarSign, href: "/brand/billing" },
    { title: "Pending content reviews", value: totals?.pendingApprovals ?? 0, icon: Check, href: "/brand/collaborations" },
  ];
  return <div className="portal-page">
    <PortalHeading eyebrow="BRAND STUDIO" title={`Welcome${data?.brand?.companyName ? `, ${data.brand.companyName}` : ""}`} description={data?.brand ? `Your brand profile is ${data.brand.status}. Campaign budget is shown separately from recorded payments.` : "Set up your company profile to start exploring creator partnerships."} action={<Link className="portal-button" href={data?.brand ? "/brand/campaigns/create" : "/brand/profile"}>{data?.brand ? "Create campaign" : "Set up profile"}<ArrowRight size={15} /></Link>} />
    {!data?.brand && <div className="portal-callout"><b>Complete your brand profile</b><p>Your profile is reviewed before you can discover creators or submit campaigns.</p><Link className="portal-text-link" href="/brand/profile">Continue setup <ArrowRight size={14} /></Link></div>}
    <div className="portal-kpi-grid">{cards.map(({ title, value, icon: Icon, href }) => <Link className="portal-kpi-card" href={href} key={title}><span className="portal-kpi-icon"><Icon size={18} /></span><span>{title}</span><b>{value}</b></Link>)}</div>
    <div className="portal-column-grid">
      <section className="portal-panel"><div className="portal-panel-heading"><h2>Recent campaigns</h2><Link href="/brand/campaigns">View all <ArrowRight size={14} /></Link></div>{array(data?.campaigns).length ? <div className="portal-list">{array(data?.campaigns).map((campaign) => { const progress = object(campaign.deliverableProgress); return <Link className="portal-list-row" href={`/brand/campaigns/${id(campaign)}`} key={id(campaign)}><span><b>{displayName(campaign)}</b><small>{String(campaign.status ?? "draft")} · ends {formatPortalDate(campaign.endDate)} · {progress.total ? `${formatPortalNumber(progress.approved)} / ${formatPortalNumber(progress.total)} deliverables approved` : "No deliverables assigned"}</small></span><strong>{formatPortalNumber(campaign.budget)}</strong></Link>; })}</div> : <PortalEmpty title="No campaigns yet" description="Create a campaign brief to get started." />}</section>
      <section className="portal-panel"><div className="portal-panel-heading"><h2>Upcoming deliverables</h2><Link href="/brand/collaborations">Review work <ArrowRight size={14} /></Link></div>{array(data?.deliverables).length ? <div className="portal-list">{array(data?.deliverables).map((item, index) => <div className="portal-list-row" key={String(item._id ?? index)}><span><b>{String(item.description ?? "Campaign deliverable")}</b><small>{displayName(item.creator)} · {displayName(item.campaign)}</small></span><strong>{formatPortalDate(item.dueAt)}</strong></div>)}</div> : <PortalEmpty title="Nothing due soon" description="Deliverables from creator collaborations will appear here." />}</section>
    </div>
    <section className="portal-panel"><div className="portal-panel-heading"><h2>Recent creator activity</h2><Link href="/brand/collaborations">View collaborations <ArrowRight size={14} /></Link></div>{array(data?.collaborations).length ? <div className="portal-creator-strip">{array(data?.collaborations).map((item) => <div className="portal-creator-mini" key={id(item)}><span className="portal-avatar">{displayName(item.creator).slice(0, 1)}</span><div><b>{displayName(item.creator)}</b><small>{displayName(item.campaign)} · {String(item.status ?? "invited")}</small></div></div>)}</div> : <PortalEmpty title="No creator activity yet" description="Creators who accept your campaign invitations will show up here." />}</section>
    <div className="portal-column-grid"><section className="portal-panel"><div className="portal-panel-heading"><h2>Recent messages</h2><Link href="/brand/messages">Open inbox <ArrowRight size={14} /></Link></div>{array(data?.recentMessages).length ? <div className="portal-list">{array(data?.recentMessages).map((message) => <Link className="portal-list-row" href="/brand/messages" key={id(message)}><span><b>{displayName(message.sender)} · {displayName(message.creator)}</b><small>{displayName(message.campaign)} · {String(message.body ?? "")}</small></span><time>{formatPortalDate(message.createdAt)}</time></Link>)}</div> : <PortalEmpty title="No recent messages" description="Messages from your campaign conversations will appear here." />}</section><section className="portal-panel"><div className="portal-panel-heading"><h2>Notifications</h2><Link href="/brand/notifications">View all <ArrowRight size={14} /></Link></div>{array(data?.notifications).length ? <div className="portal-list">{array(data?.notifications).map((notification) => <Link className="portal-list-row" href="/brand/notifications" key={id(notification)}><span><b>{String(notification.title)}</b><small>{String(notification.message)}</small></span><time>{formatPortalDate(notification.createdAt)}</time></Link>)}</div> : <PortalEmpty title="No notifications" description="Campaign and creator updates will appear here." />}</section></div>
  </div>;
}

function BrandProfilePage() {
  const { data, error, loading, reload } = usePortalData<{ brand: Row | null }>("/api/brand/profile");
  if (loading) return <PortalLoading count={1} />;
  if (error) return <PortalError message={error} retry={() => void reload()} />;
  return <BrandProfileForm key={id(data?.brand) || "new"} brand={data?.brand ?? null} onSaved={() => void reload()} />;
}

function BrandProfileForm({ brand, onSaved }: { brand: Row | null; onSaved: () => void }) {
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [companyLogo, setCompanyLogo] = useState(String(brand?.companyLogo ?? ""));
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true); setError(""); setNotice("");
    const form = new FormData(event.currentTarget);
    const socialMediaLinks = String(form.get("socialMediaLinks") ?? "").split("\n").map((line) => {
      const [platform, ...urlParts] = line.split("=");
      return { platform: platform.trim(), url: urlParts.join("=").trim() };
    }).filter((item) => item.platform && item.url);
    try {
      const result = await portalRequest("/api/brand/profile", { method: "PATCH", body: JSON.stringify({
        companyName: form.get("companyName"), contactPerson: form.get("contactPerson"), phone: form.get("phone"),
        website: form.get("website") || "", industry: form.get("industry"), description: form.get("description"),
        companyLogo: form.get("companyLogo") || undefined, location: form.get("location"), country: form.get("country"), socialMediaLinks,
      }) });
      setNotice(result.message); onSaved();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to save brand profile."); }
    finally { setSaving(false); }
  }
  return <div className="portal-page"><PortalHeading eyebrow="COMPANY PROFILE" title="Your brand, your story" description={`Your account email is verified from sign-in and cannot be changed here. Profile status: ${String(brand?.status ?? "profile not submitted")}.`} />
    <form className="portal-panel portal-form-grid" onSubmit={(event) => void submit(event)}>
      <PortalInput label="Company name" name="companyName" defaultValue={String(brand?.companyName ?? "")} required />
      <PortalInput label="Contact person" name="contactPerson" defaultValue={String(brand?.contactPerson ?? "")} required />
      <PortalInput label="Contact email" name="email" type="email" defaultValue={String(brand?.email ?? "")} disabled />
      <PortalInput label="Phone" name="phone" defaultValue={String(brand?.phone ?? "")} required />
      <PortalInput label="Industry" name="industry" defaultValue={String(brand?.industry ?? "")} required />
      <PortalInput label="Website" name="website" type="url" defaultValue={String(brand?.website ?? "")} />
      <PortalInput label="Location" name="location" defaultValue={String(brand?.location ?? "")} required />
      <PortalInput label="Country" name="country" defaultValue={String(brand?.country ?? "")} required />
      <label className="portal-field"><span>Company logo URL</span><input name="companyLogo" type="url" value={companyLogo} onChange={(event) => setCompanyLogo(event.target.value)} /></label>
      <PortalFileUpload purpose="brand-logo" onUploaded={(asset) => setCompanyLogo(asset.url)} />
      <label className="portal-field portal-field-wide"><span>Company description</span><textarea name="description" rows={4} defaultValue={String(brand?.description ?? "")} required /></label>
      <label className="portal-field portal-field-wide"><span>Social media links</span><textarea name="socialMediaLinks" rows={3} defaultValue={array(brand?.socialMediaLinks).map((link) => `${String(link.platform ?? "")}=${String(link.url ?? "")}`).join("\n")} placeholder={"Instagram=https://instagram.com/yourbrand\nLinkedIn=https://linkedin.com/company/yourbrand"} /><small>One platform=URL per line.</small></label>
      {error && <p className="portal-form-error portal-field-wide" role="alert">{error}</p>}{notice && <p className="portal-form-success portal-field-wide" role="status">{notice}</p>}
      <div className="portal-field-wide"><button className="portal-button" disabled={saving}>{saving ? "Saving…" : "Save company profile"}</button></div>
    </form>
  </div>;
}

function PortalInput({ label, name, defaultValue = "", type = "text", required = false, disabled = false, min }: { label: string; name: string; defaultValue?: string; type?: string; required?: boolean; disabled?: boolean; min?: string }) {
  return <label className="portal-field"><span>{label}</span><input name={name} type={type} defaultValue={defaultValue} required={required} disabled={disabled} min={min} /></label>;
}

function CreatorDiscoveryPage() {
  const [filters, setFilters] = useState({ q: "", category: "", platform: "", location: "", language: "", audienceLocation: "", minFollowers: "", maxFollowers: "", minEngagement: "", maxEngagement: "", minBudget: "", maxBudget: "", sort: "relevant", page: 1 });
  const [filtersInitialized, setFiltersInitialized] = useState(false);
  const [data, setData] = useState<DiscoverResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const update = (key: Exclude<keyof typeof filters, "page">, value: string) => setFilters((current) => ({ ...current, [key]: value, page: 1 }));
  const setPage = (page: number) => setFilters((current) => ({ ...current, page }));
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      const requestedPage = Number.parseInt(params.get("page") ?? "1", 10);
      const sortOptions = ["relevant", "followers", "engagement", "price", "recent"];
      const requestedSort = params.get("sort") ?? "relevant";
      setFilters((current) => ({
        ...current,
        q: params.get("q") ?? "",
        category: params.get("category") ?? "",
        platform: params.get("platform") ?? "",
        location: params.get("location") ?? "",
        language: params.get("language") ?? "",
        audienceLocation: params.get("audienceLocation") ?? "",
        minFollowers: params.get("minFollowers") ?? "",
        maxFollowers: params.get("maxFollowers") ?? "",
        minEngagement: params.get("minEngagement") ?? "",
        maxEngagement: params.get("maxEngagement") ?? "",
        minBudget: params.get("minBudget") ?? "",
        maxBudget: params.get("maxBudget") ?? "",
        sort: sortOptions.includes(requestedSort) ? requestedSort : "relevant",
        page: Number.isSafeInteger(requestedPage) && requestedPage > 0 ? Math.min(requestedPage, 100000) : 1,
      }));
      setFiltersInitialized(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  const fetchCreators = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(filters)) if (value) params.set(key, String(value));
      const search = params.toString();
      window.history.replaceState(null, "", `${window.location.pathname}?${search}`);
      const response = await portalRequest<DiscoverResponse>(`/api/brand/creators?${search}`);
      setData(response.data ?? null);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to search creators."); }
    finally { setLoading(false); }
  }, [filters]);
  useEffect(() => {
    if (!filtersInitialized) return;
    const timer = window.setTimeout(() => { void fetchCreators(); }, filters.q ? 350 : 0);
    return () => window.clearTimeout(timer);
  }, [fetchCreators, filters.q, filtersInitialized]);

  async function saveToShortlist(creatorId: string) {
    setNotice(""); setError("");
    try {
      let lists = (await portalRequest<{ shortlists: Row[] }>("/api/brand/shortlists")).data?.shortlists ?? [];
      if (!lists.length) {
        const created = await portalRequest<{ shortlist: Row }>("/api/brand/shortlists", { method: "POST", body: JSON.stringify({ name: "Creator shortlist" }) });
        if (created.data?.shortlist) lists = [created.data.shortlist];
      }
      if (!lists[0]) throw new Error("Create a shortlist before saving creators.");
      await portalRequest(`/api/brand/shortlists/${id(lists[0])}`, { method: "PATCH", body: JSON.stringify({ action: "add", creatorId }) });
      setNotice("Creator added to your shortlist.");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to save creator."); }
  }

  const results = data?.creators ?? [];
  return <div className="portal-page"><PortalHeading eyebrow="CREATOR MARKETPLACE" title="Find your next creative partner" description="Search approved creator profiles. Private contact details are never shown in the marketplace." />
    <div className="portal-discovery-layout"><aside className="portal-filter-panel"><label className="portal-field"><span>Search</span><input value={filters.q} onChange={(event) => update("q", event.target.value)} placeholder="Name or username" /></label>
      <label className="portal-field"><span>Category</span><input value={filters.category} onChange={(event) => update("category", event.target.value)} placeholder="e.g. Beauty" /></label>
      <label className="portal-field"><span>Platform</span><select value={filters.platform} onChange={(event) => update("platform", event.target.value)}><option value="">All platforms</option>{["Instagram", "YouTube", "TikTok", "Twitch", "Other"].map((item) => <option key={item}>{item}</option>)}</select></label>
      <label className="portal-field"><span>Location</span><input value={filters.location} onChange={(event) => update("location", event.target.value)} placeholder="Creator location" /></label>
      <label className="portal-field"><span>Language</span><input value={filters.language} onChange={(event) => update("language", event.target.value)} placeholder="e.g. English" /></label>
      <label className="portal-field"><span>Audience location</span><input value={filters.audienceLocation} onChange={(event) => update("audienceLocation", event.target.value)} placeholder="Country" /></label>
      <label className="portal-field"><span>Followers from</span><input type="number" min="0" value={filters.minFollowers} onChange={(event) => update("minFollowers", event.target.value)} /></label>
      <label className="portal-field"><span>Followers to</span><input type="number" min="0" value={filters.maxFollowers} onChange={(event) => update("maxFollowers", event.target.value)} /></label>
      <label className="portal-field"><span>Engagement % min.</span><input type="number" min="0" max="100" step="0.1" value={filters.minEngagement} onChange={(event) => update("minEngagement", event.target.value)} /></label>
      <label className="portal-field"><span>Budget from</span><input type="number" min="0" value={filters.minBudget} onChange={(event) => update("minBudget", event.target.value)} /></label>
      <label className="portal-field"><span>Budget to</span><input type="number" min="0" value={filters.maxBudget} onChange={(event) => update("maxBudget", event.target.value)} /></label>
      <label className="portal-field"><span>Sort by</span><select value={filters.sort} onChange={(event) => update("sort", event.target.value)}><option value="relevant">Most relevant</option><option value="followers">Highest followers</option><option value="engagement">Highest engagement</option><option value="price">Lowest package price</option><option value="recent">Recently added</option></select></label>
    </aside>
    <div className="portal-discovery-results"><div className="portal-results-heading"><b>{data?.pagination.total ?? 0} creators</b><span>Approved, publicly visible profiles only</span></div>{notice && <p className="portal-form-success" role="status">{notice}</p>}{error && <PortalError message={error} />}{loading ? <PortalLoading count={6} /> : results.length ? <div className="portal-creator-grid">{results.map((creator) => <CreatorCard key={id(creator)} creator={creator} onSave={() => void saveToShortlist(id(creator))} />)}</div> : !error && <PortalEmpty title="No creators found" description="Try adjusting your filters to explore a broader creator network." />}
      {!!data?.pagination.pages && data.pagination.pages > 1 && <div className="portal-pagination"><button className="portal-button portal-button-secondary" disabled={filters.page <= 1} onClick={() => setPage(filters.page - 1)}><ArrowDown size={14} /> Previous</button><span>Page {filters.page} of {data.pagination.pages}</span><button className="portal-button portal-button-secondary" disabled={filters.page >= data.pagination.pages} onClick={() => setPage(filters.page + 1)}>Next <ArrowUp size={14} /></button></div>}
    </div></div>
  </div>;
}

function CreatorCard({ creator, onSave }: { creator: Row; onSave: () => void }) {
  const price = object(creator.startingPrice);
  return <article className="portal-creator-card"><Link className="portal-creator-card-link" href={`/brand/creators/${id(creator)}`}>
    {creator.profileImage ? <Image className="portal-creator-image" src={String(creator.profileImage)} alt="" width={300} height={180} unoptimized /> : <div className="portal-creator-image portal-creator-image-placeholder">{displayName(creator).slice(0, 1)}</div>}
    <div className="portal-creator-name"><h3>{displayName(creator)}</h3>{creator.verificationStatus === "verified" && <span className="portal-verified">Verified</span>}</div>
    <p>{creator.instagramUsername ? `@${String(creator.instagramUsername)}` : String(creator.youtubeChannel ?? creator.primaryPlatform ?? "Creator")} · {String(creator.primaryPlatform ?? "Platform")}</p>
    <div className="portal-tag-list">{array(creator.contentCategories).slice(0, 3).map((item) => <span key={String(item)}>{recordText(item)}</span>)}</div>
    <div className="portal-creator-stats"><span><b>{formatPortalNumber(creator.followers)}</b> followers</span><span><b>{creator.metricsVerificationStatus === "verified" ? `${formatPortalNumber(creator.engagementRate)}%` : "Unverified"}</b> engagement</span></div>
    <div className="portal-creator-stats"><span>{String(creator.location ?? "Location")}</span><span>{price.amount !== undefined ? `${formatPortalNumber(price.amount)} ${String(price.currency ?? "")}` : "Rates on request"}</span></div>
  </Link><div className="portal-creator-actions"><Button type="button" className="portal-button-secondary" onClick={onSave}><Star size={14} /> Save</Button><Link className="portal-text-link" href={`/brand/creators/${id(creator)}`}>View profile <ArrowRight size={14} /></Link></div></article>;
}

function BrandCampaignsPage() {
  const { data, error, loading, reload } = usePortalData<{ campaigns: Row[] }>("/api/brand/campaigns");
  return <div className="portal-page"><PortalHeading eyebrow="CAMPAIGNS" title="Campaign workspace" description="Review campaign progress, manage creator invitations, and track content approvals." action={<Link className="portal-button" href="/brand/campaigns/create">Create campaign <ArrowRight size={15} /></Link>} />
    {loading ? <PortalLoading /> : error ? <PortalError message={error} retry={() => void reload()} /> : array(data?.campaigns).length ? <div className="portal-panel portal-table-scroll"><table className="portal-table"><thead><tr><th>Campaign</th><th>Status</th><th>Budget</th><th>Creators</th><th>Timeline</th><th /></tr></thead><tbody>{array(data?.campaigns).map((campaign) => <tr key={id(campaign)}><td><Link className="portal-table-title" href={`/brand/campaigns/${id(campaign)}`}>{displayName(campaign)}</Link><small>{String(campaign.industry ?? campaign.objective ?? "")}</small></td><td><span className={`portal-status portal-status-${String(campaign.status)}`}>{String(campaign.status)}</span></td><td>{formatPortalNumber(campaign.budget)}</td><td>{array(campaign.selectedCreators).length} / {formatPortalNumber(campaign.requiredCreators)}</td><td>{formatPortalDate(campaign.startDate)} — {formatPortalDate(campaign.endDate)}</td><td><Link href={`/brand/campaigns/${id(campaign)}`} aria-label={`Open ${displayName(campaign)}`}><ArrowRight size={16} /></Link></td></tr>)}</tbody></table></div> : <PortalEmpty title="No campaigns" description="Create a campaign brief and submit it for administrator review." />}</div>;
}

function BrandShortlistsPage() {
  const { data, error, loading, reload } = usePortalData<{ shortlists: Row[] }>("/api/brand/shortlists");
  const [name, setName] = useState("");
  const [notice, setNotice] = useState("");
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setNotice("");
    try { await portalRequest("/api/brand/shortlists", { method: "POST", body: JSON.stringify({ name }) }); setName(""); setNotice("Shortlist created."); await reload(); }
    catch (reason) { setNotice(reason instanceof Error ? reason.message : "Unable to create shortlist."); }
  }
  return <div className="portal-page"><PortalHeading eyebrow="SAVED CREATORS" title="Shortlists" description="Organize potential creator partners into private lists for your brand." />
    <form className="portal-inline-form" onSubmit={(event) => void create(event)}><input aria-label="New shortlist name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Name a new shortlist" required /><Button type="submit">Create shortlist</Button></form>
    {notice && <p className="portal-form-success" role="status">{notice}</p>}{loading ? <PortalLoading /> : error ? <PortalError message={error} retry={() => void reload()} /> : array(data?.shortlists).length ? <div className="portal-shortlist-grid">{array(data?.shortlists).map((list) => <BrandShortlistCard key={id(list)} shortlist={list} onChanged={() => void reload()} onNotice={setNotice} />)}</div> : !error && <PortalEmpty title="No shortlists yet" description="Create a shortlist or save a creator from the marketplace." />}</div>;
}

function BrandShortlistCard({ shortlist, onChanged, onNotice }: { shortlist: Row; onChanged: () => void; onNotice: (message: string) => void }) {
  const [name, setName] = useState(String(shortlist.name ?? ""));
  async function update(payload: Record<string, unknown>, successMessage: string) {
    try { await portalRequest(`/api/brand/shortlists/${id(shortlist)}`, { method: "PATCH", body: JSON.stringify(payload) }); onNotice(successMessage); onChanged(); }
    catch (reason) { onNotice(reason instanceof Error ? reason.message : "Unable to update shortlist."); }
  }
  async function remove() {
    try { await portalRequest(`/api/brand/shortlists/${id(shortlist)}`, { method: "DELETE" }); onNotice("Shortlist deleted."); onChanged(); }
    catch (reason) { onNotice(reason instanceof Error ? reason.message : "Unable to delete shortlist."); }
  }
  return <article className="portal-panel">
    <div className="portal-panel-heading"><h2>{String(shortlist.name)}</h2><span>{array(shortlist.creators).length} creators</span></div>
    <form className="portal-inline-form" onSubmit={(event) => { event.preventDefault(); void update({ action: "rename", name }, "Shortlist renamed."); }}><input aria-label={`Rename ${String(shortlist.name)}`} value={name} onChange={(event) => setName(event.target.value)} required /><Button type="submit" className="portal-button-secondary">Rename</Button><Button type="button" className="portal-button-danger" onClick={() => void remove()}>Delete list</Button></form>
    {array(shortlist.creators).length ? <div className="portal-list">{array(shortlist.creators).map((entry, index) => {
      const creator = object(entry.creator);
      const creatorId = id(creator);
      return <div className="portal-list-row" key={creatorId || index}><span>{creatorId ? <Link href={`/brand/creators/${creatorId}`}><b>{displayName(creator)}</b></Link> : <b>Creator unavailable</b>}<small>{String(creator.primaryPlatform ?? "")} · {formatPortalNumber(creator.followers)} followers</small><form className="portal-inline-form" onSubmit={(event) => { event.preventDefault(); const note = new FormData(event.currentTarget).get("note"); void update({ action: "note", creatorId, note: typeof note === "string" && note.trim() ? note.trim() : undefined }, "Internal note saved."); }}><input name="note" aria-label={`Internal note for ${displayName(creator)}`} defaultValue={String(entry.note ?? "")} placeholder="Private note for your team" /><Button type="submit" className="portal-button-secondary">Save note</Button></form></span><div className="portal-action-row">{creatorId && <Link href={`/brand/creators/${creatorId}`} aria-label={`View ${displayName(creator)}`}><ArrowRight size={14} /></Link>}<Button type="button" disabled={!creatorId} className="portal-button-danger" onClick={() => void update({ action: "remove", creatorId }, "Creator removed from shortlist.")}>Remove</Button></div></div>;
    })}</div> : <PortalEmpty title="This list is empty" description="Save creators from discovery to compare them here." />}
  </article>;
}

function BrandCollaborationsPage() {
  const { data, error, loading, reload } = usePortalData<{ collaborations: Row[]; deliverables: Row[] }>("/api/brand/collaborations");
  return <div className="portal-page"><PortalHeading eyebrow="ACTIVE PARTNERSHIPS" title="Collaborations" description="Track creator agreements, deadlines, submitted content, and approvals." />
    {loading ? <PortalLoading /> : error ? <PortalError message={error} retry={() => void reload()} /> : array(data?.collaborations).length ? <div className="portal-card-grid">{array(data?.collaborations).map((collaboration) => <article className="portal-panel" key={id(collaboration)}><div className="portal-panel-heading"><h2>{displayName(collaboration.creator)}</h2><span className={`portal-status portal-status-${String(collaboration.status)}`}>{String(collaboration.status)}</span></div><p>{displayName(collaboration.campaign)} · deadline {formatPortalDate(collaboration.deadline)}</p><p><b>{formatPortalNumber(collaboration.agreedCompensation)} {String(collaboration.currency ?? "")}</b> agreed compensation</p>{array(data?.deliverables).filter((item) => id(item.collaboration) === id(collaboration)).map((item) => <div className="portal-deliverable-row" key={id(item)}><span>{String(item.description)}</span><span className={`portal-status portal-status-${String(item.status)}`}>{String(item.status)}</span><b>{formatPortalDate(item.dueAt)}</b>{Boolean(item.submissionUrl) && <a className="portal-text-link" href={String(item.submissionUrl)} target="_blank" rel="noreferrer">Preview content</a>}{item.status === "submitted" && <DeliverableReview deliverableId={id(item)} onDone={() => void reload()} />}</div>)}</article>)}</div> : !error && <PortalEmpty title="No collaborations yet" description="Accepted creator invitations will appear here." />}</div>;
}

function DeliverableReview({ deliverableId, onDone }: { deliverableId: string; onDone: () => void }) {
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  async function review(status: "approved" | "revision_requested") {
    setSaving(true); setError("");
    try { await portalRequest(`/api/brand/deliverables/${deliverableId}`, { method: "PATCH", body: JSON.stringify({ status, feedback }) }); setFeedback(""); onDone(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to review content."); }
    finally { setSaving(false); }
  }
  return <div className="portal-review-form"><textarea value={feedback} onChange={(event) => setFeedback(event.target.value)} placeholder="Feedback (required for revision requests)" rows={2} /><div><Button type="button" disabled={saving} onClick={() => void review("approved")}><Check size={14} /> Approve</Button><Button type="button" className="portal-button-secondary" disabled={saving || !feedback.trim()} onClick={() => void review("revision_requested")}>Request revision</Button></div>{error && <small className="portal-form-error">{error}</small>}</div>;
}

function CreatorProfile({ recordId }: { recordId: string }) {
  const { data, error, loading, reload } = usePortalData<Row>(`/api/brand/creators/${recordId}`);
  const { data: campaignData, error: campaignError, loading: campaignsLoading } = usePortalData<{ campaigns: Row[] }>("/api/brand/campaigns");
  const { data: shortlistData, error: shortlistError, loading: shortlistsLoading, reload: reloadShortlists } = usePortalData<{ shortlists: Row[] }>("/api/brand/shortlists");
  const campaigns = array(campaignData?.campaigns);
  const shortlists = array(shortlistData?.shortlists);
  const [shortlistId, setShortlistId] = useState("");
  const [campaignId, setCampaignId] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  async function saveToShortlist(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!shortlistId) return;
    setSaving(true); setNotice("");
    try { const result = await portalRequest(`/api/brand/shortlists/${shortlistId}`, { method: "PATCH", body: JSON.stringify({ action: "add", creatorId: recordId }) }); setNotice(result.message); await reloadShortlists(); }
    catch (reason) { setNotice(reason instanceof Error ? reason.message : "Unable to save creator to shortlist."); }
    finally { setSaving(false); }
  }
  async function invite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setNotice("");
    const form = new FormData(event.currentTarget);
    const deliverables = String(form.get("deliverables") ?? "").split("\n").filter((line) => line.trim()).map((description) => ({ description, quantity: 1 }));
    try {
      const result = await portalRequest("/api/brand/invitations", { method: "POST", body: JSON.stringify({ campaignId, creatorId: recordId, deliverables, compensation: Number(form.get("compensation")), currency: form.get("currency"), deadline: form.get("deadline"), message: form.get("message") }) });
      setNotice(result.message); event.currentTarget.reset();
    } catch (reason) { setNotice(reason instanceof Error ? reason.message : "Unable to invite creator."); }
    finally { setSaving(false); }
  }
  if (loading) return <PortalLoading />;
  if (error) return <PortalError message={error} retry={() => void reload()} />;
  const creator = object(data?.creator);
  const packages = array(data?.packages);
  return <div className="portal-page"><Link href="/brand/discover-creators" className="portal-back-link">← Back to discovery</Link><PortalHeading eyebrow="CREATOR PROFILE" title={displayName(creator)} description={`${String(creator.primaryPlatform ?? "Creator")} · ${String(creator.location ?? "")}${creator.verificationStatus === "verified" ? " · Verified account" : ""}`} />
    <div className="portal-profile-layout"><section className="portal-panel portal-profile-summary">{creator.profileImage ? <Image src={String(creator.profileImage)} alt="" width={180} height={180} unoptimized /> : <div className="portal-profile-avatar">{displayName(creator).slice(0, 1)}</div>}<h2>{displayName(creator)}</h2><p>{String(creator.bio ?? "Creator profile")}</p><div className="portal-tag-list">{array(creator.contentCategories).map((item) => <span key={String(item)}>{recordText(item)}</span>)}</div><div className="portal-profile-metrics"><span><b>{formatPortalNumber(creator.followers)}</b> followers</span><span><b>{creator.metricsVerificationStatus === "verified" ? `${formatPortalNumber(creator.engagementRate)}%` : "Unverified"}</b> engagement</span><span><b>{formatPortalNumber(creator.averageViews)}</b> average views</span></div><p>Audience: {recordText(object(creator.audienceDemographics).topCountries)}</p><p>Languages: {recordText(creator.languages)}</p>{Boolean(creator.portfolioUrl) && <a className="portal-text-link" href={String(creator.portfolioUrl)} target="_blank" rel="noreferrer">Portfolio link <ArrowRight size={14} /></a>}<section className="portal-stack"><h3>Save to shortlist</h3>{shortlistError ? <PortalError message={shortlistError} /> : shortlistsLoading ? <PortalLoading count={1} /> : shortlists.length ? <form className="portal-inline-form" onSubmit={(event) => void saveToShortlist(event)}><select aria-label="Choose a shortlist" value={shortlistId} onChange={(event) => setShortlistId(event.target.value)} required><option value="">Choose shortlist</option>{shortlists.map((item) => <option value={id(item)} key={id(item)}>{String(item.name)}</option>)}</select><Button disabled={saving}>{saving ? "Saving…" : "Add creator"}</Button>{notice && <small role="status">{notice}</small>}</form> : <p className="portal-muted"><Link href="/brand/shortlists">Create a shortlist</Link> before saving creators.</p>}</section></section>
      <div className="portal-stack"><section className="portal-panel"><div className="portal-panel-heading"><h2>Social accounts</h2></div>{array(data?.socialAccounts).length ? array(data?.socialAccounts).map((account) => <p className="portal-list-row" key={id(account)}><span><b>{String(account.platform)} · @{String(account.username)}</b><small>{formatPortalNumber(account.followers)} followers · {String(account.verificationStatus)}</small></span><a className="portal-text-link" href={String(account.profileUrl)} target="_blank" rel="noreferrer">View</a></p>) : <p className="portal-muted">No linked social accounts yet.</p>}</section>
        <section className="portal-panel"><div className="portal-panel-heading"><h2>Collaboration packages</h2></div>{packages.length ? packages.map((item) => <div className="portal-package-row" key={id(item)}><span><b>{String(item.title)}</b><small>{String(item.platform)} · {String(item.deliveryDays)} days</small></span><strong>{formatPortalNumber(item.price)} {String(item.currency)}</strong></div>) : <p className="portal-muted">Rates available on request.</p>}</section>
        <section className="portal-panel"><div className="portal-panel-heading"><h2>Selected campaign examples</h2></div>{array(data?.completedCampaignExamples).length ? array(data?.completedCampaignExamples).map((example) => <p className="portal-list-row" key={id(example)}><span><b>{String(example.title)}</b><small>{String(example.industry)} · {formatPortalDate(example.endDate)}</small></span></p>) : <p className="portal-muted">No approved campaign examples to show yet.</p>}</section>
        <section className="portal-panel"><div className="portal-panel-heading"><h2>Invite to a campaign</h2></div>{campaignError ? <PortalError message={campaignError} /> : campaignsLoading ? <PortalLoading count={1} /> : campaigns.filter((campaign) => ["approved", "active"].includes(String(campaign.status))).length ? <form className="portal-form-grid" onSubmit={(event) => void invite(event)}><label className="portal-field portal-field-wide"><span>Approved campaign</span><select required value={campaignId} onChange={(event) => setCampaignId(event.target.value)}><option value="">Choose campaign</option>{campaigns.filter((campaign) => ["approved", "active"].includes(String(campaign.status))).map((campaign) => <option key={id(campaign)} value={id(campaign)}>{String(campaign.title)}</option>)}</select></label><PortalInput label="Proposed compensation" name="compensation" type="number" min="0" required /><PortalInput label="Currency" name="currency" defaultValue="USD" required /><PortalInput label="Deadline" name="deadline" type="date" required min={new Date().toISOString().slice(0, 10)} /><label className="portal-field portal-field-wide"><span>Deliverables (one per line)</span><textarea name="deliverables" rows={2} defaultValue="One campaign deliverable" required /></label><label className="portal-field portal-field-wide"><span>Invitation message</span><textarea name="message" rows={2} /></label>{notice && <p className="portal-form-success portal-field-wide" role="status">{notice}</p>}<div className="portal-field-wide"><Button disabled={saving}>{saving ? "Sending…" : "Send campaign invitation"}</Button></div></form> : <p className="portal-muted">No approved or active campaign is available for invitations.</p>}</section></div></div>
  </div>;
}

function BrandCampaignDetail({ recordId }: { recordId: string }) {
  const { data, error, loading, reload } = usePortalData<Row>(`/api/brand/campaigns/${recordId}`);
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState(false);
  async function submitReview() {
    try { const result = await portalRequest(`/api/brand/campaigns/${recordId}`, { method: "PATCH", body: JSON.stringify({ status: "pending" }) }); setNotice(result.message); await reload(); }
    catch (reason) { setNotice(reason instanceof Error ? reason.message : "Unable to submit campaign."); }
  }
  if (loading) return <PortalLoading />;
  if (error) return <PortalError message={error} retry={() => void reload()} />;
  const campaign = object(data?.campaign);
  return <div className="portal-page"><Link href="/brand/campaigns" className="portal-back-link">← Campaigns</Link><PortalHeading eyebrow="CAMPAIGN BRIEF" title={displayName(campaign)} description={`${String(campaign.industry ?? "")} · ${String(campaign.status ?? "")}`} action={campaign.status === "draft" ? <div className="portal-action-row"><Button className="portal-button-secondary" onClick={() => setEditing((current) => !current)}>{editing ? "Cancel editing" : "Edit draft"}</Button><Button onClick={() => void submitReview()}>Submit for review</Button></div> : undefined} />{notice && <p className="portal-form-success" role="status">{notice}</p>}
    {editing && <CampaignDraftEditor campaign={campaign} recordId={recordId} onSaved={(message) => { setNotice(message); setEditing(false); void reload(); }} />}
    <div className="portal-detail-grid"><section className="portal-panel"><h2>Campaign overview</h2><p>{String(campaign.description ?? "")}</p><dl className="portal-detail-list"><dt>Objective</dt><dd>{String(campaign.objective ?? "—")}</dd><dt>Budget</dt><dd>{formatPortalNumber(campaign.budget)} <small>(campaign budget, not payment)</small></dd><dt>Timeline</dt><dd>{formatPortalDate(campaign.startDate)} — {formatPortalDate(campaign.endDate)}</dd><dt>Platforms</dt><dd>{recordText(campaign.platforms)}</dd><dt>Audience</dt><dd>{String(campaign.targetAudience ?? "—")}</dd><dt>Admin feedback</dt><dd>{String(campaign.brandFeedback ?? "No feedback recorded yet.")}</dd></dl></section>
      <section className="portal-panel"><div className="portal-panel-heading"><h2>Invitations</h2><Link className="portal-text-link" href="/brand/discover-creators">Discover creators</Link></div>{array(data?.invitations).length ? array(data?.invitations).map((invitation) => <p className="portal-list-row" key={id(invitation)}><span><b>{displayName(invitation.creator)}</b><small>{String(invitation.status)} · {formatPortalDate(invitation.deadline)}</small></span><strong>{formatPortalNumber(invitation.compensation)} {String(invitation.currency)}</strong></p>) : <p className="portal-muted">No invitations yet. Open a creator profile to invite them.</p>}</section>
      <section className="portal-panel portal-field-wide"><h2>Deliverables & content approvals</h2>{array(data?.deliverables).length ? array(data?.deliverables).map((item) => <div className="portal-deliverable-row" key={id(item)}><span><b>{String(item.description)}</b><small>{displayName(item.creator)} · due {formatPortalDate(item.dueAt)}</small></span><span className={`portal-status portal-status-${String(item.status)}`}>{String(item.status)}</span>{Boolean(item.submissionUrl) && <a className="portal-text-link" href={String(item.submissionUrl)} target="_blank" rel="noreferrer">Open submitted content</a>}{item.status === "submitted" && <DeliverableReview deliverableId={id(item)} onDone={() => void reload()} />}</div>) : <PortalEmpty title="No deliverables yet" description="Deliverables are created when creators accept your invitations." />}</section>
      <section className="portal-panel portal-field-wide"><h2>Assigned creators</h2>{array(campaign.selectedCreators).length ? <div className="portal-tag-list">{array(campaign.selectedCreators).map((creator) => <Link href={`/brand/creators/${id(creator)}`} key={id(creator)}>{displayName(creator)}</Link>)}</div> : <p className="portal-muted">No creators assigned.</p>}</section></div>
  </div>;
}

function CampaignDraftEditor({ campaign, recordId, onSaved }: { campaign: Row; recordId: string; onSaved: (message: string) => void }) {
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const list = (name: string) => String(form.get(name) ?? "").split(",").map((item) => item.trim()).filter(Boolean);
    const optionalNumber = (name: string) => String(form.get(name) ?? "").trim() ? Number(form.get(name)) : undefined;
    setSaving(true); setError("");
    try {
      const result = await portalRequest(`/api/brand/campaigns/${recordId}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: form.get("title"), objective: form.get("objective"), description: form.get("description"), industry: form.get("industry"),
          targetAudience: form.get("targetAudience") || undefined, targetAgeRange: form.get("targetAgeRange") || undefined,
          targetGender: form.get("targetGender") || undefined, targetLocation: list("targetLocation"),
          audienceInterests: list("audienceInterests"), audienceLanguages: list("audienceLanguages"),
          platforms: list("platforms"), contentTypes: list("contentTypes"), creatorCategories: list("creatorCategories"),
          minimumFollowers: optionalNumber("minimumFollowers"), maximumFollowers: optionalNumber("maximumFollowers"),
          minimumEngagementRate: optionalNumber("minimumEngagementRate"), budgetPerCreator: optionalNumber("budgetPerCreator"),
          requiredCreators: Number(form.get("requiredCreators")), budget: Number(form.get("budget")),
          startDate: form.get("startDate"), endDate: form.get("endDate"),
          deliverables: String(form.get("deliverables") ?? "").split("\n").map((description) => description.trim()).filter(Boolean).map((description) => ({ description, quantity: 1 })),
          terms: form.get("terms") || undefined,
        }),
      });
      onSaved(result.message);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to update campaign draft."); }
    finally { setSaving(false); }
  }
  const dateValue = (value: unknown) => {
    const date = new Date(String(value ?? ""));
    return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
  };
  const csvValue = (value: unknown) => Array.isArray(value) ? value.map(recordText).join(", ") : "";
  const deliverables = array(campaign.deliverables).map((item) => String(item.description ?? "")).join("\n");
  return <form className="portal-panel portal-form-grid" onSubmit={(event) => void save(event)}><h2 className="portal-field-wide">Edit campaign draft</h2>
    <PortalInput label="Campaign name" name="title" defaultValue={String(campaign.title ?? "")} required />
    <PortalInput label="Objective" name="objective" defaultValue={String(campaign.objective ?? "")} required />
    <PortalInput label="Industry" name="industry" defaultValue={String(campaign.industry ?? "")} required />
    <PortalInput label="Platforms (comma separated)" name="platforms" defaultValue={csvValue(campaign.platforms)} required />
    <PortalInput label="Content types (comma separated)" name="contentTypes" defaultValue={csvValue(campaign.contentTypes)} />
    <PortalInput label="Creator categories (comma separated)" name="creatorCategories" defaultValue={csvValue(campaign.creatorCategories)} />
    <PortalInput label="Target locations (comma separated)" name="targetLocation" defaultValue={csvValue(campaign.targetLocation)} />
    <PortalInput label="Audience interests (comma separated)" name="audienceInterests" defaultValue={csvValue(campaign.audienceInterests)} />
    <PortalInput label="Audience languages (comma separated)" name="audienceLanguages" defaultValue={csvValue(campaign.audienceLanguages)} />
    <PortalInput label="Minimum followers" name="minimumFollowers" type="number" min="0" defaultValue={String(campaign.minimumFollowers ?? "")} />
    <PortalInput label="Maximum followers" name="maximumFollowers" type="number" min="0" defaultValue={String(campaign.maximumFollowers ?? "")} />
    <PortalInput label="Minimum engagement (%)" name="minimumEngagementRate" type="number" min="0" defaultValue={String(campaign.minimumEngagementRate ?? "")} />
    <PortalInput label="Creators required" name="requiredCreators" type="number" min="1" defaultValue={String(campaign.requiredCreators ?? 1)} required />
    <PortalInput label="Budget per creator" name="budgetPerCreator" type="number" min="0" defaultValue={String(campaign.budgetPerCreator ?? "")} />
    <PortalInput label="Total budget" name="budget" type="number" min="0" defaultValue={String(campaign.budget ?? 0)} required />
    <PortalInput label="Start date" name="startDate" type="date" defaultValue={dateValue(campaign.startDate)} required />
    <PortalInput label="End date" name="endDate" type="date" defaultValue={dateValue(campaign.endDate)} required />
    <label className="portal-field portal-field-wide"><span>Campaign description</span><textarea name="description" rows={4} defaultValue={String(campaign.description ?? "")} required /></label>
    <label className="portal-field portal-field-wide"><span>Target audience</span><textarea name="targetAudience" rows={2} defaultValue={String(campaign.targetAudience ?? "")} /></label>
    <PortalInput label="Target age range" name="targetAgeRange" defaultValue={String(campaign.targetAgeRange ?? "")} />
    <PortalInput label="Target gender (if relevant)" name="targetGender" defaultValue={String(campaign.targetGender ?? "")} />
    <label className="portal-field portal-field-wide"><span>Deliverables (one per line)</span><textarea name="deliverables" rows={3} defaultValue={deliverables} /></label>
    <label className="portal-field portal-field-wide"><span>Campaign terms</span><textarea name="terms" rows={3} defaultValue={String(campaign.terms ?? "")} /></label>
    {error && <p className="portal-form-error portal-field-wide" role="alert">{error}</p>}
    <div className="portal-field-wide"><Button disabled={saving}>{saving ? "Saving…" : "Save draft changes"}</Button></div>
  </form>;
}

export function PortalMessages() {
  const { data, error, loading, reload } = usePortalData<{ conversations: Row[] }>("/api/conversations");
  const [activeId, setActiveId] = useState("");
  const conversations = array(data?.conversations);
  const active = conversations.find((item) => id(item) === activeId);
  return <div className="portal-page"><PortalHeading eyebrow="PRIVATE MESSAGES" title="Conversations" description="Campaign conversations are visible only to their participants." />{loading ? <PortalLoading /> : error ? <PortalError message={error} retry={() => void reload()} /> : conversations.length ? <div className="portal-messages-layout"><nav className="portal-conversation-list">{conversations.map((conversation) => <button key={id(conversation)} className={activeId === id(conversation) ? "portal-conversation-active" : ""} onClick={() => setActiveId(id(conversation))}><b>{displayName(conversation.creator ?? conversation.brand)}</b><small>{displayName(conversation.campaign)} · {formatPortalDate(conversation.lastMessageAt)}</small></button>)}</nav>{active ? <MessageThread conversationId={id(active)} /> : <div className="portal-message-placeholder"><MessageSquareText size={28} /><p>Choose a conversation to view messages.</p></div>}</div> : <PortalEmpty title="No conversations yet" description="Campaign conversations become available when you work with an invited creator." />}</div>;
}

function MessageThread({ conversationId }: { conversationId: string }) {
  const { data, error, loading, reload } = usePortalData<{ messages: Row[] }>(`/api/conversations/${conversationId}/messages`);
  const [body, setBody] = useState("");
  const [sendError, setSendError] = useState("");
  const [attachment, setAttachment] = useState<{ url: string; name: string; mimeType: string; size: number } | null>(null);
  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSendError("");
    try { await portalRequest(`/api/conversations/${conversationId}/messages`, { method: "POST", body: JSON.stringify({ body, attachments: attachment ? [attachment] : [] }) }); setBody(""); setAttachment(null); await reload(); }
    catch (reason) { setSendError(reason instanceof Error ? reason.message : "Unable to send message."); }
  }
  return <section className="portal-message-thread">{error && <PortalError message={error} />}{loading ? <PortalLoading count={2} /> : <div className="portal-message-history">{array(data?.messages).map((message) => <article className="portal-message-bubble" key={id(message)}><b>{displayName(message.sender)}</b><p>{String(message.body ?? "")}</p><time>{formatPortalDate(message.createdAt)}</time>{array(message.attachments).map((file) => <a key={String(file.url)} href={String(file.url)} target="_blank" rel="noreferrer">{String(file.name)}</a>)}</article>)}</div>}<form className="portal-message-form" onSubmit={(event) => void send(event)}><textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="Write a message" rows={2} maxLength={5000} /><PortalFileUpload purpose="message-attachment" accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm" onUploaded={setAttachment} />{attachment && <small className="portal-attachment-label">{attachment.name}</small>}<Button>Send</Button>{sendError && <p className="portal-form-error">{sendError}</p>}</form></section>;
}

export function PortalNotifications() {
  const { data, error, loading, reload } = usePortalData<{ notifications: Row[]; unread: number }>("/api/notifications");
  async function markAll() {
    try { await portalRequest("/api/notifications/read-all", { method: "PATCH", body: JSON.stringify({}) }); await reload(); }
    catch (reason) { window.alert(reason instanceof Error ? reason.message : "Unable to mark notifications read."); }
  }
  async function markRead(notificationId: string) {
    try { await portalRequest(`/api/notifications/${notificationId}`, { method: "PATCH", body: JSON.stringify({}) }); await reload(); }
    catch (reason) { window.alert(reason instanceof Error ? reason.message : "Unable to update notification."); }
  }
  return <div className="portal-page"><PortalHeading eyebrow="UPDATES" title="Notifications" description={`${data?.unread ?? 0} unread updates in your workspace.`} action={<Button className="portal-button-secondary" onClick={() => void markAll()}>Mark all read</Button>} />{loading ? <PortalLoading /> : error ? <PortalError message={error} retry={() => void reload()} /> : array(data?.notifications).length ? <div className="portal-panel portal-list">{array(data?.notifications).map((notification) => <div className={`portal-notification-row ${notification.readAt ? "" : "portal-notification-unread"}`} key={id(notification)}><span><b>{String(notification.title)}</b><small>{String(notification.message)} · {formatPortalDate(notification.createdAt)}</small></span>{!notification.readAt && <Button className="portal-button-secondary" onClick={() => void markRead(id(notification))}>Mark read</Button>}{typeof object(notification.data).href === "string" && <Link href={String(object(notification.data).href)} aria-label="Open notification">Open</Link>}</div>)}</div> : !error && <PortalEmpty title="All caught up" description="There are no notifications to display." />}</div>;
}

function BrandBillingPage() {
  const { data, error, loading, reload } = usePortalData<{ campaignBudget: Row[]; payments: Row[]; totals: Row[] }>("/api/brand/billing");
  return <div className="portal-page">
    <PortalHeading eyebrow="CAMPAIGN FINANCE" title="Budgets & records" description="Campaign budgets are planning amounts. Payment records are entered and managed manually by the agency team." />
    {loading ? <PortalLoading /> : error ? <PortalError message={error} retry={() => void reload()} /> : <>
      <div className="portal-kpi-grid">
        {array(data?.campaignBudget).map((row, index) => <article className="portal-kpi-card" key={`budget-${index}`}><span>Campaign budgets · {String(row._id)}</span><b>{formatPortalNumber(row.total)}</b><small>{String(row.campaigns ?? 0)} campaigns</small></article>)}
        {array(data?.totals).map((row, index) => <article className="portal-kpi-card" key={index}><span>Creator payable · {String(object(row._id).status)} · {String(object(row._id).currency)}</span><b>{formatPortalNumber(row.total)}</b><small>{String(row.count)} manually recorded entries</small></article>)}
      </div>
      <div className="portal-callout"><b>Need to arrange a campaign payment?</b><p>Contact your agency manager. Payments and creator payouts are handled manually; no online checkout is available.</p></div>
      <section className="portal-panel">
        <div className="portal-panel-heading"><h2>Creator payment records</h2></div>
        {array(data?.payments).length ? <div className="portal-table-scroll"><table className="portal-table"><thead><tr><th>Campaign</th><th>Creator</th><th>Amount</th><th>Status</th><th>Reference</th><th>Date</th></tr></thead><tbody>{array(data?.payments).map((payment) => <tr key={id(payment)}><td>{displayName(payment.campaign)}</td><td>{displayName(payment.creator)}</td><td>{formatPortalNumber(payment.amount)} {String(payment.currency)}</td><td>{String(payment.status)}</td><td>{String(payment.reference ?? "—")}</td><td>{formatPortalDate(payment.paidAt ?? payment.createdAt)}</td></tr>)}</tbody></table></div> : <PortalEmpty title="No payment records" description="Agency-managed creator payment records will appear here when available." />}
      </section>
    </>}
  </div>;
}

function PortalSettingsPage({ kind }: { kind: "brand" | "creator" }) {
  return <div className="portal-page"><PortalHeading eyebrow="ACCOUNT SETTINGS" title="Security & preferences" description="Your account access follows the authenticated account and role." /><section className="portal-panel"><h2>Account security</h2><p>Passwords and email verification are managed through the secure account pages.</p><div className="portal-action-row"><Link className="portal-button portal-button-secondary" href="/forgot-password">Reset password</Link><Link className="portal-button portal-button-secondary" href={kind === "brand" ? "/brand/profile" : "/creator/profile"}>Manage profile</Link></div></section></div>;
}

function SupportPage() {
  return <div className="portal-page"><PortalHeading eyebrow="HELP & SUPPORT" title="How can we help?" description="Contact the agency team for assistance with your workspace, campaigns, or account." /><section className="portal-panel"><h2>Agency support</h2><p>For a private support request, use the contact details provided by your agency administrator. Do not send passwords, payment credentials, or other sensitive information in a message.</p><Link className="portal-button" href="/contact">Open contact page</Link></section></div>;
}
