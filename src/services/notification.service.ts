import { Types } from "mongoose";
import Notification from "@/models/Notification";
import User, { userRoles } from "@/models/User";
import { connectToDatabase } from "@/lib/db";

type AdminNotice = {
  type: string;
  title: string;
  message: string;
  href: string;
  data?: Record<string, string>;
};

export async function notifyAdminUsers(notice: AdminNotice): Promise<void> {
  try {
    await connectToDatabase();
    const administrativeRoles = userRoles.filter((role) => !["brand", "creator", "student"].includes(role));
    const recipients = await User.find({ role: { $in: administrativeRoles }, status: "active" }).select("_id").lean();
    if (recipients.length === 0) return;
    await Notification.insertMany(recipients.map(({ _id }) => ({
      recipient: _id,
      type: notice.type,
      title: notice.title,
      message: notice.message,
      data: { href: notice.href, ...notice.data },
    })));
  } catch (error) {
    console.error(`Admin notification could not be persisted for ${notice.type}.`, error);
  }
}

export type UserNotice = {
  userId: string | Types.ObjectId;
  type: string;
  title: string;
  message: string;
  href?: string;
  data?: Record<string, string>;
};

export async function notifyUser(notice: UserNotice): Promise<void> {
  try {
    await connectToDatabase();
    await Notification.create({
      recipient: typeof notice.userId === "string" ? new Types.ObjectId(notice.userId) : notice.userId,
      type: notice.type,
      title: notice.title,
      message: notice.message,
      data: { ...(notice.href ? { href: notice.href } : {}), ...notice.data },
    });
  } catch (error) {
    console.error(`User notification could not be persisted for ${notice.type}.`, error);
  }
}
