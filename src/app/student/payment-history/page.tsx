import type { Metadata } from "next";
import { StudentPaymentHistory } from "@/components/student/student-payment-history";

export const metadata: Metadata = {
  title: "Payment History — Student Portal",
  description: "View history of payouts and commission transactions.",
};

export default function StudentPaymentHistoryPage() {
  return <StudentPaymentHistory />;
}

