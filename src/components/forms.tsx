"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name."),
  company: z.string().trim().min(2, "Please enter your company name."),
  email: z.string().trim().email("Enter a valid email address."),
  phone: z.string().trim().min(7, "Enter a phone number with at least 7 characters."),
  service: z.string().min(1, "Choose a service."),
  budget: z.string().min(1, "Choose an estimated budget."),
  preferredPlatform: z.string().min(1, "Choose a platform or select not specified."),
  details: z.string().trim().min(20, "Please share at least 20 characters about your campaign."),
  website: z.string().max(0),
});
type ContactValues = z.infer<typeof contactSchema>;

const creatorSchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name."),
  email: z.union([z.string().trim().email("Enter a valid email address."), z.literal("")]),
  phone: z.union([z.string().trim().min(7, "Enter a phone number with at least 7 characters."), z.literal("")]),
  socialProfile: z.string().trim().min(1, "Add your profile link or username."),
  platform: z.enum(["Instagram", "TikTok", "YouTube", "Other"], { error: "Choose your primary platform." }),
  followers: z.string().regex(/^[\d,]+$/, "Enter your follower or subscriber count."),
  website: z.string().max(0),
}).refine((value) => Boolean(value.email || value.phone), {
  path: ["email"],
  message: "Add an email address or phone number so our team can contact you.",
});
type CreatorValues = z.infer<typeof creatorSchema>;

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});
type LoginValues = z.infer<typeof loginSchema>;

const registerSchema = z.object({
  name: z.string().trim().min(2, "Enter your name."),
  email: z.string().trim().email("Enter a valid email address."),
  phone: z.string().trim().optional(),
  role: z.enum(["brand", "creator"]),
  password: z.string().min(12, "Use at least 12 characters.")
    .regex(/[a-z]/, "Include a lowercase letter.")
    .regex(/[A-Z]/, "Include an uppercase letter.")
    .regex(/[0-9]/, "Include a number.")
    .regex(/[^A-Za-z0-9]/, "Include a symbol."),
  confirmPassword: z.string(),
}).refine((value) => value.password === value.confirmPassword, {
  path: ["confirmPassword"],
  message: "Passwords do not match.",
});
type RegisterValues = z.infer<typeof registerSchema>;

const forgotSchema = z.object({ email: z.string().trim().email("Enter a valid email address.") });
type ForgotValues = z.infer<typeof forgotSchema>;
const resetSchema = z.object({
  token: z.string().min(32, "Paste the reset token from your link."),
  password: registerSchema.shape.password,
});
type ResetValues = z.infer<typeof resetSchema>;
const verifyEmailSchema = z.object({ token: z.string().min(32, "Paste the verification token from your link.") });
type VerifyEmailValues = z.infer<typeof verifyEmailSchema>;

type ApiResult = {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
  errors?: Array<{ field?: string; message: string }>;
};

async function submitJson(path: string, value: Record<string, unknown>): Promise<ApiResult> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(value),
  });
  let result: unknown;
  try {
    result = await response.json();
  } catch {
    throw new Error("The server returned an unreadable response. Please try again.");
  }
  if (!isApiResult(result)) throw new Error("The server returned an unexpected response. Please try again.");
  if (!response.ok || !result.success) {
    const detail = result.errors?.[0]?.message;
    throw new Error(detail ? `${result.message} ${detail}` : result.message);
  }
  return result;
}

function isApiResult(value: unknown): value is ApiResult {
  return typeof value === "object" && value !== null
    && "success" in value && typeof value.success === "boolean"
    && "message" in value && typeof value.message === "string";
}

function FieldError({ children }: { children?: string }) {
  return children ? <span className="field-error" role="alert">{children}</span> : null;
}

function FormNotice({ error, success }: { error: string; success: string }) {
  if (error) return <p className="form-error" role="alert">{error}</p>;
  if (success) return <p className="form-notice" role="status">{success}</p>;
  return null;
}

export function ContactForm() {
  const [notice, setNotice] = useState({ error: "", success: "" });
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { preferredPlatform: "Not specified", website: "" },
  });
  const submit = handleSubmit(async ({ service, ...values }) => {
    setNotice({ error: "", success: "" });
    try {
      const result = await submitJson("/api/enquiries", {
        ...values,
        service,
        preferredPlatform: values.preferredPlatform,
      });
      const reference = typeof result.data?.referenceId === "string" ? ` Reference: ${result.data.referenceId}.` : "";
      setNotice({ error: "", success: `${result.message}${reference}` });
    } catch (error) {
      setNotice({ error: error instanceof Error ? error.message : "Unable to submit your enquiry.", success: "" });
    }
  });
  return <form className="form-card contact-form-card" onSubmit={submit} noValidate>
    <div className="form-heading"><span className="eyebrow">YOUR ENQUIRY</span><h2>A few details to get us started.</h2><p>Your enquiry is validated and sent to our team. We do not send email or SMS confirmations at this time.</p></div>
    <div className="form-grid">
      <label className="form-field">Name<input {...register("name")} placeholder="Your name" autoComplete="name" /><FieldError>{errors.name?.message}</FieldError></label>
      <label className="form-field">Company name<input {...register("company")} placeholder="Company or brand" autoComplete="organization" /><FieldError>{errors.company?.message}</FieldError></label>
      <label className="form-field">Email<input {...register("email")} type="email" placeholder="you@company.com" autoComplete="email" /><FieldError>{errors.email?.message}</FieldError></label>
      <label className="form-field">Phone<input {...register("phone")} type="tel" placeholder="+1 (555) 000-0000" autoComplete="tel" /><FieldError>{errors.phone?.message}</FieldError></label>
      <label className="form-field">Service required<select {...register("service")} defaultValue=""><option value="" disabled>Select a service</option><option>Influencer marketing</option><option>Creator discovery</option><option>UGC production</option><option>Campaign management</option><option>Other / not sure yet</option></select><FieldError>{errors.service?.message}</FieldError></label>
      <label className="form-field">Estimated budget<select {...register("budget")} defaultValue=""><option value="" disabled>Select a range</option><option>Under $5,000</option><option>$5,000–$15,000</option><option>$15,000–$50,000</option><option>$50,000+</option><option>To be discussed</option></select><FieldError>{errors.budget?.message}</FieldError></label>
      <label className="form-field">Preferred platform<select {...register("preferredPlatform")}><option>Not specified</option><option>Instagram</option><option>TikTok</option><option>YouTube</option><option>Multiple platforms</option><option>Other</option></select><FieldError>{errors.preferredPlatform?.message}</FieldError></label>
      <label className="form-field form-full">Campaign details<textarea {...register("details")} rows={5} placeholder="What are you hoping to make together?" /><FieldError>{errors.details?.message}</FieldError></label>
      <label className="honeypot" aria-hidden="true">Leave this field empty<input {...register("website")} tabIndex={-1} autoComplete="off" /></label>
    </div>
    <button className="button button-dark" type="submit" disabled={isSubmitting}>{isSubmitting ? "Sending enquiry…" : "Send campaign enquiry"} <span>↗</span></button>
    <FormNotice {...notice} />
  </form>;
}

export function CreatorForm() {
  const [notice, setNotice] = useState({ error: "", success: "" });
  const [reference, setReference] = useState("");
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<CreatorValues>({
    resolver: zodResolver(creatorSchema),
    defaultValues: { website: "", email: "", phone: "" },
  });
  const submit = handleSubmit(async ({ followers, ...values }) => {
    setNotice({ error: "", success: "" });
    try {
      const result = await submitJson("/api/creators/register", {
        ...values,
        email: values.email || undefined,
        phone: values.phone || undefined,
        followers: Number(followers.replace(/,/g, "")),
      });
      setReference(typeof result.data?.referenceId === "string" ? result.data.referenceId : "");
      setNotice({ error: "", success: result.message });
    } catch (error) {
      setReference("");
      setNotice({ error: error instanceof Error ? error.message : "Unable to submit your application.", success: "" });
    }
  });
  const startAnotherApplication = () => {
    reset({ website: "", email: "", phone: "" });
    setReference("");
    setNotice({ error: "", success: "" });
  };
  return notice.success ? (
    <section
      className="creator-success form-card"
      role="status"
      aria-live="polite"
    >
      <div className="creator-success-mark" aria-hidden="true">
        <Check size={29} strokeWidth={2.5} />
      </div>
      <span className="eyebrow">APPLICATION RECEIVED</span>
      <h2>You&apos;re on our radar.</h2>
      <p className="creator-success-message">{notice.success}</p>
      <p className="creator-success-detail">Thanks for sharing your work with us. Our team will review your application.</p>
      {reference && <span className="creator-success-reference">REFERENCE <b>{reference}</b></span>}
      <button className="creator-success-again" type="button" onClick={startAnotherApplication}>
        Submit another application <ArrowRight size={15} />
      </button>
      <Link className="creator-success-home" href="/">Back to Arclivo <ArrowRight size={14} /></Link>
    </section>
  ) : (
    <form
      className="form-card"
      onSubmit={submit}
      noValidate
    >
    <div className="form-heading"><span className="eyebrow">CREATOR APPLICATION</span><h2>Let’s get to know you.</h2><p>Share five quick details. We will contact you for anything else. We do not send email confirmations in this phase.</p></div>
    <div className="form-grid">
      <label className="form-field">Full name<input {...register("name")} autoComplete="name" /><FieldError>{errors.name?.message}</FieldError></label>
      <label className="form-field">Email (or phone below)<input {...register("email")} type="email" autoComplete="email" /><FieldError>{errors.email?.message}</FieldError></label>
      <label className="form-field">Phone / WhatsApp (or email above)<input {...register("phone")} type="tel" autoComplete="tel" /><FieldError>{errors.phone?.message}</FieldError></label>
      <label className="form-field">Primary platform<select {...register("platform")} defaultValue=""><option value="" disabled>Choose platform</option><option>Instagram</option><option>TikTok</option><option>YouTube</option><option>Other</option></select><FieldError>{errors.platform?.message}</FieldError></label>
      <label className="form-field">Social profile link or username<input {...register("socialProfile")} placeholder="@yourhandle or https://…" /><FieldError>{errors.socialProfile?.message}</FieldError></label>
      <label className="form-field">Followers / subscribers<input {...register("followers")} inputMode="numeric" placeholder="e.g. 25,000" /><FieldError>{errors.followers?.message}</FieldError></label>
      <label className="honeypot" aria-hidden="true">Leave this field empty<input {...register("website")} tabIndex={-1} autoComplete="off" /></label>
    </div>
    <button className="button button-dark" type="submit" disabled={isSubmitting}>{isSubmitting ? "Submitting application…" : "Submit creator application"} <span>↗</span></button>
    <FormNotice error={notice.error} success="" />
  </form>
  );
}

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });
  const submit = handleSubmit(async (values) => {
    setError("");
    try {
      const result = await submitJson("/api/auth/login", values);
      const redirectTo = typeof result.data?.redirectTo === "string" && result.data.redirectTo.startsWith("/") ? result.data.redirectTo : "/";
      window.dispatchEvent(new Event("auth-session-changed"));
      router.push(redirectTo);
      router.refresh();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Unable to sign in.");
    }
  });
  return <form className="form-card" onSubmit={submit} noValidate><div className="form-heading"><span className="eyebrow">WELCOME BACK</span><h2>Sign in to your account.</h2><p>Use your registered email and password.</p></div><div className="form-grid"><label className="form-field form-full">Email<input {...register("email")} type="email" autoComplete="email" /><FieldError>{errors.email?.message}</FieldError></label><label className="form-field form-full">Password<input {...register("password")} type="password" autoComplete="current-password" /><FieldError>{errors.password?.message}</FieldError></label></div><button className="button button-dark" disabled={isSubmitting}>{isSubmitting ? "Signing in…" : "Sign in"} <span>↗</span></button><FormNotice error={error} success="" /><p className="form-foot-link"><Link href="/forgot-password">Forgot your password?</Link></p></form>;
}

export function RegisterForm() {
  const [notice, setNotice] = useState({ error: "", success: "" });
  const [verificationToken, setVerificationToken] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: "brand" },
  });
  const submit = handleSubmit(async (formValues) => {
    setNotice({ error: "", success: "" });
    setVerificationToken("");
    try {
      const values = {
        name: formValues.name,
        email: formValues.email,
        phone: formValues.phone || undefined,
        role: formValues.role,
        password: formValues.password,
      };
      const result = await submitJson("/api/auth/register", values);
      setNotice({ error: "", success: result.message });
      if (typeof result.data?.verificationTokenForDevelopment === "string") {
        setVerificationToken(result.data.verificationTokenForDevelopment);
      }
    } catch (error) {
      setNotice({ error: error instanceof Error ? error.message : "Unable to create your account.", success: "" });
    }
  });
  return <form className="form-card" onSubmit={submit} noValidate><div className="form-heading"><span className="eyebrow">CREATE AN ACCOUNT</span><h2>Let’s get started.</h2><p>Public accounts are limited to brand and creator roles. Admin accounts must be provisioned securely.</p></div><div className="form-grid"><label className="form-field form-full">Full name<input {...register("name")} autoComplete="name" /><FieldError>{errors.name?.message}</FieldError></label><label className="form-field form-full">Email<input {...register("email")} type="email" autoComplete="email" /><FieldError>{errors.email?.message}</FieldError></label><label className="form-field form-full">Phone (optional)<input {...register("phone")} type="tel" autoComplete="tel" /><FieldError>{errors.phone?.message}</FieldError></label><label className="form-field form-full">Account type<select {...register("role")}><option value="brand">Brand</option><option value="creator">Creator</option></select><FieldError>{errors.role?.message}</FieldError></label><label className="form-field form-full">Password<input {...register("password")} type="password" autoComplete="new-password" /><FieldError>{errors.password?.message}</FieldError></label><label className="form-field form-full">Confirm password<input {...register("confirmPassword")} type="password" autoComplete="new-password" /><FieldError>{errors.confirmPassword?.message}</FieldError></label></div><button className="button button-dark" disabled={isSubmitting}>{isSubmitting ? "Creating account…" : "Create account"} <span>↗</span></button><FormNotice {...notice} />{verificationToken && <p className="form-notice">Development-only verification token: <code>{verificationToken}</code>. <Link href="/verify-email">Verify email</Link></p>}<p className="form-foot-link">Already registered? <Link href="/login">Sign in</Link></p></form>;
}

export function ForgotPasswordForm() {
  const [notice, setNotice] = useState({ error: "", success: "" });
  const [developmentToken, setDevelopmentToken] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotValues>({ resolver: zodResolver(forgotSchema) });
  const submit = handleSubmit(async (values) => {
    setNotice({ error: "", success: "" });
    setDevelopmentToken("");
    try {
      const result = await submitJson("/api/auth/forgot-password", values);
      setNotice({ error: "", success: result.message });
      if (typeof result.data?.resetToken === "string") setDevelopmentToken(result.data.resetToken);
    } catch (error) {
      setNotice({ error: error instanceof Error ? error.message : "Unable to request password reset.", success: "" });
    }
  });
  return <form className="form-card" onSubmit={submit} noValidate><div className="form-heading"><span className="eyebrow">ACCOUNT RECOVERY</span><h2>Reset your password.</h2><p>Password recovery tokens expire after 30 minutes. Email delivery must be configured before production use.</p></div><label className="form-field">Account email<input {...register("email")} type="email" autoComplete="email" /><FieldError>{errors.email?.message}</FieldError></label><button className="button button-dark" disabled={isSubmitting}>{isSubmitting ? "Requesting…" : "Request reset"} <span>↗</span></button><FormNotice {...notice} />{developmentToken && <p className="form-notice">Development-only reset token: <code>{developmentToken}</code></p>}<p className="form-foot-link"><Link href="/reset-password">Already have a reset token?</Link></p></form>;
}

export function ResetPasswordForm() {
  const [notice, setNotice] = useState({ error: "", success: "" });
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<ResetValues>({ resolver: zodResolver(resetSchema) });
  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (token) setValue("token", token);
  }, [setValue]);
  const submit = handleSubmit(async (values) => {
    setNotice({ error: "", success: "" });
    try {
      const result = await submitJson("/api/auth/reset-password", values);
      setNotice({ error: "", success: result.message });
    } catch (error) {
      setNotice({ error: error instanceof Error ? error.message : "Unable to reset your password.", success: "" });
    }

  });
  return <form className="form-card" onSubmit={submit} noValidate><div className="form-heading"><span className="eyebrow">ACCOUNT RECOVERY</span><h2>Choose a new password.</h2><p>A reset link sent by email fills this token automatically. Tokens expire after 30 minutes.</p></div><label className="form-field">Reset token<input {...register("token")} autoComplete="off" /><FieldError>{errors.token?.message}</FieldError></label><label className="form-field">New password<input {...register("password")} type="password" autoComplete="new-password" /><FieldError>{errors.password?.message}</FieldError></label><button className="button button-dark" disabled={isSubmitting}>{isSubmitting ? "Updating…" : "Reset password"} <span>↗</span></button><FormNotice {...notice} /></form>;
}

export function VerifyEmailForm() {
  const [notice, setNotice] = useState({ error: "", success: "" });
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<VerifyEmailValues>({ resolver: zodResolver(verifyEmailSchema) });
  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (token) setValue("token", token);
  }, [setValue]);
  const submit = handleSubmit(async (values) => {
    setNotice({ error: "", success: "" });
    try {
      const result = await submitJson("/api/auth/verify-email", values);
      setNotice({ error: "", success: result.message });
    } catch (error) {
      setNotice({ error: error instanceof Error ? error.message : "Unable to verify this email address.", success: "" });
    }
  });
  return <form className="form-card" onSubmit={submit} noValidate><div className="form-heading"><span className="eyebrow">EMAIL VERIFICATION</span><h2>Confirm your email.</h2><p>A verification email fills this token automatically. If you are testing locally, you can paste the development token.</p></div><label className="form-field">Verification token<input {...register("token")} autoComplete="off" /><FieldError>{errors.token?.message}</FieldError></label><button className="button button-dark" disabled={isSubmitting}>{isSubmitting ? "Verifying…" : "Verify email"} <span>↗</span></button><FormNotice {...notice} /></form>;
}
