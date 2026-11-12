import { z } from "zod";
import { apiSuccess, ApiError, withApiErrors } from "@/lib/api-response";
import { requireRole } from "@/lib/permissions";
import { connectToDatabase } from "@/lib/db";
import { readJson, validateMutationOrigin } from "@/lib/request";
import Student from "@/models/Student";
import StudentSupportTicket from "@/models/StudentSupportTicket";
import { generateTicketNumber } from "@/lib/student-payment";
import { notifyAdminUsers } from "@/services/notification.service";

const createTicketSchema = z
  .object({
    category: z.enum([
      "Commission & Payouts",
      "Referral Tracking",
      "Creator Verification",
      "Account & Profile",
      "General Support",
    ]),
    subject: z.string().trim().min(3, "Subject must be at least 3 characters.").max(200),
    message: z.string().trim().min(5, "Message must be at least 5 characters.").max(3000),
  })
  .strict();

export const GET = withApiErrors(async () => {
  const user = await requireRole(["student"]);
  await connectToDatabase();

  const student = await Student.findOne({ user: user._id }).lean();
  if (!student) {
    throw new ApiError("Student profile not found.", 404);
  }

  const tickets = await StudentSupportTicket.find({ student: student._id })
    .sort({ lastReplyAt: -1, createdAt: -1 })
    .select("ticketNumber category subject status priority createdAt lastReplyAt lastReplyBy messages")
    .lean();

  const formatted = tickets.map((t) => ({
    _id: t._id,
    ticketNumber: t.ticketNumber,
    category: t.category,
    subject: t.subject,
    status: t.status,
    priority: t.priority,
    createdAt: t.createdAt,
    lastReplyAt: t.lastReplyAt,
    lastReplyBy: t.lastReplyBy,
    messagesCount: t.messages?.length || 0,
    latestMessageSnippet: t.messages?.[t.messages.length - 1]?.message?.slice(0, 100) || "",
  }));

  return apiSuccess({
    tickets: formatted,
    total: formatted.length,
  });
});

export const POST = withApiErrors(async (request: Request) => {
  validateMutationOrigin(request);
  const user = await requireRole(["student"]);
  await connectToDatabase();

  const student = await Student.findOne({ user: user._id });
  if (!student || student.status !== "active") {
    throw new ApiError("Active student account required.", 403);
  }

  const body = createTicketSchema.parse(await readJson(request));
  const ticketNumber = generateTicketNumber();

  const ticket = await StudentSupportTicket.create({
    ticketNumber,
    student: student._id,
    studentUser: user._id,
    studentName: student.name,
    studentEmail: student.email,
    studentId: student.studentId,
    category: body.category,
    subject: body.subject,
    status: "open",
    priority: "medium",
    messages: [
      {
        sender: user._id,
        senderRole: "student",
        senderName: student.name,
        message: body.message,
        createdAt: new Date(),
      },
    ],
    lastReplyAt: new Date(),
    lastReplyBy: "student",
  });

  await notifyAdminUsers({
    type: "student_support_ticket",
    title: `New Student Support Request: ${ticketNumber}`,
    message: `${student.name} [${student.studentId}] submitted: "${body.subject}"`,
    href: "/admin/students?tab=support",
    data: { ticketId: ticket._id.toString(), ticketNumber },
  });

  return apiSuccess(
    ticket,
    `Support request ${ticketNumber} created. Our support team will review and reply promptly.`,
    201
  );
});

