import type { Metadata } from "next";
import { StudentEarnings } from "@/components/student/student-earnings";

export const metadata: Metadata = {
  title: "Total Earnings — Student Portal",
  description: "View your student ambassador earnings balance and referral compensation.",
};

export default function StudentEarningsPage() {
  return <StudentEarnings />;
}

