"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  HelpCircle,
  Receipt,
  TrendingUp,
  UserCheck,
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

type EarningsData = {
  totalEarnings: number;
  paidAmount?: number;
  pendingPayment?: number;
  verifiedCreators: number;
  pendingVerification: number;
  currency: string;
};

type VerifiedReferral = {
  _id: string;
  creatorName: string;
  creatorHandle: string;
  confirmedFollowers?: number;
  followers?: number;
  commissionEarned: number;
  commissionTierLabel?: string;
  verifiedAt?: string;
  createdAt: string;
};

export function StudentEarnings() {
  const [data, setData] = useState<EarningsData>({
    totalEarnings: 0,
    paidAmount: 0,
    pendingPayment: 0,
    verifiedCreators: 0,
    pendingVerification: 0,
    currency: "INR",
  });
  const [verifiedList, setVerifiedList] = useState<VerifiedReferral[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadStats() {
      try {
        const [meRes, refRes] = await Promise.all([
          fetch("/api/student/me", { credentials: "same-origin" }),
          fetch("/api/student/referrals?status=verified", { credentials: "same-origin" }),
        ]);

        const meJson = await meRes.json();
        if (meRes.ok && meJson.success && meJson.data?.stats) {
          setData(meJson.data.stats);
        }

        const refJson = await refRes.json();
        if (refRes.ok && refJson.success) {
          setVerifiedList(refJson.data.referrals || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error loading earnings data.");
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const pendingBalance =
    data.pendingPayment !== undefined
      ? data.pendingPayment
      : Math.max(0, data.totalEarnings - (data.paidAmount ?? 0));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
      {/* Header */}
      <div className="admin-page-heading">
        <div>
          <span className="admin-eyebrow">FINANCIAL OVERVIEW & LEDGER</span>
          <h1>Total Earnings</h1>
          <p>
            Track approved referral rewards, verified creator commissions, disbursed payments, and your pending balance.
          </p>
        </div>

        <div className="admin-heading-actions">
          <Link
            href="/student/payment-history"
            className="admin-button"
          >
            <Receipt size={14} />
            <span>Disbursement History</span>
          </Link>

          <Link
            href="/student/support"
            className="admin-button admin-button-secondary"
          >
            <HelpCircle size={14} />
            <span>Payout Support</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="admin-inline-error" role="alert">
          {error}
          <button onClick={() => setError("")} aria-label="Dismiss error">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Primary Financial KPI Cards */}
      <div className="admin-kpi-grid">
        {/* Total Earnings */}
        <div className="admin-kpi-card">
          <div className="admin-kpi-icon admin-tone-violet">
            <Wallet size={16} />
          </div>
          <span className="admin-kpi-label">TOTAL APPROVED COMMISSION</span>
          <div className="admin-kpi-value">
            {loading ? "…" : formatINR(data.totalEarnings)}
          </div>
          <span className="admin-kpi-sub" style={{ color: "#168d65", display: "flex", alignItems: "center", gap: "4px" }}>
            <CheckCircle2 size={10} />
            Approved by agency administration
          </span>
        </div>

        {/* Paid Amount */}
        <div className="admin-kpi-card">
          <div className="admin-kpi-icon admin-tone-green">
            <CheckCircle2 size={16} />
          </div>
          <span className="admin-kpi-label">TOTAL AMOUNT PAID</span>
          <div className="admin-kpi-value" style={{ color: "#15845f" }}>
            {loading ? "…" : formatINR(data.paidAmount ?? 0)}
          </div>
          <span className="admin-kpi-sub">Disbursed via direct transfer / UPI</span>
        </div>

        {/* Pending Payment Balance */}
        <div className="admin-kpi-card">
          <div className="admin-kpi-icon admin-tone-amber">
            <Clock size={16} />
          </div>
          <span className="admin-kpi-label">PENDING PAYOUT BALANCE</span>
          <div className="admin-kpi-value" style={{ color: "#a2701f" }}>
            {loading ? "…" : formatINR(pendingBalance)}
          </div>
          <span className="admin-kpi-sub">Approved commissions awaiting next payout</span>
        </div>

        {/* Verified Creators count */}
        <div className="admin-kpi-card">
          <div className="admin-kpi-icon admin-tone-blue">
            <UserCheck size={16} />
          </div>
          <span className="admin-kpi-label">VERIFIED CREATORS REFERRED</span>
          <div className="admin-kpi-value">
            {loading ? "…" : data.verifiedCreators}
          </div>
          <span className="admin-kpi-sub">{data.pendingVerification} pending onboarding check</span>
        </div>
      </div>

      {/* Itemized Commission Table */}
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
              Approved Commission Breakdown
            </h2>
            <p style={{ fontSize: "11px", color: "#85889d", margin: "4px 0 0" }}>
              Itemized list of all commissions credited from verified creator onboardings ({verifiedList.length} total).
            </p>
          </div>

          <Link
            href="/student/verified-creators"
            className="admin-text-link"
          >
            <span>View Verified Creators</span>
            <ArrowRight size={12} />
          </Link>
        </div>

        {loading ? (
          <div className="admin-empty-state" style={{ minHeight: "260px" }}>
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
            <b>Loading commission records…</b>
          </div>
        ) : verifiedList.length === 0 ? (
          <div className="admin-empty-state" style={{ minHeight: "240px" }}>
            <Wallet size={32} style={{ color: "#c4c7d6", marginBottom: "8px" }} />
            <b>No approved commissions yet</b>
            <p style={{ margin: "5px 0 16px", fontSize: "11px", color: "#8b8fa2", maxWidth: "420px" }}>
              When creators sign up through your referral link and complete verification, follower-based rewards are added to your ledger.
            </p>
            <Link href="/student/dm-templates" className="admin-button">
              <span>View Outreach Templates</span>
            </Link>
          </div>
        ) : (
          <div className="admin-table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>CREATOR NAME & HANDLE</th>
                  <th>VERIFIED FOLLOWERS</th>
                  <th>COMMISSION TIER</th>
                  <th>VERIFIED DATE</th>
                  <th style={{ textAlign: "right" }}>COMMISSION CREDITED</th>
                </tr>
              </thead>
              <tbody>
                {verifiedList.map((ref) => (
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
                    </td>
                    <td>
                      <span className="admin-status-pill admin-status-approved">
                        {ref.commissionTierLabel || "Standard Follower Tier"}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: "#676a7c" }}>
                        {ref.verifiedAt
                          ? new Date(ref.verifiedAt).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : "—"}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <span style={{ fontWeight: "700", color: "#15845f", fontSize: "11.5px" }}>
                        ₹{ref.commissionEarned || 0}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
