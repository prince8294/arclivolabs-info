import { z } from "zod";
import { apiSuccess, ApiError, withApiErrors } from "@/lib/api-response";
import { requireAdminPermission } from "@/lib/admin/permissions";
import { connectToDatabase } from "@/lib/db";
import { readJson, validateMutationOrigin } from "@/lib/request";
import StudentCertificate from "@/models/StudentCertificate";

const statusSchema = z
  .object({
    status: z.enum(["published", "revoked"]),
  })
  .strict();

type RouteContext = { params: Promise<{ id: string }> };

export const PATCH = withApiErrors(async (request: Request, { params }: RouteContext) => {
  validateMutationOrigin(request);
  const actor = await requireAdminPermission("student:manage");
  await connectToDatabase();
  const { id } = await params;

  const cert = await StudentCertificate.findById(id);
  if (!cert) {
    throw new ApiError("Certificate not found.", 404);
  }

  const body = statusSchema.parse(await readJson(request));

  cert.status = body.status;
  if (body.status === "revoked") {
    cert.revokedAt = new Date();
    cert.revokedBy = actor._id;
  } else {
    cert.revokedAt = undefined;
    cert.revokedBy = undefined;
  }

  cert.auditLog.push({
    action: `certificate_${body.status}`,
    performedBy: actor._id,
    performedByName: actor.name,
    timestamp: new Date(),
    details: `Certificate status changed to "${body.status}" by ${actor.name}.`,
  });

  await cert.save();

  return apiSuccess(cert, `Certificate ${cert.certificateId} has been ${body.status}.`);
});

