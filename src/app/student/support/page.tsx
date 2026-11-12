import type { Metadata } from "next";
import { StudentSupport } from "@/components/student/student-support";

export const metadata: Metadata = {
  title: "Support — Student Portal | Arclivo",
  description: "Ambassador support desk and frequently asked questions.",
};

export default function StudentSupportPage() {
  return <StudentSupport />;
}

