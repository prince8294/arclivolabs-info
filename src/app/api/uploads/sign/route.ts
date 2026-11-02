import { createHash, randomUUID } from "node:crypto";
import { z } from "zod";
import { ApiError, apiSuccess, withApiErrors } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/permissions";
import { readJson, validateMutationOrigin } from "@/lib/request";
import { enforceRateLimit } from "@/lib/rate-limit";

const imageTypes = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
} as const;
const mediaTypes = {
  ...imageTypes,
  "video/mp4": "mp4",
  "video/webm": "webm",
} as const;
const uploadSchema = z.object({
  purpose: z.enum(["profile-image", "brand-logo", "portfolio", "deliverable", "message-attachment"]),
  fileName: z.string().trim().min(1).max(200),
  contentType: z.string().trim().toLowerCase(),
  size: z.coerce.number().int().positive(),
}).strict();

export const POST = withApiErrors(async (request) => {
  validateMutationOrigin(request);
  const user = await getCurrentUser();
  const body = uploadSchema.parse(await readJson(request));
  const isBrand = user.role === "brand";
  const isCreator = user.role === "creator";
  if ((body.purpose === "brand-logo" && !isBrand)
    || (["profile-image", "portfolio", "deliverable"].includes(body.purpose) && !isCreator)
    || (body.purpose === "message-attachment" && !isBrand && !isCreator)) {
    throw new ApiError("You cannot upload this file for the selected purpose.", 403);
  }
  const allowedTypes = body.purpose === "brand-logo" || body.purpose === "profile-image" ? imageTypes : mediaTypes;
  const extension = allowedTypes[body.contentType as keyof typeof allowedTypes];
  if (!extension) throw new ApiError("This file type is not supported.", 415);
  const maxBytes = body.contentType.startsWith("image/") ? 10 * 1024 * 1024 : 100 * 1024 * 1024;
  if (body.size > maxBytes) throw new ApiError(`File exceeds the ${Math.round(maxBytes / 1024 / 1024)} MB size limit.`, 413);
  const filenameExtension = body.fileName.split(".").pop()?.toLowerCase();
  const compatibleExtension = filenameExtension === extension || (extension === "jpg" && filenameExtension === "jpeg");
  if (!compatibleExtension) throw new ApiError("File extension does not match the declared content type.", 400);
  await enforceRateLimit({ scope: "media-upload", identity: user.id, limit: 30, windowMs: 60 * 60 * 1000 });

  const {
    CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET,
    CLOUDINARY_IMAGE_UPLOAD_PRESET,
    CLOUDINARY_MEDIA_UPLOAD_PRESET,
  } = process.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET
    || !CLOUDINARY_IMAGE_UPLOAD_PRESET || !CLOUDINARY_MEDIA_UPLOAD_PRESET) {
    throw new ApiError("Cloudinary is not configured. Set the Cloudinary environment variables before uploading.", 503);
  }
  if (!/^[a-z0-9][a-z0-9_-]*$/i.test(CLOUDINARY_CLOUD_NAME)) {
    throw new ApiError("CLOUDINARY_CLOUD_NAME is invalid.", 503);
  }

  const kind = isBrand ? "brands" : "creators";
  const folder = `arclivo/${kind}/${user.id}/${body.purpose}`;
  const publicId = randomUUID();
  const timestamp = Math.floor(Date.now() / 1000);
  const resourceType = body.contentType.startsWith("video/") ? "video" : "image";
  const uploadPreset = resourceType === "video" ? CLOUDINARY_MEDIA_UPLOAD_PRESET : CLOUDINARY_IMAGE_UPLOAD_PRESET;
  const signedParameters = { folder, public_id: publicId, timestamp, upload_preset: uploadPreset };
  const signatureBase = Object.entries(signedParameters)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
  const signature = createHash("sha1")
    .update(`${signatureBase}${CLOUDINARY_API_SECRET}`)
    .digest("hex");
  return apiSuccess({
    cloudName: CLOUDINARY_CLOUD_NAME,
    apiKey: CLOUDINARY_API_KEY,
    timestamp,
    signature,
    folder,
    publicId,
    uploadPreset,
    resourceType,
  }, "Cloudinary upload signature created.");
});
