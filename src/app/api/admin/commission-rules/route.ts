import { z } from "zod";
import { apiSuccess, withApiErrors, ApiError } from "@/lib/api-response";
import { requireAdminPermission } from "@/lib/admin/permissions";
import { connectToDatabase } from "@/lib/db";
import { readJson, validateMutationOrigin } from "@/lib/request";
import CommissionRule from "@/models/CommissionRule";
import { getOrInitializeCommissionRules } from "@/lib/commission";

const updateTiersSchema = z.object({
  tiers: z.array(
    z.object({
      tierKey: z.string().trim().min(1),
      minFollowers: z.number().int().min(0),
      maxFollowers: z.number().int().min(0).nullable().optional(),
      label: z.string().trim().min(1),
      amount: z.number().min(0),
      currency: z.string().default("INR"),
      order: z.number().int().default(0),
      isActive: z.boolean().default(true),
    })
  ).min(1, "At least one tier is required."),
}).strict();

export const GET = withApiErrors(async () => {
  await requireAdminPermission("student:read");
  const rules = await getOrInitializeCommissionRules();
  return apiSuccess(rules);
});

export const PUT = withApiErrors(async (request) => {
  validateMutationOrigin(request);
  await requireAdminPermission("student:manage");
  await connectToDatabase();

  const body = updateTiersSchema.parse(await readJson(request));

  for (const tier of body.tiers) {
    await CommissionRule.findOneAndUpdate(
      { tierKey: tier.tierKey },
      {
        $set: {
          minFollowers: tier.minFollowers,
          maxFollowers: tier.maxFollowers ?? null,
          label: tier.label,
          amount: tier.amount,
          currency: tier.currency || "INR",
          order: tier.order,
          isActive: tier.isActive,
        },
      },
      { upsert: true, returnDocument: "after" }
    );
  }

  const updatedRules = await CommissionRule.find({ isActive: true }).sort({ order: 1 }).lean();
  return apiSuccess(updatedRules, "Commission rates updated successfully.");
});

