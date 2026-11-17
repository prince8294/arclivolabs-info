import { createHash, randomUUID } from "node:crypto";
import { ApiError } from "@/lib/api-response";
import { connectToDatabase } from "@/lib/db";
import Creator from "@/models/Creator";
import CreatorApplication from "@/models/CreatorApplication";
import ScheduledJobRun from "@/models/ScheduledJobRun";

const PROFILE_IMAGE_FOLDER = "arclivo/creators/instagram";
const DEFAULT_GRAPH_API_VERSION = "v27.0";
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

type CreatorForSync = {
  _id: unknown;
  fullName: string;
  instagramUsername?: string | null;
  profileImage?: string | null;
  profileImagePublicId?: string | null;
  profileImageSourceUrl?: string | null;
  profileImageSourceHash?: string | null;
};

type MetaMedia = {
  id?: unknown;
  caption?: unknown;
  comments_count?: unknown;
  like_count?: unknown;
  media_type?: unknown;
  media_product_type?: unknown;
  media_url?: unknown;
  permalink?: unknown;
  thumbnail_url?: unknown;
  timestamp?: unknown;
  view_count?: unknown;
  views?: unknown;
};

export type MetaProfile = {
  requested_username?: string;
  sync_error?: string;
  sync_status?: number;
  id?: unknown;
  name?: unknown;
  username?: unknown;
  biography?: unknown;
  profile_picture_url?: unknown;
  followers_count?: unknown;
  follows_count?: unknown;
  media_count?: unknown;
  website?: unknown;
  media?: { data?: unknown };
};

export type MetaInstagramSyncStatus = "updated" | "unchanged" | "failed" | "skipped";

export interface MetaInstagramSyncResult {
  creatorId: string;
  username: string;
  status: MetaInstagramSyncStatus;
  error?: string;
  cleanupWarning?: string;
}

export interface MetaInstagramSyncSummary {
  executed: boolean;
  reason?: "not_configured" | "already_running" | "already_completed" | "nothing_due";
  processedCount: number;
  updatedCount: number;
  unchangedCount: number;
  failedCount: number;
  details: MetaInstagramSyncResult[];
}

export interface MetaInstagramSyncInfo {
  lastSyncAt: string | null;
  lastSyncStatus: "succeeded" | "failed" | "processing" | "never" | "not_configured";
  processedCount: number;
  totalWithInstagram: number;
  dueCount: number;
  providerConfigured: boolean;
  providerName: "Meta Instagram Graph API";
  providerType: "meta_graph";
}

type CloudinaryUpload = { secureUrl: string; publicId: string };

function requiredConfiguration() {
  const {
    META_ACCESS_TOKEN,
    META_INSTAGRAM_ACCOUNT_ID,
    META_GRAPH_API_VERSION = DEFAULT_GRAPH_API_VERSION,
    CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET,
  } = process.env;

  if (!META_ACCESS_TOKEN || !META_INSTAGRAM_ACCOUNT_ID
    || !CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) return null;
  if (!/^v\d+\.\d+$/.test(META_GRAPH_API_VERSION)) return null;
  if (!/^\d+$/.test(META_INSTAGRAM_ACCOUNT_ID)) return null;
  if (!/^[a-z0-9][a-z0-9_-]*$/i.test(CLOUDINARY_CLOUD_NAME)) return null;

  return {
    metaAccessToken: META_ACCESS_TOKEN,
    metaInstagramAccountId: META_INSTAGRAM_ACCOUNT_ID,
    metaGraphApiVersion: META_GRAPH_API_VERSION,
    cloudinaryCloudName: CLOUDINARY_CLOUD_NAME,
    cloudinaryApiKey: CLOUDINARY_API_KEY,
    cloudinaryApiSecret: CLOUDINARY_API_SECRET,
  };
}

export function normalizeInstagramUsername(raw?: string | null): string {
  if (!raw) return "";
  let handle = raw.trim();
  if (/^https?:\/\//i.test(handle)) {
    try {
      const url = new URL(handle);
      handle = url.pathname.split("/").filter(Boolean)[0] || "";
    } catch {
      return "";
    }
  }
  handle = handle.replace(/^@+/, "").replace(/\/+$/, "").split("?")[0].trim().toLowerCase();
  return /^[a-z0-9._]{1,30}$/.test(handle) ? handle : "";
}

function sleep(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function fetchWithRetry(
  input: string | URL,
  init: RequestInit,
  attempts = 3,
  timeoutMs = 30_000,
): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const response = await fetch(input, { ...init, signal: AbortSignal.timeout(timeoutMs) });
      if (response.status !== 429 && response.status < 500) return response;
      if (attempt === attempts - 1) return response;
      const retryAfter = Number(response.headers.get("retry-after"));
      const delay = Number.isFinite(retryAfter) && retryAfter > 0
        ? Math.min(retryAfter * 1000, 30_000)
        : (2 ** attempt) * 1000;
      await sleep(delay + Math.floor(Math.random() * 250));
    } catch (error) {
      lastError = error;
      if (attempt === attempts - 1) throw error;
      await sleep((2 ** attempt) * 1000);
    }
  }
  throw lastError instanceof Error ? lastError : new Error("External request failed.");
}

async function responseError(response: Response, provider: string) {
  const body = (await response.text()).slice(0, 500).trim();
  return `${provider} returned HTTP ${response.status}${body ? `: ${body}` : ""}`;
}

export function metaApiFailure(body: string, responseStatus: number): { message: string; status: number } {
  try {
    const parsed = JSON.parse(body) as { error?: { code?: unknown; message?: unknown } };
    const code = typeof parsed.error?.code === "number" ? parsed.error.code : null;
    const message = typeof parsed.error?.message === "string" ? parsed.error.message : "Meta request failed.";
    if (code === 10) {
      return {
        message: `Meta permission denied (#10): ${message}. Grant Advanced Access for instagram_basic and pages_read_engagement, then switch the Meta app to Live mode.`,
        status: 403,
      };
    }
    if (code === 190) {
      return {
        message: `Meta access token is invalid or expired (#190). Generate a new long-lived token, update META_ACCESS_TOKEN, and restart the app. Meta says: ${message}`,
        status: 401,
      };
    }
    return {
      message: `Meta Graph API error${code === null ? "" : ` #${code}`}: ${message}`,
      status: responseStatus === 429 ? 429 : 502,
    };
  } catch {
    return {
      message: `Meta Graph API returned HTTP ${responseStatus}.`,
      status: responseStatus === 429 ? 429 : 502,
    };
  }
}

async function metaResponseError(response: Response) {
  const body = (await response.text()).slice(0, 2_000).trim();
  return metaApiFailure(body, response.status);
}

async function fetchMetaProfile(
  username: string,
  config: NonNullable<ReturnType<typeof requiredConfiguration>>,
): Promise<MetaProfile> {
  if (!username) return { requested_username: username, sync_error: "Invalid Instagram username." };
  const fields = [
    `business_discovery.username(${username}){`,
    "id,name,username,biography,profile_picture_url,followers_count,follows_count,media_count,website,",
    "media.limit(12){id,caption,comments_count,like_count,media_type,media_product_type,media_url,permalink,thumbnail_url,timestamp,view_count}",
    "}",
  ].join("");
  const endpoint = new URL(
    `https://graph.facebook.com/${config.metaGraphApiVersion}/${config.metaInstagramAccountId}`,
  );
  endpoint.searchParams.set("fields", fields);

  try {
    const response = await fetchWithRetry(endpoint, {
      headers: { Authorization: `Bearer ${config.metaAccessToken}` },
    });
    if (!response.ok) {
      const failure = await metaResponseError(response);
      return { requested_username: username, sync_error: failure.message, sync_status: failure.status };
    }
    const payload = await response.json() as { business_discovery?: unknown };
    if (!payload.business_discovery || typeof payload.business_discovery !== "object") {
      return { requested_username: username, sync_error: "Meta returned no Business Discovery profile." };
    }
    return { requested_username: username, ...(payload.business_discovery as MetaProfile) };
  } catch (error) {
    return {
      requested_username: username,
      sync_error: error instanceof Error ? error.message : "Meta Graph API request failed.",
      sync_status: error instanceof Error && error.name === "TimeoutError" ? 504 : 502,
    };
  }
}

async function fetchMetaProfiles(
  creators: CreatorForSync[],
  config: NonNullable<ReturnType<typeof requiredConfiguration>>,
) {
  const profiles: MetaProfile[] = new Array(creators.length);
  let nextIndex = 0;
  const workers = Array.from({ length: Math.min(3, creators.length) }, async () => {
    while (nextIndex < creators.length) {
      const index = nextIndex++;
      const username = normalizeInstagramUsername(creators[index].instagramUsername);
      profiles[index] = await fetchMetaProfile(username, config);
    }
  });
  await Promise.all(workers);
  return profiles;
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function numberValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? Math.round(value) : undefined;
}

export function profileUsername(record: MetaProfile): string {
  return normalizeInstagramUsername(stringValue(record.username) || record.requested_username);
}

export function profileImageUrl(record: MetaProfile): string {
  return stringValue(record.profile_picture_url);
}

export function isAllowedInstagramImageUrl(rawUrl: string): boolean {
  try {
    const url = new URL(rawUrl);
    if (url.protocol !== "https:") return false;
    const hostname = url.hostname.toLowerCase();
    return hostname === "cdninstagram.com" || hostname.endsWith(".cdninstagram.com")
      || hostname === "fbcdn.net" || hostname.endsWith(".fbcdn.net");
  } catch {
    return false;
  }
}

async function downloadInstagramImage(rawUrl: string) {
  if (!isAllowedInstagramImageUrl(rawUrl)) {
    throw new Error("Meta returned an unsupported Instagram image host.");
  }
  const response = await fetchWithRetry(rawUrl, { redirect: "follow", headers: { Accept: "image/*" } });
  if (!response.ok) throw new Error(await responseError(response, "Instagram image"));
  if (!isAllowedInstagramImageUrl(response.url)) {
    throw new Error("Instagram profile image redirected to an unsupported host.");
  }
  const contentType = response.headers.get("content-type")?.split(";")[0].trim().toLowerCase() || "";
  if (!contentType.startsWith("image/") || contentType === "image/svg+xml") {
    throw new Error("Instagram profile image did not return a supported raster image.");
  }
  const contentLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_IMAGE_BYTES) {
    throw new Error("Instagram profile image exceeds the 10 MB limit.");
  }
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (!bytes.length || bytes.length > MAX_IMAGE_BYTES) {
    throw new Error("Instagram profile image is empty or exceeds the 10 MB limit.");
  }
  return { bytes, contentType, hash: createHash("sha256").update(bytes).digest("hex") };
}

function cloudinarySignature(parameters: Record<string, string | number | boolean>, secret: string) {
  const signatureBase = Object.entries(parameters)
    .filter(([, value]) => value !== "")
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
  return createHash("sha1").update(`${signatureBase}${secret}`).digest("hex");
}

async function uploadToCloudinary(
  folder: string,
  image: { bytes: Uint8Array; contentType: string },
  config: NonNullable<ReturnType<typeof requiredConfiguration>>,
): Promise<CloudinaryUpload> {
  const timestamp = Math.floor(Date.now() / 1000);
  const publicId = randomUUID();
  const parameters = { folder, public_id: publicId, timestamp };
  const form = new FormData();
  const uploadBytes = image.bytes.buffer.slice(
    image.bytes.byteOffset,
    image.bytes.byteOffset + image.bytes.byteLength,
  ) as ArrayBuffer;
  form.set("file", new Blob([uploadBytes], { type: image.contentType }), "instagram-profile-image");
  form.set("api_key", config.cloudinaryApiKey);
  form.set("folder", folder);
  form.set("public_id", publicId);
  form.set("timestamp", String(timestamp));
  form.set("signature", cloudinarySignature(parameters, config.cloudinaryApiSecret));

  const response = await fetchWithRetry(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(config.cloudinaryCloudName)}/image/upload`,
    { method: "POST", body: form },
    3,
    45_000,
  );
  const result = await response.json() as {
    secure_url?: unknown; public_id?: unknown; resource_type?: unknown; error?: { message?: unknown };
  };
  if (!response.ok || typeof result.secure_url !== "string" || typeof result.public_id !== "string"
    || result.resource_type !== "image") {
    const message = typeof result.error?.message === "string" ? result.error.message : `HTTP ${response.status}`;
    throw new Error(`Cloudinary upload failed: ${message}`);
  }
  if (result.public_id !== `${folder}/${publicId}`) throw new Error("Cloudinary returned an unexpected public ID.");
  return { secureUrl: result.secure_url, publicId: result.public_id };
}

export function isManagedProfileImagePublicId(publicId?: string | null): boolean {
  if (!publicId || !publicId.startsWith(`${PROFILE_IMAGE_FOLDER}/`) || publicId.includes("..")) return false;
  const assetName = publicId.split("/").at(-1) || "";
  return !/^default(?:[-_]|$)/i.test(assetName);
}

async function validateCloudinaryImage(urlValue: string, cloudName: string) {
  const url = new URL(urlValue);
  if (url.protocol !== "https:" || url.hostname !== "res.cloudinary.com"
    || !url.pathname.startsWith(`/${cloudName}/image/upload/`)) {
    throw new Error("Cloudinary returned an invalid delivery URL.");
  }
  for (let attempt = 0; attempt < 3; attempt++) {
    let response = await fetch(url, { method: "HEAD", redirect: "follow", signal: AbortSignal.timeout(20_000) });
    if (!response.ok || !response.headers.get("content-type")?.toLowerCase().startsWith("image/")) {
      response = await fetch(url, {
        headers: { Range: "bytes=0-0", Accept: "image/*" },
        redirect: "follow",
        signal: AbortSignal.timeout(20_000),
      });
    }
    if (response.ok && response.headers.get("content-type")?.toLowerCase().startsWith("image/")) return;
    if (attempt < 2) await sleep(1_000 * (attempt + 1));
  }
  throw new Error("The uploaded Cloudinary image is not publicly accessible.");
}

async function destroyCloudinaryImage(
  publicId: string,
  config: NonNullable<ReturnType<typeof requiredConfiguration>>,
) {
  if (!isManagedProfileImagePublicId(publicId)) return;
  const timestamp = Math.floor(Date.now() / 1000);
  const parameters = { invalidate: true, public_id: publicId, timestamp };
  const form = new FormData();
  form.set("api_key", config.cloudinaryApiKey);
  form.set("public_id", publicId);
  form.set("timestamp", String(timestamp));
  form.set("invalidate", "true");
  form.set("signature", cloudinarySignature(parameters, config.cloudinaryApiSecret));
  const response = await fetchWithRetry(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(config.cloudinaryCloudName)}/image/destroy`,
    { method: "POST", body: form },
  );
  const result = await response.json() as { result?: unknown; error?: { message?: unknown } };
  if (!response.ok || (result.result !== "ok" && result.result !== "not found")) {
    const message = typeof result.error?.message === "string" ? result.error.message : `HTTP ${response.status}`;
    throw new Error(`Cloudinary delete failed: ${message}`);
  }
}

function getMedia(record: MetaProfile): MetaMedia[] | null {
  if (!record.media || !Array.isArray(record.media.data)) return null;
  return record.media.data.filter((item): item is MetaMedia => Boolean(item) && typeof item === "object");
}

function average(values: number[]) {
  return values.length ? Math.round(values.reduce((total, value) => total + value, 0) / values.length) : 0;
}

function hashtags(caption: string) {
  return [...new Set(caption.match(/#[\p{L}\p{N}_]+/gu)?.map((tag) => tag.slice(1).toLowerCase()) || [])].slice(0, 30);
}

function profileUpdate(record: MetaProfile, now: Date) {
  const username = profileUsername(record);
  const followers = numberValue(record.followers_count);
  const media = getMedia(record);
  const update: Record<string, unknown> = {
    instagramDataSource: "meta",
    instagramSyncStatus: "succeeded",
    instagramSyncError: null,
    lastProfileSyncAt: now,
  };
  const name = stringValue(record.name);
  if (name) update.fullName = name;
  if (typeof record.biography === "string") update.bio = record.biography.trim();
  if (username) {
    update.instagramUsername = username;
    update.instagramUrl = `https://www.instagram.com/${username}/`;
  }
  const accountId = stringValue(record.id);
  if (accountId) update.instagramAccountId = accountId;
  if (typeof record.website === "string") update.instagramWebsite = record.website.trim();
  if (followers !== undefined) {
    update.followers = followers;
    update.lastFollowersSyncedAt = now;
  }
  const following = numberValue(record.follows_count);
  if (following !== undefined) update.followingCount = following;
  const postCount = numberValue(record.media_count);
  if (postCount !== undefined) update.postsCount = postCount;

  if (media) {
    const normalizedMedia = media.flatMap((item) => {
      const mediaId = stringValue(item.id);
      if (!mediaId) return [];
      const caption = stringValue(item.caption);
      const timestamp = stringValue(item.timestamp);
      return [{
        mediaId,
        caption,
        hashtags: hashtags(caption),
        commentsCount: numberValue(item.comments_count) ?? 0,
        likesCount: numberValue(item.like_count) ?? 0,
        viewsCount: numberValue(item.view_count) ?? numberValue(item.views),
        mediaType: stringValue(item.media_type),
        mediaProductType: stringValue(item.media_product_type),
        permalink: stringValue(item.permalink),
        thumbnailUrl: stringValue(item.thumbnail_url) || stringValue(item.media_url),
        publishedAt: timestamp && !Number.isNaN(Date.parse(timestamp)) ? new Date(timestamp) : undefined,
      }];
    });
    const reels = normalizedMedia.filter((item) => item.mediaProductType.toUpperCase() === "REELS");
    const engagementItems = normalizedMedia.filter((item) => Number.isFinite(item.likesCount + item.commentsCount));
    const views = reels.flatMap((item) => item.viewsCount === undefined ? [] : [item.viewsCount]);
    const avgLikes = average(engagementItems.map((item) => item.likesCount));
    const avgComments = average(engagementItems.map((item) => item.commentsCount));
    const avgViews = average(views);
    update.instagramMedia = normalizedMedia;
    update.lastMediaSyncAt = now;
    update.analyzedReels = reels.length;
    update.viewsSampleSize = views.length;
    update.engagementSampleSize = engagementItems.length;
    update.averageLikes = avgLikes;
    update.averageComments = avgComments;
    update.averageReelViews = avgViews;
    update.averageViews = avgViews;
    update.engagementRate = followers && engagementItems.length
      ? Math.min(100, Number((((avgLikes + avgComments) / followers) * 100).toFixed(2)))
      : 0;
    update.metricsVerificationStatus = engagementItems.length ? "verified" : "unverified";
    if (engagementItems.length) update.metricsLastVerifiedAt = now;
  }
  return update;
}

export function creatorApplicationInstagramUpdate(record: MetaProfile, now = new Date()) {
  const update: Record<string, unknown> = {
    instagramLastSyncedAt: now,
    instagramSyncStatus: "succeeded",
  };
  const name = stringValue(record.name);
  if (name.length >= 2) update.name = name;

  const username = profileUsername(record);
  if (username) {
    update.instagramUsername = username;
    update.socialProfile = `https://www.instagram.com/${username}/`;
  }
  const biography = stringValue(record.biography);
  if (biography) update.instagramBio = biography;

  const followers = numberValue(record.followers_count);
  const following = numberValue(record.follows_count);
  const posts = numberValue(record.media_count);
  if (followers !== undefined) update.followers = followers;
  if (following !== undefined) update.followingCount = following;
  if (posts !== undefined) update.postsCount = posts;

  const media = getMedia(record);
  if (!media) return update;
  const recentMedia = media.flatMap((item) => {
    const mediaId = stringValue(item.id);
    if (!mediaId) return [];
    const timestamp = stringValue(item.timestamp);
    return [{
      mediaId,
      caption: stringValue(item.caption),
      mediaType: stringValue(item.media_type),
      mediaProductType: stringValue(item.media_product_type),
      permalink: stringValue(item.permalink),
      thumbnailUrl: stringValue(item.thumbnail_url) || stringValue(item.media_url),
      publishedAt: timestamp && !Number.isNaN(Date.parse(timestamp)) ? new Date(timestamp) : undefined,
      likesCount: numberValue(item.like_count),
      commentsCount: numberValue(item.comments_count),
      viewsCount: numberValue(item.view_count) ?? numberValue(item.views),
    }];
  });
  if (!recentMedia.length) return update;

  update.recentInstagramMedia = recentMedia;
  const likes = recentMedia.flatMap((item) => item.likesCount === undefined ? [] : [item.likesCount]);
  const comments = recentMedia.flatMap((item) => item.commentsCount === undefined ? [] : [item.commentsCount]);
  const views = recentMedia.flatMap((item) => item.viewsCount === undefined ? [] : [item.viewsCount]);
  const engagementSamples = recentMedia.filter((item) => item.likesCount !== undefined && item.commentsCount !== undefined);
  const averageValue = (values: number[]) => values.length ? average(values) : undefined;
  const averageLikes = averageValue(likes);
  const averageComments = averageValue(comments);
  const averageViews = averageValue(views);
  if (averageLikes !== undefined) update.averageLikes = averageLikes;
  if (averageComments !== undefined) update.averageComments = averageComments;
  if (averageViews !== undefined) update.averageViews = averageViews;
  if (followers && engagementSamples.length) {
    const engagementAverage = average(engagementSamples.map((item) => (item.likesCount ?? 0) + (item.commentsCount ?? 0)));
    update.engagementRate = Math.min(100, Number(((engagementAverage / followers) * 100).toFixed(2)));
  }
  return update;
}

function unchangedImageFilter(creator: CreatorForSync) {
  return {
    _id: creator._id,
    profileImage: creator.profileImage ?? { $in: [null, ""] },
    profileImagePublicId: creator.profileImagePublicId ?? { $in: [null, ""] },
  };
}

async function saveMetaWithoutReplacingImage(
  creator: CreatorForSync,
  record: MetaProfile,
  syncError?: string,
) {
  const update = profileUpdate(record, new Date());
  if (syncError) {
    update.instagramSyncStatus = "partial";
    update.instagramSyncError = syncError.slice(0, 1000);
  }
  await Creator.updateOne({ _id: creator._id }, { $set: update });
}

async function syncCreator(
  creator: CreatorForSync,
  record: MetaProfile,
  config: NonNullable<ReturnType<typeof requiredConfiguration>>,
): Promise<MetaInstagramSyncResult> {
  const creatorId = String(creator._id);
  const username = normalizeInstagramUsername(creator.instagramUsername);
  if (record.sync_error) {
    await Creator.updateOne(
      { _id: creator._id },
      { $set: { instagramSyncStatus: "failed", instagramSyncError: record.sync_error.slice(0, 1000) } },
    );
    return { creatorId, username, status: "failed", error: record.sync_error };
  }

  const sourceUrl = profileImageUrl(record);
  if (!sourceUrl) {
    const warning = "Meta returned no profile image; existing image was preserved.";
    await saveMetaWithoutReplacingImage(creator, record, warning);
    return { creatorId, username, status: "updated", cleanupWarning: warning };
  }

  let image: Awaited<ReturnType<typeof downloadInstagramImage>>;
  try {
    image = await downloadInstagramImage(sourceUrl);
  } catch (error) {
    const warning = error instanceof Error ? error.message : "Image download failed.";
    await saveMetaWithoutReplacingImage(creator, record, warning);
    return { creatorId, username, status: "updated", cleanupWarning: warning };
  }

  const syncedAt = new Date();
  const metaFields = profileUpdate(record, syncedAt);
  if (creator.profileImageSourceHash && creator.profileImageSourceHash === image.hash) {
    let unchanged;
    try {
      unchanged = await Creator.updateOne(
        unchangedImageFilter(creator),
        { $set: { ...metaFields, profileImageSourceUrl: sourceUrl, profileImageSourceHash: image.hash, profileImageLastSyncedAt: syncedAt } },
      );
    } catch (error) {
      return { creatorId, username, status: "failed", error: error instanceof Error ? error.message : "Database update failed." };
    }
    if (unchanged.matchedCount !== 1) {
      return { creatorId, username, status: "skipped", error: "Creator image changed during synchronization." };
    }
    return { creatorId, username, status: "unchanged" };
  }

  let uploaded: CloudinaryUpload | null = null;
  try {
    uploaded = await uploadToCloudinary(`${PROFILE_IMAGE_FOLDER}/${creatorId}`, image, config);
    await validateCloudinaryImage(uploaded.secureUrl, config.cloudinaryCloudName);
  } catch (error) {
    if (uploaded && isManagedProfileImagePublicId(uploaded.publicId)) {
      try { await destroyCloudinaryImage(uploaded.publicId, config); } catch { /* best-effort orphan cleanup */ }
    }
    const warning = error instanceof Error ? error.message : "Cloudinary validation failed.";
    await saveMetaWithoutReplacingImage(creator, record, warning);
    return { creatorId, username, status: "updated", cleanupWarning: warning };
  }

  let updated;
  try {
    updated = await Creator.updateOne(
      unchangedImageFilter(creator),
      { $set: {
        ...metaFields,
        profileImage: uploaded.secureUrl,
        profileImagePublicId: uploaded.publicId,
        profileImageSourceUrl: sourceUrl,
        profileImageSourceHash: image.hash,
        profileImageLastSyncedAt: syncedAt,
      } },
    );
  } catch (error) {
    try { await destroyCloudinaryImage(uploaded.publicId, config); } catch { /* best-effort orphan cleanup */ }
    return { creatorId, username, status: "failed", error: error instanceof Error ? error.message : "Database update failed; the old image was preserved." };
  }
  if (updated.matchedCount !== 1) {
    try { await destroyCloudinaryImage(uploaded.publicId, config); } catch { /* best-effort orphan cleanup */ }
    return { creatorId, username, status: "failed", error: "Creator image changed before the database update; the old image was preserved." };
  }

  const oldPublicId = creator.profileImagePublicId;
  if (!oldPublicId || !isManagedProfileImagePublicId(oldPublicId) || oldPublicId === uploaded.publicId) {
    return { creatorId, username, status: "updated" };
  }
  const sharedReferences = await Creator.countDocuments({
    _id: { $ne: creator._id },
    $or: [
      { profileImagePublicId: oldPublicId },
      ...(creator.profileImage ? [{ profileImage: creator.profileImage }] : []),
    ],
  });
  if (sharedReferences > 0) return { creatorId, username, status: "updated" };
  try {
    await destroyCloudinaryImage(oldPublicId, config);
    return { creatorId, username, status: "updated" };
  } catch (error) {
    return {
      creatorId,
      username,
      status: "updated",
      cleanupWarning: error instanceof Error ? error.message : "Old Cloudinary image cleanup failed.",
    };
  }
}

type ApplicationForSync = {
  _id: unknown;
  primaryPlatform: string;
  socialProfile?: string | null;
  instagramUsername?: string | null;
  profileImage?: string | null;
  profileImagePublicId?: string | null;
  profileImageSourceUrl?: string | null;
  profileImageSourceHash?: string | null;
};

function applicationInstagramUsername(application: ApplicationForSync, requestedProfile?: string) {
  if (application.primaryPlatform.trim().toLowerCase() !== "instagram") {
    throw new ApiError("Auto Sync Instagram is available only for Instagram applications.", 400);
  }
  const rawProfile = requestedProfile?.trim() || application.socialProfile?.trim() || application.instagramUsername?.trim() || "";
  if (!rawProfile) throw new ApiError("Enter an Instagram profile URL or username before syncing.", 400);
  if (/^https?:\/\//i.test(rawProfile)) {
    let profileUrl: URL;
    try {
      profileUrl = new URL(rawProfile);
    } catch {
      throw new ApiError("Enter a valid Instagram profile URL.", 400);
    }
    if (profileUrl.protocol !== "https:" || !["instagram.com", "www.instagram.com"].includes(profileUrl.hostname.toLowerCase())) {
      throw new ApiError("The profile URL must belong to instagram.com.", 400);
    }
  }
  const username = normalizeInstagramUsername(rawProfile);
  if (!username) throw new ApiError("The Instagram profile URL or username is invalid.", 400);
  return username;
}

function applicationImageFilter(application: ApplicationForSync) {
  return {
    _id: application._id,
    profileImage: application.profileImage ?? { $in: [null, ""] },
    profileImagePublicId: application.profileImagePublicId ?? { $in: [null, ""] },
  };
}

async function saveApplicationInstagramData(
  application: ApplicationForSync,
  fields: Record<string, unknown>,
  status: "succeeded" | "partial",
  error?: string,
) {
  const set = { ...fields, instagramSyncStatus: status };
  const update = error
    ? { $set: { ...set, instagramSyncError: error.slice(0, 1000) } }
    : { $set: set, $unset: { instagramSyncError: 1 } };
  const updated = await CreatorApplication.findOneAndUpdate(
    { _id: application._id },
    update,
    { returnDocument: "after", runValidators: true, strict: "throw" },
  ).lean();
  if (!updated) throw new ApiError("Creator application not found.", 404);
  return updated;
}

function applicationSyncConfigurationError() {
  const required = ["META_ACCESS_TOKEN", "META_INSTAGRAM_ACCOUNT_ID", "CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) return `Instagram sync is not configured. Missing: ${missing.join(", ")}.`;
  if (!/^v\d+\.\d+$/.test(process.env.META_GRAPH_API_VERSION || DEFAULT_GRAPH_API_VERSION)) {
    return "META_GRAPH_API_VERSION must use the format vNN.N.";
  }
  if (!/^\d+$/.test(process.env.META_INSTAGRAM_ACCOUNT_ID || "")) {
    return "META_INSTAGRAM_ACCOUNT_ID must be a numeric Instagram professional account ID.";
  }
  if (!/^[a-z0-9][a-z0-9_-]*$/i.test(process.env.CLOUDINARY_CLOUD_NAME || "")) {
    return "CLOUDINARY_CLOUD_NAME is invalid.";
  }
  return "Instagram sync configuration is invalid.";
}

export async function syncCreatorApplicationInstagram(applicationId: string, requestedProfile?: string) {
  const config = requiredConfiguration();
  if (!config) throw new ApiError(applicationSyncConfigurationError(), 503);
  await connectToDatabase();
  const application = await CreatorApplication.findById(applicationId).lean<ApplicationForSync>();
  if (!application) throw new ApiError("Creator application not found.", 404);

  const username = applicationInstagramUsername(application, requestedProfile);
  const record = await fetchMetaProfile(username, config);
  if (record.sync_error) {
    await CreatorApplication.updateOne(
      { _id: application._id },
      { $set: { instagramSyncStatus: "failed", instagramSyncError: record.sync_error.slice(0, 1000) } },
    );
    throw new ApiError(record.sync_error, record.sync_status ?? 502);
  }

  const syncedAt = new Date();
  const fields = creatorApplicationInstagramUpdate(record, syncedAt);
  const sourceUrl = profileImageUrl(record);
  let uploaded: CloudinaryUpload | null = null;
  let warning: string | undefined;
  let updatedApplication;

  if (!sourceUrl) {
    warning = "Meta returned no profile picture; the existing image was preserved.";
    updatedApplication = await saveApplicationInstagramData(application, fields, "partial", warning);
  } else {
    let image: Awaited<ReturnType<typeof downloadInstagramImage>> | null = null;
    try {
      image = await downloadInstagramImage(sourceUrl);
    } catch (error) {
      warning = error instanceof Error ? error.message : "Instagram profile picture download failed.";
    }

    if (!image) {
      updatedApplication = await saveApplicationInstagramData(application, fields, "partial", warning);
    } else if (application.profileImage && application.profileImageSourceHash && application.profileImageSourceHash === image.hash) {
      updatedApplication = await CreatorApplication.findOneAndUpdate(
        applicationImageFilter(application),
        {
          $set: {
            ...fields,
            instagramSyncStatus: "succeeded",
            profileImageSourceUrl: sourceUrl,
            profileImageSourceHash: image.hash,
            profileImageLastSyncedAt: syncedAt,
          },
          $unset: { instagramSyncError: 1 },
        },
        { returnDocument: "after", runValidators: true, strict: "throw" },
      ).lean();
      if (!updatedApplication) throw new ApiError("The application profile picture changed during sync; the previous image was preserved.", 409);
    } else {
      try {
        uploaded = await uploadToCloudinary(`${PROFILE_IMAGE_FOLDER}/applications/${String(application._id)}`, image, config);
        await validateCloudinaryImage(uploaded.secureUrl, config.cloudinaryCloudName);
      } catch (error) {
        if (uploaded && isManagedProfileImagePublicId(uploaded.publicId)) {
          try { await destroyCloudinaryImage(uploaded.publicId, config); } catch (cleanupError) {
            const cleanupMessage = cleanupError instanceof Error ? cleanupError.message : "Uploaded image cleanup failed.";
            warning = `${error instanceof Error ? error.message : "Cloudinary image upload failed."} ${cleanupMessage}`;
          }
        }
        warning ??= error instanceof Error ? error.message : "Cloudinary image upload failed.";
        uploaded = null;
        updatedApplication = await saveApplicationInstagramData(application, fields, "partial", warning);
      }

      if (uploaded) {
        try {
          updatedApplication = await CreatorApplication.findOneAndUpdate(
            applicationImageFilter(application),
            {
              $set: {
                ...fields,
                instagramSyncStatus: "succeeded",
                profileImage: uploaded.secureUrl,
                profileImagePublicId: uploaded.publicId,
                profileImageSourceUrl: sourceUrl,
                profileImageSourceHash: image.hash,
                profileImageLastSyncedAt: syncedAt,
              },
              $unset: { instagramSyncError: 1 },
            },
            { returnDocument: "after", runValidators: true, strict: "throw" },
          ).lean();
          if (!updatedApplication) throw new ApiError("The application profile picture changed during sync; the previous image was preserved.", 409);
        } catch (error) {
          try {
            await destroyCloudinaryImage(uploaded.publicId, config);
          } catch (cleanupError) {
            const cleanupMessage = cleanupError instanceof Error ? cleanupError.message : "Uploaded image cleanup failed.";
            throw new Error(`${error instanceof Error ? error.message : "Application update failed."} ${cleanupMessage}`);
          }
          throw error;
        }

        const oldPublicId = application.profileImagePublicId;
        if (oldPublicId && oldPublicId !== uploaded.publicId && isManagedProfileImagePublicId(oldPublicId)) {
          const sharedReferences = await Promise.all([
            Creator.countDocuments({
              $or: [
                { profileImagePublicId: oldPublicId },
                ...(application.profileImage ? [{ profileImage: application.profileImage }] : []),
              ],
            }),
            CreatorApplication.countDocuments({
              _id: { $ne: application._id },
              $or: [
                { profileImagePublicId: oldPublicId },
                ...(application.profileImage ? [{ profileImage: application.profileImage }] : []),
              ],
            }),
          ]);
          if (sharedReferences.every((count) => count === 0)) {
            try {
              await destroyCloudinaryImage(oldPublicId, config);
            } catch (error) {
              warning = error instanceof Error ? error.message : "Old Cloudinary profile picture cleanup failed.";
            }
          }
        }
      }
    }
  }

  return { application: updatedApplication, ...(warning ? { warning } : {}) };
}

async function claimJob(now: Date, force: boolean) {
  const jobType = "sync-meta-instagram";
  const periodKey = force ? `manual-${now.getTime()}-${randomUUID()}` : now.toISOString().slice(0, 10);
  const staleBefore = new Date(now.getTime() - 10 * 60 * 1000);
  try {
    const job = await ScheduledJobRun.create({ jobType, periodKey, status: "processing", startedAt: now });
    return { job, reason: null };
  } catch (error) {
    const existing = await ScheduledJobRun.findOne({ jobType, periodKey });
    if (!existing) throw error;
    if (existing.status === "succeeded") return { job: null, reason: "already_completed" as const };
    if (existing.status === "processing" && existing.startedAt > staleBefore) {
      return { job: null, reason: "already_running" as const };
    }
    const job = await ScheduledJobRun.findOneAndUpdate(
      { _id: existing._id, $or: [{ status: "failed" }, { status: "processing", startedAt: { $lte: staleBefore } }] },
      { $set: { status: "processing", startedAt: now, completedAt: undefined, processedCount: 0, errorCode: undefined } },
      { returnDocument: "after" },
    );
    return job ? { job, reason: null } : { job: null, reason: "already_running" as const };
  }
}

export async function runWeeklyMetaInstagramSync(
  options: { force?: boolean } = {},
): Promise<MetaInstagramSyncSummary> {
  const config = requiredConfiguration();
  if (!config) {
    return { executed: false, reason: "not_configured", processedCount: 0, updatedCount: 0, unchangedCount: 0, failedCount: 0, details: [] };
  }
  await connectToDatabase();
  const now = new Date();
  const claim = await claimJob(now, options.force === true);
  if (!claim.job) {
    return { executed: false, reason: claim.reason || "already_running", processedCount: 0, updatedCount: 0, unchangedCount: 0, failedCount: 0, details: [] };
  }

  try {
    const dueBefore = new Date(now.getTime() - SEVEN_DAYS_MS);
    const creatorFilter: Record<string, unknown> = { instagramUsername: { $exists: true, $nin: [null, ""] } };
    if (!options.force) {
      creatorFilter.$or = [
        { lastProfileSyncAt: { $exists: false } },
        { lastProfileSyncAt: null },
        { lastProfileSyncAt: { $lte: dueBefore } },
      ];
    }
    const creators = await Creator.find(creatorFilter)
      .select("_id fullName instagramUsername profileImage profileImagePublicId profileImageSourceUrl profileImageSourceHash")
      .lean<CreatorForSync[]>();
    if (!creators.length) {
      claim.job.status = "succeeded";
      claim.job.completedAt = new Date();
      claim.job.processedCount = 0;
      await claim.job.save();
      return { executed: true, reason: "nothing_due", processedCount: 0, updatedCount: 0, unchangedCount: 0, failedCount: 0, details: [] };
    }

    const profiles = await fetchMetaProfiles(creators, config);
    const details: MetaInstagramSyncResult[] = new Array(creators.length);
    let nextIndex = 0;
    const workers = Array.from({ length: Math.min(3, creators.length) }, async () => {
      while (nextIndex < creators.length) {
        const index = nextIndex++;
        try {
          details[index] = await syncCreator(creators[index], profiles[index], config);
        } catch (error) {
          details[index] = {
            creatorId: String(creators[index]._id),
            username: normalizeInstagramUsername(creators[index].instagramUsername),
            status: "failed",
            error: error instanceof Error ? error.message : "Creator synchronization failed.",
          };
        }
      }
    });
    await Promise.all(workers);

    const updatedCount = details.filter((item) => item.status === "updated").length;
    const unchangedCount = details.filter((item) => item.status === "unchanged").length;
    const failedCount = details.filter((item) => item.status === "failed").length;
    claim.job.status = failedCount === creators.length ? "failed" : "succeeded";
    claim.job.completedAt = new Date();
    claim.job.processedCount = updatedCount + unchangedCount;
    claim.job.errorCode = failedCount ? "meta_instagram_partial_failure" : undefined;
    await claim.job.save();
    return { executed: true, processedCount: details.length, updatedCount, unchangedCount, failedCount, details };
  } catch (error) {
    claim.job.status = "failed";
    claim.job.completedAt = new Date();
    claim.job.errorCode = error instanceof Error ? error.message.slice(0, 120) : "meta_instagram_sync_failed";
    await claim.job.save();
    throw error;
  }
}

export async function getMetaInstagramSyncInfo(): Promise<MetaInstagramSyncInfo> {
  await connectToDatabase();
  const dueBefore = new Date(Date.now() - SEVEN_DAYS_MS);
  const instagramFilter = { instagramUsername: { $exists: true, $nin: [null, ""] } };
  const dueFilter = {
    ...instagramFilter,
    $or: [
      { lastProfileSyncAt: { $exists: false } },
      { lastProfileSyncAt: null },
      { lastProfileSyncAt: { $lte: dueBefore } },
    ],
  };
  const [lastJob, totalWithInstagram, dueCount] = await Promise.all([
    ScheduledJobRun.findOne({ jobType: "sync-meta-instagram" }).sort({ startedAt: -1 }).lean(),
    Creator.countDocuments(instagramFilter),
    Creator.countDocuments(dueFilter),
  ]);
  const configured = Boolean(requiredConfiguration());
  return {
    lastSyncAt: lastJob ? (lastJob.completedAt || lastJob.startedAt).toISOString() : null,
    lastSyncStatus: !configured
      ? "not_configured"
      : lastJob
        ? lastJob.status as "succeeded" | "failed" | "processing"
        : "never",
    processedCount: lastJob?.processedCount || 0,
    totalWithInstagram,
    dueCount,
    providerConfigured: configured,
    providerName: "Meta Instagram Graph API",
    providerType: "meta_graph",
  };
}
