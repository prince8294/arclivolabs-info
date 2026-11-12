"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  HelpCircle,
  Receipt,
  ShieldCheck,
  TrendingUp,
  Wallet,
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
      } catch {
        // Fallback
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-bold tracking-widest text-[#7459d2] uppercase block mb-1">
            Financial Overview
          </span>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Total Earnings</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Track approved referral rewards, verified creator commissions, and ambassador balances.
          </p>
        </div>

        <Link
          href="/student/payment-history"
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-[#7459d2] hover:bg-[#6247bf] rounded-lg transition-colors shadow-xs shrink-0"
        >
          <Receipt size={14} />
          <span>View Payment History</span>
        </Link>
      </div>

      {/* Main KPI Cards: Total Earnings, Paid Amount, Pending Payment */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Earnings */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Total Approved Earnings</span>
            <div className="w-10 h-10 rounded-lg bg-purple-50 text-[#7459d2] flex items-center justify-center">
              <Wallet size={20} />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-gray-900 mt-3">
            {loading ? "…" : formatINR(data.totalEarnings)}
          </div>
          <p className="text-[11px] text-emerald-600 mt-1 font-medium flex items-center gap-1">
            <CheckCircle2 size={12} />
            <span>Approved by Agency</span>
          </p>
        </div>

        {/* Paid Amount */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Total Amount Paid</span>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-emerald-600 mt-3">
            {loading ? "…" : formatINR(data.paidAmount ?? 0)}
          </div>
          <p className="text-[11px] text-emerald-600 mt-1 font-medium">
            Disbursed via UPI / Bank
          </p>
        </div>

        {/* Pending Payment */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Pending Payment Balance</span>
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock size={20} />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-amber-600 mt-3">
            {loading ? "…" : formatINR(data.pendingPayment ?? Math.max(0, data.totalEarnings - (data.paidAmount ?? 0)))}
          </div>
          <p className="text-[11px] text-gray-400 mt-1">
            Approved commissions awaiting payout
          </p>
        </div>
      </div>

      {/* Secondary Referral Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-500">Verified Creators</span>
            <div className="text-2xl font-bold text-gray-900 mt-1">
              {loading ? "…" : data.verifiedCreators}
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">Creators confirmed with follower metrics</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-500">Pending Creator Verification</span>
            <div className="text-2xl font-bold text-gray-900 mt-1">
              {loading ? "…" : data.pendingVerification}
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">Undergoing quality and follower verification</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock size={20} />
          </div>
        </div>
      </div>

      {/* Verified Commission Breakdown Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Approved Commission Breakdown</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Itemized commissions credited from verified creator referrals ({verifiedList.length} total).
            </p>
          </div>
          <Link
            href="/student/verified-creators"
            className="text-xs font-semibold text-[#7459d2] hover:underline inline-flex items-center gap-1"
          >
            <span>Verified Creators</span>
            <ArrowRight size={12} />
          </Link>
        </div>

        {verifiedList.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <div className="w-10 h-10 rounded-full bg-purple-50 text-[#7459d2] flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 size={20} />
            </div>
            <h4 className="text-xs font-bold text-gray-800">No approved commissions yet</h4>
            <p className="text-[11px] text-gray-400 max-w-sm mx-auto mt-1 leading-relaxed">
              When creator referrals are verified by administration, their follower-based commission reward will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-500 uppercase tracking-wider text-[10px] font-bold">
                  <th className="py-3 px-4">Creator</th>
                  <th className="py-3 px-4">Followers</th>
                  <th className="py-3 px-4">Commission Tier</th>
                  <th className="py-3 px-4">Verified Date</th>
                  <th className="py-3 px-4 text-right">Commission Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {verifiedList.map((ref) => (
                  <tr key={ref._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-gray-900">{ref.creatorName}</div>
                      <div className="text-[#7459d2] font-mono text-[11px] flex items-center gap-1 mt-0.5">
                        <InstagramIcon size={11} />
                        <span>@{ref.creatorHandle}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-gray-900">
                        {(ref.confirmedFollowers ?? ref.followers ?? 0).toLocaleString()}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-purple-50 text-[#6247bf] border border-purple-100">
                        {ref.commissionTierLabel || "Standard Follower Tier"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-gray-500">
                      {ref.verifiedAt
                        ? new Date(ref.verifiedAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "—"}
                    </td>
                    <td className="py-3.5 px-4 text-right font-extrabold text-emerald-700">
                      ₹{ref.commissionEarned || 0}
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
