import type { Metadata } from "next";
import { StudentOverview } from "@/components/student/student-overview";

export const metadata: Metadata = {
  title: "Overview — Student Portal | Arclivo",
  description: "View your student ambassador overview, referred creators, and earnings.",
};

export default function StudentOverviewPage() {
  return <StudentOverview />;
}

