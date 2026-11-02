import { z } from "zod";
import { apiSuccess, ApiError, withApiErrors } from "@/lib/api-response";
import { requireAdminPermission } from "@/lib/admin/permissions";
import { connectToDatabase } from "@/lib/db";
import { readJson, validateMutationOrigin } from "@/lib/request";
import { recordCommittedActivity } from "@/services/activity.service";
import Brand from "@/models/Brand";
import Collaboration from "@/models/Collaboration";
import PaymentTransaction from "@/models/PaymentTransaction";

const paymentSchema = z.object({
  collaborationId: z.string().trim().min(1),
  amount: z.coerce.number().min(0).max(1_000_000_000),
  currency: z.string().trim().regex(/^[A-Za-z]{3}$/),
  status: z.enum(["pending", "paid"]).default("pending"),
  reference: z.string().trim().max(120).optional(),
}).strict().refine((value) => value.status !== "paid" || Boolean(value.reference), { path: ["reference"], message: "A verified transaction reference is required to record a payment." });

export const GET = withApiErrors(async (request) => {
  await requireAdminPermission("finance:read");
  await connectToDatabase();
  const url = new URL(request.url);
  const page = Math.max(1, Math.min(100000, Number(url.searchParams.get("page") ?? 1)));
  const limit = Math.max(1, Math.min(100, Number(url.searchParams.get("limit") ?? 25)));
  const [payments, total] = await Promise.all([
    PaymentTransaction.find().populate("brand", "companyName").populate("creator", "fullName").populate("campaign", "title").populate("recordedBy", "name").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    PaymentTransaction.countDocuments(),
  ]);
  return apiSuccess({ payments, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

export const POST = withApiErrors(async (request) => {
  validateMutationOrigin(request);
  const actor = await requireAdminPermission("finance:manage");
  const body = paymentSchema.parse(await readJson(request));
  await connectToDatabase();
  const collaboration = await Collaboration.findById(body.collaborationId).select("creator brand campaign status");
  if (!collaboration || !["accepted", "in_progress", "content_submitted", "revision_requested", "approved", "completed"].includes(collaboration.status)) {
    throw new ApiError("An active collaboration is required to record a payment.", 404);
  }
  const brand = await Brand.findById(collaboration.brand).select("_id");
  if (!brand) throw new ApiError("Collaboration brand was not found.", 404);
  const payment = await PaymentTransaction.create({
    collaboration: collaboration._id,
    creator: collaboration.creator,
    brand: collaboration.brand,
    campaign: collaboration.campaign,
    amount: body.amount,
    currency: body.currency.toUpperCase(),
    status: body.status,
    reference: body.reference,
    recordedBy: actor._id,
    ...(body.status === "paid" ? { paidAt: new Date() } : {}),
    history: [{ status: body.status, reference: body.reference, recordedBy: actor._id, recordedAt: new Date() }],
  });
  await recordCommittedActivity({ actorId: actor.id, action: `payment.${body.status}`, resourceType: "PaymentTransaction", resourceId: payment.id });
  return apiSuccess({ payment }, "Payment record created.", 201);
});
