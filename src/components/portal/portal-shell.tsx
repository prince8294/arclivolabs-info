"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell, BriefcaseBusiness, Compass, CreditCard, LayoutDashboard, LogOut,
  Menu, MessageSquareText, Package, Settings, ShieldQuestion, Star, UserRound, Users,
  type LucideIcon,
} from "lucide-react";

type PortalLink = { title: string; href: string; icon: LucideIcon };
const links: Record<"brand" | "creator", PortalLink[]> = {
  brand: [
    { title: "Dashboard", href: "/brand/dashboard", icon: LayoutDashboard },
    { title: "Company profile", href: "/brand/profile", icon: UserRound },
    { title: "Discover creators", href: "/brand/discover-creators", icon: Compass },
    { title: "Campaigns", href: "/brand/campaigns", icon: BriefcaseBusiness },
    { title: "Shortlists", href: "/brand/shortlists", icon: Star },
    { title: "Collaborations", href: "/brand/collaborations", icon: Users },
    { title: "Messages", href: "/brand/messages", icon: MessageSquareText },
    { title: "Notifications", href: "/brand/notifications", icon: Bell },
    { title: "Billing", href: "/brand/billing", icon: CreditCard },
    { title: "Settings", href: "/brand/settings", icon: Settings },
    { title: "Support", href: "/brand/support", icon: ShieldQuestion },
  ],
  creator: [
    { title: "Dashboard", href: "/creator/dashboard", icon: LayoutDashboard },
    { title: "Creator profile", href: "/creator/profile", icon: UserRound },
    { title: "Social accounts", href: "/creator/social-accounts", icon: Compass },
    { title: "Portfolio", href: "/creator/portfolio", icon: Package },
    { title: "Packages & rates", href: "/creator/packages", icon: CreditCard },
    { title: "Campaigns", href: "/creator/campaigns", icon: BriefcaseBusiness },
    { title: "Invitations", href: "/creator/invitations", icon: Star },
    { title: "Collaborations", href: "/creator/collaborations", icon: Users },
    { title: "Deliverables", href: "/creator/deliverables", icon: Package },
    { title: "Earnings", href: "/creator/earnings", icon: CreditCard },
    { title: "Messages", href: "/creator/messages", icon: MessageSquareText },
    { title: "Notifications", href: "/creator/notifications", icon: Bell },
    { title: "Settings", href: "/creator/settings", icon: Settings },
    { title: "Support", href: "/creator/support", icon: ShieldQuestion },
  ],
};

export function PortalShell({ kind, name, children }: { kind: "brand" | "creator"; name: string; children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

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

  return <div className="portal-frame">
    {mobileOpen && <button className="portal-scrim" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
    <aside className={`portal-sidebar ${mobileOpen ? "portal-sidebar-open" : ""}`}>
      <Link href={`/${kind}/dashboard`} className="portal-brand" onClick={() => setMobileOpen(false)}><span className="portal-brand-mark">A</span><span>ARCLIVO<small>{kind === "brand" ? "BRAND STUDIO" : "CREATOR STUDIO"}</small></span></Link>
      <span className="portal-nav-caption">YOUR WORKSPACE</span>
      <nav className="portal-nav" aria-label={`${kind} dashboard navigation`}>
        {links[kind].map(({ title, href, icon: Icon }) => <Link key={href} href={href} onClick={() => setMobileOpen(false)} className={pathname === href || pathname.startsWith(`${href}/`) ? "portal-nav-link portal-nav-active" : "portal-nav-link"}><Icon size={17} /><span>{title}</span></Link>)}
      </nav>
      <div className="portal-sidebar-bottom"><div className="portal-user"><span>{name.trim().charAt(0).toUpperCase()}</span><div><b>{name}</b><small>{kind === "brand" ? "Brand account" : "Creator account"}</small></div></div><button className="portal-logout" onClick={() => void logout()} disabled={signingOut}><LogOut size={15} />{signingOut ? "Signing out…" : "Sign out"}</button></div>
    </aside>
    <div className="portal-main"><header className="portal-topbar"><button className="portal-mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open dashboard navigation"><Menu size={20} /></button><div><span>Workspace</span><b>{links[kind].find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))?.title ?? "Overview"}</b></div><Link href={`/${kind}/notifications`} className="portal-notification-link" aria-label="Notifications"><Bell size={18} /></Link></header><main className="portal-content">{children}</main></div>
  </div>;
}
