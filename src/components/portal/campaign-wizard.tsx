"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { z } from "zod";
import { PortalError, PortalHeading, portalRequest } from "@/components/portal/portal-shared";

const storageKey = "brand-campaign-draft-v1";
const steps = ["Basics", "Audience", "Platforms", "Creator fit", "Budget & dates", "Review"];
type WizardData = {
  title: string; objective: string; description: string; industry: string;
  targetAudience: string; targetAgeRange: string; targetGender: string; targetLocation: string; audienceInterests: string; audienceLanguages: string;
  platforms: string[]; contentTypes: string[];
  creatorCategories: string; minimumFollowers: string; maximumFollowers: string; minimumEngagementRate: string; requiredCreators: string; budgetPerCreator: string;
  budget: string; currency: string; startDate: string; endDate: string; deliverables: string; terms: string;
};
const emptyDraft: WizardData = {
  title: "", objective: "", description: "", industry: "", targetAudience: "", targetAgeRange: "", targetGender: "",
  targetLocation: "", audienceInterests: "", audienceLanguages: "", platforms: [], contentTypes: [], creatorCategories: "",
  minimumFollowers: "", maximumFollowers: "", minimumEngagementRate: "", requiredCreators: "1", budgetPerCreator: "",
  budget: "", currency: "INR", startDate: "", endDate: "", deliverables: "", terms: "",
};
const platformOptions = ["Instagram", "YouTube", "TikTok", "Twitch", "Other"] as const;
const contentOptions = ["Reels", "Stories", "Posts", "YouTube videos", "UGC content", "Short-form video", "Live stream"] as const;
const list = (value: string) => value.split(",").map((item) => item.trim()).filter(Boolean);
const campaignDraftSchema = z.object({
  title: z.string().max(160), objective: z.string().max(160), description: z.string().max(5000), industry: z.string().max(100),
  targetAudience: z.string().max(2000), targetAgeRange: z.string().max(80), targetGender: z.string().max(80),
  targetLocation: z.string().max(1000), audienceInterests: z.string().max(1000), audienceLanguages: z.string().max(500),
  platforms: z.array(z.enum(platformOptions)).max(platformOptions.length),
  contentTypes: z.array(z.enum(contentOptions)).max(contentOptions.length),
  creatorCategories: z.string().max(1000), minimumFollowers: z.string().max(20), maximumFollowers: z.string().max(20),
  minimumEngagementRate: z.string().max(20), requiredCreators: z.string().max(5), budgetPerCreator: z.string().max(20),
  budget: z.string().max(20), currency: z.string().regex(/^[A-Za-z]{3}$/), startDate: z.string().max(40), endDate: z.string().max(40),
  deliverables: z.string().max(5000), terms: z.string().max(5000),
}).partial();

export function CampaignWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<WizardData>(emptyDraft);
  const [hydrated, setHydrated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = window.localStorage.getItem(storageKey);
        if (saved) {
          const parsed: unknown = JSON.parse(saved);
          const restored = campaignDraftSchema.safeParse(parsed);
          if (restored.success) setDraft({ ...emptyDraft, ...restored.data });
          else setError("Saved campaign draft is invalid; start a fresh campaign brief.");
        }
      } catch (reason) {
        setError(reason instanceof Error ? "Saved draft could not be restored; start a fresh campaign brief." : "Saved draft could not be restored.");
      } finally { setHydrated(true); }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  function update<K extends keyof WizardData>(key: K, value: WizardData[K]) {
    const updated = { ...draft, [key]: value };
    setDraft(updated);
    if (hydrated) {
      try { window.localStorage.setItem(storageKey, JSON.stringify(updated)); }
      catch { setError("This browser could not save the campaign draft. Check available local storage before continuing."); }
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step < steps.length - 1) { setStep((current) => Math.min(current + 1, steps.length - 1)); setError(""); return; }
    setSaving(true); setError("");
    try {
      const result = await portalRequest<{ campaign: { id: string } }>("/api/brand/campaigns", {
        method: "POST",
        body: JSON.stringify({
          title: draft.title, objective: draft.objective, description: draft.description, industry: draft.industry,
          targetAudience: draft.targetAudience || undefined, targetAgeRange: draft.targetAgeRange || undefined,
          targetGender: draft.targetGender || undefined, targetLocation: list(draft.targetLocation),
          audienceInterests: list(draft.audienceInterests), audienceLanguages: list(draft.audienceLanguages),
          platforms: draft.platforms, contentTypes: draft.contentTypes, creatorCategories: list(draft.creatorCategories),
          minimumFollowers: draft.minimumFollowers ? Number(draft.minimumFollowers) : undefined,
          maximumFollowers: draft.maximumFollowers ? Number(draft.maximumFollowers) : undefined,
          minimumEngagementRate: draft.minimumEngagementRate ? Number(draft.minimumEngagementRate) : undefined,
          requiredCreators: Number(draft.requiredCreators),
          budgetPerCreator: draft.budgetPerCreator ? Number(draft.budgetPerCreator) : undefined,
          budget: Number(draft.budget), currency: draft.currency.toUpperCase(), startDate: draft.startDate, endDate: draft.endDate,
          deliverables: draft.deliverables.split("\n").map((description) => description.trim()).filter(Boolean).map((description) => ({ description, quantity: 1 })),
          terms: draft.terms || undefined,
        }),
      });
      window.localStorage.removeItem(storageKey);
      router.push(`/brand/campaigns/${result.data?.campaign.id ?? ""}`);
      router.refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to submit campaign."); }
    finally { setSaving(false); }
  }

  return <div className="portal-page"><Link href="/brand/campaigns" className="portal-back-link"><ArrowLeft size={14} /> Campaigns</Link>
    <PortalHeading eyebrow="CAMPAIGN BUILDER" title="Build your campaign brief" description="Your draft is saved in this browser while you work. Submitting creates a campaign pending agency review." />
    <ol className="portal-wizard-steps">{steps.map((title, index) => <li className={index === step ? "portal-wizard-active" : index < step ? "portal-wizard-done" : ""} key={title}><span>{index < step ? <Check size={14} /> : index + 1}</span><b>{title}</b></li>)}</ol>
    <form className="portal-panel portal-wizard-form" onSubmit={(event) => void submit(event)}>
      {step === 0 && <><h2>Campaign basics</h2><WizardInput label="Campaign name" value={draft.title} required onChange={(value) => update("title", value)} /><WizardInput label="Objective" value={draft.objective} required onChange={(value) => update("objective", value)} /><WizardInput label="Industry" value={draft.industry} required onChange={(value) => update("industry", value)} /><WizardArea label="Campaign description" value={draft.description} required onChange={(value) => update("description", value)} /></>}
      {step === 1 && <><h2>Audience</h2><WizardArea label="Target audience" value={draft.targetAudience} onChange={(value) => update("targetAudience", value)} /><WizardInput label="Target age range" value={draft.targetAgeRange} placeholder="e.g. 18–34" onChange={(value) => update("targetAgeRange", value)} /><WizardInput label="Gender (if relevant)" value={draft.targetGender} onChange={(value) => update("targetGender", value)} /><WizardInput label="Target locations (comma separated)" value={draft.targetLocation} placeholder="e.g. United States, Canada" onChange={(value) => update("targetLocation", value)} /><WizardInput label="Audience interests (comma separated)" value={draft.audienceInterests} onChange={(value) => update("audienceInterests", value)} /><WizardInput label="Languages (comma separated)" value={draft.audienceLanguages} onChange={(value) => update("audienceLanguages", value)} /></>}
      {step === 2 && <><h2>Platforms & content formats</h2><fieldset className="portal-choice-grid"><legend>Social platforms (select at least one)</legend>{platformOptions.map((option) => <label key={option}><input type="checkbox" checked={draft.platforms.includes(option)} onChange={(event) => update("platforms", event.target.checked ? [...draft.platforms, option] : draft.platforms.filter((item) => item !== option))} />{option}</label>)}</fieldset><fieldset className="portal-choice-grid"><legend>Content formats</legend>{contentOptions.map((option) => <label key={option}><input type="checkbox" checked={draft.contentTypes.includes(option)} onChange={(event) => update("contentTypes", event.target.checked ? [...draft.contentTypes, option] : draft.contentTypes.filter((item) => item !== option))} />{option}</label>)}</fieldset></>}
      {step === 3 && <><h2>Creator requirements</h2><WizardInput label="Preferred creator categories (comma separated)" value={draft.creatorCategories} onChange={(value) => update("creatorCategories", value)} /><div className="portal-form-grid"><WizardInput label="Minimum followers" type="number" value={draft.minimumFollowers} onChange={(value) => update("minimumFollowers", value)} /><WizardInput label="Maximum followers" type="number" value={draft.maximumFollowers} onChange={(value) => update("maximumFollowers", value)} /><WizardInput label="Minimum engagement (%)" type="number" value={draft.minimumEngagementRate} onChange={(value) => update("minimumEngagementRate", value)} /><WizardInput label="Number of creators" type="number" min="1" value={draft.requiredCreators} required onChange={(value) => update("requiredCreators", value)} /><WizardInput label="Budget per creator (optional)" type="number" value={draft.budgetPerCreator} onChange={(value) => update("budgetPerCreator", value)} /></div></>}
      {step === 4 && <><h2>Budget & timeline</h2><div className="portal-form-grid"><WizardInput label="Total campaign budget" type="number" min="0" value={draft.budget} required onChange={(value) => update("budget", value)} /><WizardInput label="Budget currency (ISO 4217)" value={draft.currency} required onChange={(value) => update("currency", value.toUpperCase())} /></div><div className="portal-form-grid"><WizardInput label="Start date" type="date" value={draft.startDate} required onChange={(value) => update("startDate", value)} /><WizardInput label="End date" type="date" value={draft.endDate} required onChange={(value) => update("endDate", value)} /></div><WizardArea label="Deliverables (one per line)" value={draft.deliverables} onChange={(value) => update("deliverables", value)} /><WizardArea label="Campaign terms" value={draft.terms} onChange={(value) => update("terms", value)} /></>}
      {step === 5 && <><h2>Review campaign</h2><div className="portal-review-summary">{[
        ["Name", draft.title], ["Objective", draft.objective], ["Industry", draft.industry], ["Platforms", draft.platforms.join(", ") || "None"], ["Content formats", draft.contentTypes.join(", ") || "None"], ["Audience", draft.targetAudience], ["Locations", draft.targetLocation], ["Creator categories", draft.creatorCategories], ["Creator slots", draft.requiredCreators], ["Budget", `${draft.budget} ${draft.currency}`], ["Timeline", `${draft.startDate || "Not set"} — ${draft.endDate || "Not set"}`], ["Deliverables", draft.deliverables],
      ].map(([label, value]) => <div key={label}><span>{label}</span><b>{value || "—"}</b></div>)}</div><p className="portal-muted">Submitting creates a campaign with pending approval status. Only an authorized administrator can approve it.</p></>}
      {error && <PortalError message={error} />}
      <div className="portal-wizard-actions">{step > 0 && <button className="portal-button portal-button-secondary" type="button" onClick={() => setStep((current) => current - 1)}><ArrowLeft size={14} /> Back</button>}<span />{step < steps.length - 1 ? <button className="portal-button" type="submit" disabled={step === 2 && draft.platforms.length === 0}>Continue <ArrowRight size={14} /></button> : <button className="portal-button" type="submit" disabled={saving}>{saving ? "Submitting…" : "Submit for review"}</button>}</div>
    </form>
  </div>;
}

function WizardInput({ label, value, onChange, required = false, type = "text", min, placeholder }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; type?: string; min?: string; placeholder?: string }) {
  return <label className="portal-field"><span>{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} required={required} min={min} placeholder={placeholder} /></label>;
}
function WizardArea({ label, value, onChange, required = false }: { label: string; value: string; onChange: (value: string) => void; required?: boolean }) {
  return <label className="portal-field portal-field-wide"><span>{label}</span><textarea rows={4} value={value} onChange={(event) => onChange(event.target.value)} required={required} /></label>;
}
