"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  HelpCircle,
  Info,
  Receipt,
  Wallet,
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-bold tracking-widest text-[#7459d2] uppercase block mb-1">
            Financial Ledger
          </span>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Payment History</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Track processed disbursements, transaction references (UTR), and pending balances.
          </p>
        </div>

        <Link
          href="/student/support"
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors shadow-xs shrink-0"
        >
          <HelpCircle size={14} />
          <span>Payment Support</span>
        </Link>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Earnings */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Total Approved Commission</span>
            <div className="w-9 h-9 rounded-lg bg-purple-50 text-[#7459d2] flex items-center justify-center">
              <Wallet size={18} />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-gray-900 mt-2">
            {loading ? "…" : formatINR(summary.totalEarnings)}
          </div>
          <p className="text-[11px] text-gray-400 mt-1">From verified creator referrals</p>
        </div>

        {/* Paid Amount */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Total Amount Paid</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-2">
            {loading ? "…" : formatINR(summary.paidAmount)}
          </div>
          <p className="text-[11px] text-emerald-600 mt-1 font-medium">Successfully disbursed</p>
        </div>

        {/* Pending Balance */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Pending Payment Balance</span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock size={18} />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-600 mt-2">
            {loading ? "…" : formatINR(summary.pendingPayment)}
          </div>
          <p className="text-[11px] text-gray-400 mt-1">Pending agency disbursement</p>
        </div>
      </div>

      {/* Info Notice */}
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 flex items-start gap-3">
        <Info size={16} className="text-[#7459d2] shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <p className="font-semibold text-gray-900">Official Ambassador Disbursements:</p>
          <p className="text-[11px] text-gray-600 mt-0.5">
            Disbursements are created manually by the agency finance team via UPI or direct bank transfer.
            UTR and transaction reference numbers are updated upon successful settlement.
          </p>
        </div>
      </div>

      {/* Payment History List / Empty State */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Disbursement Records</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Itemized history of all payments recorded by administration ({payments.length} total).
            </p>
          </div>
          <Link
            href="/student/earnings"
            className="text-xs font-semibold text-[#7459d2] hover:underline inline-flex items-center gap-1"
          >
            <span>Earnings Breakdown</span>
            <ArrowRight size={12} />
          </Link>
        </div>

        {loading ? (
          <div className="py-16 text-center text-gray-400">
            <div className="w-7 h-7 border-2 border-[#7459d2] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs">Loading disbursement records…</p>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-rose-600 text-xs">
            <p>{error}</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-purple-50 text-[#7459d2] flex items-center justify-center mx-auto mb-3">
              <Receipt size={24} />
            </div>
            <h3 className="text-sm font-bold text-gray-900">No payout records yet</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 leading-relaxed">
              Your payment history will appear here once referral earnings are disbursed by administration.
            </p>
            <div className="mt-5 flex items-center justify-center gap-3">
              <Link
                href="/student/earnings"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#7459d2] bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors border border-purple-200"
              >
                <Wallet size={13} />
                <span>Check Current Earnings</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-500 uppercase tracking-wider text-[10px] font-bold">
                  <th className="py-3 px-4">Disbursement Date</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4">Transaction Reference / UTR</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Payment Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payments.map((p) => (
                  <tr key={p._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-gray-900 whitespace-nowrap">
                      {new Date(p.paymentDate).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-gray-900 whitespace-nowrap">
                      ₹{p.amount.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-700">
                        {p.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-gray-700">
                      {p.transactionReference ? (
                        <span className="bg-purple-50/60 text-[#6247bf] px-2 py-0.5 rounded border border-purple-100">
                          {p.transactionReference}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">Pending UTR</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {p.status === "paid" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 size={12} />
                          <span>Paid</span>
                        </span>
                      ) : p.status === "processing" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          <Clock size={12} />
                          <span>Processing</span>
                        </span>
                      ) : p.status === "rejected" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          <XCircle size={12} />
                          <span>Rejected</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock size={12} />
                          <span>Pending</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-gray-500 max-w-xs truncate text-[11px]">
                      {p.internalNote || <span className="text-gray-300">—</span>}
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
