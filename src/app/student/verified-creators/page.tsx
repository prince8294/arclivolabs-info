import type { Metadata } from "next";
import { CreatorReferralsView } from "@/components/student/creator-referrals-view";

export const metadata: Metadata = {
  title: "Verified Creators — Student Portal",
  description: "View verified creators referred by your code who are eligible for campaign rewards.",
};

export default function VerifiedCreatorsPage() {
  return (
    <CreatorReferralsView
      filterType="verified"
      title="Verified Creators"
      description="Creators who have been reviewed and approved by the ArclivoLabs onboarding team."
    />
  );
}

