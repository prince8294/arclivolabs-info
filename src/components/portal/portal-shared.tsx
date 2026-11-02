"use client";

import { useCallback, useEffect, useState } from "react";

export type PortalEnvelope<T> = { success: boolean; message: string; data?: T; errors?: Array<{ field?: string; message: string }> };
type UploadPurpose = "profile-image" | "brand-logo" | "portfolio" | "deliverable" | "message-attachment";
export type UploadedAsset = { url: string; name: string; mimeType: string; size: number };

export async function portalRequest<T>(url: string, init?: RequestInit): Promise<PortalEnvelope<T>> {
  const response = await fetch(url, {
    ...init,
    credentials: "same-origin",
    cache: "no-store",
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  let payload: unknown;
  try { payload = await response.json(); } catch { throw new Error("The server returned an unreadable response."); }
  if (typeof payload !== "object" || payload === null || !("success" in payload) || !("message" in payload)) {
    throw new Error("The server returned an unexpected response.");
  }
  const envelope = payload as PortalEnvelope<T>;
  if (!response.ok || !envelope.success || envelope.data === undefined) {
    throw new Error(envelope.errors?.[0]?.message ? `${envelope.message} ${envelope.errors[0].message}` : envelope.message);
  }
  return envelope;
}

export function PortalFileUpload({ purpose, onUploaded, accept }: { purpose: UploadPurpose; onUploaded: (asset: UploadedAsset) => void; accept?: string }) {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  async function upload(file: File | undefined) {
    if (!file) return;
    setUploading(true); setMessage("");
    try {
      const signed = await portalRequest<{
        cloudName: string;
        apiKey: string;
        timestamp: number;
        signature: string;
        folder: string;
        publicId: string;
        uploadPreset: string;
        resourceType: "image" | "video";
      }>("/api/uploads/sign", {
        method: "POST",
        body: JSON.stringify({ purpose, fileName: file.name, contentType: file.type, size: file.size }),
      });
      if (!signed.data) throw new Error("The upload service did not return Cloudinary upload details.");
      const formData = new FormData();
      formData.set("file", file);
      formData.set("api_key", signed.data.apiKey);
      formData.set("timestamp", String(signed.data.timestamp));
      formData.set("signature", signed.data.signature);
      formData.set("folder", signed.data.folder);
      formData.set("public_id", signed.data.publicId);
      formData.set("upload_preset", signed.data.uploadPreset);
      const uploadUrl = `https://api.cloudinary.com/v1_1/${encodeURIComponent(signed.data.cloudName)}/${signed.data.resourceType}/upload`;
      const response = await fetch(uploadUrl, { method: "POST", body: formData, credentials: "omit" });
      const result: unknown = await response.json();
      if (!response.ok || !isCloudinaryUpload(result)) {
        const message = isCloudinaryError(result) ? result.error.message : `Cloudinary upload failed with status ${response.status}.`;
        throw new Error(message);
      }
      onUploaded({ url: result.secure_url, name: file.name, mimeType: file.type, size: result.bytes });
      setMessage("File uploaded.");
    } catch (reason) { setMessage(reason instanceof Error ? reason.message : "Unable to upload file."); }
    finally { setUploading(false); }
  }
  return <label className="portal-field portal-file-field"><span>Upload file to Cloudinary</span><input type="file" accept={accept ?? "image/jpeg,image/png,image/webp,image/avif"} disabled={uploading} onChange={(event) => void upload(event.target.files?.[0])} /><small>{uploading ? "Uploading securely…" : "Images and media are stored in the agency Cloudinary account."}</small>{message && <small role="status">{message}</small>}</label>;
}

function isCloudinaryUpload(value: unknown): value is { secure_url: string; bytes: number } {
  return typeof value === "object" && value !== null
    && "secure_url" in value && typeof value.secure_url === "string" && value.secure_url.startsWith("https://")
    && "bytes" in value && typeof value.bytes === "number";
}

function isCloudinaryError(value: unknown): value is { error: { message: string } } {
  return typeof value === "object" && value !== null && "error" in value
    && typeof value.error === "object" && value.error !== null
    && "message" in value.error && typeof value.error.message === "string";
}

export function usePortalData<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await portalRequest<T>(url);
      setData(response.data ?? null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load this page.");
    } finally {
      setLoading(false);
    }
  }, [url]);
  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  return { data, error, loading, reload: load, setData };
}

export function PortalHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: React.ReactNode }) {
  return <div className="portal-page-heading"><div><span className="portal-eyebrow">{eyebrow}</span><h1>{title}</h1>{description && <p>{description}</p>}</div>{action && <div className="portal-heading-actions">{action}</div>}</div>;
}

export function PortalError({ message, retry }: { message: string; retry?: () => void }) {
  return <div className="portal-error" role="alert"><p>{message}</p>{retry && <button className="portal-button portal-button-secondary" onClick={retry}>Try again</button>}</div>;
}

export function PortalLoading({ count = 3 }: { count?: number }) {
  return <div className="portal-skeleton-grid" role="status" aria-label="Loading"><span className="portal-skeleton-label">Loading workspace data…</span>{Array.from({ length: count }, (_, index) => <div className="portal-skeleton-card" key={index} />)}</div>;
}

export function PortalEmpty({ title, description }: { title: string; description: string }) {
  return <div className="portal-empty"><span>✦</span><h2>{title}</h2><p>{description}</p></div>;
}

export function formatPortalDate(value: unknown) {
  if (typeof value !== "string" && !(value instanceof Date)) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function formatPortalNumber(value: unknown) {
  return typeof value === "number" ? new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value) : "—";
}

export function recordText(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "string" && /^\d{4}-\d\d-\d\dT/.test(value)) return formatPortalDate(value);
  if (typeof value === "number") return formatPortalNumber(value);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.map(recordText).join(", ");
  if (typeof value === "object") {
    const item = value as Record<string, unknown>;
    return String(item.companyName ?? item.fullName ?? item.name ?? item.title ?? item._id ?? "—");
  }
  return String(value);
}
