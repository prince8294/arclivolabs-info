import { ApiError } from "@/lib/api-response";

const MAX_BODY_BYTES = 64 * 1024;

export async function readJson(request: Request): Promise<unknown> {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    throw new ApiError("Request body is too large.", 413);
  }

  const reader = request.body?.getReader();
  if (!reader) throw new ApiError("Request body must be valid JSON.", 400);
  const decoder = new TextDecoder();
  let body = "";
  let bytesRead = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytesRead += value.byteLength;
    if (bytesRead > MAX_BODY_BYTES) {
      await reader.cancel();
      throw new ApiError("Request body is too large.", 413);
    }
    body += decoder.decode(value, { stream: true });
  }
  body += decoder.decode();

  let value: unknown;
  try {
    value = JSON.parse(body);
  } catch (error) {
    if (error instanceof SyntaxError) throw new ApiError("Request body must be valid JSON.", 400);
    throw error;
  }
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new ApiError("Request body must be a JSON object.", 400);
  }
  return value;
}

export function validateMutationOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  if (!origin) throw new ApiError("A valid request origin is required.", 403);

  let originUrl: URL;
  try {
    originUrl = new URL(origin);
  } catch {
    throw new ApiError("A valid request origin is required.", 403);
  }

  const allowedOrigins = new Set([new URL(request.url).origin]);
  const configuredOrigin = process.env.NEXT_PUBLIC_APP_URL;
  if (configuredOrigin) allowedOrigins.add(new URL(configuredOrigin).origin);

  if (!allowedOrigins.has(originUrl.origin)) {
    throw new ApiError("Request origin is not allowed.", 403);
  }
}
