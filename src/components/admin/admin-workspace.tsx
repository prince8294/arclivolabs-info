"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Camera, ChevronLeft, ChevronRight, CirclePlus, Download, ExternalLink, LoaderCircle, Pencil, Search, ShieldCheck, Trash2, Upload, UserPlus, X } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { UserRole } from "@/models/User";
import { FinancePayoutsPanel } from "@/components/admin/finance-payouts";
import { BrandLoader } from "@/components/brand-loader";

// Modals mount into the admin frame so they keep the admin theme variables
// while escaping the page transition's transformed/clipping containers.
function AdminModalPortal({ children }: { children: ReactNode }) {
  if (typeof document === "undefined") return null;
  return createPortal(children, document.querySelector(".admin-frame") ?? document.body);
}

type AdminRecord = Record<string, unknown> & { _id?: string; id?: string };
type Envelope<T> = { success: boolean; message: string; data?: T; errors?: Array<{ field?: string; message: string }> };
type Field = { key: string; label: string; type?: "text" | "email" | "url" | "number" | "textarea" | "date" | "select" | "csv" | "boolean" | "image"; options?: string[]; required?: boolean; hint?: string };

const resourceForSection: Record<string, string> = {
  creators: "creators", brands: "brands", campaigns: "campaigns", enquiries: "enquiries",
  "contact-messages": "contact-messages", team: "team", services: "services", blogs: "blogs",
  notifications: "notifications", "activity-logs": "activity-logs", settings: "settings",
};

const config: Record<string, { title: string; singular: string; description: string; columns: Array<[string, string]>; fields: Field[]; statuses?: string[]; create?: boolean }> = {
  creators: {
    title: "Creator network", singular: "creator", description: "Review creator profiles, applications, availability, and verification.",
    columns: [["fullName", "Creator"], ["primaryPlatform", "Platform"], ["contentCategories", "Categories"], ["followers", "Followers"], ["location", "Location"], ["engagementRate", "Engagement"], ["metricsVerificationStatus", "Metrics"], ["approvalStatus", "Approval"]],
    fields: [
      { key: "fullName", label: "Full name", required: true }, { key: "email", label: "Email", type: "email", required: true },
      { key: "phone", label: "Phone", required: true }, { key: "primaryPlatform", label: "Primary platform", required: true },
      { key: "profileImage", label: "Profile photo (Upload File)", type: "image", hint: "Choose an image file (JPG, PNG, WEBP, AVIF) from your device to upload directly to Cloudinary." },
      { key: "contentCategories", label: "Categories (comma separated)", type: "csv", required: true },
      { key: "followers", label: "Followers", type: "number", required: true }, { key: "location", label: "Location", required: true },
      { key: "instagramUsername", label: "Instagram username" }, { key: "youtubeChannel", label: "YouTube channel" },
      { key: "bio", label: "Creator bio", type: "textarea" },
      { key: "languages", label: "Languages (comma separated)", type: "csv", hint: "e.g. English, Hindi, Tamil" },
      { key: "averageLikes", label: "Average Likes", type: "number", hint: "Used to auto-calculate engagement rate" },
      { key: "averageComments", label: "Average Comments", type: "number", hint: "Used to auto-calculate engagement rate" },
      { key: "averageReelViews", label: "Average Reel Views", type: "number" },
      { key: "audienceLocation", label: "Audience Location", hint: "e.g. 60% India, 20% UAE" },
      { key: "collaborationTypes", label: "Collaboration Types (comma separated)", type: "csv", hint: "e.g. Reels, Stories, Posts, UGC" },
      { key: "pastBrandCollaborations", label: "Past Brand Collaborations (comma separated)", type: "csv" },
    ], statuses: ["pending", "approved", "rejected"], create: true,
  },
  "creator-applications": {
    title: "Creator applications", singular: "application", description: "Review applicants, record follow-ups, complete missing profile details, and approve creators into the network.",
    columns: [["referenceId", "Reference"], ["name", "Applicant"], ["email", "Email"], ["phone", "Phone"], ["primaryPlatform", "Platform"], ["socialProfile", "Social profile"], ["approvalStatus", "Status"]],
    fields: [
      { key: "name", label: "Full name" }, { key: "email", label: "Email", type: "email" },
      { key: "phone", label: "Phone / WhatsApp" }, { key: "primaryPlatform", label: "Primary platform" },
      { key: "socialProfile", label: "Social profile link or username" },
      { key: "contentCategory", label: "Content category" }, { key: "followers", label: "Followers / subscribers", type: "number" },
      { key: "location", label: "Location" }, { key: "portfolioUrl", label: "Portfolio URL", type: "url" },
      { key: "introduction", label: "Introduction", type: "textarea" },
    ], statuses: ["pending", "contacted", "qualified", "approved", "rejected"], create: false,
  },
  brands: {
    title: "Brand CRM", singular: "brand", description: "Manage company profiles and keep brand account records up to date.",
    columns: [["companyName", "Company"], ["industry", "Industry"], ["contactPerson", "Contact"], ["email", "Email"], ["phone", "Phone"], ["status", "Status"], ["createdAt", "Registered"]],
    fields: [
      { key: "companyName", label: "Company name", required: true }, { key: "contactPerson", label: "Contact person", required: true },
      { key: "email", label: "Email", type: "email", required: true }, { key: "phone", label: "Phone", required: true },
      { key: "industry", label: "Industry", required: true }, { key: "description", label: "Company description", type: "textarea", required: true },
      { key: "location", label: "Location", required: true }, { key: "country", label: "Country", required: true },
      { key: "website", label: "Website", type: "url" }, { key: "companyLogo", label: "Cloudinary logo URL", type: "url" },
    ], statuses: ["active", "pending", "suspended"], create: true,
  },
  campaigns: {
    title: "Campaigns", singular: "campaign", description: "Build and manage brand campaigns, creator assignments, budgets, and campaign dates.",
    columns: [["title", "Campaign"], ["brand", "Brand"], ["objective", "Objective"], ["platforms", "Platforms"], ["budget", "Budget"], ["selectedCreators", "Creators"], ["startDate", "Start"], ["endDate", "End"], ["status", "Status"]],
    fields: [
      { key: "title", label: "Campaign title", required: true }, { key: "brand", label: "Brand record ID", required: true, hint: "Copy the brand ID from the brand detail URL." },
      { key: "objective", label: "Objective", type: "textarea", required: true }, { key: "description", label: "Campaign description", type: "textarea", required: true },
      { key: "industry", label: "Industry", required: true }, { key: "platforms", label: "Platforms (comma separated)", type: "csv", required: true },
      { key: "contentTypes", label: "Content formats (comma separated)", type: "csv" }, { key: "targetAudience", label: "Target audience", type: "textarea" },
      { key: "budget", label: "Budget", type: "number", required: true }, { key: "currency", label: "Budget currency (ISO 4217)", hint: "Defaults to INR for new campaigns." }, { key: "startDate", label: "Start date", type: "date", required: true },
      { key: "endDate", label: "End date", type: "date", required: true }, { key: "requiredCreators", label: "Creator slots", type: "number", required: true },
      { key: "selectedCreators", label: "Selected creator IDs (comma separated)", type: "csv" }, { key: "notes", label: "Internal instructions", type: "textarea" },
      { key: "status", label: "Status", type: "select", options: ["draft", "pending", "approved", "active", "completed", "cancelled"] },
    ], statuses: ["draft", "pending", "approved", "active", "completed", "cancelled"], create: true,
  },
  enquiries: {
    title: "Brand enquiries", singular: "enquiry", description: "Manage incoming leads through the sales pipeline, assign ownership, and schedule follow-up.",
    columns: [["referenceId", "Reference"], ["name", "Contact"], ["company", "Company"], ["serviceRequired", "Service"], ["budget", "Budget"], ["assignedTo", "Assigned"], ["status", "Pipeline"], ["createdAt", "Received"]],
    fields: [
      { key: "name", label: "Contact name", required: true }, { key: "company", label: "Company", required: true }, { key: "email", label: "Email", type: "email", required: true },
      { key: "phone", label: "Phone", required: true }, { key: "serviceRequired", label: "Service", required: true }, { key: "budget", label: "Estimated budget", required: true },
      { key: "details", label: "Campaign details", type: "textarea", required: true }, { key: "preferredPlatform", label: "Preferred platform" },
    ], statuses: ["new", "contacted", "qualified", "proposal_sent", "negotiation", "converted", "rejected"], create: true,
  },
  "contact-messages": {
    title: "Contact inbox", singular: "message", description: "Review inbound messages, mark them as read, and archive resolved conversations.",
    columns: [["referenceId", "Reference"], ["name", "From"], ["email", "Email"], ["subject", "Subject"], ["status", "Status"], ["createdAt", "Received"]],
    fields: [], statuses: ["new", "read", "replied", "archived"], create: false,
  },
  team: {
    title: "Team access", singular: "team member", description: "Manage internal roles and invite trusted team members. Invitation delivery requires an email provider.",
    columns: [["name", "Name"], ["email", "Email"], ["role", "Role"], ["status", "Account"], ["lastLoginAt", "Last active"]],
    fields: [
      { key: "role", label: "Role", type: "select", options: ["admin", "manager", "campaign_manager", "creator_manager", "sales_executive", "finance_manager"] },
      { key: "status", label: "Account status", type: "select", options: ["active", "suspended", "deactivated"] },
      { key: "permissions", label: "Permission restrictions (comma separated)", type: "csv", hint: "Super Admin only. Values can restrict a role's default permissions, not add capabilities." },
    ], statuses: ["active", "suspended", "deactivated"], create: false,
  },
  services: {
    title: "Services CMS", singular: "service", description: "Publish or update the service catalog shown on the public website.",
    columns: [["title", "Service"], ["slug", "Slug"], ["description", "Description"], ["isFeatured", "Featured"], ["isActive", "Published"], ["updatedAt", "Updated"]],
    fields: [
      { key: "title", label: "Title", required: true }, { key: "slug", label: "URL slug", required: true }, { key: "description", label: "Short description", type: "textarea", required: true },
      { key: "content", label: "Service content", type: "textarea", required: true }, { key: "icon", label: "Icon name" }, { key: "featuredImage", label: "Cloudinary image URL", type: "url" },
      { key: "isFeatured", label: "Featured", type: "boolean" }, { key: "isActive", label: "Published", type: "boolean" },
    ], create: true,
  },
  blogs: {
    title: "Insights CMS", singular: "article", description: "Draft and publish safe, plain-text insight articles for the public site.",
    columns: [["title", "Article"], ["slug", "Slug"], ["category", "Category"], ["isPublished", "Published"], ["publishedAt", "Published date"], ["updatedAt", "Updated"]],
    fields: [
      { key: "title", label: "Title", required: true }, { key: "slug", label: "URL slug", required: true }, { key: "excerpt", label: "Excerpt", type: "textarea", required: true },
      { key: "content", label: "Article content (plain text)", type: "textarea", required: true }, { key: "category", label: "Category", required: true }, { key: "tags", label: "Tags (comma separated)", type: "csv" },
      { key: "featuredImage", label: "Cloudinary image URL", type: "url" }, { key: "isPublished", label: "Published", type: "boolean" }, { key: "publishedAt", label: "Publish date", type: "date" },
    ], create: true,
  },
  notifications: {
    title: "Notifications", singular: "notification", description: "Inbox notifications for creator applications, brand enquiries, and new contact messages.",
    columns: [["title", "Notification"], ["message", "Details"], ["readAt", "Read"], ["createdAt", "Received"]],
    fields: [], create: false,
  },
  "activity-logs": {
    title: "Activity log", singular: "activity event", description: "Append-only record of administrative changes and incoming business activity.",
    columns: [["action", "Action"], ["resourceType", "Entity"], ["resourceId", "Record ID"], ["actor", "User"], ["createdAt", "Time"]],
    fields: [], create: false,
  },
  settings: {
    title: "Agency settings", singular: "settings record", description: "Maintain the public agency profile. Integration fields show configuration status only; secret values are never displayed.",
    columns: [["agencyName", "Agency"], ["contactEmail", "Contact email"], ["currency", "Default currency"], ["emailProviderStatus", "Email"], ["storageProviderStatus", "Cloudinary storage"], ["scheduledJobsStatus", "Scheduled jobs"], ["updatedAt", "Updated"]],
    fields: [
      { key: "agencyName", label: "Agency name" }, { key: "logoUrl", label: "Logo URL", type: "url" }, { key: "contactEmail", label: "Contact email", type: "email" },
      { key: "contactPhone", label: "Contact phone" }, { key: "website", label: "Website", type: "url" }, { key: "currency", label: "Default currency (ISO code)" }, { key: "timeZone", label: "Time zone" },
    ], create: true,
  },
  transactions: {
    title: "Financial records", singular: "transaction", description: "Record actual revenue and expenses. Campaign budgets are not financial transactions.",
    columns: [["type", "Type"], ["description", "Description"], ["amount", "Amount"], ["currency", "Currency"], ["occurredAt", "Date"]],
    fields: [
      { key: "type", label: "Type", type: "select", options: ["revenue", "expense"], required: true }, { key: "amount", label: "Amount", type: "number", required: true },
      { key: "currency", label: "Currency (ISO code)", required: true }, { key: "description", label: "Description", required: true }, { key: "reference", label: "Reference" },
      { key: "campaign", label: "Campaign record ID" }, { key: "occurredAt", label: "Transaction date", type: "date", required: true },
    ], create: true,
  },
};

const listEnvelope = (value: unknown): value is Envelope<{ items: AdminRecord[]; pagination?: { page: number; pages: number; total: number }; invitations?: AdminRecord[] }> =>
  typeof value === "object" && value !== null && "success" in value && "message" in value;

async function requestJson<T>(url: string, init?: RequestInit): Promise<Envelope<T>> {
  const response = await fetch(url, { ...init, credentials: "same-origin", cache: "no-store", headers: { "Content-Type": "application/json", ...init?.headers } });
  let payload: unknown;
  try { payload = await response.json(); } catch { throw new Error("The server returned an unreadable response."); }
  if (!listEnvelope(payload)) throw new Error("The server returned an unexpected response.");
  if (!response.ok || !payload.success) {
    const detail = payload.errors?.[0]?.message;
    throw new Error(detail ? `${payload.message} ${detail}` : payload.message);
  }
  return payload as Envelope<T>;
}

function text(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return new Intl.NumberFormat().format(value);
  if (Array.isArray(value)) return value.map(text).join(", ");
  if (typeof value === "object") {
    const object = value as Record<string, unknown>;
    return String(object.companyName ?? object.fullName ?? object.name ?? object.title ?? object.email ?? object._id ?? "—");
  }
  if (typeof value === "string" && /^\d{4}-\d\d-\d\dT/.test(value)) return new Date(value).toLocaleDateString();
  return String(value);
}

function label(value: string) {
  return value.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

type ReportRow = { label: string; count?: number; budget?: number; amount?: number; total?: number };

function reportRows(value: unknown[]): ReportRow[] {
  return value.flatMap((entry) => {
    if (typeof entry !== "object" || entry === null || Array.isArray(entry)) return [];
    const record = entry as Record<string, unknown>;
    const id = record._id;
    const rowLabel = typeof id === "string" || typeof id === "number"
      ? String(id)
      : typeof id === "object" && id !== null && !Array.isArray(id)
        ? Object.entries(id as Record<string, unknown>).map(([key, part]) => `${label(key)}: ${String(part)}`).join(" · ")
        : "Other";
    const row: ReportRow = { label: rowLabel };
    for (const metric of ["count", "budget", "amount", "total"] as const) {
      if (typeof record[metric] === "number") row[metric] = record[metric];
    }
    return [row];
  });
}

const reportTooltipStyle = { background: "#0b0b0b", border: "1px solid #0b0b0b", borderRadius: 6, color: "#fff", fontSize: 11, padding: "8px 10px", boxShadow: "0 14px 34px rgba(0,0,0,.22)" };
const reportTooltipLabelStyle = { color: "#a8a8a0", fontSize: 9, letterSpacing: ".08em", textTransform: "uppercase" as const };
const reportTooltipItemStyle = { color: "#f7f7f3", fontSize: 11 };

function ReportChart({ name, value }: { name: string; value: unknown[] }) {
  const rows = reportRows(value);
  const metrics = (["count", "total", "amount", "budget"] as const).filter((metric) => rows.some((row) => row[metric] !== undefined));
  const trend = /growth|trend/i.test(name);
  if (!rows.length || !metrics.length) return <p className="admin-muted">No records for this range.</p>;
  return <div className="admin-report-chart"><ResponsiveContainer width="100%" height="100%">
    {trend
      ? <LineChart data={rows} margin={{ top: 8, right: 12, left: -20, bottom: 8 }}><CartesianGrid stroke="#e8e8e1" vertical={false} /><XAxis dataKey="label" tick={{ fontSize: 10, fill: "#85857d" }} tickLine={false} axisLine={false} /><YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#85857d" }} tickLine={false} axisLine={false} /><Tooltip contentStyle={reportTooltipStyle} labelStyle={reportTooltipLabelStyle} itemStyle={reportTooltipItemStyle} cursor={{ stroke: "#c9c9c0", strokeDasharray: "3 3" }} /><Line type="monotone" dataKey={metrics[0]} stroke="#111111" strokeWidth={2} dot={{ r: 3, fill: "#111111", strokeWidth: 0 }} /></LineChart>
      : <BarChart data={rows} margin={{ top: 8, right: 12, left: -20, bottom: 8 }}><CartesianGrid stroke="#e8e8e1" vertical={false} /><XAxis dataKey="label" tick={{ fontSize: 10, fill: "#85857d" }} tickLine={false} axisLine={false} /><YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#85857d" }} tickLine={false} axisLine={false} /><Tooltip contentStyle={reportTooltipStyle} labelStyle={reportTooltipLabelStyle} itemStyle={reportTooltipItemStyle} cursor={{ fill: "rgba(17,17,17,.045)" }} />{metrics.map((metric, index) => <Bar key={metric} dataKey={metric} fill={["#111111", "#666660", "#a3a39a", "#d2d2ca"][index]} radius={[2, 2, 0, 0]} />)}</BarChart>}
  </ResponsiveContainer></div>;
}

function AdminImageUploadField({
  name,
  label,
  defaultValue,
  hint,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  hint?: string;
}) {
  const [imageUrl, setImageUrl] = useState(defaultValue ?? "");
  const [previewUrl, setPreviewUrl] = useState(defaultValue ?? "");
  const [fileName, setFileName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setImageUrl(defaultValue ?? "");
    setPreviewUrl(defaultValue ?? "");
    setUploadSuccess("");
    setUploadError("");
    setFileName("");
  }, [defaultValue]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show immediate local preview
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);
    setFileName(file.name);
    setUploading(true);
    setUploadError("");
    setUploadSuccess("");

    try {
      const fd = new FormData();
      fd.set("file", file);

      const res = await fetch("/api/admin/uploads", {
        method: "POST",
        body: fd,
        credentials: "same-origin",
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to upload image to Cloudinary.");
      }

      setImageUrl(data.data.url);
      setPreviewUrl(data.data.url);
      setUploadSuccess("✓ Image uploaded to Cloudinary!");
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed.");
      if (!imageUrl) {
        setPreviewUrl("");
        setFileName("");
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = () => {
    setImageUrl("");
    setPreviewUrl("");
    setFileName("");
    setUploadSuccess("");
    setUploadError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="admin-form-field admin-field-wide admin-image-field">
      <span>{label}</span>
      <div className="admin-image-upload-box">
        {/* Preview Area */}
        <div className="admin-image-preview-area">
          {previewUrl ? (
            <img src={previewUrl} alt="Creator preview" className="admin-image-preview-thumb" />
          ) : (
            <div className="admin-image-preview-empty">
              <Camera size={26} />
              <span>No image</span>
            </div>
          )}
        </div>

        {/* Upload Button & Actions */}
        <div className="admin-image-upload-actions">
          <div className="admin-image-btn-row">
            <button
              type="button"
              className="admin-upload-trigger-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Upload size={14} />
              <span>
                {uploading
                  ? "Uploading to Cloudinary…"
                  : previewUrl
                  ? "Change / Upload New Photo"
                  : "Choose Image File"}
              </span>
            </button>

            {previewUrl && (
              <button
                type="button"
                className="admin-clear-image-btn"
                onClick={handleRemove}
                disabled={uploading}
              >
                <Trash2 size={13} /> Remove Photo
              </button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            onChange={handleFileChange}
            disabled={uploading}
            style={{ display: "none" }}
          />

          {/* Hidden input to pass the Cloudinary URL on form submit */}
          <input type="hidden" name={name} value={imageUrl} />

          {/* Feedback messages */}
          {uploading && (
            <p className="admin-upload-hint loading">
              <LoaderCircle size={13} className="admin-spin" /> Uploading image to Cloudinary…
            </p>
          )}
          {uploadSuccess && (
            <p className="admin-upload-hint success">
              {uploadSuccess} {fileName ? `(${fileName})` : ""}
            </p>
          )}
          {uploadError && <p className="admin-upload-hint error">{uploadError}</p>}
        </div>
      </div>
      {hint && <small>{hint}</small>}
    </div>
  );
}

export function AdminWorkspace({ section, role, recordId }: { section: string; role: UserRole; recordId?: string }) {
  const searchParams = useSearchParams();
  const initialResource = section === "creators" && searchParams.get("type") === "creator-applications" ? "creator-applications" : resourceForSection[section] ?? section;
  const [resource, setResource] = useState(initialResource);
  const [items, setItems] = useState<AdminRecord[]>([]);
  const [invitations, setInvitations] = useState<AdminRecord[]>([]);
  const [record, setRecord] = useState<AdminRecord | null>(null);
  const [pendingApplications, setPendingApplications] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [modal, setModal] = useState(false);
  const [formRecord, setFormRecord] = useState<AdminRecord | null>(null);
  const [inviteForm, setInviteForm] = useState(false);
  const [inviteToken, setInviteToken] = useState("");
  const definition = config[resource];
  const canManage = role === "super_admin"
    || (role === "admin" && !["settings", "transactions"].includes(resource))
    || (role === "manager" && ["creators", "creator-applications", "campaigns", "enquiries", "contact-messages", "services", "blogs"].includes(resource))
    || (role === "creator_manager" && ["creators", "creator-applications"].includes(resource))
    || (role === "campaign_manager" && resource === "campaigns")
    || (role === "sales_executive" && ["enquiries", "contact-messages"].includes(resource))
    || (role === "finance_manager" && resource === "transactions");
  const visibleFields = definition?.fields.filter((field) => resource !== "team" || role === "super_admin" || field.key !== "permissions") ?? [];

  const load = useCallback(async () => {
    if (!definition) return;
    setLoading(true);
    setError("");
    try {
      if (recordId) {
        const result = await requestJson<AdminRecord>(`/api/admin/${resource}/${recordId}`);
        setRecord(result.data ?? null);
      } else {
        const query = new URLSearchParams({ page: String(page), limit: "15" });
        if (search.trim()) query.set("q", search.trim());
        if (status) query.set("status", status);
        const result = await requestJson<{ items: AdminRecord[]; pagination?: { page: number; pages: number; total: number }; invitations?: AdminRecord[]; pendingApplications?: number }>(`/api/admin/${resource}?${query}`);
        setItems(result.data?.items ?? []);
        setInvitations(result.data?.invitations ?? []);
        setPages(result.data?.pagination?.pages ?? 1);
        setTotal(result.data?.pagination?.total ?? 0);
        setPendingApplications(result.data?.pendingApplications ?? 0);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load records.");
    } finally { setLoading(false); }
  }, [definition, page, recordId, resource, search, status]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  if (!definition) return <section className="admin-error-state"><h1>Page not available</h1><p>This admin section is not configured.</p></section>;

  const openForm = (item?: AdminRecord) => {
    setFormRecord(item ?? null);
    setModal(true);
    setError("");
  };

  function showCreatorResource(next: "creators" | "creator-applications") {
    setResource(next);
    setPage(1);
    const url = next === "creator-applications" ? "/admin/creators?type=creator-applications" : "/admin/creators";
    window.history.replaceState(null, "", url);
  }

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const values: Record<string, unknown> = {};
    for (const field of definition.fields) {
      const raw = formData.get(field.key);
      if (field.type === "boolean") {
        values[field.key] = raw === "on";
      } else if (raw !== null && raw !== "") {
        if (field.type === "number") values[field.key] = Number(raw);
        else if (field.type === "csv") values[field.key] = String(raw).split(",").map((part) => part.trim()).filter(Boolean);
        else values[field.key] = raw;
      } else if (field.key === "profileImage") {
        values[field.key] = "";
      } else if (resource === "creator-applications" && ["email", "phone", "contentCategory", "followers", "location", "portfolioUrl", "introduction"].includes(field.key)) {
        values[field.key] = null;
      }
    }
    setSaving(true);
    setError("");
    try {
      const url = formRecord?._id ? `/api/admin/${resource}/${formRecord._id}` : `/api/admin/${resource}`;
      const response = await requestJson<AdminRecord>(url, { method: formRecord?._id ? "PATCH" : "POST", body: JSON.stringify(values) });
      setNotice(response.message);
      setModal(false);
      await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to save record."); }
    finally { setSaving(false); }
  }

  async function update(item: AdminRecord, changes: Record<string, unknown>, message: string) {
    if (!item._id) return;
    setSaving(true);
    setError("");
    try {
      const response = await requestJson(`/api/admin/${resource}/${item._id}`, { method: "PATCH", body: JSON.stringify(changes) });
      setNotice(response.message || message);
      await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to update record."); }
    finally { setSaving(false); }
  }

  async function remove(item: AdminRecord) {
    if (!item._id || !window.confirm(`Permanently remove this ${definition.singular}? This action cannot be undone.`)) return;
    setSaving(true);
    try {
      const response = await requestJson(`/api/admin/${resource}/${item._id}`, { method: "DELETE" });
      setNotice(response.message);
      await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to delete record."); }
    finally { setSaving(false); }
  }

  async function invite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setSaving(true);
    setError("");
    try {
      const result = await requestJson<{ invitationTokenForDevelopment?: string }>("/api/admin/team/invite", {
        method: "POST",
        body: JSON.stringify({ name: data.get("name"), email: data.get("email"), role: data.get("role") }),
      });
      setNotice(result.message);
      setInviteToken(result.data?.invitationTokenForDevelopment ?? "");
      event.currentTarget.reset();
      await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to create invitation."); }
    finally { setSaving(false); }
  }

  async function markAllRead() {
    try {
      const result = await requestJson("/api/admin/notifications/read-all", { method: "POST", body: "{}" });
      setNotice(result.message);
      await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to update notifications."); }
  }

  const rowActions = (item: AdminRecord) => {
    const id = item._id;
    if (!id) return null;
    if (resource === "creator-applications") return <select className="admin-row-select" aria-label="Update application status" value={String(item.approvalStatus ?? "pending")} onChange={(event) => void update(item, { approvalStatus: event.target.value }, "Application status updated.")} disabled={saving}>
      {(config["creator-applications"].statuses ?? []).map((value) => <option value={value} key={value}>{label(value)}</option>)}
    </select>;
    if (resource === "creators") return <>
      {item.approvalStatus !== "approved" && <button className="admin-small-button admin-approve" onClick={() => update(item, { approvalStatus: "approved" }, "Creator approved.")} disabled={saving}>Approve</button>}
      {item.approvalStatus !== "rejected" && <button className="admin-small-button admin-reject" onClick={() => update(item, { approvalStatus: "rejected" }, "Creator rejected.")} disabled={saving}>Reject</button>}
      <button className="admin-small-button" onClick={() => update(item, { verificationStatus: item.verificationStatus === "verified" ? "unverified" : "verified" }, "Verification updated.")} disabled={saving}><ShieldCheck size={13} />{item.verificationStatus === "verified" ? "Unverify" : "Verify"}</button>
      {item.metricsVerificationStatus === "pending" && <><button className="admin-small-button admin-approve" onClick={() => update(item, { metricsVerificationStatus: "verified" }, "Creator metrics verified.")} disabled={saving}>Verify metrics</button><button className="admin-small-button admin-reject" onClick={() => update(item, { metricsVerificationStatus: "unverified" }, "Metric verification request declined.")} disabled={saving}>Decline metrics</button></>}
      {item.metricsVerificationStatus === "verified" && <button className="admin-small-button" onClick={() => update(item, { metricsVerificationStatus: "unverified" }, "Metric verification revoked.")} disabled={saving}>Revoke metric verification</button>}
      <button className="admin-small-button" onClick={() => update(item, { featured: !item.featured }, "Featured setting updated.")} disabled={saving}>{item.featured ? "Unfeature" : "Feature"}</button>
    </>;
    if (resource === "enquiries" || resource === "contact-messages") return <select className="admin-row-select" aria-label="Update status" value={String(item.status ?? "new")} onChange={(event) => void update(item, { status: event.target.value }, "Status updated.")} disabled={saving}>
      {(config[resource].statuses ?? []).map((value) => <option value={value} key={value}>{label(value)}</option>)}
    </select>;
    if (resource === "brands") return <select className="admin-row-select" aria-label="Update brand status" value={String(item.status ?? "pending")} onChange={(event) => void update(item, { status: event.target.value }, "Brand status updated.")} disabled={saving}>
      {(config.brands.statuses ?? []).map((value) => <option value={value} key={value}>{label(value)}</option>)}
    </select>;
    if (resource === "campaigns") return <select className="admin-row-select" aria-label="Update campaign status" value={String(item.status ?? "draft")} onChange={(event) => void update(item, { status: event.target.value }, "Campaign status updated.")} disabled={saving}>
      {(config.campaigns.statuses ?? []).map((value) => <option value={value} key={value}>{label(value)}</option>)}
    </select>;
    if (resource === "team") return null;
    if (resource === "services" || resource === "blogs") return <button className="admin-small-button" onClick={() => void update(item, { [resource === "services" ? "isActive" : "isPublished"]: !(resource === "services" ? item.isActive : item.isPublished) }, "Publication status updated.")} disabled={saving}>{resource === "services" ? item.isActive ? "Unpublish" : "Publish" : item.isPublished ? "Unpublish" : "Publish"}</button>;
    if (resource === "notifications" && !item.readAt) return <button className="admin-small-button" onClick={() => void update(item, {}, "Notification marked as read.")} disabled={saving}>Mark read</button>;
    return null;
  };

  if (recordId && record) return <AdminRecordDetail section={section} resource={resource} item={record} onEdit={() => openForm(record)} definition={definition} visibleFields={visibleFields} saving={saving} error={error} notice={notice} onDelete={() => void remove(record)} canManage={canManage} modal={modal} closeModal={() => setModal(false)} submitForm={submitForm} formRecord={formRecord} />;

  return <section className="admin-resource">
    <div className="admin-page-heading">
      <div><span className="admin-eyebrow">MANAGE YOUR AGENCY</span><h1>{definition.title}</h1><p>{definition.description}</p></div>
      <div className="admin-heading-actions">
        {(resource === "creators" || resource === "creator-applications") && <button className="admin-button admin-button-secondary" onClick={() => showCreatorResource(resource === "creators" ? "creator-applications" : "creators")}>{resource === "creators" ? `Review applications${pendingApplications > 0 ? ` (${pendingApplications})` : ""}` : "Creator directory"}</button>}
        {resource === "notifications" && items.some((item) => !item.readAt) && <button className="admin-button admin-button-secondary" onClick={() => void markAllRead()}>Mark all read</button>}
        {resource === "team" && canManage && <button className="admin-button" onClick={() => setInviteForm((value) => !value)}><UserPlus size={15} /> Invite team</button>}
        {definition.create && canManage && <button className="admin-button" onClick={() => openForm()}><CirclePlus size={15} /> Add {definition.singular}</button>}
      </div>
    </div>
    {notice && <p className="admin-toast" role="status">{notice}<button onClick={() => setNotice("")} aria-label="Dismiss notification"><X size={14} /></button></p>}
    {error && <div className="admin-inline-error" role="alert">{error}<button onClick={() => setError("")} aria-label="Dismiss error"><X size={14} /></button></div>}
    {resource === "creators" && pendingApplications > 0 && <div className="admin-pending-notice" role="status">
      <span><b>{pendingApplications}</b> creator application{pendingApplications === 1 ? "" : "s"} waiting for review. Approved applications appear in the creator network.</span>
      <button type="button" className="admin-button admin-button-secondary" onClick={() => showCreatorResource("creator-applications")}>Review applications</button>
    </div>}

    {resource === "team" && inviteForm && <form className="admin-panel admin-invite-form" onSubmit={(event) => void invite(event)}>
      <div className="admin-panel-heading"><div><h2>Invite a colleague</h2><p>Invite links expire after seven days. Email delivery is not configured.</p></div><button type="button" className="admin-icon-button" onClick={() => setInviteForm(false)} aria-label="Close invite form"><X size={17} /></button></div>
      <div className="admin-inline-fields"><label>Name<input name="name" required minLength={2} maxLength={120} /></label><label>Email<input name="email" type="email" required /></label><label>Role<select name="role" defaultValue="manager">{(role === "super_admin" ? ["admin", "manager", "campaign_manager", "creator_manager", "sales_executive", "finance_manager"] : ["manager", "campaign_manager", "creator_manager", "sales_executive", "finance_manager"]).map((value) => <option value={value} key={value}>{label(value)}</option>)}</select></label><button className="admin-button" disabled={saving}>{saving ? "Creating…" : "Create invitation"}</button></div>
      {inviteToken && <p className="admin-invite-token">Development invitation token (copy once): <code>{inviteToken}</code></p>}
    </form>}

    <div className="admin-toolbar">
      <label className="admin-search"><Search size={16} /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder={`Search ${definition.title.toLowerCase()}…`} aria-label={`Search ${definition.title}`} /></label>
      {definition.statuses && <label className="admin-filter-control"><span>Status</span><select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}><option value="">All statuses</option>{definition.statuses.map((value) => <option value={value} key={value}>{label(value)}</option>)}</select></label>}
      {resource === "enquiries" && <button className="admin-button admin-button-secondary" onClick={() => window.open("/api/admin/enquiries/export", "_blank")}><Download size={15} /> Export CSV</button>}
      {resource === "transactions" && <span className="admin-filter-note">Financial access is permission-controlled.</span>}
    </div>

    <div className="admin-panel admin-table-panel">
      {loading ? <div className="admin-table-skeleton"><BrandLoader variant="inline" label="Loading records" />{Array.from({ length: 7 }, (_, index) => <div className="admin-skeleton" key={index} />)}</div>
        : items.length === 0 ? <div className="admin-empty-state"><span className="admin-empty-icon"><Search size={20} /></span><b>No records found</b><p>{search || status ? "Try changing the search or filters." : "Records will appear here as your agency starts using the system."}</p>{definition.create && canManage && <button className="admin-button" onClick={() => openForm()}><CirclePlus size={15} /> Add {definition.singular}</button>}</div>
          : <div className="admin-table-scroll"><table className="admin-table"><thead><tr>{definition.columns.map(([key, title]) => <th key={key}>{title}</th>)}<th className="admin-actions-head">Actions</th></tr></thead><tbody>
            {items.map((item, index) => <tr key={String(item._id ?? item.id ?? index)}>
              {definition.columns.map(([key]) => <td key={key} className={key === "status" || key === "approvalStatus" || key === "metricsVerificationStatus" ? "admin-status-cell" : ""}>
                {key === "fullName" || key === "companyName" || key === "title" || key === "name" || key === "referenceId"
                  ? <Link className="admin-primary-cell" href={`/admin/${section}/${String(item._id ?? item.id)}${resource !== section ? `?type=${resource}` : ""}`}>{text(item[key])}</Link>
                  : key === "status" || key === "approvalStatus" || key === "metricsVerificationStatus" || (key === "isPublished" || key === "isActive")
                    ? <span className={`admin-status-pill admin-status-${String(item[key] ?? "draft").toLowerCase()}`}>{label(text(item[key]))}</span>
                    : <span className="admin-cell-text">{text(key === "actor" ? (item.actor as AdminRecord | undefined)?.name : item[key])}</span>}
              </td>)}
              <td><div className="admin-row-actions">
                <Link href={`/admin/${section}/${String(item._id ?? item.id)}${resource !== section ? `?type=${resource}` : ""}`} className="admin-icon-button" aria-label={`View ${definition.singular}`}><ExternalLink size={15} /></Link>
                {canManage && visibleFields.length > 0 && <button className="admin-icon-button" onClick={() => openForm(item)} aria-label={`Edit ${definition.singular}`}><Pencil size={15} /></button>}
                {canManage && rowActions(item)}
                {canManage && !["notifications", "team", "transactions", "activity-logs", "settings"].includes(resource) && <button className="admin-icon-button admin-delete-button" onClick={() => void remove(item)} aria-label={`Delete ${definition.singular}`}><Trash2 size={15} /></button>}
              </div></td>
            </tr>)}
          </tbody></table></div>}
      {!loading && total > 0 && <div className="admin-pagination"><span>{total} record{total === 1 ? "" : "s"}</span><div><button aria-label="Previous page" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}><ChevronLeft size={16} /></button><span>Page {page} of {pages}</span><button aria-label="Next page" disabled={page >= pages} onClick={() => setPage((value) => Math.min(pages, value + 1))}><ChevronRight size={16} /></button></div></div>}
    </div>
    {resource === "transactions" && <>
      <FinancePayoutsPanel canManage={role === "super_admin" || role === "finance_manager"} />
    </>}
    {resource === "team" && invitations.length > 0 && <section className="admin-panel admin-panel-padding admin-invites-list"><div className="admin-panel-heading"><div><h2>Open invitations</h2><p>{invitations.length} invitation(s) awaiting acceptance</p></div></div><div className="admin-invitation-rows">{invitations.map((invite) => <div key={String(invite._id)}><b>{text(invite.name)}</b><span>{text(invite.email)}</span><span>{label(text(invite.role))}</span><small>Expires {text(invite.expiresAt)}</small></div>)}</div></section>}

    {modal && <AdminModalPortal><div className="admin-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setModal(false); }}>
      <form className="admin-modal" onSubmit={(event) => void submitForm(event)}>
        <div className="admin-modal-heading"><div><span className="admin-eyebrow">{formRecord ? "UPDATE RECORD" : "NEW RECORD"}</span><h2>{formRecord ? `Edit ${definition.singular}` : `Add ${definition.singular}`}</h2></div><button type="button" className="admin-icon-button" onClick={() => setModal(false)} aria-label="Close dialog"><X size={18} /></button></div>
        <div className="admin-form-grid">{visibleFields.map((field) => (
          field.type === "image" ? (
            <AdminImageUploadField
              key={field.key}
              name={field.key}
              label={field.label}
              defaultValue={String(formRecord?.[field.key] ?? "")}
              hint={field.hint}
            />
          ) : (
            <label className={`admin-form-field ${field.type === "textarea" ? "admin-field-wide" : ""}`} key={field.key}>
              <span>{field.label}{field.required && !formRecord && <i> *</i>}</span>
              {field.type === "textarea" ? <textarea name={field.key} defaultValue={String(formRecord?.[field.key] ?? "")} required={field.required && !formRecord} rows={4} />
                : field.type === "select" ? <select name={field.key} defaultValue={String(formRecord?.[field.key] ?? field.options?.[0] ?? "")}>{field.options?.map((option) => <option value={option} key={option}>{label(option)}</option>)}</select>
                  : field.type === "boolean" ? <span className="admin-checkbox-row"><input type="checkbox" name={field.key} defaultChecked={Boolean(formRecord?.[field.key])} />Enabled</span>
                    : <input name={field.key} type={field.type === "csv" ? "text" : field.type ?? "text"} defaultValue={field.type === "csv" ? toCsv(formRecord?.[field.key]) : formatInputValue(field, formRecord?.[field.key])} required={field.required && !formRecord} min={field.type === "number" ? 0 : undefined} />}
              {field.hint && <small>{field.hint}</small>}
            </label>
          )
        ))}</div>
        {error && <p className="admin-form-error" role="alert">{error}</p>}
        <div className="admin-modal-actions"><button type="button" className="admin-button admin-button-secondary" onClick={() => setModal(false)}>Cancel</button><button type="submit" className="admin-button" disabled={saving}>{saving ? <><LoaderCircle size={15} className="admin-spin" />Saving…</> : formRecord ? "Save changes" : "Create record"}</button></div>
      </form>
    </div></AdminModalPortal>}
  </section>;
}

function formatInputValue(field: Field, value: unknown) {
  if (value === undefined || value === null) return "";
  if (field.type === "date") return new Date(String(value)).toISOString().slice(0, 10);
  return String(value);
}

function toCsv(value: unknown): string {
  return Array.isArray(value) ? value.map((item) => String(item)).join(", ") : "";
}

function AdminRecordDetail({ section, resource, item, onEdit, definition, visibleFields, saving, error, notice, onDelete, canManage, modal, closeModal, submitForm, formRecord }: {
  section: string; resource: string; item: AdminRecord; onEdit: () => void; definition: (typeof config)[string];
  visibleFields: Field[];
  saving: boolean; error: string; notice: string; onDelete: () => void; canManage: boolean; modal: boolean; closeModal: () => void;
  submitForm: (event: FormEvent<HTMLFormElement>) => void; formRecord: AdminRecord | null;
}) {
  const [notes, setNotes] = useState<AdminRecord[]>([]);
  const [noteBody, setNoteBody] = useState("");
  const [noteError, setNoteError] = useState("");
  const entityType = resource === "creator-applications" || resource === "creators" ? "creator"
    : resource === "contact-messages" ? "contact" : resource === "enquiries" ? "enquiry"
      : resource === "brands" ? "brand" : resource === "campaigns" ? "campaign" : null;

  const loadNotes = useCallback(async () => {
    if (!entityType || !item._id) return;
    try {
      const result = await requestJson<{ items: AdminRecord[] }>(`/api/admin/notes?entityType=${entityType}&entityId=${item._id}`);
      setNotes(result.data?.items ?? []);
    } catch (reason) {
      setNoteError(reason instanceof Error ? reason.message : "Unable to load internal notes.");
    }
  }, [entityType, item._id]);
  useEffect(() => {
    const timer = window.setTimeout(() => { void loadNotes(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadNotes]);

  async function addNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!entityType || !item._id) return;
    try {
      await requestJson("/api/admin/notes", { method: "POST", body: JSON.stringify({ entityType, entityId: item._id, body: noteBody }) });
      setNoteBody("");
      setNoteError("");
      await loadNotes();
    } catch (reason) { setNoteError(reason instanceof Error ? reason.message : "Unable to add note."); }
  }

  const entries = Object.entries(item).filter(([key]) => !["_id", "__v", "passwordHash", "sessionVersion", "dedupeHash"].includes(key));
  return <section className="admin-resource">
    <div className="admin-page-heading"><div><Link href={`/admin/${section}`} className="admin-back-link"><ChevronLeft size={14} />Back to {definition.title}</Link><span className="admin-eyebrow">RECORD DETAIL</span><h1>{text(item.fullName ?? item.companyName ?? item.title ?? item.name ?? item.referenceId ?? item._id)}</h1><p>{definition.singular} profile and activity</p></div>
      <div className="admin-heading-actions">{canManage && definition.fields.length > 0 && <button className="admin-button admin-button-secondary" onClick={onEdit}><Pencil size={15} />Edit</button>}{canManage && !["team", "activity-logs", "settings", "transactions", "notifications"].includes(resource) && <button className="admin-button admin-button-danger" onClick={onDelete}><Trash2 size={15} />Delete</button>}</div>
    </div>
    {notice && <p className="admin-toast" role="status">{notice}</p>}{error && <p className="admin-inline-error" role="alert">{error}</p>}
    <div className="admin-detail-grid"><article className="admin-panel admin-panel-padding"><h2>Record information</h2><dl className="admin-detail-list">{entries.map(([key, value]) => <div key={key}><dt>{label(key)}</dt><dd>{key === "profileImage" && typeof value === "string" && value ? <div className="admin-detail-photo-wrapper"><img src={value} alt="Profile" className="admin-detail-photo-thumb" /></div> : text(value)}</dd></div>)}</dl></article>
      {entityType && <article className="admin-panel admin-panel-padding"><h2>Internal notes</h2><p className="admin-panel-description">Visible to authorized agency team members only.</p><div className="admin-note-list">{notes.map((note) => <div key={String(note._id)}><p>{text(note.body)}</p><small>{text((note.author as AdminRecord | undefined)?.name)} · {text(note.createdAt)}</small></div>)}{notes.length === 0 && !noteError && <p className="admin-muted">No internal notes yet.</p>}</div>{noteError && <p className="admin-form-error" role="alert">{noteError}</p>}{canManage && <form className="admin-note-form" onSubmit={(event) => void addNote(event)}><textarea value={noteBody} onChange={(event) => setNoteBody(event.target.value)} maxLength={5000} required placeholder="Add a private note…" /><button className="admin-button" disabled={!noteBody.trim()}>Add note</button></form>}</article>}
    </div>
    {resource === "creators" && <article className="admin-panel admin-panel-padding"><div className="admin-panel-heading"><div><h2>Campaign history</h2><p>Current and past campaigns featuring this creator</p></div></div><p className="admin-muted">Campaign assignments are available on campaign detail records.</p></article>}
    {modal && <AdminModalPortal><div className="admin-modal-backdrop"><form className="admin-modal" onSubmit={(event) => submitForm(event)}><div className="admin-modal-heading"><div><span className="admin-eyebrow">UPDATE RECORD</span><h2>Edit {definition.singular}</h2></div><button className="admin-icon-button" type="button" onClick={() => closeModal()} aria-label="Close dialog"><X size={18} /></button></div>
      <div className="admin-form-grid">{visibleFields.map((field) => (
        field.type === "image" ? (
          <AdminImageUploadField
            key={field.key}
            name={field.key}
            label={field.label}
            defaultValue={String(formRecord?.[field.key] ?? "")}
            hint={field.hint}
          />
        ) : (
          <label className={`admin-form-field ${field.type === "textarea" ? "admin-field-wide" : ""}`} key={field.key}><span>{field.label}</span>
            {field.type === "textarea" ? <textarea name={field.key} defaultValue={String(formRecord?.[field.key] ?? "")} rows={4} />
              : field.type === "select" ? <select name={field.key} defaultValue={String(formRecord?.[field.key] ?? field.options?.[0] ?? "")}>{field.options?.map((option) => <option value={option} key={option}>{label(option)}</option>)}</select>
                : field.type === "boolean" ? <span className="admin-checkbox-row"><input type="checkbox" name={field.key} defaultChecked={Boolean(formRecord?.[field.key])} />Enabled</span>
                  : <input name={field.key} type={field.type === "csv" ? "text" : field.type ?? "text"} defaultValue={field.type === "csv" ? toCsv(formRecord?.[field.key]) : formatInputValue(field, formRecord?.[field.key])} min={field.type === "number" ? 0 : undefined} />}
            {field.hint && <small>{field.hint}</small>}
          </label>
        )
      ))}</div>{error && <p className="admin-form-error" role="alert">{error}</p>}
      <div className="admin-modal-actions"><button type="button" className="admin-button admin-button-secondary" onClick={() => closeModal()}>Cancel</button><button type="submit" className="admin-button" disabled={saving}>{saving ? "Saving…" : "Save changes"}</button></div></form></div></AdminModalPortal>}
  </section>;
}

type ChartDatum = { label: string; value: number; secondary?: number };
type GrowthPoint = { date: string; creators: number; brands: number; enquiries: number };

const chartPalette = ["#111111", "#6f6f67", "#a3a39a", "#cbcbc3", "#e4e4dc"];
const chartAxisTick = { fontSize: 9, fill: "#8b8b83" };
const knownAnalyticsKeys = new Set([
  "range", "financeAccess", "creatorGrowth", "brandGrowth", "enquiryTrend", "campaignStatuses",
  "campaignCategories", "revenueTrend", "enquiryStatuses", "recordedTransactions", "contactMessages",
]);

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function formatCount(value: number) {
  return new Intl.NumberFormat().format(value);
}

function dateLabel(value: string) {
  if (!/^\d{4}-\d{2}(-\d{2})?$/.test(value)) return value;
  const date = new Date(`${value.length === 7 ? `${value}-01` : value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, value.length === 7 ? { month: "short", year: "2-digit" } : { day: "numeric", month: "short" }).format(date);
}

function seriesTotal(value: unknown): number {
  if (!Array.isArray(value)) return 0;
  return value.reduce((sum, item) => sum + (asNumber((item as { count?: unknown }).count) ?? 0), 0);
}

function growthSeries(data: Record<string, unknown>): GrowthPoint[] {
  const points = new Map<string, GrowthPoint>();
  const sources = [["creatorGrowth", "creators"], ["brandGrowth", "brands"], ["enquiryTrend", "enquiries"]] as const;
  for (const [source, field] of sources) {
    const series = data[source];
    if (!Array.isArray(series)) continue;
    for (const item of series) {
      const row = item as { _id?: unknown; count?: unknown };
      const date = typeof row._id === "string" ? row._id : null;
      const count = asNumber(row.count);
      if (!date || count === null) continue;
      const point = points.get(date) ?? { date, creators: 0, brands: 0, enquiries: 0 };
      point[field] = count;
      points.set(date, point);
    }
  }
  return [...points.values()].sort((a, b) => a.date.localeCompare(b.date));
}

function statusSeries(value: unknown): ChartDatum[] {
  if (!Array.isArray(value)) return [];
  const counts = new Map<string, number>();
  for (const item of value) {
    const row = item as { _id?: unknown; count?: unknown };
    const count = asNumber(row.count);
    const id = row._id;
    const name = typeof id === "string"
      ? id
      : typeof id === "object" && id !== null
        ? String((id as Record<string, unknown>).status ?? "other")
        : "other";
    if (count === null) continue;
    counts.set(name, (counts.get(name) ?? 0) + count);
  }
  return [...counts.entries()].map(([name, value]) => ({ label: name, value })).sort((a, b) => b.value - a.value);
}

function categorySeries(value: unknown): ChartDatum[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const row = item as { _id?: unknown; count?: unknown; budget?: unknown };
    const id = row._id;
    const count = asNumber(row.count);
    if (count === null) return [];
    const industry = typeof id === "object" && id !== null ? String((id as Record<string, unknown>).industry ?? "Other") : "Other";
    const budget = asNumber(row.budget);
    return [{ label: industry, value: count, ...(budget !== null ? { secondary: budget } : {}) }];
  }).sort((a, b) => b.value - a.value);
}

function transactionSeries(value: unknown): ChartDatum[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const row = item as { _id?: unknown; amount?: unknown; count?: unknown };
    const id = row._id;
    const amount = asNumber(row.amount);
    if (amount === null || typeof id !== "object" || id === null) return [];
    const type = String((id as Record<string, unknown>).type ?? "other");
    const currency = String((id as Record<string, unknown>).currency ?? "");
    const count = asNumber(row.count);
    return [{ label: `${type}${currency ? ` · ${currency}` : ""}`, value: amount, ...(count !== null ? { secondary: count } : {}) }];
  }).sort((a, b) => b.value - a.value);
}

function revenueSeries(value: unknown): { rows: Array<Record<string, number | string>>; currencies: string[] } {
  const rows = new Map<string, Record<string, number | string>>();
  const currencies = new Set<string>();
  if (!Array.isArray(value)) return { rows: [], currencies: [] };
  for (const item of value) {
    const record = item as { _id?: unknown; total?: unknown };
    const id = record._id;
    const total = asNumber(record.total);
    if (total === null || typeof id !== "object" || id === null) continue;
    const date = typeof (id as Record<string, unknown>).date === "string" ? String((id as Record<string, unknown>).date) : null;
    const currency = typeof (id as Record<string, unknown>).currency === "string" ? String((id as Record<string, unknown>).currency) : "INR";
    if (!date) continue;
    const row = rows.get(date) ?? { date };
    row[currency] = total;
    rows.set(date, row);
    currencies.add(currency);
  }
  return {
    rows: [...rows.values()].sort((a, b) => String(a.date).localeCompare(String(b.date))),
    currencies: [...currencies].sort(),
  };
}

function StatStrip({ stats }: { stats: Array<{ label: string; value: number; note: string }> }) {
  return <div className="admin-analytics-stats">
    {stats.map((stat) => <article className="admin-panel admin-stat" key={stat.label}>
      <span className="admin-kpi-label">{stat.label}</span>
      <b>{formatCount(stat.value)}</b>
      <small>{stat.note}</small>
    </article>)}
  </div>;
}

function GrowthChart({ data }: { data: Record<string, unknown> }) {
  const rows = growthSeries(data);
  const totals = rows.reduce((sum, row) => ({
    creators: sum.creators + row.creators,
    brands: sum.brands + row.brands,
    enquiries: sum.enquiries + row.enquiries,
  }), { creators: 0, brands: 0, enquiries: 0 });
  return <article className="admin-panel admin-chart-card admin-report-wide">
    <div className="admin-chart-head">
      <div><h2>Network momentum</h2><p>New creators, brands and enquiries across the selected range</p></div>
      <div className="admin-chart-key">
        <span><i style={{ background: "#111111" }} />Creators <b>{formatCount(totals.creators)}</b></span>
        <span><i style={{ background: "#77776f" }} />Brands <b>{formatCount(totals.brands)}</b></span>
        <span><i style={{ background: "#b9b9b0" }} />Enquiries <b>{formatCount(totals.enquiries)}</b></span>
      </div>
    </div>
    {rows.length ? <div className="admin-chart-frame"><ResponsiveContainer width="100%" height="100%">
      <AreaChart data={rows} margin={{ top: 12, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="analyticsGrowth" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#111111" stopOpacity={0.18} />
            <stop offset="100%" stopColor="#111111" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="#ecece6" strokeDasharray="2 5" />
        <XAxis dataKey="date" tickFormatter={dateLabel} tickLine={false} axisLine={false} tick={chartAxisTick} minTickGap={26} />
        <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={chartAxisTick} width={34} />
        <Tooltip contentStyle={reportTooltipStyle} labelStyle={reportTooltipLabelStyle} itemStyle={reportTooltipItemStyle} labelFormatter={(value) => dateLabel(String(value))} cursor={{ stroke: "#c9c9c0", strokeDasharray: "3 3" }} />
        <Area type="monotone" dataKey="creators" stroke="#111111" fill="url(#analyticsGrowth)" strokeWidth={2.2} activeDot={{ r: 4, fill: "#111111", stroke: "#fff", strokeWidth: 2 }} />
        <Area type="monotone" dataKey="brands" stroke="#77776f" fill="transparent" strokeWidth={1.8} />
        <Area type="monotone" dataKey="enquiries" stroke="#b9b9b0" fill="transparent" strokeWidth={1.8} />
      </AreaChart>
    </ResponsiveContainer></div> : <p className="admin-chart-empty">No growth activity recorded in this range.</p>}
  </article>;
}

function DonutPanel({ title, description, rows }: { title: string; description: string; rows: ChartDatum[] }) {
  const total = rows.reduce((sum, row) => sum + row.value, 0);
  return <article className="admin-panel admin-chart-card">
    <div className="admin-chart-head">
      <div><h2>{title}</h2><p>{description}</p></div>
      {total > 0 && <b className="admin-chart-total">{formatCount(total)}</b>}
    </div>
    {total > 0 ? <>
      <div className="admin-donut-wrap"><div className="admin-donut">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={rows} dataKey="value" nameKey="label" innerRadius="64%" outerRadius="92%" paddingAngle={3} stroke="none">
              {rows.map((row, index) => <Cell key={row.label} fill={chartPalette[index % chartPalette.length]} />)}
            </Pie>
            <Tooltip contentStyle={reportTooltipStyle} labelStyle={reportTooltipLabelStyle} itemStyle={reportTooltipItemStyle} />
          </PieChart>
        </ResponsiveContainer>
        <span className="admin-donut-center"><b>{formatCount(total)}</b><small>records</small></span>
      </div></div>
      <ul className="admin-donut-legend">
        {rows.map((row, index) => <li key={row.label}><i style={{ background: chartPalette[index % chartPalette.length] }} />{label(row.label)}<b>{formatCount(row.value)}</b></li>)}
      </ul>
    </> : <p className="admin-chart-empty">No records in this range.</p>}
  </article>;
}

function RankPanel({ title, description, rows, secondaryLabel = "records" }: { title: string; description: string; rows: ChartDatum[]; secondaryLabel?: string }) {
  const max = Math.max(...rows.map((row) => row.value), 1);
  return <article className="admin-panel admin-chart-card">
    <div className="admin-chart-head"><div><h2>{title}</h2><p>{description}</p></div></div>
    {rows.length ? <div className="admin-rank-list">
      {rows.map((row, index) => <div className="admin-rank-row" key={`${row.label}-${index}`}>
        <span className="admin-rank-label" title={row.label}>{label(row.label)}</span>
        <span className="admin-rank-track"><i style={{ width: `${Math.max(3, Math.round((row.value / max) * 100))}%` }} /></span>
        <span className="admin-rank-value">{formatCount(row.value)}</span>
        {row.secondary !== undefined && <small>{secondaryLabel} {formatCount(row.secondary)}</small>}
      </div>)}
    </div> : <p className="admin-chart-empty">No records in this range.</p>}
  </article>;
}

function RevenuePanel({ value }: { value: unknown }) {
  const series = revenueSeries(value);
  return <article className="admin-panel admin-chart-card admin-report-wide">
    <div className="admin-chart-head">
      <div><h2>Recorded revenue</h2><p>Saved revenue transactions by currency — campaign budgets are excluded</p></div>
      <div className="admin-chart-key">{series.currencies.map((currency, index) => <span key={currency}><i style={{ background: chartPalette[index % chartPalette.length] }} />{currency}</span>)}</div>
    </div>
    {series.rows.length ? <div className="admin-chart-frame admin-chart-frame-compact"><ResponsiveContainer width="100%" height="100%">
      <LineChart data={series.rows} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="#ecece6" strokeDasharray="2 5" />
        <XAxis dataKey="date" tickFormatter={dateLabel} tickLine={false} axisLine={false} tick={chartAxisTick} minTickGap={26} />
        <YAxis tickLine={false} axisLine={false} tick={chartAxisTick} width={46} />
        <Tooltip contentStyle={reportTooltipStyle} labelStyle={reportTooltipLabelStyle} itemStyle={reportTooltipItemStyle} labelFormatter={(label) => dateLabel(String(label))} />
        {series.currencies.map((currency, index) => <Line key={currency} type="monotone" dataKey={currency} stroke={chartPalette[index % chartPalette.length]} strokeWidth={2} dot={false} activeDot={{ r: 4, fill: "#111111", stroke: "#fff", strokeWidth: 2 }} />)}
      </LineChart>
    </ResponsiveContainer></div> : <p className="admin-chart-empty">No recorded revenue in this range.</p>}
  </article>;
}

function AnalyticsDashboard({ data }: { data: Record<string, unknown> }) {
  const enquiryTotal = data.enquiryTrend !== undefined ? seriesTotal(data.enquiryTrend) : seriesTotal(data.enquiryStatuses);
  const stats = [
    { label: "New creators", value: seriesTotal(data.creatorGrowth), note: "Joined in this range" },
    { label: "New brands", value: seriesTotal(data.brandGrowth), note: "Joined in this range" },
    { label: "Enquiries", value: enquiryTotal, note: "Received in this range" },
    ...(typeof data.contactMessages === "number" ? [{ label: "Contact messages", value: data.contactMessages, note: "Received in this range" }] : []),
  ];
  return <>
    <StatStrip stats={stats} />
    <div className="admin-report-grid">
      <GrowthChart data={data} />
      {Array.isArray(data.campaignStatuses) && <DonutPanel title="Campaign mix" description="Every saved campaign by current status" rows={statusSeries(data.campaignStatuses)} />}
      {Array.isArray(data.campaignCategories) && <RankPanel title="Campaign categories" description="Campaigns by industry, highest first" rows={categorySeries(data.campaignCategories)} secondaryLabel="budget" />}
      {Array.isArray(data.enquiryStatuses) && <RankPanel title="Enquiry pipeline" description="Leads grouped by current pipeline stage" rows={statusSeries(data.enquiryStatuses)} />}
      {Array.isArray(data.revenueTrend) && <RevenuePanel value={data.revenueTrend} />}
      {Array.isArray(data.recordedTransactions) && <RankPanel title="Recorded transactions" description="Revenue and expenses saved in this range" rows={transactionSeries(data.recordedTransactions)} />}
      {Object.entries(data).filter(([key]) => !knownAnalyticsKeys.has(key)).map(([key, value]) => <article className="admin-panel admin-chart-card" key={key}>
        <div className="admin-chart-head"><div><h2>{label(key)}</h2><p>Additional recorded metric</p></div></div>
        {Array.isArray(value) ? <ReportChart name={key} value={value} /> : <p className="admin-muted">{text(value)}</p>}
      </article>)}
    </div>
  </>;
}

export function AdminAnalyticsPage({ section }: { section: "analytics" | "reports" }) {
  return <AdminAnalytics section={section} />;
}

function AdminAnalytics({ section }: { section: "analytics" | "reports" }) {
  const [range, setRange] = useState("30d");
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const url = section === "reports" ? "/api/admin/reports" : "/api/admin/dashboard/analytics";
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const query = new URLSearchParams();
      if (from && to) { query.set("from", from); query.set("to", to); }
      else query.set("range", range);
      const result = await requestJson<Record<string, unknown>>(`${url}?${query}`);
      setData(result.data ?? null);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to load analytics."); }
    finally { setLoading(false); }
  }, [from, range, to, url]);
  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  return <section className="admin-resource"><div className="admin-page-heading"><div><span className="admin-eyebrow">MEASURE WHAT MATTERS</span><h1>{section === "reports" ? "Reports" : "Analytics"}</h1><p>Aggregated from saved records. Budgets are not treated as recognized revenue.</p></div>
    <div className="admin-heading-actions">{section === "reports" && <a className="admin-button admin-button-secondary" href={`/api/admin/reports?${from && to ? `from=${from}&to=${to}` : `range=${range}`}&format=csv`}><Download size={15} /> Export CSV</a>}</div></div>
    <div className="admin-toolbar"><label className="admin-filter-control"><span>Preset range</span><select value={range} onChange={(event) => { setRange(event.target.value); setFrom(""); setTo(""); }}><option value="7d">Last 7 days</option><option value="30d">Last 30 days</option><option value="90d">Last 90 days</option><option value="12m">Last 12 months</option></select></label><label className="admin-filter-control"><span>From</span><input type="date" value={from} onChange={(event) => setFrom(event.target.value)} /></label><label className="admin-filter-control"><span>To</span><input type="date" value={to} onChange={(event) => setTo(event.target.value)} /></label><button className="admin-button admin-button-secondary" onClick={() => void load()}>Apply range</button><button className="admin-button admin-button-secondary" onClick={() => window.print()}>Print</button></div>
    {error && <div className="admin-inline-error" role="alert">{error}</div>}
    {loading ? <div className="admin-panel admin-panel-padding"><BrandLoader variant="inline" label="Loading report" /><div className="admin-skeleton admin-chart-skeleton" /></div> : data && <AnalyticsDashboard data={data} />}
  </section>;
}

export function AdminProfile() {
  const [profile, setProfile] = useState<AdminRecord | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    void requestJson<AdminRecord>("/api/users/me").then((response) => setProfile(response.data ?? null))
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Unable to load profile."))
      .finally(() => setLoading(false));
  }, []);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      const result = await requestJson<AdminRecord>("/api/users/me", { method: "PATCH", body: JSON.stringify({ name: form.get("name"), phone: form.get("phone") }) });
      setProfile(result.data ?? null);
      setNotice(result.message);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to save profile."); }
  }
  return <section className="admin-resource"><div className="admin-page-heading"><div><span className="admin-eyebrow">YOUR ACCOUNT</span><h1>My profile</h1><p>Update your personal details. Account role changes are managed separately.</p></div></div>{loading ? <div className="admin-panel admin-panel-padding"><BrandLoader variant="inline" label="Loading your profile" /><div className="admin-skeleton admin-chart-skeleton" /></div> : <form className="admin-panel admin-panel-padding admin-profile-form" onSubmit={(event) => void save(event)}><label className="admin-form-field"><span>Full name</span><input name="name" defaultValue={String(profile?.name ?? "")} minLength={2} required /></label><label className="admin-form-field"><span>Email</span><input type="email" value={String(profile?.email ?? "")} disabled /></label><label className="admin-form-field"><span>Phone</span><input name="phone" defaultValue={String(profile?.phone ?? "")} /></label><label className="admin-form-field"><span>Role</span><input value={label(String(profile?.role ?? ""))} disabled /></label>{error && <p className="admin-form-error" role="alert">{error}</p>}{notice && <p className="admin-toast" role="status">{notice}</p>}<button className="admin-button">Save changes</button></form>}</section>;
}
