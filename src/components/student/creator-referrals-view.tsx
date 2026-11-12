"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  MessageSquareText,
  ShieldCheck,
  Users,
} from "lucide-react";

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

export function CreatorReferralsView({
  filterType,
  title,
  description,
}: {
  filterType: "all" | "verified" | "pending";
  title: string;
  description: string;
}) {
  const [items, setItems] = useState<ReferralItem[]>([]);
  const [referralCode, setReferralCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchReferrals() {
      try {
        const res = await fetch(`/api/student/referrals?status=${filterType}`, {
          credentials: "same-origin",
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.message || "Failed to load referrals.");
        }
        setItems(json.data.referrals || []);
        setReferralCode(json.data.referralCode || "");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error loading referrals.");
      } finally {
        setLoading(false);
      }
    }
    fetchReferrals();
  }, [filterType]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-bold tracking-widest text-[#7459d2] uppercase block mb-1">
            Referral Network
          </span>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{title}</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">{description}</p>
        </div>

        <Link
          href="/student/dm-templates"
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-[#7459d2] hover:bg-[#6247bf] rounded-lg transition-colors shadow-xs shrink-0"
        >
          <MessageSquareText size={14} />
          <span>Outreach DM Templates</span>
        </Link>
      </div>

      {/* Security Privacy Notice */}
      <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2.5">
        <ShieldCheck size={16} className="text-blue-600 shrink-0 mt-0.5" />
        <div className="text-[11px] leading-relaxed text-blue-800">
          <strong>Privacy & Security Protection:</strong> In accordance with creator privacy policies, private creator contact numbers, email addresses, and private agreements are never displayed in student dashboards.
        </div>
      </div>

      {/* Referrals List Table / Empty State */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-400">
            <div className="w-7 h-7 border-2 border-[#7459d2] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs">Loading referrals…</p>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-rose-600 text-xs">
            <p>{error}</p>
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-purple-50 text-[#7459d2] flex items-center justify-center mx-auto mb-3">
              {filterType === "verified" ? (
                <CheckCircle2 size={24} />
              ) : filterType === "pending" ? (
                <Clock size={24} />
              ) : (
                <Users size={24} />
              )}
            </div>
            <h3 className="text-sm font-bold text-gray-800">No {filterType} referrals yet</h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto mt-1 leading-relaxed">
              {filterType === "verified"
                ? "Once agency administrators verify creators who applied with your code, they will be listed here with approved status."
                : filterType === "pending"
                ? "When creators register using your referral code, they appear here while undergoing quality & metric verification."
                : `Start pitching creators on Instagram using your code (${referralCode || "your code"}). As soon as creators apply, they will appear here.`}
            </p>
            <div className="mt-5">
              <Link
                href="/student/dm-templates"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#7459d2] hover:bg-purple-50 rounded-lg border border-purple-200 transition-colors"
              >
                <span>View Instagram Outreach Templates</span>
                <ArrowRight size={13} />
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
                {items.map((ref) => (
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
                          Applied with: {(ref.followers ?? 0).toLocaleString()}
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
    </div>
  );
}
