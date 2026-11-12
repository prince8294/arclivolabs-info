import type { Metadata } from "next";
import { CreatorReferralsView } from "@/components/student/creator-referrals-view";

export const metadata: Metadata = {
  title: "Pending Verification — Student Portal",
  description: "View creators currently undergoing profile review and metric verification.",
};

export default function PendingVerificationPage() {
  return (
    <CreatorReferralsView
      filterType="pending"
      title="Pending Verification"
      description="Creators whose applications are currently under quality, niche, and audience review."
    />
  );
}

