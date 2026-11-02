import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/components/forms";

export const metadata: Metadata = { title: "Create Account", description: "Create a brand or creator account." };

export default function RegisterPage() {
  return <section className="auth-page section-pad"><div className="auth-aside"><span className="eyebrow">START A CONVERSATION</span><h1>A place for<br /><em>good work.</em></h1><p>Create a brand or creator account. Elevated agency roles are provisioned securely and cannot be self-selected.</p></div><div><RegisterForm /><p className="auth-switch">Already registered? <Link href="/login">Sign in</Link></p></div></section>;
}
