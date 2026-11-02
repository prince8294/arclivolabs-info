"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ArrowRight, BadgeCheck, BriefcaseBusiness, Check, Clock3, CircleDollarSign, Package } from "lucide-react";
import {
  formatPortalDate, formatPortalNumber, PortalEmpty, PortalError, PortalFileUpload, PortalHeading, PortalLoading,
  portalRequest, recordText, usePortalData,
} from "@/components/portal/portal-shared";
import { PortalMessages, PortalNotifications } from "@/components/portal/brand-portal";

type Row = Record<string, unknown>;
function object(value: unknown): Row {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Row : {};
}
function array(value: unknown): Row[] {
  return Array.isArray(value) ? value.map(object) : [];
}
function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}
function id(value: unknown) {
  return String(object(value)._id ?? object(value).id ?? (typeof value === "string" ? value : ""));
}
function display(value: unknown) {
  const record = object(value);
  return String(record.fullName ?? record.title ?? record.companyName ?? record.name ?? "Creator profile");
}
function parsePercentageMap(input: FormDataEntryValue | null) {
  const value = String(input ?? "").trim();
  if (!value) return {};
  const entries = value.split(",").map((item) => {
    const separator = item.lastIndexOf(":");
    const label = item.slice(0, separator).trim();
    const percentage = Number(item.slice(separator + 1).trim());
    if (separator < 1 || !label || !Number.isFinite(percentage) || percentage < 0 || percentage > 100) {
      throw new Error("Audience percentages must use label:percentage pairs from 0 to 100.");
    }
    return [label, percentage] as const;
  });
  return Object.fromEntries(entries);
}
function percentageMapToText(value: unknown) {
  return Object.entries(object(value)).map(([label, amount]) => `${label}:${String(amount)}`).join(", ");
}

export function CreatorPortalPage({ section, recordId }: { section: string; recordId?: string }) {
  if (recordId && section === "campaigns") return <CreatorCampaignDetail recordId={recordId} />;
  if (recordId) return <PortalEmpty title="Page not found" description="This creator workspace page is not available." />;
  switch (section) {
    case "dashboard": return <CreatorDashboardPage />;
    case "profile": return <CreatorProfilePage />;
    case "social-accounts": return <CreatorSocialAccounts />;
    case "portfolio": return <CreatorPortfolio />;
    case "packages": return <CreatorPackages />;
    case "campaigns": return <CreatorCampaigns />;
    case "invitations": return <CreatorInvitations />;
    case "collaborations": return <CreatorCollaborations />;
    case "deliverables": return <CreatorDeliverables />;
    case "earnings": return <CreatorEarnings />;
    case "messages": return <PortalMessages />;
    case "notifications": return <PortalNotifications />;
    case "settings": return <CreatorSettings />;
    case "support": return <CreatorSupport />;
    default: return <PortalEmpty title="Page not found" description="This creator workspace page is not available." />;
  }
}

function CreatorDashboardPage() {
  const { data, error, loading, reload } = usePortalData<Row>("/api/creator/dashboard");
  if (loading) return <PortalLoading count={6} />;
  if (error) return <PortalError message={error} retry={() => void reload()} />;
  const totals = object(data?.totals);
  const profile = object(data?.profile);
  const cards = [
    { title: "Invitations", value: totals.invitations ?? 0, icon: BadgeCheck, href: "/creator/invitations" },
    { title: "Pending responses", value: totals.pendingInvitations ?? 0, icon: Clock3, href: "/creator/invitations" },
    { title: "Active collaborations", value: totals.activeCampaigns ?? 0, icon: BriefcaseBusiness, href: "/creator/collaborations" },
    { title: "Completed collaborations", value: totals.completedCampaigns ?? 0, icon: Check, href: "/creator/collaborations" },
    { title: "Pending deliverables", value: totals.pendingDeliverables ?? 0, icon: Package, href: "/creator/deliverables" },
    { title: "Payment records", value: array(totals.recordedEarnings).filter((entry) => object(entry._id).status === "paid").reduce((sum, entry) => sum + Number(entry.count ?? 0), 0), icon: CircleDollarSign, href: "/creator/earnings" },
  ];
  return <div className="portal-page"><PortalHeading eyebrow="CREATOR STUDIO" title={`Welcome${profile.fullName ? `, ${String(profile.fullName)}` : ""}`} description={profile.approvalStatus ? `Profile status: ${String(profile.approvalStatus)} · Metric verification: ${String(profile.metricsVerificationStatus ?? "unverified")}.` : `Your profile status: ${String(data?.applicationStatus ?? "not submitted")}.`} action={<Link className="portal-button" href="/creator/profile">{profile.fullName ? "Update profile" : "Complete profile"}<ArrowRight size={14} /></Link>} />
    {!profile._id && <div className="portal-callout"><b>Complete your profile and submit it for review.</b><p>Marketplace visibility is limited to profiles approved by the agency team.</p><Link className="portal-text-link" href="/creator/profile">Continue profile setup <ArrowRight size={14} /></Link></div>}
    <div className="portal-kpi-grid">{cards.map(({ title, value, icon: Icon, href }) => <Link className="portal-kpi-card" href={href} key={title}><span className="portal-kpi-icon"><Icon size={18} /></span><span>{title}</span><b>{formatPortalNumber(value)}</b></Link>)}</div>
    {Boolean(profile._id) && <section className="portal-panel"><div className="portal-panel-heading"><h2>Profile completion</h2><strong>{formatPortalNumber(profile.completion)}%</strong></div><progress className="portal-profile-progress" max={100} value={Number(profile.completion ?? 0)} aria-label="Profile completion" />{stringArray(profile.improvementSuggestions).length ? <ul className="portal-profile-suggestions">{stringArray(profile.improvementSuggestions).map((suggestion, index) => <li key={index}>{suggestion}</li>)}</ul> : <p className="portal-muted">Your profile is complete. Keep your portfolio and account metrics current.</p>}</section>}
    <div className="portal-column-grid"><section className="portal-panel"><div className="portal-panel-heading"><h2>Campaign invitations</h2><Link href="/creator/invitations">View all <ArrowRight size={14} /></Link></div>{array(data?.invitations).length ? <div className="portal-list">{array(data?.invitations).map((invitation) => <Link className="portal-list-row" href="/creator/invitations" key={id(invitation)}><span><b>{display(invitation.campaign)}</b><small>{display(invitation.brand)} · {String(invitation.status)}</small></span><strong>{formatPortalDate(invitation.deadline)}</strong></Link>)}</div> : <PortalEmpty title="No invitations yet" description="Invitations from brands will appear here." />}</section>
      <section className="portal-panel"><div className="portal-panel-heading"><h2>Upcoming deadlines</h2><Link href="/creator/deliverables">View deliverables <ArrowRight size={14} /></Link></div>{array(data?.deliverables).length ? array(data?.deliverables).map((item) => <div className="portal-list-row" key={id(item)}><span><b>{String(item.description)}</b><small>{display(item.campaign)}</small></span><strong>{formatPortalDate(item.dueAt)}</strong></div>) : <PortalEmpty title="No upcoming deadlines" description="Deliverable due dates appear once you accept an invitation." />}</section></div>
    <div className="portal-column-grid"><section className="portal-panel"><div className="portal-panel-heading"><h2>Recent campaign activity</h2><Link href="/creator/collaborations">View collaborations <ArrowRight size={14} /></Link></div>{array(data?.collaborations).length ? <div className="portal-list">{array(data?.collaborations).map((item) => <Link className="portal-list-row" href={`/creator/campaigns/${id(item)}`} key={id(item)}><span><b>{display(item.campaign)}</b><small>{display(item.brand)} · {String(item.status)}</small></span><time>{formatPortalDate(item.updatedAt)}</time></Link>)}</div> : <PortalEmpty title="No campaign activity" description="Updates to your active collaborations will show here." />}</section><section className="portal-panel"><div className="portal-panel-heading"><h2>Notifications</h2><Link href="/creator/notifications">View all <ArrowRight size={14} /></Link></div>{array(data?.notifications).length ? <div className="portal-list">{array(data?.notifications).map((notification) => <Link className="portal-list-row" href="/creator/notifications" key={id(notification)}><span><b>{String(notification.title)}</b><small>{String(notification.message)}</small></span><time>{formatPortalDate(notification.createdAt)}</time></Link>)}</div> : <PortalEmpty title="No notifications" description="Invitation, content, and payment updates will appear here." />}</section></div>
    <section className="portal-panel"><div className="portal-panel-heading"><h2>Recorded earnings</h2><Link href="/creator/earnings">View payments <ArrowRight size={14} /></Link></div>{array(totals.recordedEarnings).length ? <div className="portal-package-grid">{array(totals.recordedEarnings).map((entry, index) => <article key={index}><span>{String(object(entry._id).status)} · {String(object(entry._id).currency)}</span><b>{formatPortalNumber(entry.total)}</b><small>{String(entry.count)} finance records</small></article>)}</div> : <PortalEmpty title="No payment records" description="Only payments recorded by an authorized finance manager appear as earnings." />}</section>
  </div>;
}

function CreatorProfilePage() {
  const { data, error, loading, reload } = usePortalData<Row>("/api/creator/profile");
  if (loading) return <PortalLoading count={1} />;
  if (error) return <PortalError message={error} retry={() => void reload()} />;
  return <CreatorProfileForm key={id(data?.creator) || "new"} creator={data?.creator ? object(data.creator) : null} application={object(data?.application)} onSaved={() => void reload()} />;
}

function CreatorProfileForm({ creator, application, onSaved }: { creator: Row | null; application: Row; onSaved: () => void }) {
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [requestingMetrics, setRequestingMetrics] = useState(false);
  const [profileImage, setProfileImage] = useState(String(creator?.profileImage ?? ""));
  async function requestMetricsReview() {
    setRequestingMetrics(true); setError(""); setNotice("");
    try { const result = await portalRequest("/api/creator/profile/verify-metrics", { method: "POST", body: JSON.stringify({}) }); setNotice(result.message); onSaved(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to request metric verification."); }
    finally { setRequestingMetrics(false); }
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true); setError(""); setNotice("");
    try {
      const result = await portalRequest<{ creator: Row }>("/api/creator/profile", { method: "PATCH", body: JSON.stringify({
        fullName: form.get("fullName"), phone: form.get("phone"), profileImage: form.get("profileImage") || undefined,
        bio: form.get("bio"), instagramUsername: form.get("instagramUsername"), instagramUrl: form.get("instagramUrl") || undefined,
        youtubeChannel: form.get("youtubeChannel"), youtubeUrl: form.get("youtubeUrl") || undefined,
        primaryPlatform: form.get("primaryPlatform"), contentCategories: String(form.get("contentCategories")).split(",").map((item) => item.trim()).filter(Boolean),
        followers: Number(form.get("followers")), averageViews: Number(form.get("averageViews") || 0), engagementRate: Number(form.get("engagementRate") || 0),
        location: form.get("location"), country: form.get("country"), languages: String(form.get("languages")).split(",").map((item) => item.trim()).filter(Boolean),
        audienceDemographics: {
          ageRanges: parsePercentageMap(form.get("audienceAgeRanges")),
          gender: parsePercentageMap(form.get("audienceGender")),
          topCountries: String(form.get("audienceCountries") ?? "").split(",").map((item) => item.trim()).filter(Boolean),
        },
        portfolioUrl: form.get("portfolioUrl") || undefined, availability: form.get("availability"),
      }) });
      setNotice(result.message); onSaved();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to save profile."); }
    finally { setSaving(false); }
  }
  const profile = creator ?? {};
  return <div className="portal-page"><PortalHeading eyebrow="CREATOR PROFILE" title="Tell brands what makes you unique" description={`Your application: ${String(application.approvalStatus ?? "not submitted")}. Creator-submitted audience metrics stay unverified until reviewed by an administrator.`} />
    <section className="portal-panel"><div className="portal-panel-heading"><h2>Audience metric verification</h2><span className="portal-status">{String(profile.metricsVerificationStatus ?? "unverified")}</span></div><p>Submitted follower, view, engagement, and audience figures are not verified automatically. An agency administrator must review and verify them.</p>{profile.metricsVerificationStatus === "pending" && <p className="portal-muted">Verification requested {formatPortalDate(profile.metricsVerificationRequestedAt)}. Your figures remain unverified while the request is pending.</p>}{profile.metricsVerificationStatus === "verified" && <p className="portal-muted">Metrics last verified {formatPortalDate(profile.metricsLastVerifiedAt)}.</p>}{(!profile.metricsVerificationStatus || profile.metricsVerificationStatus === "unverified") && <button className="portal-button" type="button" disabled={!creator || requestingMetrics} onClick={() => void requestMetricsReview()}>{requestingMetrics ? "Requesting…" : creator ? "Request metric verification" : "Save your profile to request verification"}</button>}{error && <p className="portal-form-error" role="alert">{error}</p>}{notice && <p className="portal-form-success" role="status">{notice}</p>}</section>
    <form className="portal-panel portal-form-grid" onSubmit={(event) => void submit(event)}>
      <Input label="Full name" name="fullName" defaultValue={String(profile.fullName ?? "")} required />
      <Input label="Phone" name="phone" defaultValue={String(profile.phone ?? "")} required />
      <label className="portal-field"><span>Profile photo URL</span><input name="profileImage" type="url" value={profileImage} onChange={(event) => setProfileImage(event.target.value)} /></label>
      <PortalFileUpload purpose="profile-image" onUploaded={(asset) => setProfileImage(asset.url)} />
      <Input label="Primary platform" name="primaryPlatform" defaultValue={String(profile.primaryPlatform ?? "Instagram")} required />
      <Input label="Instagram username" name="instagramUsername" defaultValue={String(profile.instagramUsername ?? "")} />
      <Input label="Instagram profile URL" name="instagramUrl" type="url" defaultValue={String(profile.instagramUrl ?? "")} />
      <Input label="YouTube channel" name="youtubeChannel" defaultValue={String(profile.youtubeChannel ?? "")} />
      <Input label="YouTube profile URL" name="youtubeUrl" type="url" defaultValue={String(profile.youtubeUrl ?? "")} />
      <Input label="Content categories (comma separated)" name="contentCategories" defaultValue={array(profile.contentCategories).join(", ")} required />
      <Input label="Languages (comma separated)" name="languages" defaultValue={array(profile.languages).join(", ")} />
      <Input label="Audience age ranges (label:%, comma separated)" name="audienceAgeRanges" defaultValue={percentageMapToText(object(profile.audienceDemographics).ageRanges)} placeholder="18-24:35, 25-34:50" />
      <Input label="Audience gender split (label:%, comma separated)" name="audienceGender" defaultValue={percentageMapToText(object(profile.audienceDemographics).gender)} placeholder="Women:60, Men:40" />
      <Input label="Top audience countries (comma separated)" name="audienceCountries" defaultValue={array(object(profile.audienceDemographics).topCountries).map(recordText).join(", ")} />
      <Input label="Followers" name="followers" type="number" defaultValue={String(profile.followers ?? 0)} required min="0" />
      <Input label="Average views" name="averageViews" type="number" defaultValue={String(profile.averageViews ?? 0)} min="0" />
      <Input label="Engagement rate (%)" name="engagementRate" type="number" defaultValue={String(profile.engagementRate ?? 0)} min="0" max="100" step="0.01" />
      <Input label="City / region" name="location" defaultValue={String(profile.location ?? "")} required />
      <Input label="Country" name="country" defaultValue={String(profile.country ?? "")} />
      <Input label="Portfolio URL" name="portfolioUrl" type="url" defaultValue={String(profile.portfolioUrl ?? "")} />
      <label className="portal-field"><span>Availability</span><select name="availability" defaultValue={String(profile.availability ?? "available")}><option value="available">Available</option><option value="unavailable">Unavailable</option></select></label>
      <label className="portal-field portal-field-wide"><span>Creator bio</span><textarea name="bio" rows={4} defaultValue={String(profile.bio ?? "")} /></label>
      {error && <p className="portal-form-error portal-field-wide" role="alert">{error}</p>}{notice && <p className="portal-form-success portal-field-wide" role="status">{notice}</p>}
      <div className="portal-field-wide"><button className="portal-button" disabled={saving}>{saving ? "Saving…" : "Save creator profile"}</button></div>
    </form>
  </div>;
}

function Input({ label, name, defaultValue = "", type = "text", required = false, min, max, step, placeholder }: { label: string; name: string; defaultValue?: string; type?: string; required?: boolean; min?: string; max?: string; step?: string; placeholder?: string }) {
  return <label className="portal-field"><span>{label}</span><input name={name} defaultValue={defaultValue} type={type} required={required} min={min} max={max} step={step} placeholder={placeholder} /></label>;
}

function CreatorSocialAccounts() {
  const { data, error, loading, reload } = usePortalData<{ accounts: Row[] }>("/api/creator/social-accounts");
  const [notice, setNotice] = useState("");
  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const formElement = event.currentTarget; const form = new FormData(formElement);
    try {
      const result = await portalRequest("/api/creator/social-accounts", { method: "POST", body: JSON.stringify({ platform: form.get("platform"), username: form.get("username"), profileUrl: form.get("profileUrl"), followers: Number(form.get("followers")), averageViews: Number(form.get("averageViews") || 0) }) });
      setNotice(result.message); formElement.reset(); await reload();
    } catch (reason) { setNotice(reason instanceof Error ? reason.message : "Unable to add account."); }
  }
  async function remove(accountId: string) {
    try { await portalRequest(`/api/creator/social-accounts/${accountId}`, { method: "DELETE" }); await reload(); }
    catch (reason) { setNotice(reason instanceof Error ? reason.message : "Unable to remove account."); }
  }
  return <div className="portal-page"><PortalHeading eyebrow="SOCIAL PRESENCE" title="Social accounts" description="Follower and view metrics are creator-submitted and not verified unless explicitly reviewed by the agency." />
    <section className="portal-panel"><h2>Add a social account</h2><form className="portal-form-grid" onSubmit={(event) => void add(event)}><Input label="Platform" name="platform" defaultValue="Instagram" required /><Input label="Username" name="username" required /><Input label="Profile URL" name="profileUrl" type="url" required /><Input label="Followers" name="followers" type="number" min="0" required /><Input label="Average views" name="averageViews" type="number" min="0" /><div className="portal-field-wide"><button className="portal-button">Add account</button></div></form>{notice && <p className="portal-form-success" role="status">{notice}</p>}</section>
    {loading ? <PortalLoading /> : error ? <PortalError message={error} retry={() => void reload()} /> : array(data?.accounts).length ? <div className="portal-card-grid">{array(data?.accounts).map((account) => <article className="portal-panel" key={id(account)}><div className="portal-panel-heading"><h2>{String(account.platform)} · @{String(account.username)}</h2><span className="portal-status">{String(account.verificationStatus)}</span></div><p>{formatPortalNumber(account.followers)} followers · {formatPortalNumber(account.averageViews)} avg views</p><p>Last verified: {formatPortalDate(account.lastVerifiedAt)}</p><a className="portal-text-link" href={String(account.profileUrl)} target="_blank" rel="noreferrer">Open social profile <ArrowRight size={14} /></a><button className="portal-button portal-button-danger" onClick={() => void remove(id(account))}>Remove account</button></article>)}</div> : !error && <PortalEmpty title="No social accounts yet" description="Add your public creator profiles to help brands assess fit." />}</div>;
}

function CreatorPortfolio() {
  const { data, error, loading, reload } = usePortalData<{ items: Row[] }>("/api/creator/portfolio");
  const [notice, setNotice] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState("image");
  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const formElement = event.currentTarget; const form = new FormData(formElement);
    try {
      const result = await portalRequest("/api/creator/portfolio", { method: "POST", body: JSON.stringify({ title: form.get("title"), description: form.get("description"), mediaUrl: form.get("mediaUrl"), mediaType: form.get("mediaType"), categories: String(form.get("categories") ?? "").split(",").map((item) => item.trim()).filter(Boolean) }) });
      setNotice(result.message); formElement.reset(); setMediaUrl(""); setMediaType("image"); await reload();
    } catch (reason) { setNotice(reason instanceof Error ? reason.message : "Unable to add portfolio item."); }
  }
  async function remove(itemId: string) {
    try { await portalRequest(`/api/creator/portfolio/${itemId}`, { method: "DELETE" }); await reload(); }
    catch (reason) { setNotice(reason instanceof Error ? reason.message : "Unable to delete portfolio item."); }
  }
  return <div className="portal-page"><PortalHeading eyebrow="YOUR WORK" title="Portfolio" description="Upload images and videos to configured object storage, or add an externally hosted URL." />
    <section className="portal-panel"><h2>Add a portfolio example</h2><form className="portal-form-grid" onSubmit={(event) => void add(event)}><Input label="Title" name="title" required /><label className="portal-field"><span>Media URL</span><input name="mediaUrl" type="url" value={mediaUrl} onChange={(event) => setMediaUrl(event.target.value)} required /></label><PortalFileUpload purpose="portfolio" accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm" onUploaded={(asset) => { setMediaUrl(asset.url); setMediaType(asset.mimeType.startsWith("video/") ? "video" : "image"); }} /><Input label="Categories (comma separated)" name="categories" /><label className="portal-field"><span>Media type</span><select name="mediaType" value={mediaType} onChange={(event) => setMediaType(event.target.value)}><option value="image">Image</option><option value="video">Video</option><option value="link">Link</option></select></label><label className="portal-field portal-field-wide"><span>Description</span><textarea name="description" rows={2} /></label><div className="portal-field-wide"><button className="portal-button">Add to portfolio</button></div></form>{notice && <p className="portal-form-success" role="status">{notice}</p>}</section>
    {loading ? <PortalLoading /> : error ? <PortalError message={error} retry={() => void reload()} /> : array(data?.items).length ? <div className="portal-card-grid">{array(data?.items).map((item) => <article className="portal-panel" key={id(item)}><span className="portal-status">{String(item.mediaType)}</span><h2>{String(item.title)}</h2><p>{String(item.description ?? "")}</p><a className="portal-text-link" href={String(item.mediaUrl)} target="_blank" rel="noreferrer">View example <ArrowRight size={14} /></a><button className="portal-button portal-button-danger" onClick={() => void remove(id(item))}>Remove</button></article>)}</div> : !error && <PortalEmpty title="No portfolio examples" description="Add examples that represent the work you want to make." />}</div>;
}

function CreatorPackages() {
  const { data, error, loading, reload } = usePortalData<{ packages: Row[] }>("/api/creator/packages");
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState<Row | null>(null);
  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const formElement = event.currentTarget; const form = new FormData(formElement);
    try {
      const result = await portalRequest("/api/creator/packages", { method: "POST", body: JSON.stringify({ title: form.get("title"), platform: form.get("platform"), description: form.get("description"), price: Number(form.get("price")), currency: form.get("currency"), deliveryDays: Number(form.get("deliveryDays")) }) });
      setNotice(result.message); formElement.reset(); await reload();
    } catch (reason) { setNotice(reason instanceof Error ? reason.message : "Unable to create package."); }
  }
  async function remove(packageId: string) {
    try { await portalRequest(`/api/creator/packages/${packageId}`, { method: "DELETE" }); await reload(); }
    catch (reason) { setNotice(reason instanceof Error ? reason.message : "Unable to remove package."); }
  }
  async function update(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      const result = await portalRequest(`/api/creator/packages/${id(editing)}`, { method: "PATCH", body: JSON.stringify({ title: form.get("title"), platform: form.get("platform"), description: form.get("description"), price: Number(form.get("price")), currency: form.get("currency"), deliveryDays: Number(form.get("deliveryDays")) }) });
      setNotice(result.message); setEditing(null); await reload();
    } catch (reason) { setNotice(reason instanceof Error ? reason.message : "Unable to update package."); }
  }
  return <div className="portal-page"><PortalHeading eyebrow="COLLABORATION RATES" title="Packages & pricing" description="Prices are proposals. They are not payments or earnings until finance records a transaction." />
    <section className="portal-panel"><h2>Create a package</h2><form className="portal-form-grid" onSubmit={(event) => void add(event)}><Input label="Package name" name="title" required /><Input label="Platform / format" name="platform" required /><Input label="Price" name="price" type="number" min="0" required /><Input label="Currency (ISO)" name="currency" defaultValue="USD" required /><Input label="Delivery timeline (days)" name="deliveryDays" type="number" min="1" defaultValue="7" required /><label className="portal-field portal-field-wide"><span>Description</span><textarea name="description" rows={2} /></label><div className="portal-field-wide"><button className="portal-button">Save package</button></div></form>{notice && <p className="portal-form-success" role="status">{notice}</p>}</section>
    {editing && <section className="portal-panel"><h2>Edit {String(editing.title)}</h2><form className="portal-form-grid" onSubmit={(event) => void update(event)}><Input label="Package name" name="title" defaultValue={String(editing.title)} required /><Input label="Platform / format" name="platform" defaultValue={String(editing.platform)} required /><Input label="Price" name="price" type="number" min="0" defaultValue={String(editing.price)} required /><Input label="Currency (ISO)" name="currency" defaultValue={String(editing.currency)} required /><Input label="Delivery timeline (days)" name="deliveryDays" type="number" min="1" defaultValue={String(editing.deliveryDays)} required /><label className="portal-field portal-field-wide"><span>Description</span><textarea name="description" rows={2} defaultValue={String(editing.description ?? "")} /></label><div className="portal-field-wide portal-action-row"><button className="portal-button">Update package</button><button className="portal-button portal-button-secondary" type="button" onClick={() => setEditing(null)}>Cancel</button></div></form></section>}
    {loading ? <PortalLoading /> : error ? <PortalError message={error} retry={() => void reload()} /> : array(data?.packages).length ? <div className="portal-card-grid">{array(data?.packages).map((item) => <article className="portal-panel" key={id(item)}><div className="portal-panel-heading"><h2>{String(item.title)}</h2><span className="portal-status">{item.isActive ? "Visible" : "Hidden"}</span></div><p>{String(item.platform)} · {String(item.deliveryDays)} day delivery</p><p>{formatPortalNumber(item.price)} {String(item.currency)}</p><p>{String(item.description ?? "")}</p><div className="portal-action-row"><button className="portal-button portal-button-secondary" onClick={() => setEditing(item)}>Edit</button><button className="portal-button portal-button-danger" onClick={() => void remove(id(item))}>Delete package</button></div></article>)}</div> : !error && <PortalEmpty title="No packages yet" description="Add packages to make your starting rates visible to approved brands." />}</div>;
}

function CreatorCampaigns() {
  const { data, error, loading, reload } = usePortalData<{ collaborations: Row[] }>("/api/creator/campaigns");
  return <div className="portal-page"><PortalHeading eyebrow="CAMPAIGNS" title="Your collaborations" description="Campaign details appear only after you have accepted a creator invitation." />{loading ? <PortalLoading /> : error ? <PortalError message={error} retry={() => void reload()} /> : array(data?.collaborations).length ? <div className="portal-card-grid">{array(data?.collaborations).map((item) => <Link className="portal-panel portal-campaign-card" href={`/creator/campaigns/${id(item)}`} key={id(item)}><div className="portal-panel-heading"><h2>{display(item.campaign)}</h2><span className={`portal-status portal-status-${String(item.status)}`}>{String(item.status)}</span></div><p>{display(item.brand)} · due {formatPortalDate(item.deadline)}</p><b>{formatPortalNumber(item.agreedCompensation)} {String(item.currency)}</b><span className="portal-text-link">Open campaign <ArrowRight size={14} /></span></Link>)}</div> : !error && <PortalEmpty title="No campaigns" description="Accepted campaign invitations will become collaborations here." />}</div>;
}

function CreatorCampaignDetail({ recordId }: { recordId: string }) {
  const { data, error, loading, reload } = usePortalData<Row>(`/api/creator/campaigns/${recordId}`);
  if (loading) return <PortalLoading />;
  if (error) return <PortalError message={error} retry={() => void reload()} />;
  const collaboration = object(data?.collaboration);
  const campaign = object(collaboration.campaign);
  return <div className="portal-page"><Link href="/creator/campaigns" className="portal-back-link">← Collaborations</Link><PortalHeading eyebrow="COLLABORATION" title={display(campaign)} description={`${display(collaboration.brand)} · ${String(collaboration.status)}`} />
    <div className="portal-detail-grid"><section className="portal-panel"><h2>Campaign brief</h2><p>{String(campaign.description ?? "")}</p><dl className="portal-detail-list"><dt>Objective</dt><dd>{String(campaign.objective ?? "—")}</dd><dt>Platforms</dt><dd>{recordText(campaign.platforms)}</dd><dt>Timeline</dt><dd>{formatPortalDate(campaign.startDate)} — {formatPortalDate(campaign.endDate)}</dd><dt>Agreed compensation</dt><dd>{formatPortalNumber(collaboration.agreedCompensation)} {String(collaboration.currency ?? "")} · payment not recorded</dd><dt>Terms</dt><dd>{String(campaign.terms ?? "—")}</dd></dl></section><section className="portal-panel"><h2>Your deliverables</h2>{array(data?.deliverables).length ? array(data?.deliverables).map((item) => <div className="portal-deliverable-row" key={id(item)}><b>{String(item.description)}</b><span>{String(item.status)}</span><span>Due {formatPortalDate(item.dueAt)}</span>{Boolean(item.feedback) && <p>Brand feedback: {String(item.feedback)}</p>}{Boolean(item.submissionUrl) && <a className="portal-text-link" href={String(item.submissionUrl)} target="_blank" rel="noreferrer">Submitted content <ArrowRight size={14} /></a>}</div>) : <PortalEmpty title="No deliverables" description="Your campaign does not have deliverables configured yet." />}</section></div>
  </div>;
}

function CreatorInvitations() {
  const { data, error, loading, reload } = usePortalData<{ invitations: Row[] }>("/api/creator/invitations");
  const [notice, setNotice] = useState("");
  async function respond(invitationId: string, answer: "accept" | "reject") {
    setNotice("");
    try { const result = await portalRequest(`/api/creator/invitations/${invitationId}/${answer}`, { method: "POST" }); setNotice(result.message); await reload(); }
    catch (reason) { setNotice(reason instanceof Error ? reason.message : "Unable to respond to invitation."); }
  }
  return <div className="portal-page"><PortalHeading eyebrow="BRAND INVITATIONS" title="Campaign invitations" description="Review the campaign brief, proposed compensation, deliverables, and response deadline before deciding." />{notice && <p className="portal-form-success" role="status">{notice}</p>}
    {loading ? <PortalLoading /> : error ? <PortalError message={error} retry={() => void reload()} /> : array(data?.invitations).length ? <div className="portal-card-grid">{array(data?.invitations).map((item) => <article className="portal-panel" key={id(item)}><div className="portal-panel-heading"><h2>{display(item.campaign)}</h2><span className={`portal-status portal-status-${String(item.status)}`}>{String(item.status)}</span></div><p>{display(item.brand)} · {String(object(item.campaign).industry ?? "")}</p><p>{String(item.message ?? "A brand invited you to collaborate.")}</p><p><b>{formatPortalNumber(item.compensation)} {String(item.currency)}</b> · response deadline {formatPortalDate(item.expiresAt)}</p><p>Deliverables: {array(item.deliverables).map((task) => String(task.description)).join(", ")}</p>{item.status === "pending" && new Date(String(item.expiresAt)) > new Date() && <div className="portal-action-row"><button className="portal-button" onClick={() => void respond(id(item), "accept")}>Accept invitation</button><button className="portal-button portal-button-secondary" onClick={() => void respond(id(item), "reject")}>Decline</button></div>}</article>)}</div> : !error && <PortalEmpty title="No invitations" description="Campaign invitations from approved brands will appear here." />}</div>;
}

function CreatorCollaborations() {
  return <CreatorCampaigns />;
}

function CreatorDeliverables() {
  const { data, error, loading, reload } = usePortalData<{ deliverables: Row[] }>("/api/creator/deliverables");
  const [notice, setNotice] = useState("");
  const [submissionUrls, setSubmissionUrls] = useState<Record<string, string>>({});
  async function submit(event: FormEvent<HTMLFormElement>, itemId: string) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    try {
      const result = await portalRequest("/api/creator/deliverables", { method: "POST", body: JSON.stringify({ deliverableId: itemId, submissionUrl: form.get("submissionUrl"), caption: form.get("caption") }) });
      setNotice(result.message); await reload();
    } catch (reason) { setNotice(reason instanceof Error ? reason.message : "Unable to submit content."); }
  }
  return <div className="portal-page"><PortalHeading eyebrow="CONTENT DELIVERY" title="Deliverables" description="Upload content to configured object storage or submit a content URL. Brands review every submission and may request revisions." />{notice && <p className="portal-form-success" role="status">{notice}</p>}{loading ? <PortalLoading /> : error ? <PortalError message={error} retry={() => void reload()} /> : array(data?.deliverables).length ? <div className="portal-card-grid">{array(data?.deliverables).map((item) => <article className="portal-panel" key={id(item)}><div className="portal-panel-heading"><h2>{String(item.description)}</h2><span className={`portal-status portal-status-${String(item.status)}`}>{String(item.status)}</span></div><p>{display(item.campaign)} · due {formatPortalDate(item.dueAt)}</p>{Boolean(item.feedback) && <p className="portal-form-error">Revision feedback: {String(item.feedback)}</p>}{Boolean(item.submissionUrl) && <a href={String(item.submissionUrl)} className="portal-text-link" target="_blank" rel="noreferrer">Current submission <ArrowRight size={14} /></a>}{["pending", "revision_requested"].includes(String(item.status)) && <form className="portal-form-grid" onSubmit={(event) => void submit(event, id(item))}><label className="portal-field"><span>Content URL</span><input name="submissionUrl" type="url" value={submissionUrls[id(item)] ?? String(item.submissionUrl ?? "")} onChange={(event) => setSubmissionUrls((current) => ({ ...current, [id(item)]: event.target.value }))} required /></label><PortalFileUpload purpose="deliverable" accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm" onUploaded={(asset) => setSubmissionUrls((current) => ({ ...current, [id(item)]: asset.url }))} /><label className="portal-field portal-field-wide"><span>Caption / notes</span><textarea name="caption" rows={3} /></label><div className="portal-field-wide"><button className="portal-button">{item.status === "revision_requested" ? "Submit revision" : "Submit for approval"}</button></div></form>}</article>)}</div> : !error && <PortalEmpty title="No deliverables yet" description="Deliverable submission tasks will appear when you accept a collaboration." />}</div>;
}

function CreatorEarnings() {
  const { data, error, loading, reload } = usePortalData<{ transactions: Row[]; summary: Row[] }>("/api/creator/earnings");
  return <div className="portal-page"><PortalHeading eyebrow="PAYMENT RECORDS" title="Earnings" description="Only finance-recorded creator payable transactions appear here. Paid status is not independently confirmed by a bank payout provider." />{loading ? <PortalLoading /> : error ? <PortalError message={error} retry={() => void reload()} /> : array(data?.transactions).length ? <div className="portal-panel portal-table-scroll"><table className="portal-table"><thead><tr><th>Campaign</th><th>Amount</th><th>Status</th><th>Payment reference</th><th>Last status update</th><th>Paid date</th></tr></thead><tbody>{array(data?.transactions).map((payment) => { const history = array(payment.history); const latest = history.at(-1); return <tr key={id(payment)}><td>{display(payment.campaign)}</td><td>{formatPortalNumber(payment.amount)} {String(payment.currency)}</td><td><span className={`portal-status portal-status-${String(payment.status)}`}>{String(payment.status)}</span></td><td>{String(payment.reference ?? "—")}</td><td>{latest ? `${String(latest.status)} · ${formatPortalDate(latest.recordedAt)}` : "—"}</td><td>{formatPortalDate(payment.paidAt)}</td></tr>; })}</tbody></table></div> : !error && <PortalEmpty title="No earnings recorded" description="When a finance manager records a payable against an active collaboration, it will appear here." />}</div>;
}

function CreatorSettings() {
  return <div className="portal-page"><PortalHeading eyebrow="ACCOUNT SETTINGS" title="Security & preferences" description="Keep your account credentials secure and current." /><section className="portal-panel"><h2>Account security</h2><p>Change your account password and verify your email address using the secure account pages.</p><Link className="portal-button portal-button-secondary" href="/forgot-password">Reset password</Link></section></div>;
}

function CreatorSupport() {
  return <div className="portal-page"><PortalHeading eyebrow="CREATOR SUPPORT" title="Get help" description="For account and campaign support, reach out to the agency team through the public contact page." /><section className="portal-panel"><p>Never share passwords, payment credentials, or account recovery codes in campaign messages.</p><Link className="portal-button" href="/contact">Contact the agency</Link></section></div>;
}
