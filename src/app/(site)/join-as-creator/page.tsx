import type { Metadata } from "next";
import { CreatorForm } from "@/components/forms";

export const metadata: Metadata = { title: "Join as a Creator", description: "Register your interest in joining our creator partnership network." };

export default async function JoinCreatorPage({
  searchParams,
}: {
  searchParams?: Promise<{ ref?: string }>;
}) {
  const resolved = searchParams ? await searchParams : undefined;
  return (
    <section className="creator-application-page">
      <CreatorForm initialReferralCode={resolved?.ref} />
    </section>
  );
}
