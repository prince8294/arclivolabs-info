"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight, BriefcaseBusiness, Building2,
  CircleDollarSign, Handshake, Users, UserRoundCheck,
} from "lucide-react";
import {
  Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from "recharts";
import { BrandLoader } from "@/components/brand-loader";

type DashboardPayload = {
  totals: {
    creators: number;
    pendingCreatorApplications: number;
    brands: number;
    activeCampaigns: number;
    completedCampaigns: number;
    newEnquiries: number;
    campaignBudgetsByCurrency: Array<{ _id: string; total: number }>;
    monthlyRevenue: Array<{ _id: string; total: number; count: number }> | null;
  };
  comparisons: Record<string, { current: number; previous: number; change: number | null }>;
  recentActivity: Array<{ _id: string; action: string; resourceType: string; createdAt: string; actor?: { name?: string } }>;
  financeAccess: boolean;
};
type AnalyticsPayload = {
  creatorGrowth: Array<{ _id: string; count: number }>;
  brandGrowth: Array<{ _id: string; count: number }>;
  enquiryTrend: Array<{ _id: string; count: number }>;
  campaignStatuses: Array<{ _id: string; count: number }>;
  campaignCategories: Array<{ _id: { industry: string; currency: string }; count: number; budget: number }>;
  revenueTrend: Array<{ _id: { date: string; currency: string }; total: number }> | null;
};
type ApiEnvelope<T> = { success: boolean; message: string; data?: T };

const palette = ["#111111", "#4b4b46", "#77776f", "#a3a39a", "#c9c9c0", "#e2e2da"];
const tooltipStyle = { background: "#0b0b0b", border: "1px solid #0b0b0b", borderRadius: 6, color: "#fff", fontSize: 11, padding: "8px 10px", boxShadow: "0 14px 34px rgba(0,0,0,.22)" };
const tooltipLabelStyle = { color: "#a8a8a0", fontSize: 9, letterSpacing: ".08em", textTransform: "uppercase" as const };
const tooltipItemStyle = { color: "#f7f7f3", fontSize: 11 };

async function getData<T>(path: string): Promise<T> {
  const response = await fetch(path, { cache: "no-store" });
  const envelope = await response.json() as ApiEnvelope<T>;
  if (!response.ok || !envelope.success || envelope.data === undefined) {
    throw new Error(envelope.message || "Unable to load dashboard data.");
  }
  return envelope.data;
}

function number(value: number) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(value);
}

function comparisonLabel(change: number | null) {
  if (change === null) return "No previous period";
  return `${Math.abs(change)}% vs previous month`;
}

export function AdminDashboard() {
  const [range, setRange] = useState("30d");
  const [stats, setStats] = useState<DashboardPayload | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsPayload | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
        const [nextStats, nextAnalytics] = await Promise.all([
        getData<DashboardPayload>("/api/admin/dashboard/stats"),
        getData<AnalyticsPayload>(`/api/admin/dashboard/analytics?range=${range}`),
      ]);
      setStats(nextStats);
      setAnalytics(nextAnalytics);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load dashboard.");
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const trend = useMemo(() => {
    const map = new Map<string, { date: string; creators: number; brands: number; enquiries: number }>();
    for (const [field, values] of [["creators", analytics?.creatorGrowth], ["brands", analytics?.brandGrowth], ["enquiries", analytics?.enquiryTrend]] as const) {
      for (const value of values ?? []) {
        const row = map.get(value._id) ?? { date: value._id, creators: 0, brands: 0, enquiries: 0 };
        row[field] = value.count;
        map.set(value._id, row);
      }
    }
    return [...map.values()].sort((a, b) => a.date.localeCompare(b.date));
  }, [analytics]);

  if (error && !stats) return <section className="admin-error-state"><h1>Dashboard unavailable</h1><p>{error}</p><button className="admin-button" onClick={() => void load()}>Try again</button></section>;

  const cards = stats ? [
    { title: "Total creators", value: number(stats.totals.creators), sub: comparisonLabel(stats.comparisons.creators.change), icon: Users, tone: "violet" },
    { title: "Pending applications", value: number(stats.totals.pendingCreatorApplications), sub: "Awaiting review", icon: UserRoundCheck, tone: "amber", href: "/admin/creators?type=creator-applications" },
    { title: "Total brands", value: number(stats.totals.brands), sub: comparisonLabel(stats.comparisons.brands.change), icon: Building2, tone: "blue" },
    { title: "Active campaigns", value: number(stats.totals.activeCampaigns), sub: comparisonLabel(stats.comparisons.campaigns.change), icon: BriefcaseBusiness, tone: "green" },
    { title: "Completed campaigns", value: number(stats.totals.completedCampaigns), sub: "All recorded campaigns", icon: Handshake, tone: "blue" },
    { title: "New enquiries", value: number(stats.totals.newEnquiries), sub: comparisonLabel(stats.comparisons.enquiries.change), icon: Handshake, tone: "amber", href: "/admin/enquiries" },
    {
      title: "Campaign budgets",
      value: stats.totals.campaignBudgetsByCurrency.length === 1
        ? new Intl.NumberFormat(undefined, { style: "currency", currency: stats.totals.campaignBudgetsByCurrency[0]._id }).format(stats.totals.campaignBudgetsByCurrency[0].total)
        : `${stats.totals.campaignBudgetsByCurrency.length} currencies`,
      sub: stats.totals.campaignBudgetsByCurrency.length > 1
        ? stats.totals.campaignBudgetsByCurrency.map((item) => `${item._id} ${number(item.total)}`).join(" · ")
        : "Budget totals, not revenue",
      icon: CircleDollarSign,
      tone: "violet",
    },
  ] : [];

  return <div className="admin-dashboard">
    <div className="admin-page-heading">
      <div><span className="admin-eyebrow">AGENCY OVERVIEW</span><h1>Good to see you.</h1><p>Here’s what’s happening across your creator network.</p></div>
      <label className="admin-filter-control"><span>Date range</span><select value={range} onChange={(event) => setRange(event.target.value)}><option value="7d">Last 7 days</option><option value="30d">Last 30 days</option><option value="90d">Last 90 days</option><option value="12m">Last 12 months</option></select></label>
    </div>
    {error && <div className="admin-inline-error" role="alert">{error}</div>}
    {loading && !stats ? <><BrandLoader variant="inline" label="Loading dashboard" /><div className="admin-kpi-grid">{Array.from({ length: 8 }, (_, index) => <div className="admin-skeleton admin-kpi-skeleton" key={index} />)}</div></> : <>
      <section className="admin-kpi-grid" aria-label="Key metrics">
        {cards.map(({ title, value, sub, icon: Icon, tone, href }) => {
          const content = <><span className={`admin-kpi-icon admin-tone-${tone}`}><Icon size={18} /></span><span className="admin-kpi-label">{title}</span><b className="admin-kpi-value">{value}</b><span className="admin-kpi-sub">{sub}</span></>;
          return href ? <Link className="admin-kpi-card admin-kpi-link" key={title} href={href}>{content}<ArrowRight size={14} className="admin-card-arrow" /></Link> : <article className="admin-kpi-card" key={title}>{content}</article>;
        })}
        {stats?.financeAccess && <article className="admin-kpi-card">
          <span className="admin-kpi-icon admin-tone-green"><CircleDollarSign size={18} /></span><span className="admin-kpi-label">Recorded revenue · this month</span>
          {stats.totals.monthlyRevenue?.length ? stats.totals.monthlyRevenue.map((line) => <b className="admin-kpi-value admin-revenue-line" key={line._id}>{new Intl.NumberFormat(undefined, { style: "currency", currency: line._id }).format(line.total)} <small>{line.count} records</small></b>) : <b className="admin-kpi-value">—</b>}
          <span className="admin-kpi-sub">Only saved financial transactions</span>
        </article>}
      </section>

      <section className="admin-chart-grid">
        <article className="admin-panel admin-chart-panel">
          <div className="admin-panel-heading"><div><h2>Network growth</h2><p>Registrations and enquiries over the selected period</p></div><span className="admin-chart-legend"><i className="legend-creators" /> Creators <i className="legend-brands" /> Brands <i className="legend-enquiries" /> Enquiries</span></div>
          {loading && !analytics ? <div className="admin-skeleton admin-chart-skeleton" /> : <div className="admin-chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={trend} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}>
            <defs><linearGradient id="creatorArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#111111" stopOpacity={0.16} /><stop offset="100%" stopColor="#111111" stopOpacity={0} /></linearGradient></defs>
            <CartesianGrid vertical={false} stroke="#e8e8e1" /><XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "#85857d" }} minTickGap={28} /><YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "#85857d" }} /><Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} cursor={{ stroke: "#c9c9c0", strokeDasharray: "3 3" }} />
            <Area type="monotone" dataKey="creators" stroke="#111111" fill="url(#creatorArea)" strokeWidth={2} /><Area type="monotone" dataKey="brands" stroke="#77776f" fill="transparent" strokeWidth={1.8} /><Area type="monotone" dataKey="enquiries" stroke="#b9b9b0" fill="transparent" strokeWidth={1.8} />
          </AreaChart></ResponsiveContainer></div>}
        </article>
        <article className="admin-panel admin-chart-panel">
          <div className="admin-panel-heading"><div><h2>Campaign status</h2><p>All campaign records</p></div></div>
          <div className="admin-pie-wrap">
            {analytics?.campaignStatuses.length ? <ResponsiveContainer width="100%" height={220}><PieChart><Pie data={analytics.campaignStatuses} dataKey="count" nameKey="_id" innerRadius={62} outerRadius={88} paddingAngle={4} stroke="none">
              {analytics.campaignStatuses.map((entry, index) => <Cell key={entry._id} fill={palette[index % palette.length]} />)}
            </Pie><Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} /></PieChart></ResponsiveContainer> : <div className="admin-empty-chart">No campaign records in the database yet.</div>}
          </div>
          <div className="admin-status-legend">{(analytics?.campaignStatuses ?? []).map((item, index) => <span key={item._id}><i style={{ background: palette[index % palette.length] }} />{item._id}<b>{item.count}</b></span>)}</div>
        </article>
      </section>

      <section className="admin-bottom-grid">
        <article className="admin-panel admin-panel-padding">
          <div className="admin-panel-heading"><div><h2>Recent team activity</h2><p>Latest recorded administrative events</p></div><Link href="/admin/activity-logs" className="admin-text-link">View activity <ArrowRight size={14} /></Link></div>
          <div className="admin-activity-list">
            {stats?.recentActivity.length ? stats.recentActivity.map((item) => <div className="admin-activity-row" key={item._id}><span className="admin-activity-dot" /><span><b>{formatAction(item.action)}</b><small>{item.actor?.name ?? "System"} · {item.resourceType}</small></span><time>{new Date(item.createdAt).toLocaleDateString()}</time></div>) : <div className="admin-empty-state"><span>No activity recorded yet.</span></div>}
          </div>
        </article>
        <article className="admin-panel admin-panel-padding">
          <div className="admin-panel-heading"><div><h2>Quick actions</h2><p>Jump into your next task</p></div></div>
          <div className="admin-quick-actions">
            <Link href="/admin/creators" className="admin-quick-action"><Users size={17} /><span>Add or review creators</span><ArrowRight size={15} /></Link>
            <Link href="/admin/brands" className="admin-quick-action"><Building2 size={17} /><span>Add a brand</span><ArrowRight size={15} /></Link>
            <Link href="/admin/campaigns" className="admin-quick-action"><BriefcaseBusiness size={17} /><span>Create campaign</span><ArrowRight size={15} /></Link>
            <Link href="/admin/enquiries" className="admin-quick-action"><Handshake size={17} /><span>Work enquiries</span><ArrowRight size={15} /></Link>
            <Link href="/admin/team" className="admin-quick-action"><Users size={17} /><span>Invite team member</span><ArrowRight size={15} /></Link>
          </div>
        </article>
      </section>
      {stats?.financeAccess && analytics?.revenueTrend && <section className="admin-panel admin-panel-padding admin-revenue-note"><h2>Revenue reporting</h2><p>Financial charts include only explicit revenue transactions; campaign budgets are never counted as realized revenue.</p><div className="admin-status-legend">{analytics.revenueTrend.map((item) => <span key={`${item._id.date}-${item._id.currency}`}>{item._id.date}<b>{new Intl.NumberFormat(undefined, { style: "currency", currency: item._id.currency }).format(item.total)}</b></span>)}</div></section>}
    </>}
  </div>;
}

function formatAction(value: string) {
  return value.replace(/[._]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
