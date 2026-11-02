import { createHash } from "node:crypto";
import { ApiError } from "@/lib/api-response";
import RateLimit from "@/models/RateLimit";
import { connectToDatabase } from "@/lib/db";

type RateLimitOptions = {
  scope: string;
  identity: string;
  limit: number;
  windowMs: number;
};

export async function enforceRateLimit({ scope, identity, limit, windowMs }: RateLimitOptions): Promise<void> {
  await connectToDatabase();
  const now = Date.now();
  const window = Math.floor(now / windowMs);
  const identityHash = createHash("sha256").update(identity).digest("hex");
  const id = createHash("sha256").update(`${scope}:${identityHash}:${window}`).digest("hex");

  let record;
  try {
    record = await RateLimit.findOneAndUpdate(
      { _id: id },
      { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date(now + windowMs * 2) } },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
    ).lean();
  } catch (error) {
    if (!isDuplicateKeyError(error)) throw error;
    record = await RateLimit.findByIdAndUpdate(id, { $inc: { count: 1 } }, { returnDocument: "after" }).lean();
  }

  if (!record) throw new Error("Rate-limit counter could not be updated.");
  if (record.count > limit) {
    const retryAfter = Math.max(1, Math.ceil(((window + 1) * windowMs - now) / 1000));
    throw new ApiError(
      "Too many requests. Please try again later.",
      429,
      [],
      { "Retry-After": String(retryAfter) },
    );
  }
}

export function getClientAddress(request: Request): string {
  const headers = request.headers;
  return headers.get("x-vercel-forwarded-for")
    ?? headers.get("cf-connecting-ip")
    ?? headers.get("x-real-ip")
    ?? headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? "unknown";
}

function isDuplicateKeyError(error: unknown): error is { code: number } {
  return typeof error === "object" && error !== null && "code" in error && error.code === 11000;
}
