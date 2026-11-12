import { apiSuccess, ApiError, withApiErrors } from "@/lib/api-response";
import { requireRole } from "@/lib/permissions";
import { connectToDatabase } from "@/lib/db";
import Student from "@/models/Student";
import StudentSupportTicket from "@/models/StudentSupportTicket";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withApiErrors(async (_request: Request, { params }: RouteContext) => {
  const user = await requireRole(["student"]);
  await connectToDatabase();
  const { id } = await params;

  const student = await Student.findOne({ user: user._id }).lean();
  if (!student) {
    throw new ApiError("Student profile not found.", 404);
  }

  const ticket = await StudentSupportTicket.findOne({
    _id: id,
    student: student._id,
  }).lean();

  if (!ticket) {
    throw new ApiError("Support ticket not found or access denied.", 404);
  }

  return apiSuccess(ticket);
});

