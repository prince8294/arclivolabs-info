import { z } from "zod";
import { apiSuccess, ApiError, withApiErrors } from "@/lib/api-response";
import { requireRole } from "@/lib/permissions";
import { connectToDatabase } from "@/lib/db";
import { readJson, validateMutationOrigin } from "@/lib/request";
import Student from "@/models/Student";
import StudentSupportTicket from "@/models/StudentSupportTicket";
import { notifyAdminUsers } from "@/services/notification.service";

const replySchema = z
  .object({
    message: z.string().trim().min(2, "Message is too short.").max(3000),
  })
  .strict();

type RouteContext = { params: Promise<{ id: string }> };

export const POST = withApiErrors(async (request: Request, { params }: RouteContext) => {
  validateMutationOrigin(request);
  const user = await requireRole(["student"]);
  await connectToDatabase();
  const { id } = await params;

  const student = await Student.findOne({ user: user._id });
  if (!student) {
    throw new ApiError("Student profile not found.", 404);
  }

  const ticket = await StudentSupportTicket.findOne({
    _id: id,
    student: student._id,
  });

  if (!ticket) {
    throw new ApiError("Support ticket not found.", 404);
  }

  const body = replySchema.parse(await readJson(request));

  ticket.messages.push({
    sender: user._id,
    senderRole: "student",
    senderName: student.name,
    message: body.message,
    createdAt: new Date(),
  });

  ticket.lastReplyAt = new Date();
  ticket.lastReplyBy = "student";
  // Re-open if resolved
  if (ticket.status === "resolved") {
    ticket.status = "open";
  }

  await ticket.save();

  await notifyAdminUsers({
    type: "student_ticket_reply",
    title: `Student Reply on ${ticket.ticketNumber}`,
    message: `${student.name}: "${body.message.slice(0, 120)}"`,
    href: "/admin/students?tab=support",
    data: { ticketId: ticket._id.toString(), ticketNumber: ticket.ticketNumber },
  });

  return apiSuccess(ticket, "Reply sent successfully.");
});

