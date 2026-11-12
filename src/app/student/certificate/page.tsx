import type { Metadata } from "next";
import { StudentCertificate } from "@/components/student/student-certificate";

export const metadata: Metadata = {
  title: "My Certificate — Student Portal",
  description: "View your campus ambassador certification status and program credentials.",
};

export default function StudentCertificatePage() {
  return <StudentCertificate />;
}

