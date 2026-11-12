import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { ApiError, apiSuccess, withApiErrors } from "@/lib/api-response";
import { requireAdminPermission } from "@/lib/admin/permissions";
import { validateMutationOrigin } from "@/lib/request";

const allowedTypes: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export const POST = withApiErrors(async (request: Request) => {
  validateMutationOrigin(request);
  await requireAdminPermission("student:manage");

  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    throw new ApiError("No certificate file provided.", 400);
  }

  const ext = allowedTypes[file.type];
  if (!ext) {
    throw new ApiError(
      "Unsupported certificate format. Please upload a PDF, JPG, or PNG document.",
      415
    );
  }

  const maxBytes = 15 * 1024 * 1024; // 15MB
  if (file.size > maxBytes) {
    throw new ApiError("File exceeds the 15 MB size limit.", 413);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const uniqueName = `cert_${Date.now()}_${randomUUID().replace(/-/g, "").slice(0, 10)}.${ext}`;

  // Store in public/uploads/certificates
  const uploadDir = join(process.cwd(), "public", "uploads", "certificates");
  await mkdir(uploadDir, { recursive: true });
  const fullPath = join(uploadDir, uniqueName);
  await writeFile(fullPath, buffer);

  const fileUrl = `/uploads/certificates/${uniqueName}`;

  return apiSuccess(
    {
      fileUrl,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
    },
    "Certificate uploaded securely.",
    201
  );
});

