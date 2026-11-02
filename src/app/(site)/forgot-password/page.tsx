import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/forms";

export const metadata: Metadata = { title: "Forgot Password", description: "Request a password reset for your account." };

export default function ForgotPasswordPage() {
  return <section className="auth-page section-pad"><div className="auth-aside"><span className="eyebrow">ACCOUNT RECOVERY</span><h1>A fresh start<br /><em>is close.</em></h1><p>Reset links are one-time use and expire after 30 minutes.</p></div><ForgotPasswordForm /></section>;
}
