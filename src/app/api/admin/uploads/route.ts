import { createHash, randomUUID } from "node:crypto";
import { ApiError, apiSuccess, withApiErrors } from "@/lib/api-response";
import { requireAdminPermission } from "@/lib/admin/permissions";
import { validateMutationOrigin } from "@/lib/request";
import { enforceRateLimit } from "@/lib/rate-limit";

export const POST = withApiErrors(async (request: Request) => {
  validateMutationOrigin(request);
  const user = await requireAdminPermission("creator:manage");
  await enforceRateLimit({ scope: "admin-image-upload", identity: user.id, limit: 100, windowMs: 60 * 60 * 1000 });

  const formData = await request.formData();
  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    throw new ApiError("No image file provided.", 400);
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];
  if (!allowedTypes.includes(file.type)) {
    throw new ApiError("Invalid file type. Please upload a JPEG, PNG, WEBP, or AVIF image.", 415);
  }

  const maxBytes = 10 * 1024 * 1024; // 10MB
  if (file.size > maxBytes) {
    throw new ApiError("File exceeds the 10 MB size limit.", 413);
  }

  const {
    CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET,
  } = process.env;

  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new ApiError("Cloudinary is not configured. Please check your credentials.", 503);
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = "arclivo/creators/profiles";
  const publicId = randomUUID();

  const params: Record<string, string | number> = {
    folder,
    public_id: publicId,
    timestamp,
  };

  const signatureBase = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");

  const signature = createHash("sha1")
    .update(`${signatureBase}${CLOUDINARY_API_SECRET}`)
    .digest("hex");

  const uploadData = new FormData();
  uploadData.set("file", file);
  uploadData.set("api_key", CLOUDINARY_API_KEY);
  uploadData.set("timestamp", String(timestamp));
  uploadData.set("folder", folder);
  uploadData.set("public_id", publicId);
  uploadData.set("signature", signature);

  const uploadUrl = `https://api.cloudinary.com/v1_1/${encodeURIComponent(CLOUDINARY_CLOUD_NAME)}/image/upload`;
  const response = await fetch(uploadUrl, {
    method: "POST",
    body: uploadData,
  });

  const result = (await response.json()) as { secure_url?: string; error?: { message: string } };

  if (!response.ok || !result.secure_url) {
    const errorMsg = result.error?.message ?? `Cloudinary upload failed (status ${response.status}).`;
    throw new ApiError(errorMsg, 502);
  }

  return apiSuccess({
    url: result.secure_url,
    publicId,
  }, "Image uploaded to Cloudinary successfully.");
});

