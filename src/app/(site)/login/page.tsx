import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/forms";

export const metadata: Metadata = { title: "Sign In", description: "Sign in to your Arclivo account." };

export default function LoginPage() {
  return <section className="auth-page section-pad"><div className="auth-aside"><span className="eyebrow">YOUR ARCLIVO ACCOUNT</span><h1>Good to have<br /><em>you back.</em></h1><p>Sign in to continue to your brand or creator account.</p></div><div><LoginForm /><p className="auth-switch">New here? <Link href="/register">Create an account</Link></p></div></section>;
}
