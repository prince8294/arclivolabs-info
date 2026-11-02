import type { Metadata } from "next";
import { VerifyEmailForm } from "@/components/forms";

export const metadata: Metadata = { title: "Verify Email", description: "Verify the email address on your account." };

export default function VerifyEmailPage() {
  return <section className="auth-page section-pad"><div className="auth-aside"><span className="eyebrow">EMAIL VERIFICATION</span><h1>One small step<br /><em>to get started.</em></h1><p>Verification links are one-time use and expire after 24 hours.</p></div><VerifyEmailForm /></section>;
}
