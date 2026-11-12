import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db";
import Creator from "@/models/Creator";
import ScheduledJobRun from "@/models/ScheduledJobRun";
import { recordCommittedActivity } from "@/services/activity.service";

export type InstagramProviderType = "rapidapi" | "apify" | "custom_api" | "meta_graph" | "mock" | "none";

export interface ProviderConfig {
  isConfigured: boolean;
  provider: InstagramProviderType;
  providerName: string;
  description: string;
}

export interface SyncCreatorResult {
  creatorId: string;
  fullName: string;
  username: string;
  previousFollowers: number;
  newFollowers?: number;
  status: "updated" | "unchanged" | "failed" | "skipped";
  error?: string;
}

export interface SyncSummary {
  success: boolean;
  status: "succeeded" | "failed" | "no_provider";
  message: string;
  provider: string;
  providerConfigured: boolean;
  totalWithInstagram: number;
  updatedCount: number;
  failedCount: number;
  startedAt: string;
  completedAt: string;
  details: SyncCreatorResult[];
}

export interface LastSyncInfo {
  lastSyncAt: string | null;
  lastSyncStatus: "succeeded" | "failed" | "processing" | "never" | "no_provider";
  processedCount: number;
  totalWithInstagram: number;
  providerConfigured: boolean;
  providerName: string;
  providerType: InstagramProviderType;
}

/**
 * Normalizes an Instagram username by stripping @, trimming spaces,
 * and extracting handle if a full URL was provided.
 */
export function normalizeInstagramUsername(raw?: string | null): string {
  if (!raw) return "";
  let handle = raw.trim();
  if (handle.startsWith("http://") || handle.startsWith("https://")) {
    try {
      const url = new URL(handle);
      const parts = url.pathname.split("/").filter(Boolean);
      handle = parts[0] || "";
    } catch {
      handle = handle.replace(/https?:\/\/(www\.)?instagram\.com\//i, "").split("/")[0] || "";
    }
  }
  return handle.replace(/^@+/, "").replace(/\/+$/, "").split("?")[0].trim().toLowerCase();
}

/**
 * Detects which Instagram data provider is configured in environment variables.
 */
export function getInstagramProviderConfig(): ProviderConfig {
  if (process.env.RAPIDAPI_KEY) {
    const host = process.env.RAPIDAPI_HOST || "instagram-data1.p.rapidapi.com";
    return {
      isConfigured: true,
      provider: "rapidapi",
      providerName: `RapidAPI (${host})`,
      description: "RapidAPI Instagram profile follower fetcher",
    };
  }

  if (process.env.APIFY_API_TOKEN) {
    return {
      isConfigured: true,
      provider: "apify",
      providerName: "Apify Instagram Scraper",
      description: "Apify Instagram Scraper Actor API",
    };
  }

  if (process.env.INSTAGRAM_FOLLOWER_API_URL) {
    return {
      isConfigured: true,
      provider: "custom_api",
      providerName: "Custom Follower API",
      description: "Custom external microservice endpoint",
    };
  }

  if (process.env.INSTAGRAM_GRAPH_TOKEN && process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID) {
    return {
      isConfigured: true,
      provider: "meta_graph",
      providerName: "Meta Instagram Graph API",
      description: "Official Meta Business Discovery API",
    };
  }

  if (process.env.INSTAGRAM_SYNC_MOCK === "true") {
    return {
      isConfigured: true,
      provider: "mock",
      providerName: "Development Simulator (Mock)",
      description: "Development simulation mode for testing updates",
    };
  }

  return {
    isConfigured: false,
    provider: "none",
    providerName: "No Provider Configured",
    description: "Requires RapidAPI or another authorized data provider key in .env",
  };
}

/**
 * Fetches the follower count for a given username using the configured provider.
 */
export async function fetchFollowersForUsername(username: string): Promise<{
  success: boolean;
  followers?: number;
  error?: string;
}> {
  const cleanUsername = normalizeInstagramUsername(username);
  if (!cleanUsername) {
    return { success: false, error: "Invalid username." };
  }

  const config = getInstagramProviderConfig();
  if (!config.isConfigured) {
    return {
      success: false,
      error: "NO_PROVIDER_CONFIGURED",
    };
  }

  try {
    // 1. RapidAPI integration (Supports standard endpoints & Instagram Scraper Stable API)
    if (config.provider === "rapidapi") {
      const apiKey = process.env.RAPIDAPI_KEY!;
      const host = process.env.RAPIDAPI_HOST || "instagram-scraper-stable-api.p.rapidapi.com";

      // Instagram Scraper Stable API (by thetechguy32744)
      if (host.includes("instagram-scraper-stable-api")) {
        const form = new FormData();
        form.append("username_or_url", cleanUsername);
        form.append("data", "basic");

        const response = await fetch(`https://${host}/ig_get_fb_profile.php`, {
          method: "POST",
          headers: {
            "x-rapidapi-key": apiKey,
            "x-rapidapi-host": host,
          },
          body: form,
          signal: AbortSignal.timeout(15000),
        });

        if (!response.ok) {
          return { success: false, error: `RapidAPI returned HTTP ${response.status}: ${response.statusText}` };
        }

        const json = await response.json();
        const count =
          json?.follower_count ??
          json?.followers ??
          json?.data?.follower_count ??
          json?.data?.user?.edge_followed_by?.count;

        if (typeof count === "number" && count >= 0) {
          return { success: true, followers: Math.round(count) };
        }

        return { success: false, error: "Could not parse follower count from provider response." };
      }

      // Other RapidAPI Instagram scrapers
      const endpoint = host.includes("scraper-api2")
        ? `https://${host}/v1/info?username_or_id_or_url=${encodeURIComponent(cleanUsername)}`
        : `https://${host}/user/info?username=${encodeURIComponent(cleanUsername)}`;

      const response = await fetch(endpoint, {
        headers: {
          "x-rapidapi-key": apiKey,
          "x-rapidapi-host": host,
        },
        signal: AbortSignal.timeout(12000),
      });

      if (!response.ok) {
        return { success: false, error: `RapidAPI returned HTTP ${response.status}: ${response.statusText}` };
      }

      const json = await response.json();
      // Parse various standard RapidAPI response structures
      const count =
        json?.data?.user?.edge_followed_by?.count ??
        json?.data?.follower_count ??
        json?.data?.user?.follower_count ??
        json?.follower_count ??
        json?.followers ??
        json?.user?.follower_count;

      if (typeof count === "number" && count >= 0) {
        return { success: true, followers: Math.round(count) };
      }

      return { success: false, error: "Could not parse follower count from provider response." };
    }

    // 2. Custom external API endpoint
    if (config.provider === "custom_api") {
      const baseUrl = process.env.INSTAGRAM_FOLLOWER_API_URL!;
      const url = new URL(baseUrl);
      url.searchParams.set("username", cleanUsername);

      const headers: Record<string, string> = {};
      if (process.env.INSTAGRAM_API_KEY) {
        headers["Authorization"] = `Bearer ${process.env.INSTAGRAM_API_KEY}`;
      }

      const response = await fetch(url.toString(), {
        headers,
        signal: AbortSignal.timeout(12000),
      });

      if (!response.ok) {
        return { success: false, error: `Custom API returned HTTP ${response.status}` };
      }

      const json = await response.json();
      const count = json?.followers ?? json?.follower_count ?? json?.data?.followers;
      if (typeof count === "number" && count >= 0) {
        return { success: true, followers: Math.round(count) };
      }

      return { success: false, error: "Custom API did not return a valid follower count." };
    }

    // 3. Meta Graph API (Business Discovery)
    if (config.provider === "meta_graph") {
      const token = process.env.INSTAGRAM_GRAPH_TOKEN!;
      const igId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID!;
      const endpoint = `https://graph.facebook.com/v19.0/${igId}?fields=business_discovery.username(${cleanUsername}){followers_count}&access_token=${token}`;

      const response = await fetch(endpoint, { signal: AbortSignal.timeout(12000) });
      if (!response.ok) {
        return { success: false, error: `Meta Graph API returned HTTP ${response.status}` };
      }

      const json = await response.json();
      const count = json?.business_discovery?.followers_count;
      if (typeof count === "number" && count >= 0) {
        return { success: true, followers: Math.round(count) };
      }

      return { success: false, error: "Meta Graph API did not return followers_count." };
    }

    // 4. Mock / Development mode
    if (config.provider === "mock") {
      // Simulate real fetch with random realistic drift (-10 to +35 followers)
      return { success: true, followers: -1 }; // Handled in syncAllInstagramFollowers
    }

    return { success: false, error: "Unsupported provider." };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Network error contacting provider.",
    };
  }
}

/**
 * Synchronizes follower counts for all creators who have an Instagram username.
 * Updates MongoDB records automatically.
 */
export async function syncAllInstagramFollowers(actorId?: string): Promise<SyncSummary> {
  await connectToDatabase();
  const startedAt = new Date();
  const periodKey = `sync-${startedAt.getTime()}`;
  const providerConfig = getInstagramProviderConfig();

  // Find all creators with an instagramUsername
  const creators = await Creator.find({
    instagramUsername: { $exists: true, $ne: "" },
  }).select("_id fullName instagramUsername followers lastFollowersSyncedAt").lean();

  const details: SyncCreatorResult[] = [];
  let updatedCount = 0;
  let failedCount = 0;

  // If no provider is configured, record the attempt and return helpful guidance
  if (!providerConfig.isConfigured) {
    await ScheduledJobRun.create({
      jobType: "sync-instagram-followers",
      periodKey,
      status: "failed",
      startedAt,
      completedAt: new Date(),
      processedCount: 0,
      errorCode: "no_provider_configured",
    });

    return {
      success: false,
      status: "no_provider",
      message: "No Instagram data provider is configured in .env. Please configure RAPIDAPI_KEY to fetch live follower counts.",
      provider: providerConfig.providerName,
      providerConfigured: false,
      totalWithInstagram: creators.length,
      updatedCount: 0,
      failedCount: creators.length,
      startedAt: startedAt.toISOString(),
      completedAt: new Date().toISOString(),
      details: creators.map((c) => ({
        creatorId: String(c._id),
        fullName: c.fullName,
        username: normalizeInstagramUsername(c.instagramUsername),
        previousFollowers: c.followers,
        status: "skipped",
        error: "Provider not configured. Set RAPIDAPI_KEY in .env.",
      })),
    };
  }

  // Create running job record
  const job = await ScheduledJobRun.create({
    jobType: "sync-instagram-followers",
    periodKey,
    status: "processing",
    startedAt,
    processedCount: 0,
  });

  try {
    for (const creator of creators) {
      const username = normalizeInstagramUsername(creator.instagramUsername);
      if (!username) {
        details.push({
          creatorId: String(creator._id),
          fullName: creator.fullName,
          username: creator.instagramUsername || "",
          previousFollowers: creator.followers,
          status: "skipped",
          error: "Empty or invalid username.",
        });
        continue;
      }

      let newCount: number | undefined;

      if (providerConfig.provider === "mock") {
        // Mock mode: add a small realistic variation so admin can verify UI & DB updating
        const delta = Math.floor(Math.random() * 50) - 10;
        newCount = Math.max(0, (creator.followers || 1000) + delta);
      } else {
        const result = await fetchFollowersForUsername(username);
        if (result.success && typeof result.followers === "number") {
          newCount = result.followers;
        } else {
          failedCount++;
          details.push({
            creatorId: String(creator._id),
            fullName: creator.fullName,
            username,
            previousFollowers: creator.followers,
            status: "failed",
            error: result.error || "Failed to fetch follower count.",
          });
          continue;
        }
      }

      // Update in MongoDB
      if (typeof newCount === "number") {
        const now = new Date();
        await Creator.updateOne(
          { _id: creator._id },
          {
            $set: {
              followers: newCount,
              lastFollowersSyncedAt: now,
              metricsLastVerifiedAt: now,
            },
          },
        );

        updatedCount++;
        details.push({
          creatorId: String(creator._id),
          fullName: creator.fullName,
          username,
          previousFollowers: creator.followers,
          newFollowers: newCount,
          status: newCount === creator.followers ? "unchanged" : "updated",
        });
      }
    }

    job.status = "succeeded";
    job.completedAt = new Date();
    job.processedCount = updatedCount;
    await job.save();

    if (actorId && actorId !== "cron" && Types.ObjectId.isValid(actorId)) {
      try {
        await recordCommittedActivity({
          actorId,
          action: "creator.followers_synced",
          resourceType: "Creator",
          resourceId: creators[0]?._id ? String(creators[0]._id) : undefined,
        });
      } catch {
        // ignore activity log failures
      }
    }

    return {
      success: true,
      status: "succeeded",
      message: `Successfully synchronized ${updatedCount} creator${updatedCount === 1 ? "" : "s"} from Instagram.`,
      provider: providerConfig.providerName,
      providerConfigured: true,
      totalWithInstagram: creators.length,
      updatedCount,
      failedCount,
      startedAt: startedAt.toISOString(),
      completedAt: job.completedAt.toISOString(),
      details,
    };
  } catch (err) {
    job.status = "failed";
    job.completedAt = new Date();
    job.errorCode = err instanceof Error ? err.message.slice(0, 120) : "sync_error";
    await job.save();
    throw err;
  }
}

/**
 * Retrieves the latest sync date, status, and stats for the admin dashboard.
 */
export async function getLastInstagramSyncInfo(): Promise<LastSyncInfo> {
  await connectToDatabase();
  const provider = getInstagramProviderConfig();

  const [lastJob, totalWithInstagram] = await Promise.all([
    ScheduledJobRun.findOne({ jobType: "sync-instagram-followers" }).sort({ startedAt: -1 }).lean(),
    Creator.countDocuments({ instagramUsername: { $exists: true, $ne: "" } }),
  ]);

  if (!lastJob) {
    return {
      lastSyncAt: null,
      lastSyncStatus: provider.isConfigured ? "never" : "no_provider",
      processedCount: 0,
      totalWithInstagram,
      providerConfigured: provider.isConfigured,
      providerName: provider.providerName,
      providerType: provider.provider,
    };
  }

  const status = !provider.isConfigured && lastJob.errorCode === "no_provider_configured"
    ? "no_provider"
    : (lastJob.status as "succeeded" | "failed" | "processing");

  return {
    lastSyncAt: (lastJob.completedAt || lastJob.startedAt).toISOString(),
    lastSyncStatus: status,
    processedCount: lastJob.processedCount || 0,
    totalWithInstagram,
    providerConfigured: provider.isConfigured,
    providerName: provider.providerName,
    providerType: provider.provider,
  };
}

/**
 * Daily 24-hour automatic sync used by /api/cron.
 * Ensures creators are synced automatically every 24 hours.
 */
export async function runDailyInstagramSync(): Promise<{
  executed: boolean;
  reason?: string;
  summary?: SyncSummary;
}> {
  await connectToDatabase();
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Check if a sync succeeded in the last 24 hours
  const recentSync = await ScheduledJobRun.findOne({
    jobType: "sync-instagram-followers",
    status: "succeeded",
    completedAt: { $gte: twentyFourHoursAgo },
  }).lean();

  if (recentSync) {
    return {
      executed: false,
      reason: "already_synced_within_24h",
    };
  }

  const summary = await syncAllInstagramFollowers("cron");
  return {
    executed: true,
    summary,
  };
}
