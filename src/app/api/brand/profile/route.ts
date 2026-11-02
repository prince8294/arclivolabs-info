import { apiSuccess, withApiErrors } from "@/lib/api-response";
import { requireRole } from "@/lib/permissions";
import { findOwnedBrand } from "@/lib/portal-access";
import { readJson, validateMutationOrigin } from "@/lib/request";
import { brandProfileSchema } from "@/lib/validations/portal";
import Brand from "@/models/Brand";

export const GET = withApiErrors(async () => {
  const user = await requireRole(["brand"]);
  const brand = await findOwnedBrand(user);
  return apiSuccess({ brand });
});

export const PATCH = withApiErrors(async (request) => {
  validateMutationOrigin(request);
  const user = await requireRole(["brand"]);
  const input = brandProfileSchema.parse(await readJson(request));
  const brand = await Brand.findOneAndUpdate(
    { user: user._id },
    {
      $set: { ...input, email: user.email },
      $setOnInsert: { user: user._id, status: "pending" },
    },
    { returnDocument: "after", upsert: true, runValidators: true, setDefaultsOnInsert: true },
  ).select("-__v").lean();
  return apiSuccess({ brand }, "Brand profile saved.");
});
