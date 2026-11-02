import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/forms";

export const metadata: Metadata = { title: "Reset Password", description: "Choose a new password for your account." };

export default function ResetPasswordPage() {
  return <section className="auth-page section-pad"><div className="auth-aside"><span className="eyebrow">ACCOUNT RECOVERY</span><h1>Back to<br /><em>what matters.</em></h1><p>Enter the secure reset token from your password recovery email.</p></div><ResetPasswordForm /></section>;
}
