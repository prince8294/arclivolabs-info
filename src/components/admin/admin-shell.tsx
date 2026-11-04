"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity, BarChart3, Bell, BriefcaseBusiness, Building2, ChevronDown, FileText,
  Handshake, LayoutDashboard, LogOut, Menu, MessageSquareText, Settings, Shield,
  UserRound, Users, type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@/models/User";

type NavigationItem = { label: string; href: string; icon: LucideIcon; permission: string; group: string };
const navigation: NavigationItem[] = [
  { label: "Overview", href: "/admin/dashboard", icon: LayoutDashboard, permission: "dashboard:view", group: "Workspace" },
  { label: "Creators", href: "/admin/creators", icon: Users, permission: "creator:read", group: "Network" },
  { label: "Brands", href: "/admin/brands", icon: Building2, permission: "brand:read", group: "Network" },
  { label: "Campaigns", href: "/admin/campaigns", icon: BriefcaseBusiness, permission: "campaign:read", group: "Network" },
  { label: "Enquiries", href: "/admin/enquiries", icon: Handshake, permission: "enquiry:read", group: "Network" },
  { label: "Contact inbox", href: "/admin/contact-messages", icon: MessageSquareText, permission: "contact:read", group: "Network" },
  { label: "Team", href: "/admin/team", icon: Shield, permission: "team:read", group: "Network" },
  { label: "Services", href: "/admin/services", icon: FileText, permission: "content:read", group: "Content" },
  { label: "Insights", href: "/admin/blogs", icon: FileText, permission: "content:read", group: "Content" },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3, permission: "analytics:read", group: "Operations" },
  { label: "Reports", href: "/admin/reports", icon: Activity, permission: "analytics:read", group: "Operations" },
  { label: "Notifications", href: "/admin/notifications", icon: Bell, permission: "notification:read", group: "Operations" },
  { label: "Activity log", href: "/admin/activity-logs", icon: Activity, permission: "activity:read", group: "Operations" },
  { label: "Settings", href: "/admin/settings", icon: Settings, permission: "settings:read", group: "Operations" },
  { label: "My profile", href: "/admin/profile", icon: UserRound, permission: "dashboard:view", group: "Operations" },
];

const navigationGroups = ["Workspace", "Network", "Content", "Operations"] as const;

const roleLabels: Record<UserRole, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  manager: "Manager",
  campaign_manager: "Campaign Manager",
  creator_manager: "Creator Manager",
  sales_executive: "Sales Executive",
  finance_manager: "Finance Manager",
  brand: "Brand",
  creator: "Creator",
};

function canSeeItem(role: UserRole, permission: string): boolean {
  if (role === "super_admin") return true;
  const allowed: Record<UserRole, readonly string[]> = {
    super_admin: [],
    admin: navigation.filter((item) => item.permission !== "finance:read" && item.permission !== "finance:manage" && item.permission !== "settings:manage").map((item) => item.permission),
    manager: ["dashboard:view", "creator:read", "brand:read", "campaign:read", "enquiry:read", "contact:read", "content:read", "analytics:read", "notification:read", "activity:read"],
    campaign_manager: ["dashboard:view", "creator:read", "brand:read", "campaign:read", "analytics:read", "notification:read"],
    creator_manager: ["dashboard:view", "creator:read", "notification:read"],
    sales_executive: ["dashboard:view", "brand:read", "enquiry:read", "contact:read", "notification:read"],
    finance_manager: ["dashboard:view", "campaign:read", "analytics:read"],
    brand: [],
    creator: [],
  };
  return allowed[role].includes(permission);
}

export function AdminShell({ children, name, role, permissions }: { children: React.ReactNode; name: string; role: UserRole; permissions?: readonly string[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const items = navigation.filter((item) => canSeeItem(role, item.permission) && (permissions === undefined || permissions.includes(item.permission)));

  async function logout() {
    setSigningOut(true);
    try {
      const response = await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
      if (!response.ok) throw new Error("Unable to sign out.");
      router.replace("/login");
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  }

  return <div className="admin-frame">
    {mobileOpen && <button className="admin-scrim" onClick={() => setMobileOpen(false)} aria-label="Close navigation" />}
    <aside className={`admin-sidebar ${mobileOpen ? "admin-sidebar-open" : ""}`}>
      <Link href="/admin/dashboard" className="admin-brand" onClick={() => setMobileOpen(false)}>
        <span className="admin-brand-symbol">A</span>
        <span>ARCLIVO<span className="admin-brand-sub">AGENCY CONTROL</span></span>
      </Link>
      <nav className="admin-nav" aria-label="Admin navigation">
        {navigationGroups.map((group) => {
          const groupItems = items.filter((item) => item.group === group);
          if (groupItems.length === 0) return null;
          return <div className="admin-nav-group" key={group}>
            <div className="admin-sidebar-label">{group}</div>
            {groupItems.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || (href !== "/admin/dashboard" && pathname.startsWith(`${href}/`));
              return <Link key={href} href={href} className={active ? "admin-nav-link admin-nav-active" : "admin-nav-link"} onClick={() => setMobileOpen(false)}>
                <Icon size={16} strokeWidth={1.7} /><span>{label}</span>
              </Link>;
            })}
          </div>;
        })}
      </nav>
      <div className="admin-sidebar-bottom">
        <div className="admin-user-chip">
          <span className="admin-avatar">{name.trim().charAt(0).toUpperCase()}</span>
          <span className="admin-user-meta"><b>{name}</b><small>{roleLabels[role]}</small></span>
          <ChevronDown size={15} />
        </div>
        <button className="admin-logout" onClick={logout} disabled={signingOut}><LogOut size={16} />{signingOut ? "Signing out…" : "Sign out"}</button>
        <div className="admin-sidebar-note"><span />Private agency workspace</div>
      </div>
    </aside>
    <div className="admin-main">
      <header className="admin-topbar">
        <button className="admin-mobile-trigger" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu size={20} /></button>
        <div className="admin-breadcrumb"><span>Agency</span><span>/</span><b>{items.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))?.label ?? "Workspace"}</b></div>
        <div className="admin-topbar-right"><span className="admin-secure"><span />Secure workspace</span><Link href="/admin/notifications" className="admin-top-icon" aria-label="Notifications"><Bell size={17} /></Link></div>
      </header>
      <main className="admin-content">{children}</main>
    </div>
  </div>;
}
