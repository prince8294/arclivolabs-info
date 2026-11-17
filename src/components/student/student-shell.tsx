"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Award,
  Check,
  Clock,
  Copy,
  ExternalLink,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareText,
  Receipt,
  UserCheck,
  UserRound,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

type MenuItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  group?: string;
};

// Exact 10 menu items requested in specification
const menuGroups = [
  {
    group: "Dashboard",
    items: [
      { title: "Overview", href: "/student/overview", icon: LayoutDashboard },
      { title: "DM Templates", href: "/student/dm-templates", icon: MessageSquareText },
    ],
  },
  {
    group: "Referral Network",
    items: [
      { title: "Total Creators Referred", href: "/student/creators-referred", icon: Users },
      { title: "Verified Creators", href: "/student/verified-creators", icon: UserCheck },
      { title: "Pending Verification", href: "/student/pending-verification", icon: Clock },
    ],
  },
  {
    group: "Finance & Honors",
    items: [
      { title: "Total Earnings", href: "/student/earnings", icon: Wallet },
      { title: "Payment History", href: "/student/payment-history", icon: Receipt },
      { title: "My Certificate", href: "/student/certificate", icon: Award },
    ],
  },
  {
    group: "Account & Support",
    items: [
      { title: "Support", href: "/student/support", icon: HelpCircle },
      { title: "Profile", href: "/student/profile", icon: UserRound },
    ],
  },
];

export function StudentShell({
  student,
  children,
}: {
  student: {
    name: string;
    email: string;
    studentId: string;
    referralCode: string;
    status: string;
  };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const origin = typeof window !== "undefined" ? window.location.origin : "https://arclivolabs.com";
  const referralLink = `${origin}/join-as-creator/${student.referralCode}`;

  function copyReferralCode() {
    navigator.clipboard.writeText(student.referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  }

  function copyReferralLink() {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }

  async function handleLogout() {
    setSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
      router.replace("/login");
      router.refresh();
    } catch {
      router.replace("/login");
    } finally {
      setSigningOut(false);
    }
  }

  const allItems = menuGroups.flatMap((g) => g.items);
  const activeTitle =
    allItems.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))?.title ??
    "Overview";

  return (
    <div className="admin-frame">
      {/* Mobile Scrim */}
      {mobileOpen && (
        <button
          type="button"
          className="admin-scrim"
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation"
        />
      )}

      {/* Sidebar */}
      <aside className={`admin-sidebar ${mobileOpen ? "admin-sidebar-open" : ""}`}>
        {/* Brand Header */}
        <Link
          href="/student/overview"
          className="admin-brand"
          onClick={() => setMobileOpen(false)}
        >
          <span className="admin-brand-symbol">A</span>
          <span>
            ARCLIVO<span className="admin-brand-sub">STUDENT PORTAL</span>
          </span>
        </Link>

        {/* Quick Referral Box inside Sidebar */}
        <div
          style={{
            margin: "12px 14px 6px",
            padding: "10px 12px",
            background: "rgba(255, 255, 255, 0.04)",
            border: "1px solid rgba(255, 255, 255, 0.07)",
            borderRadius: "6px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "4px",
            }}
          >
            <span
              style={{
                fontSize: "8.5px",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "#8a8a82",
                fontWeight: "700",
              }}
            >
              Referral Code
            </span>
            <span style={{ fontSize: "9px", color: "#4ade80", fontWeight: "600" }}>● Active</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span
              style={{
                fontFamily: "monospace",
                fontSize: "12.5px",
                fontWeight: "700",
                color: "#ffffff",
                letterSpacing: "0.06em",
              }}
            >
              {student.referralCode}
            </span>
            <button
              type="button"
              onClick={copyReferralCode}
              style={{
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                color: "#ffffff",
                padding: "3px 8px",
                borderRadius: "4px",
                fontSize: "10px",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                transition: "all 0.15s ease",
              }}
              title="Copy referral code"
            >
              {copiedCode ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
              <span>{copiedCode ? "Copied" : "Copy"}</span>
            </button>
          </div>
          <div style={{ fontSize: "9px", color: "#777770", fontFamily: "monospace", marginTop: "4px" }}>
            ID: {student.studentId}
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="admin-nav" aria-label="Student navigation">
          {menuGroups.map(({ group, items }) => (
            <div className="admin-nav-group" key={group}>
              <div className="admin-sidebar-label">{group}</div>
              {items.map(({ title, href, icon: Icon }) => {
                const isActive =
                  pathname === href || (href !== "/student/overview" && pathname.startsWith(href));
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={isActive ? "admin-nav-link admin-nav-active" : "admin-nav-link"}
                  >
                    <Icon size={16} strokeWidth={1.7} />
                    <span>{title}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User Footer */}
        <div className="admin-sidebar-bottom">
          <div className="admin-user-chip">
            <span className="admin-avatar">{student.name.trim().charAt(0).toUpperCase()}</span>
            <span className="admin-user-meta">
              <b>{student.name}</b>
              <small>Campus Ambassador</small>
            </span>
          </div>
          <button
            type="button"
            className="admin-logout"
            onClick={handleLogout}
            disabled={signingOut}
          >
            <LogOut size={16} />
            <span>{signingOut ? "Signing out…" : "Sign out"}</span>
          </button>
          <div className="admin-sidebar-note">
            <span />
            Verified student ambassador
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="admin-main">
        {/* Topbar */}
        <header className="admin-topbar">
          <button
            type="button"
            className="admin-mobile-trigger"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={20} />
          </button>
          <div className="admin-breadcrumb">
            <span>Student Portal</span>
            <span>/</span>
            <b>{activeTitle}</b>
          </div>
          <div className="admin-topbar-right">
            <button
              type="button"
              onClick={copyReferralLink}
              className="admin-button admin-button-secondary"
              style={{ minHeight: "32px", padding: "0 10px", fontSize: "10.5px" }}
              title="Copy your personal creator registration link"
            >
              {copiedLink ? <Check size={12} /> : <ExternalLink size={12} />}
              <span>{copiedLink ? "Link copied!" : "Copy referral link"}</span>
            </button>
            <span className="admin-secure">
              <span />
              Active Ambassador
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
}
