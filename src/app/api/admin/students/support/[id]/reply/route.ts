import { z } from "zod";
import { apiSuccess, ApiError, withApiErrors } from "@/lib/api-response";
import { requireAdminPermission } from "@/lib/admin/permissions";
import { connectToDatabase } from "@/lib/db";
import { readJson, validateMutationOrigin } from "@/lib/request";
import StudentSupportTicket from "@/models/StudentSupportTicket";
import { notifyUser } from "@/services/notification.service";

const adminReplySchema = z
  .object({
    message: z.string().trim().min(2, "Message is too short.").max(3000),
    status: z.enum(["open", "in_progress", "resolved"]).optional(),
  })
  .strict();

type RouteContext = { params: Promise<{ id: string }> };

export const POST = withApiErrors(async (request: Request, { params }: RouteContext) => {
  validateMutationOrigin(request);
  const actor = await requireAdminPermission("student:manage");
  await connectToDatabase();
  const { id } = await params;

  const ticket = await StudentSupportTicket.findById(id);
  if (!ticket) {
    throw new ApiError("Support ticket not found.", 404);
  }

  const body = adminReplySchema.parse(await readJson(request));

  ticket.messages.push({
    sender: actor._id,
    senderRole: "admin",
    senderName: actor.name || "Agency Support",
    message: body.message,
    createdAt: new Date(),
  });

  ticket.lastReplyAt = new Date();
  ticket.lastReplyBy = "admin";

  if (body.status) {
    ticket.status = body.status;
    if (body.status === "resolved") {
      ticket.resolvedAt = new Date();
      ticket.resolvedBy = actor._id;
    }
  } else if (ticket.status === "open") {
    ticket.status = "in_progress";
  }

  await ticket.save();

  // Notify student
  await notifyUser({
    userId: ticket.studentUser.toString(),
    type: "support_reply",
    title: `New Reply on Ticket ${ticket.ticketNumber}`,
    message: `Admin replied: "${body.message.slice(0, 100)}"`,
    href: "/student/support",
  });

  return apiSuccess(ticket, "Reply sent to student successfully.");
});

