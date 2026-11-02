import { Types } from "mongoose";
import { apiSuccess, ApiError, withApiErrors } from "@/lib/api-response";
import { connectToDatabase } from "@/lib/db";
import { elevatedRoles, requireRole } from "@/lib/permissions";
import Enquiry from "@/models/Enquiry";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withApiErrors(async (_request, context: RouteContext) => {
  await requireRole(elevatedRoles);
  const { id } = await context.params;
  await connectToDatabase();
  const enquiry = await Enquiry.findOne(
    Types.ObjectId.isValid(id) ? { _id: id } : { referenceId: id },
  ).select("-dedupeHash -__v").lean();
  if (!enquiry) throw new ApiError("Enquiry was not found.", 404);
  return apiSuccess({ enquiry });
});
