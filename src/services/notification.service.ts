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
    const administrativeRoles = userRoles.filter((role) => !["brand", "creator"].includes(role));
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
