import type { Metadata } from "next";
import { StudentManagement } from "@/components/admin/student-management";

export const metadata: Metadata = {
  title: "Student Management — Arclivo Admin",
  description: "Manage student accounts, Student IDs, referral codes, and active status.",
};

export default function AdminStudentsPage() {
  return <StudentManagement />;
}

