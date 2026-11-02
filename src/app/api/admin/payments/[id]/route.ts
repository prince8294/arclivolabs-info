import { z } from "zod";
import { apiSuccess, ApiError, withApiErrors } from "@/lib/api-response";
import { requireAdminPermission } from "@/lib/admin/permissions";
import { connectToDatabase } from "@/lib/db";
import { objectId } from "@/lib/portal-access";
import { readJson, validateMutationOrigin } from "@/lib/request";
import { recordCommittedActivity } from "@/services/activity.service";
import PaymentTransaction from "@/models/PaymentTransaction";

const updateSchema = z.object({
  status: z.enum(["paid", "failed"]),
  reference: z.string().trim().min(1).max(120).optional(),
}).strict();

export const PATCH = withApiErrors(async (request, context: { params: Promise<{ id: string }> }) => {
  validateMutationOrigin(request);
  const actor = await requireAdminPermission("finance:manage");
  const body = updateSchema.parse(await readJson(request));
  const { id } = await context.params;
  await connectToDatabase();
  const payment = await PaymentTransaction.findOne({ _id: objectId(id), status: "pending" });
  if (!payment) throw new ApiError("Only a pending payment can be updated.", 404);
  if (body.status === "paid" && !body.reference && !payment.reference) {
    throw new ApiError("A verified transaction reference is required to mark a payment as paid.", 400);
  }
  payment.status = body.status;
  if (body.reference) payment.reference = body.reference;
  payment.recordedBy = actor._id;
  if (body.status === "paid") payment.paidAt = new Date();
  payment.history.push({
    status: body.status,
    reference: body.reference ?? payment.reference,
    recordedBy: actor._id,
    recordedAt: new Date(),
  });
  await payment.save();
  await recordCommittedActivity({ actorId: actor.id, action: `payment.${body.status}`, resourceType: "PaymentTransaction", resourceId: payment.id });
  return apiSuccess({ payment }, "Payment status updated.");
});
