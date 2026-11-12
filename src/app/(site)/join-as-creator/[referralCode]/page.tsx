import type { Metadata } from "next";
import { CreatorForm } from "@/components/forms";

export const metadata: Metadata = {
  title: "Join as a Creator — Ambassador Invite | Arclivo",
  description: "Register your interest in joining our creator network with your ambassador invitation code.",
};

export default async function JoinCreatorWithReferralPage({
  params,
}: {
  params: Promise<{ referralCode: string }>;
}) {
  const { referralCode } = await params;
  return (
    <section className="creator-application-page">
      <CreatorForm initialReferralCode={referralCode} />
    </section>
  );
}

