import { z } from "zod";
import { apiSuccess, ApiError, withApiErrors } from "@/lib/api-response";
import { requireAdminPermission } from "@/lib/admin/permissions";
import { connectToDatabase } from "@/lib/db";
import { readJson, validateMutationOrigin } from "@/lib/request";
import StudentSupportTicket from "@/models/StudentSupportTicket";

const statusSchema = z
  .object({
    status: z.enum(["open", "in_progress", "resolved", "closed"]),
  })
  .strict();

type RouteContext = { params: Promise<{ id: string }> };

export const PATCH = withApiErrors(async (request: Request, { params }: RouteContext) => {
  validateMutationOrigin(request);
  const actor = await requireAdminPermission("student:manage");
  await connectToDatabase();
  const { id } = await params;

  const ticket = await StudentSupportTicket.findById(id);
  if (!ticket) {
    throw new ApiError("Support ticket not found.", 404);
  }

  const body = statusSchema.parse(await readJson(request));

  ticket.status = body.status;
  if (body.status === "resolved" || body.status === "closed") {
    ticket.resolvedAt = new Date();
    ticket.resolvedBy = actor._id;
  }

  await ticket.save();

  return apiSuccess(ticket, `Ticket ${ticket.ticketNumber} marked as ${body.status}.`);
});

