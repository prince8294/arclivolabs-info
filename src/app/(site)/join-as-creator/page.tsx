import type { Metadata } from "next";
import { CreatorForm } from "@/components/forms";

export const metadata: Metadata = { title: "Join as a Creator", description: "Register your interest in joining our creator partnership network." };

export default function JoinCreatorPage() {
  return <section className="creator-application-page"><CreatorForm /></section>;
}
