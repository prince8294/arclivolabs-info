import { apiSuccess, withApiErrors } from "@/lib/api-response";
import { connectToDatabase } from "@/lib/db";
import { requireOwnedCreator } from "@/lib/portal-access";
import { requireRole } from "@/lib/permissions";
import { readJson, validateMutationOrigin } from "@/lib/request";
import { socialAccountSchema } from "@/lib/validations/portal";
import SocialAccount from "@/models/SocialAccount";

export const GET = withApiErrors(async () => {
  const user = await requireRole(["creator"]);
  const creator = await requireOwnedCreator(user);
  await connectToDatabase();
  const accounts = await SocialAccount.find({ creator: creator._id }).select("-__v").sort({ createdAt: 1 }).lean();
  return apiSuccess({ accounts });
});

export const POST = withApiErrors(async (request) => {
  validateMutationOrigin(request);
  const user = await requireRole(["creator"]);
  const creator = await requireOwnedCreator(user);
  const body = socialAccountSchema.parse(await readJson(request));
  await connectToDatabase();
  const account = await SocialAccount.create({ ...body, creator: creator._id, verificationStatus: "unverified" });
  return apiSuccess({ account }, "Social account added. Metrics are not verified.", 201);
});
