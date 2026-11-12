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
      <div className="py-20 text-center text-gray-400">
        <div className="w-8 h-8 border-2 border-[#7459d2] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-medium">Loading your student dashboard…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
        <p className="font-semibold">Unable to load dashboard</p>
        <p className="mt-1">{error || "Please refresh the page."}</p>
      </div>
    );
  }

  const { student, stats } = data;
  const origin = typeof window !== "undefined" ? window.location.origin : "https://arclivolabs.com";
  // Personal creator registration link: https://arclivolabs.com/join-as-creator/[referralCode]
  const referralLink = `${origin}/join-as-creator/${student.referralCode}`;

  function copyCode() {
    navigator.clipboard.writeText(student.referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  }

  function copyLink() {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#171828] to-[#252844] rounded-2xl p-6 sm:p-8 text-white shadow-sm relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#9075ec]/20 border border-[#9075ec]/30 text-[11px] font-semibold text-[#c7b8ff] mb-3">
            <Sparkles size={13} />
            <span>Campus Ambassador Dashboard</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Welcome back, {student.name.split(" ")[0]}!
          </h1>
          <p className="text-xs sm:text-sm text-gray-300 mt-2 leading-relaxed">
            Reach out to creators on Instagram, invite them with your unique referral code or link, and monitor your
            referrals and verified earnings in real time.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link
              href="/student/dm-templates"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#7459d2] hover:bg-[#6247bf] text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
            >
              <MessageSquareText size={15} />
              <span>Browse Outreach DM Templates</span>
              <ArrowRight size={13} />
            </Link>
            <div className="text-[11px] text-gray-400 font-mono">
              Student ID: <span className="text-white font-semibold">{student.studentId}</span>
            </div>
          </div>
        </div>

        {/* Decorative background shape */}
        <div className="absolute right-0 bottom-0 translate-x-10 translate-y-10 w-72 h-72 rounded-full bg-gradient-to-br from-[#7459d2]/20 to-transparent pointer-events-none" />
      </div>

      {/* Referral Link & Code Sharing Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              Your Personal Creator Registration Link
            </span>
            <h2 className="text-sm font-bold text-gray-800 mt-0.5">Share with Instagram Creators</h2>
            <p className="text-xs text-gray-500 mt-1">
              Give creators this link or referral code during outreach conversations. The code is captured automatically.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Referral Code Box */}
            <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="text-left">
                <div className="text-[9px] font-bold text-[#7459d2] uppercase tracking-wider">Referral Code</div>
                <div className="font-mono text-sm font-extrabold text-[#7459d2]">{student.referralCode}</div>
              </div>
              <button
                type="button"
                onClick={copyCode}
                className="ml-2 p-1.5 rounded-md hover:bg-purple-100 text-[#7459d2] transition-colors"
                title="Copy code"
              >
                {copiedCode ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              </button>
            </div>

            {/* Share Link Button */}
            <button
              type="button"
              onClick={copyLink}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-300 rounded-lg transition-colors"
            >
              {copiedLink ? <Check size={14} className="text-emerald-600" /> : <ExternalLink size={14} />}
              <span>{copiedLink ? "Link Copied!" : "Copy Registration Link"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Required 4 Overview Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Creators Referred */}
        <Link
          href="/student/creators-referred"
          className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs hover:border-[#7459d2]/40 hover:shadow-sm transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Total Creators Referred</span>
            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Users size={19} />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-gray-900 mt-2">
            {stats.totalCreatorsReferred}
          </div>
          <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">
            <span>All signups using your link</span>
            <ArrowRight size={10} className="text-gray-300 group-hover:text-indigo-600 ml-auto" />
          </p>
        </Link>

        {/* 2. Verified Creators */}
        <Link
          href="/student/verified-creators"
          className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs hover:border-emerald-400 hover:shadow-sm transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Verified Creators</span>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <UserCheck size={19} />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-emerald-600 mt-2">
            {stats.verifiedCreators}
          </div>
          <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">
            <span>Reviewed & approved by agency</span>
            <ArrowRight size={10} className="text-gray-300 group-hover:text-emerald-600 ml-auto" />
          </p>
        </Link>

        {/* 3. Pending Verification */}
        <Link
          href="/student/pending-verification"
          className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs hover:border-amber-400 hover:shadow-sm transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Pending Verification</span>
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Clock size={19} />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-amber-600 mt-2">
            {stats.pendingVerification}
          </div>
          <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">
            <span>Under onboarding review</span>
            <ArrowRight size={10} className="text-gray-300 group-hover:text-amber-600 ml-auto" />
          </p>
        </Link>

        {/* 4. Total Earnings */}
        <Link
          href="/student/earnings"
          className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs hover:border-[#7459d2]/40 hover:shadow-sm transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Total Earnings</span>
            <div className="w-10 h-10 rounded-lg bg-purple-50 text-[#7459d2] flex items-center justify-center group-hover:scale-105 transition-transform">
              <Wallet size={19} />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#7459d2] mt-2">
            {formatINR(stats.totalEarnings)}
          </div>
          <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">
            <span>Approved referral commissions</span>
            <ArrowRight size={10} className="text-gray-300 group-hover:text-[#7459d2] ml-auto" />
          </p>
        </Link>
      </div>

      {/* Real-time Referred Creators List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Your Referred Creators</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Creators who registered using your unique referral link ({referrals.length} total).
            </p>
          </div>
          <Link
            href="/student/creators-referred"
            className="text-xs font-semibold text-[#7459d2] hover:underline inline-flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight size={12} />
          </Link>
        </div>

        {referrals.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <Users size={32} className="mx-auto mb-2 text-gray-300" />
            <h4 className="text-xs font-bold text-gray-700">No referred creators yet</h4>
            <p className="text-xs text-gray-400 max-w-sm mx-auto mt-1">
              Start sharing your referral link with creators on Instagram using the ready-to-use DM templates!
            </p>
            <div className="mt-4">
              <Link
                href="/student/dm-templates"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#7459d2] bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors border border-purple-200"
              >
                <span>Browse Outreach DM Templates</span>
                <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-500 uppercase tracking-wider text-[10px] font-bold">
                  <th className="py-3 px-4">Instagram Creator</th>
                  <th className="py-3 px-4">Followers</th>
                  <th className="py-3 px-4">Registration Date</th>
                  <th className="py-3 px-4">Verification Status</th>
                  <th className="py-3 px-4 text-right">Commission</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {referrals.slice(0, 5).map((ref) => (
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
                      {ref.confirmedFollowers !== undefined && ref.confirmedFollowers !== ref.followers && (
                        <div className="text-[10px] text-gray-400">
                          Applied: {(ref.followers ?? 0).toLocaleString()}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-gray-500">
                      {new Date(ref.registrationDate || ref.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="py-3.5 px-4">
                      {ref.status === "verified" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 size={12} />
                          <span>Verified</span>
                        </span>
                      ) : ref.status === "rejected" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          <span>Rejected</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock size={12} />
                          <span>Pending Verification</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {ref.status === "verified" ? (
                        <div>
                          <span className="font-extrabold text-emerald-700 text-xs">
                            ₹{ref.commissionEarned || 0}
                          </span>
                          {ref.commissionTierLabel && (
                            <div className="text-[10px] text-gray-400">
                              {ref.commissionTierLabel}
                            </div>
                          )}
                        </div>
                      ) : ref.status === "rejected" ? (
                        <span className="text-gray-400 text-[11px]">—</span>
                      ) : (
                        <span className="text-amber-600 text-[11px] font-medium">Pending Review</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Action Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: DM Templates */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-9 h-9 rounded-lg bg-purple-50 text-[#7459d2] flex items-center justify-center mb-3">
              <MessageSquareText size={18} />
            </div>
            <h3 className="text-sm font-bold text-gray-900">20+ Instagram DM Templates</h3>
            <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
              Tested, professional outreach messages for first-time pitches, follow-ups, and registration invites with your link.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100">
            <Link
              href="/student/dm-templates"
              className="text-xs font-semibold text-[#7459d2] hover:underline inline-flex items-center gap-1"
            >
              <span>Explore Templates</span>
              <ArrowRight size={12} />
            </Link>
          </div>
        </div>

        {/* Card 2: Outreach Checklist */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <TrendingUp size={18} />
            </div>
            <h3 className="text-sm font-bold text-gray-900">Creator Outreach Best Practices</h3>
            <ul className="text-xs text-gray-500 mt-2 space-y-1.5">
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-500 font-bold">•</span>
                <span>Target creators with 1k+ engaged followers.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-500 font-bold">•</span>
                <span>Personalize greeting with their creator name.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-500 font-bold">•</span>
                <span>Share your direct registration link.</span>
              </li>
            </ul>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100">
            <Link
              href="/student/support"
              className="text-xs font-semibold text-emerald-600 hover:underline inline-flex items-center gap-1"
            >
              <span>Read Ambassador FAQ</span>
              <ArrowRight size={12} />
            </Link>
          </div>
        </div>

        {/* Card 3: Certificate Progress */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
              <Sparkles size={18} />
            </div>
            <h3 className="text-sm font-bold text-gray-900">Ambassador Certificate</h3>
            <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
              Earn your official ArclivoLabs Campus Ambassador Certificate of Excellence upon completing your outreach milestones.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100">
            <Link
              href="/student/certificate"
              className="text-xs font-semibold text-indigo-600 hover:underline inline-flex items-center gap-1"
            >
              <span>View Certificate Status</span>
              <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
