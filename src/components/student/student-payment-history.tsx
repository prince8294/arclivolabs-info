"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  HelpCircle,
  Info,
  Receipt,
  Wallet,
  X,
  XCircle,
} from "lucide-react";
import { formatINR } from "@/lib/student-utils";

type PaymentRecord = {
  _id: string;
  amount: number;
  currency: string;
  paymentDate: string;
  paymentMethod: string;
  transactionReference?: string;
  internalNote?: string;
  status: "pending" | "processing" | "paid" | "rejected";
  createdAt: string;
  paidAt?: string;
};

type PaymentSummary = {
  totalEarnings: number;
  paidAmount: number;
  pendingPayment: number;
  currency: string;
};

export function StudentPaymentHistory() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [summary, setSummary] = useState<PaymentSummary>({
    totalEarnings: 0,
    paidAmount: 0,
    pendingPayment: 0,
    currency: "INR",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadPayments() {
      try {
        const res = await fetch("/api/student/payments", { credentials: "same-origin" });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.message || "Failed to load payment history.");
        }
        setPayments(json.data.payments || []);
        if (json.data.summary) {
          setSummary(json.data.summary);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error loading payments.");
      } finally {
        setLoading(false);
      }
    }
    loadPayments();
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
      {/* Header */}
      <div className="admin-page-heading">
        <div>
          <span className="admin-eyebrow">FINANCIAL DISBURSEMENTS & LEDGER</span>
          <h1>Payment History</h1>
          <p>
            Track processed disbursements, transaction reference numbers (UTR), payment modes, and itemized payout records.
          </p>
        </div>

        <div className="admin-heading-actions">
          <Link
            href="/student/earnings"
            className="admin-button"
          >
            <Wallet size={14} />
            <span>Earnings Breakdown</span>
          </Link>

          <Link
            href="/student/support"
            className="admin-button admin-button-secondary"
          >
            <HelpCircle size={14} />
            <span>Payment Inquiries</span>
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

      {/* Financial Overview Cards */}
      <div className="admin-kpi-grid">
        {/* Total Approved Commission */}
        <div className="admin-kpi-card">
          <div className="admin-kpi-icon admin-tone-violet">
            <Wallet size={16} />
          </div>
          <span className="admin-kpi-label">TOTAL APPROVED COMMISSION</span>
          <div className="admin-kpi-value">
            {loading ? "…" : formatINR(summary.totalEarnings)}
          </div>
          <span className="admin-kpi-sub">Total earned from verified creators</span>
        </div>

        {/* Total Disbursed */}
        <div className="admin-kpi-card">
          <div className="admin-kpi-icon admin-tone-green">
            <CheckCircle2 size={16} />
          </div>
          <span className="admin-kpi-label">TOTAL AMOUNT PAID</span>
          <div className="admin-kpi-value" style={{ color: "#15845f" }}>
            {loading ? "…" : formatINR(summary.paidAmount)}
          </div>
          <span className="admin-kpi-sub">Successfully disbursed to your account</span>
        </div>

        {/* Pending Payout */}
        <div className="admin-kpi-card">
          <div className="admin-kpi-icon admin-tone-amber">
            <Clock size={16} />
          </div>
          <span className="admin-kpi-label">PENDING BALANCE</span>
          <div className="admin-kpi-value" style={{ color: "#a2701f" }}>
            {loading ? "…" : formatINR(summary.pendingPayment)}
          </div>
          <span className="admin-kpi-sub">Awaiting next finance disbursement batch</span>
        </div>

        {/* Records Count */}
        <div className="admin-kpi-card">
          <div className="admin-kpi-icon admin-tone-blue">
            <Receipt size={16} />
          </div>
          <span className="admin-kpi-label">TOTAL TRANSACTIONS</span>
          <div className="admin-kpi-value">
            {loading ? "…" : payments.length}
          </div>
          <span className="admin-kpi-sub">Recorded by agency finance</span>
        </div>
      </div>

      {/* Info Notice */}
      <div
        className="admin-panel admin-panel-padding"
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "12px",
          background: "#fcfcff",
          borderLeft: "3px solid #7257ce",
        }}
      >
        <Info size={16} style={{ color: "#7257ce", flexShrink: 0, marginTop: "2px" }} />
        <div>
          <b style={{ fontSize: "11px", color: "#2d3045" }}>Official Ambassador Disbursements</b>
          <p style={{ margin: "2px 0 0", fontSize: "10.5px", color: "#777a8e", lineHeight: "1.5" }}>
            Payments are disbursed periodically by the agency finance team via direct bank transfer or UPI. Once settlement is completed, the respective UTR / Transaction Reference number is published here for your records.
          </p>
        </div>
      </div>

      {/* Payment History Table Panel */}
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
              Disbursement Records
            </h2>
            <p style={{ fontSize: "11px", color: "#85889d", margin: "4px 0 0" }}>
              Ledger of all payment transactions created by administration ({payments.length} total records).
            </p>
          </div>

          <Link
            href="/student/earnings"
            className="admin-text-link"
          >
            <span>Commission Earnings</span>
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
            <b>Loading disbursement history…</b>
          </div>
        ) : payments.length === 0 ? (
          <div className="admin-empty-state" style={{ minHeight: "240px" }}>
            <Receipt size={32} style={{ color: "#c4c7d6", marginBottom: "8px" }} />
            <b>No disbursement records found</b>
            <p style={{ margin: "5px 0 16px", fontSize: "11px", color: "#8b8fa2", maxWidth: "420px" }}>
              Your payout history will appear here once agency administrators record a disbursement for your verified referral earnings.
            </p>
            <Link href="/student/earnings" className="admin-button admin-button-secondary">
              <Wallet size={13} />
              <span>Check Current Earnings</span>
            </Link>
          </div>
        ) : (
          <div className="admin-table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>DATE</th>
                  <th>AMOUNT</th>
                  <th>METHOD</th>
                  <th>TRANSACTION REFERENCE / UTR</th>
                  <th>STATUS</th>
                  <th>PAYMENT NOTE</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p._id}>
                    <td>
                      <span style={{ fontWeight: "600", color: "#2d3043" }}>
                        {new Date(p.paymentDate).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: "700", color: "#15845f", fontSize: "11px" }}>
                        ₹{p.amount.toLocaleString()}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: "9.5px",
                          fontWeight: "600",
                          color: "#5b5e70",
                          background: "#f0f1f5",
                          padding: "3px 7px",
                          borderRadius: "4px",
                        }}
                      >
                        {p.paymentMethod}
                      </span>
                    </td>
                    <td>
                      {p.transactionReference ? (
                        <span
                          style={{
                            fontFamily: "monospace",
                            fontSize: "10px",
                            fontWeight: "600",
                            color: "#7257ce",
                            background: "#f0edff",
                            padding: "3px 7px",
                            borderRadius: "4px",
                          }}
                        >
                          {p.transactionReference}
                        </span>
                      ) : (
                        <span style={{ color: "#a5a7b7", fontSize: "10px", fontStyle: "italic" }}>
                          Pending UTR
                        </span>
                      )}
                    </td>
                    <td>
                      {p.status === "paid" ? (
                        <span className="admin-status-pill admin-status-approved">
                          <CheckCircle2 size={11} style={{ marginRight: "4px" }} />
                          Paid
                        </span>
                      ) : p.status === "processing" ? (
                        <span className="admin-status-pill admin-status-proposal_sent">
                          <Clock size={11} style={{ marginRight: "4px" }} />
                          Processing
                        </span>
                      ) : p.status === "rejected" ? (
                        <span className="admin-status-pill admin-status-rejected">
                          <XCircle size={11} style={{ marginRight: "4px" }} />
                          Rejected
                        </span>
                      ) : (
                        <span className="admin-status-pill admin-status-pending">
                          <Clock size={11} style={{ marginRight: "4px" }} />
                          Pending
                        </span>
                      )}
                    </td>
                    <td>
                      <span style={{ color: "#74788c", fontSize: "10px" }}>
                        {p.internalNote || "—"}
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
