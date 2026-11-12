import type { Metadata } from "next";
import { CreatorReferralsView } from "@/components/student/creator-referrals-view";

export const metadata: Metadata = {
  title: "Total Creators Referred — Student Portal",
  description: "View all creators who signed up using your ambassador referral code.",
};

export default function CreatorsReferredPage() {
  return (
    <CreatorReferralsView
      filterType="all"
      title="Total Creators Referred"
      description="All creator applications and registrations submitted using your unique referral code."
    />
  );
}

