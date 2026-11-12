"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Award,
  Check,
  Clock,
  Copy,
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
  X,
  type LucideIcon,
} from "lucide-react";

type MenuItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

// Exact 10 menu items requested in specification
const menuItems: MenuItem[] = [
  { title: "Overview", href: "/student/overview", icon: LayoutDashboard },
  { title: "Total Creators Referred", href: "/student/creators-referred", icon: Users },
  { title: "Verified Creators", href: "/student/verified-creators", icon: UserCheck },
  { title: "Pending Verification", href: "/student/pending-verification", icon: Clock },
  { title: "Total Earnings", href: "/student/earnings", icon: Wallet },
  { title: "DM Templates", href: "/student/dm-templates", icon: MessageSquareText },
  { title: "Payment History", href: "/student/payment-history", icon: Receipt },
  { title: "Support", href: "/student/support", icon: HelpCircle },
  { title: "Profile", href: "/student/profile", icon: UserRound },
  { title: "My Certificate", href: "/student/certificate", icon: Award },
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

  function copyReferralCode() {
    navigator.clipboard.writeText(student.referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
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

  const activeTitle =
    menuItems.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))?.title ??
    "Overview";

  return (
    <div className="min-h-screen bg-[#f7f7fa] flex text-[#24253a]">
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#171828] text-white flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-[#28293d] flex items-center justify-between">
          <Link
            href="/student/overview"
            className="flex items-center gap-2.5 text-white font-extrabold tracking-wider text-sm"
            onClick={() => setMobileOpen(false)}
          >
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#9075ec] to-[#50417d] text-white flex items-center justify-center font-serif text-lg font-bold shadow-xs">
              A
            </span>
            <div>
              <span className="block leading-tight tracking-wider">ARCLIVO</span>
              <span className="text-[9px] text-[#9495a9] tracking-widest font-semibold block uppercase">
                Student Portal
              </span>
            </div>
          </Link>
          <button
            type="button"
            className="text-gray-400 hover:text-white lg:hidden p-1"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Quick Referral Box */}
        <div className="mx-3.5 my-3 p-3 rounded-xl bg-[#212236] border border-[#2e304b]">
          <div className="flex items-center justify-between text-[10px] text-[#8e90a6] uppercase font-bold tracking-wider mb-1">
            <span>Referral Code</span>
            <span className="text-emerald-400 font-mono text-[9px] lowercase">active</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-mono text-sm font-bold text-white tracking-wider">
              {student.referralCode}
            </span>
            <button
              type="button"
              onClick={copyReferralCode}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#b7a5ff] hover:text-white px-2 py-0.5 rounded bg-[#2e304b] hover:bg-[#3a3d5e] transition-colors"
              title="Copy your referral code"
            >
              {copiedCode ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              <span>{copiedCode ? "Copied" : "Copy"}</span>
            </button>
          </div>
          <div className="text-[10px] text-[#71738c] font-mono mt-1">ID: {student.studentId}</div>
        </div>

        {/* Navigation Menu */}
        <div className="px-3 py-1 text-[10px] font-bold text-[#72748a] uppercase tracking-wider">
          Menu
        </div>
        <nav className="flex-1 px-2.5 space-y-1 overflow-y-auto">
          {menuItems.map(({ title, href, icon: Icon }) => {
            const isActive = pathname === href || (href !== "/student/overview" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                  isActive
                    ? "bg-[#27283c] text-white border border-[#37374d]"
                    : "text-[#a7a8b7] hover:bg-[#1f2033] hover:text-white"
                }`}
              >
                <Icon size={16} className={isActive ? "text-[#b7a5ff]" : "text-[#7b7d96]"} />
                <span>{title}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className="p-3.5 border-t border-[#28293d] bg-[#141524]">
          <div className="flex items-center gap-2.5 mb-2.5">
            <div className="w-8 h-8 rounded-full bg-[#32334d] text-white font-bold flex items-center justify-center text-xs shrink-0">
              {student.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-white truncate">{student.name}</div>
              <div className="text-[10px] text-[#8e90a6] truncate">{student.email}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            disabled={signingOut}
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-semibold text-[#c3c4d4] hover:text-white bg-[#212236] hover:bg-[#2c2d47] rounded-lg transition-colors disabled:opacity-50"
          >
            <LogOut size={13} />
            <span>{signingOut ? "Signing out..." : "Sign Out"}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-14 bg-white/95 backdrop-blur-xs border-b border-gray-200 px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 lg:hidden"
              aria-label="Open sidebar"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-400">Student Portal</span>
              <span className="text-gray-300">/</span>
              <span className="font-semibold text-gray-800">{activeTitle}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Referral Badge */}
            <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 border border-purple-200 text-xs font-medium text-[#7459d2]">
              <span className="text-gray-500 text-[11px]">Code:</span>
              <span className="font-mono font-bold">{student.referralCode}</span>
              <button
                type="button"
                onClick={copyReferralCode}
                className="hover:text-purple-900 transition-colors ml-0.5"
                title="Copy code"
              >
                {copiedCode ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
              </button>
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Active</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}

