"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  MessageSquareText,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { formatINR } from "@/lib/student-utils";

function InstagramIcon({ size = 12 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

type OverviewData = {
  student: {
    name: string;
    email: string;
    studentId: string;
    referralCode: string;
    institution?: string;
  };
  stats: {
    totalCreatorsReferred: number;
    verifiedCreators: number;
    pendingVerification: number;
    totalEarnings: number;
    currency: string;
  };
};

type ReferralItem = {
  _id: string;
  creatorName: string;
  creatorHandle: string;
  platform: string;
  category: string;
  followers?: number;
  confirmedFollowers?: number;
  status: "pending" | "verified" | "rejected";
  verifiedAt?: string;
  commissionEarned?: number;
  commissionTierLabel?: string;
  currency?: string;
  createdAt: string;
  registrationDate?: string;
};

export function StudentOverview() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [referrals, setReferrals] = useState<ReferralItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    async function fetchOverview() {
      try {
        const [meRes, refRes] = await Promise.all([
          fetch("/api/student/me", { credentials: "same-origin" }),
          fetch("/api/student/referrals?status=all", { credentials: "same-origin" }),
        ]);

        const meJson = await meRes.json();
        if (!meRes.ok || !meJson.success) {
          throw new Error(meJson.message || "Failed to load overview data.");
        }
        setData(meJson.data);

        const refJson = await refRes.json();
        if (refRes.ok && refJson.success) {
          setReferrals(refJson.data.referrals || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error loading data.");
      } finally {
        setLoading(false);
      }
    }
    fetchOverview();
  }, []);

  if (loading) {
    return (
      <div className="admin-empty-state" style={{ minHeight: "360px" }}>
        <div
          style={{
            width: "28px",
            height: "28px",
            border: "2px solid #7359d2",
            borderTopColor: "transparent",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
            marginBottom: "12px",
          }}
        />
        <b>Loading your ambassador dashboard…</b>
        <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#8a8d9e" }}>
          Synchronizing referral network metrics and live balances.
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="admin-inline-error" role="alert">
        <span>{error || "Unable to load dashboard. Please refresh the page."}</span>
        <button onClick={() => setError("")} aria-label="Dismiss error">
          <X size={14} />
        </button>
      </div>
    );
  }

  const { student, stats } = data;
  const origin = typeof window !== "undefined" ? window.location.origin : "https://arclivolabs.com";
  const referralLink = `${origin}/join-as-creator/${student.referralCode}`;

  function copyCode() {
    navigator.clipboard.writeText(student.referralCode);
    setCopiedCode(true);
    setNotice("Referral code copied to clipboard!");
    setTimeout(() => {
      setCopiedCode(false);
      setNotice("");
    }, 2500);
  }

  function copyLink() {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setNotice("Personal creator registration link copied to clipboard!");
    setTimeout(() => {
      setCopiedLink(false);
      setNotice("");
    }, 2500);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
      {/* Page Heading */}
      <div className="admin-page-heading">
        <div>
          <span className="admin-eyebrow">CAMPUS AMBASSADOR ECOSYSTEM</span>
          <h1>Welcome, {student.name.split(" ")[0]}</h1>
          <p>
            Connect with creators on Instagram, share your personal referral link or code ({student.referralCode}), and track approvals, verified commissions, and earnings in real time.
          </p>
        </div>

        <div className="admin-heading-actions">
          {/* Quick Code Pill */}
          <button
            type="button"
            onClick={copyCode}
            className="admin-button admin-button-secondary"
            title="Click to copy code"
          >
            {copiedCode ? <Check size={14} style={{ color: "#168d65" }} /> : <Copy size={13} />}
            <span>Code: <strong style={{ fontFamily: "monospace", letterSpacing: "0.05em" }}>{student.referralCode}</strong></span>
          </button>

          {/* Share Link Button */}
          <button
            type="button"
            onClick={copyLink}
            className="admin-button"
          >
            {copiedLink ? <Check size={14} /> : <ExternalLink size={14} />}
            <span>{copiedLink ? "Link Copied!" : "Copy Registration Link"}</span>
          </button>

          {/* DM Templates Shortcut */}
          <Link
            href="/student/dm-templates"
            className="admin-button admin-button-secondary"
          >
            <MessageSquareText size={14} />
            <span>Outreach DM Templates</span>
          </Link>
        </div>
      </div>

      {/* Global Toast / Notice */}
      {notice && (
        <p className="admin-toast" role="status">
          {notice}
          <button onClick={() => setNotice("")} aria-label="Dismiss notice">
            <X size={14} />
          </button>
        </p>
      )}

      {/* 4 Primary KPI Cards */}
      <div className="admin-kpi-grid">
        {/* 1. Total Creators Referred */}
        <Link
          href="/student/creators-referred"
          className="admin-kpi-card admin-kpi-link"
        >
          <div className="admin-kpi-icon admin-tone-violet">
            <Users size={16} />
          </div>
          <span className="admin-kpi-label">TOTAL CREATORS REFERRED</span>
          <div className="admin-kpi-value">{stats.totalCreatorsReferred}</div>
          <span className="admin-kpi-sub">All creator registrations via your link</span>
          <ArrowRight size={13} className="admin-card-arrow" />
        </Link>

        {/* 2. Verified Creators */}
        <Link
          href="/student/verified-creators"
          className="admin-kpi-card admin-kpi-link"
        >
          <div className="admin-kpi-icon admin-tone-green">
            <UserCheck size={16} />
          </div>
          <span className="admin-kpi-label">VERIFIED CREATORS</span>
          <div className="admin-kpi-value" style={{ color: "#15845f" }}>
            {stats.verifiedCreators}
          </div>
          <span className="admin-kpi-sub">Approved & confirmed by agency</span>
          <ArrowRight size={13} className="admin-card-arrow" />
        </Link>

        {/* 3. Pending Verification */}
        <Link
          href="/student/pending-verification"
          className="admin-kpi-card admin-kpi-link"
        >
          <div className="admin-kpi-icon admin-tone-amber">
            <Clock size={16} />
          </div>
          <span className="admin-kpi-label">PENDING VERIFICATION</span>
          <div className="admin-kpi-value" style={{ color: "#a2701f" }}>
            {stats.pendingVerification}
          </div>
          <span className="admin-kpi-sub">Under quality and follower review</span>
          <ArrowRight size={13} className="admin-card-arrow" />
        </Link>

        {/* 4. Total Approved Earnings */}
        <Link
          href="/student/earnings"
          className="admin-kpi-card admin-kpi-link"
        >
          <div className="admin-kpi-icon admin-tone-blue">
            <Wallet size={16} />
          </div>
          <span className="admin-kpi-label">TOTAL APPROVED EARNINGS</span>
          <div className="admin-kpi-value">
            {formatINR(stats.totalEarnings)}
          </div>
          <span className="admin-kpi-sub">Referral commissions credited</span>
          <ArrowRight size={13} className="admin-card-arrow" />
        </Link>
      </div>

      {/* Table Panel: Referred Creators */}
      <div className="admin-panel admin-table-panel">
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid #e8e9ef",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <div>
            <h2 style={{ fontSize: "13px", fontWeight: "650", color: "#292b3e", margin: 0 }}>
              Recent Referred Creators
            </h2>
            <p style={{ fontSize: "11px", color: "#85889d", margin: "4px 0 0" }}>
              Creators who registered using your unique referral link ({referrals.length} total signups).
            </p>
          </div>

          <Link
            href="/student/creators-referred"
            className="admin-text-link"
          >
            <span>View All Referrals</span>
            <ArrowRight size={12} />
          </Link>
        </div>

        {referrals.length === 0 ? (
          <div className="admin-empty-state">
            <Users size={32} style={{ color: "#c4c7d6", marginBottom: "8px" }} />
            <b>No creator referrals recorded yet</b>
            <p style={{ margin: "5px 0 16px", fontSize: "11px", color: "#8b8fa2", maxWidth: "420px" }}>
              Start reaching out to Instagram creators using our proven outreach DM templates. When creators sign up with your link, their profiles will appear here instantly.
            </p>
            <Link href="/student/dm-templates" className="admin-button">
              <MessageSquareText size={14} />
              <span>Browse 20+ Outreach DM Templates</span>
            </Link>
          </div>
        ) : (
          <div className="admin-table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>INSTAGRAM CREATOR</th>
                  <th>VERIFIED FOLLOWERS</th>
                  <th>REGISTRATION DATE</th>
                  <th>STATUS</th>
                  <th style={{ textAlign: "right" }}>COMMISSION</th>
                </tr>
              </thead>
              <tbody>
                {referrals.slice(0, 6).map((ref) => (
                  <tr key={ref._id}>
                    <td>
                      <div>
                        <span className="admin-primary-cell">{ref.creatorName}</span>
                        <div
                          style={{
                            fontSize: "10px",
                            fontFamily: "monospace",
                            color: "#7257ce",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            marginTop: "2px",
                          }}
                        >
                          <InstagramIcon size={11} />
                          <span>@{ref.creatorHandle}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: "600", color: "#2d3043" }}>
                        {(ref.confirmedFollowers ?? ref.followers ?? 0).toLocaleString()}
                      </div>
                      {ref.confirmedFollowers !== undefined && ref.confirmedFollowers !== ref.followers && (
                        <div style={{ fontSize: "9px", color: "#9598a8" }}>
                          Applied: {(ref.followers ?? 0).toLocaleString()}
                        </div>
                      )}
                    </td>
                    <td>
                      <span style={{ color: "#676a7c" }}>
                        {new Date(ref.registrationDate || ref.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </td>
                    <td>
                      {ref.status === "verified" ? (
                        <span className="admin-status-pill admin-status-approved">
                          <CheckCircle2 size={11} style={{ marginRight: "4px" }} />
                          Verified
                        </span>
                      ) : ref.status === "rejected" ? (
                        <span className="admin-status-pill admin-status-rejected">
                          Rejected
                        </span>
                      ) : (
                        <span className="admin-status-pill admin-status-pending">
                          <Clock size={11} style={{ marginRight: "4px" }} />
                          Pending Review
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {ref.status === "verified" ? (
                        <div>
                          <span style={{ fontWeight: "700", color: "#15845f", fontSize: "11px" }}>
                            ₹{ref.commissionEarned || 0}
                          </span>
                          {ref.commissionTierLabel && (
                            <div style={{ fontSize: "9px", color: "#9194a5" }}>
                              {ref.commissionTierLabel}
                            </div>
                          )}
                        </div>
                      ) : ref.status === "rejected" ? (
                        <span style={{ color: "#a8aab8", fontSize: "11px" }}>—</span>
                      ) : (
                        <span style={{ color: "#a2701f", fontSize: "10px", fontWeight: "500" }}>
                          Pending Review
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 3 Quick Action / Editorial Resource Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))", gap: "14px" }}>
        {/* Card 1: Outreach Templates */}
        <div className="admin-panel admin-panel-padding" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div className="admin-kpi-icon admin-tone-violet">
              <MessageSquareText size={16} />
            </div>
            <h2 style={{ fontSize: "13px", fontWeight: "650", color: "#292b3e", margin: 0 }}>
              20+ Instagram DM Templates
            </h2>
            <p className="admin-panel-description">
              Hand-crafted, high-converting outreach messages for cold intros, brand sponsorship opportunities, follow-ups, and registration links.
            </p>
          </div>
          <div style={{ marginTop: "18px", paddingTop: "12px", borderTop: "1px solid #f0f1f5" }}>
            <Link href="/student/dm-templates" className="admin-text-link">
              <span>Explore outreach templates</span>
              <ArrowRight size={12} />
            </Link>
          </div>
        </div>

        {/* Card 2: Outreach Guidelines */}
        <div className="admin-panel admin-panel-padding" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div className="admin-kpi-icon admin-tone-green">
              <TrendingUp size={16} />
            </div>
            <h2 style={{ fontSize: "13px", fontWeight: "650", color: "#292b3e", margin: 0 }}>
              Ambassador Guidelines
            </h2>
            <p className="admin-panel-description">
              Send manual, personalized messages to creators with 1k+ real followers. Never use automated bot scrapers to protect account safety.
            </p>
          </div>
          <div style={{ marginTop: "18px", paddingTop: "12px", borderTop: "1px solid #f0f1f5" }}>
            <Link href="/student/support" className="admin-text-link">
              <span>Read ambassador FAQs & guide</span>
              <ArrowRight size={12} />
            </Link>
          </div>
        </div>

        {/* Card 3: Certificate */}
        <div className="admin-panel admin-panel-padding" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div className="admin-kpi-icon admin-tone-blue">
              <Sparkles size={16} />
            </div>
            <h2 style={{ fontSize: "13px", fontWeight: "650", color: "#292b3e", margin: 0 }}>
              Ambassador Certificate
            </h2>
            <p className="admin-panel-description">
              Earn an official ArclivoLabs Campus Ambassador Certificate of Excellence upon achieving verified creator onboarding milestones.
            </p>
          </div>
          <div style={{ marginTop: "18px", paddingTop: "12px", borderTop: "1px solid #f0f1f5" }}>
            <Link href="/student/certificate" className="admin-text-link">
              <span>View credentials & certificate</span>
              <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
