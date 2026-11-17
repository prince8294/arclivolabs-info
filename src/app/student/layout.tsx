import { redirect } from "next/navigation";
import { DM_Sans, Fraunces } from "next/font/google";
import { auth, sessionCookieName } from "@/lib/auth";
import { cookies } from "next/headers";
import { connectToDatabase } from "@/lib/db";
import Student from "@/models/Student";
import User from "@/models/User";
import { StudentShell } from "@/components/student/student-shell";

const adminSans = DM_Sans({
  subsets: ["latin"],
  weight: "variable",
  variable: "--font-admin-sans",
  display: "swap",
});

const adminSerif = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-admin-serif",
  display: "swap",
});

export default async function StudentLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  if (!cookieStore.has(sessionCookieName)) {
    redirect("/login?callbackUrl=%2Fstudent%2Foverview");
  }

  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=%2Fstudent%2Foverview");
  }

  await connectToDatabase();
  const user = await User.findById(session.user.id).select("-passwordHash").lean();
  if (!user || user.status !== "active" || user.role !== "student") {
    redirect("/login?callbackUrl=%2Fstudent%2Foverview");
  }

  const student = await Student.findOne({ user: user._id }).lean();
  if (!student || student.status !== "active") {
    redirect("/login?callbackUrl=%2Fstudent%2Foverview");
  }

  return (
    <div className={`${adminSans.variable} ${adminSerif.variable}`}>
      <StudentShell
        student={{
          name: student.name,
          email: student.email,
          studentId: student.studentId,
          referralCode: student.referralCode,
          status: student.status,
        }}
      >
        {children}
      </StudentShell>
    </div>
  );
}

