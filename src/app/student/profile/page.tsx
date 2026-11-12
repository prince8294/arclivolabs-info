import type { Metadata } from "next";
import { StudentProfile } from "@/components/student/student-profile";

export const metadata: Metadata = {
  title: "Profile — Student Portal | Arclivo",
  description: "View and update your student ambassador profile and credentials.",
};

export default function StudentProfilePage() {
  return <StudentProfile />;
}

