"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Menu, X } from "lucide-react";

const links = [
  ["About", "/about"],
  ["Services", "/services"],
  ["Creators", "/creators"],
  ["Case Studies", "/case-studies"],
  ["Insights", "/insights"],
  ["Contact", "/contact"],
];

export function Navigation() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [account, setAccount] = useState<{ name: string } | null>(null);
  const [accountError, setAccountError] = useState("");

  useEffect(() => {
    let active = true;
    const loadAccount = async () => {
      try {
        const response = await fetch("/api/auth/session", { cache: "no-store" });
        const result: unknown = await response.json();
        if (!response.ok || !isSessionResponse(result)) throw new Error("Unable to check the current account.");
        if (active) {
          setAccount(result.data.authenticated ? { name: result.data.user?.name ?? "Account" } : null);
          setAccountError("");
        }
      } catch {
        if (active) setAccountError("Account status temporarily unavailable.");
      }
    };
    void loadAccount();
    window.addEventListener("auth-session-changed", loadAccount);
    return () => {
      active = false;
      window.removeEventListener("auth-session-changed", loadAccount);
    };
  }, []);

  const logout = async () => {
    setAccountError("");
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      const result: unknown = await response.json();
      if (!response.ok || !isLogoutResponse(result) || !result.success) {
        throw new Error(isLogoutResponse(result) ? result.message : "Unable to sign out.");
      }
      setAccount(null);
      setOpen(false);
      window.dispatchEvent(new Event("auth-session-changed"));
      router.refresh();
    } catch (error) {
      setAccountError(error instanceof Error ? error.message : "Unable to sign out.");
    }
  };

  return <header className="site-header"><nav className="nav-shell" aria-label="Main navigation"><Link className="wordmark" href="/" onClick={() => setOpen(false)}><Image className="brand-mark-image" src="/artwork/arclivo-mark.svg" width={34} height={34} alt="" aria-hidden="true" /><span>ARCLIVO<span className="wordmark-small"> / CREATOR MARKETING</span></span></Link><div className="desktop-nav"><Link href="/">Home</Link>{links.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}{account ? <button className="nav-account" type="button" onClick={logout}>Sign out</button> : <Link href="/login">Sign in</Link>}</div><Link className="nav-cta" href="/contact">Start a Campaign <ArrowUpRight size={15} /></Link><button className="mobile-menu-button" type="button" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen((value) => !value)}>{open ? <X size={21} /> : <Menu size={21} />}</button></nav>{open && <div className="mobile-nav">{[["Home", "/"], ...links, ["Join as Creator", "/join-as-creator"], ...(account ? [] : [["Sign in", "/login"], ["Create account", "/register"]])].map(([label, href]) => <Link key={href} href={href} onClick={() => setOpen(false)}>{label}<ArrowUpRight size={15} /></Link>)}{account && <button type="button" onClick={logout}>Sign out <ArrowUpRight size={15} /></button>}{accountError && <p role="status">{accountError}</p>}</div>}{accountError && <p className="nav-status" role="status">{accountError}</p>}</header>;
}

function isSessionResponse(value: unknown): value is {
  success: true;
  data: { authenticated: boolean; user: { name: string } | null };
} {
  if (typeof value !== "object" || value === null || !("success" in value) || value.success !== true || !("data" in value)) return false;
  const data = value.data;
  if (typeof data !== "object" || data === null || !("authenticated" in data) || typeof data.authenticated !== "boolean" || !("user" in data)) return false;
  return data.user === null || (typeof data.user === "object" && data.user !== null && "name" in data.user && typeof data.user.name === "string");
}

function isLogoutResponse(value: unknown): value is { success: boolean; message: string } {
  return typeof value === "object" && value !== null
    && "success" in value && typeof value.success === "boolean"
    && "message" in value && typeof value.message === "string";
}

export function Footer() {
  return <footer className="site-footer"><div className="footer-main"><div className="footer-brand"><Link className="wordmark wordmark-footer" href="/"><Image className="brand-mark-image" src="/artwork/arclivo-mark.svg" width={34} height={34} alt="" aria-hidden="true" /><span>ARCLIVO<span className="wordmark-small"> / CREATOR MARKETING</span></span></Link><p>A hands-on influencer marketing team for brands that want meaningful creator partnerships.</p></div><div className="footer-column"><span className="footer-label">EXPLORE</span><Link href="/about">About</Link><Link href="/services">Services</Link><Link href="/creators">Creators</Link><Link href="/case-studies">Campaign concepts</Link><Link href="/insights">Insights</Link><Link href="/login">Sign in</Link><Link href="/register">Create account</Link></div><div className="footer-column"><span className="footer-label">SAY HELLO</span><Link href="/contact">Start a campaign</Link><Link href="/join-as-creator">Join as a creator</Link></div><div className="footer-note"><span className="eyebrow">GOOD WORK STARTS WITH A CONVERSATION.</span><Link className="footer-contact-link" href="/contact">Tell us what you’re thinking <ArrowUpRight size={16} /></Link></div></div><div className="footer-bottom"><span>© 2026 ARCLIVO</span><span>Creator profiles and campaign concepts are clearly marked when illustrative.</span><div><Link href="/privacy-policy">Privacy Policy</Link><Link href="/terms">Terms & Conditions</Link></div></div></footer>;
}
