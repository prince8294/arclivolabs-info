import { apiSuccess, ApiError, withApiErrors } from "@/lib/api-response";
import { requireAdminPermission } from "@/lib/admin/permissions";
import { connectToDatabase } from "@/lib/db";
import StudentSupportTicket from "@/models/StudentSupportTicket";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withApiErrors(async (_request: Request, { params }: RouteContext) => {
  await requireAdminPermission("student:read");
  await connectToDatabase();
  const { id } = await params;

  const ticket = await StudentSupportTicket.findById(id)
    .populate("student", "name email studentId referralCode phone")
    .lean();

  if (!ticket) {
    throw new ApiError("Support ticket not found.", 404);
  }

  return apiSuccess(ticket);
});

