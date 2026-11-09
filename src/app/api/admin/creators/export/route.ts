import { withApiErrors } from "@/lib/api-response";
import { requireAdminPermission } from "@/lib/admin/permissions";
import { connectToDatabase } from "@/lib/db";
import Creator from "@/models/Creator";
import { enforceRateLimit } from "@/lib/rate-limit";

export const GET = withApiErrors(async (request) => {
  const actor = await requireAdminPermission("creator:read");
  await enforceRateLimit({ scope: "creator-export", identity: actor.id, limit: 10, windowMs: 60 * 60 * 1000 });
  await connectToDatabase();

  const params = new URL(request.url).searchParams;
  const status = params.get("status");
  const search = params.get("q")?.trim().slice(0, 100);
  const safeSearch = search?.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const filter: Record<string, unknown> = {
    ...(status ? { approvalStatus: status } : {}),
    ...(safeSearch
      ? { $or: [{ fullName: new RegExp(safeSearch, "i") }, { email: new RegExp(safeSearch, "i") }, { instagramUsername: new RegExp(safeSearch, "i") }, { location: new RegExp(safeSearch, "i") }] }
      : {}),
  };

  const creators = await Creator.find(filter)
    .select("fullName email phone primaryPlatform contentCategories instagramUsername youtubeChannel followers location country languages engagementRate bio approvalStatus verificationStatus metricsVerificationStatus availability featured createdAt")
    .sort({ createdAt: -1 })
    .limit(5000)
    .lean();

  const columns: Array<[string, string]> = [
    ["fullName", "Full Name"],
    ["email", "Email"],
    ["phone", "Phone"],
    ["primaryPlatform", "Primary Platform"],
    ["contentCategories", "Categories"],
    ["instagramUsername", "Instagram"],
    ["youtubeChannel", "YouTube"],
    ["followers", "Followers"],
    ["engagementRate", "Engagement Rate (%)"],
    ["location", "Location"],
    ["country", "Country"],
    ["languages", "Languages"],
    ["bio", "Bio"],
    ["approvalStatus", "Approval Status"],
    ["verificationStatus", "Verification"],
    ["metricsVerificationStatus", "Metrics Verification"],
    ["availability", "Availability"],
    ["featured", "Featured"],
    ["createdAt", "Registered At"],
  ];

  const headers = columns.map(([, label]) => label);
  const rows = creators.map((creator) =>
    columns.map(([key]) => {
      const value = creator[key as keyof typeof creator];
      if (Array.isArray(value)) return value.join(", ");
      if (value instanceof Date) return value.toISOString();
      return String(value ?? "");
    }),
  );

  const csv = [headers, ...rows]
    .map((row) =>
      row
        .map((field) => {
          // Prevent CSV injection
          const safe = /^[\t\r\n ]*[=+\-@]/.test(field) ? `'${field}` : field;
          return `"${safe.replace(/"/g, '""')}"`;
        })
        .join(","),
    )
    .join("\r\n");

  const date = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="creators-${date}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
});

