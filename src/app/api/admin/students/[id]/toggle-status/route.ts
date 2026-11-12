import { ApiError, apiSuccess, withApiErrors } from "@/lib/api-response";
import { requireAdminPermission } from "@/lib/admin/permissions";
import { connectToDatabase } from "@/lib/db";
import { validateMutationOrigin } from "@/lib/request";
import Student from "@/models/Student";
import User from "@/models/User";

type RouteContext = { params: Promise<{ id: string }> };

export const POST = withApiErrors(async (request: Request, { params }: RouteContext) => {
  validateMutationOrigin(request);
  await requireAdminPermission("student:manage");
  await connectToDatabase();
  const { id } = await params;

  const student = await Student.findById(id);
  if (!student) {
    throw new ApiError("Student not found.", 404);
  }

  const nextStatus = student.status === "active" ? "deactivated" : "active";
  student.status = nextStatus;
  await student.save();

  const user = await User.findById(student.user);
  if (user) {
    user.status = nextStatus;
    if (nextStatus === "deactivated") {
      user.sessionVersion = (user.sessionVersion || 0) + 1;
    }
    await user.save();
  }

  return apiSuccess(
    { id: student._id, status: nextStatus },
    `Student account has been ${nextStatus === "active" ? "activated" : "deactivated"} successfully.`
  );
});

