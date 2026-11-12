import { z } from "zod";
import { apiSuccess, ApiError, withApiErrors } from "@/lib/api-response";
import { requireAdminPermission } from "@/lib/admin/permissions";
import { connectToDatabase } from "@/lib/db";
import { readJson, validateMutationOrigin } from "@/lib/request";
import Student from "@/models/Student";
import { recordCommittedActivity } from "@/services/activity.service";

const customCommissionSchema = z
  .object({
    hasCustomCommissionRates: z.boolean(),
    customCommissionRates: z
      .array(
        z.object({
          minFollowers: z.number().int().min(0),
          maxFollowers: z.number().int().min(0).nullable().optional(),
          amount: z.number().min(0),
          label: z.string().trim().min(1),
        })
      )
      .optional()
      .default([]),
  })
  .strict();

type RouteContext = { params: Promise<{ id: string }> };

export const PUT = withApiErrors(async (request: Request, { params }: RouteContext) => {
  validateMutationOrigin(request);
  const actor = await requireAdminPermission("student:manage");
  await connectToDatabase();
  const { id } = await params;

  const student = await Student.findById(id);
  if (!student) {
    throw new ApiError("Student not found.", 404);
  }

  const body = customCommissionSchema.parse(await readJson(request));

  student.hasCustomCommissionRates = body.hasCustomCommissionRates;
  student.customCommissionRates = body.hasCustomCommissionRates
    ? body.customCommissionRates.map((t) => ({
        minFollowers: t.minFollowers,
        maxFollowers: t.maxFollowers ?? null,
        amount: t.amount,
        label: t.label,
      }))
    : [];

  await student.save();

  await recordCommittedActivity({
    actorId: actor._id,
    action: "student.custom_commission_rates_updated",
    resourceType: "Student",
    resourceId: student._id.toString(),
  });

  return apiSuccess(
    {
      studentId: student._id,
      name: student.name,
      hasCustomCommissionRates: student.hasCustomCommissionRates,
      customCommissionRates: student.customCommissionRates,
    },
    `Commission rates for ${student.name} updated successfully.`
  );
});

