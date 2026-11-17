"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  MessageSquareText,
  Search,
  ShieldCheck,
  Users,
  X,
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
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

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

  const origin = typeof window !== "undefined" ? window.location.origin : "https://arclivolabs.com";
  const referralLink = `${origin}/join-as-creator/${referralCode}`;

  function copyCode() {
    if (!referralCode) return;
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    setNotice("Referral code copied to clipboard!");
    setTimeout(() => {
      setCopiedCode(false);
      setNotice("");
    }, 2500);
  }

  function copyLink() {
    if (!referralCode) return;
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setNotice("Creator registration link copied to clipboard!");
    setTimeout(() => {
      setCopiedLink(false);
      setNotice("");
    }, 2500);
  }

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.creatorName.toLowerCase().includes(q) ||
        item.creatorHandle.toLowerCase().includes(q) ||
        (item.category && item.category.toLowerCase().includes(q))
    );
  }, [items, search]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
      {/* Page Header */}
      <div className="admin-page-heading">
        <div>
          <span className="admin-eyebrow">REFERRAL NETWORK</span>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>

        <div className="admin-heading-actions">
          {referralCode && (
            <>
              <button
                type="button"
                onClick={copyCode}
                className="admin-button admin-button-secondary"
                title="Copy referral code"
              >
                {copiedCode ? <Check size={14} style={{ color: "#168d65" }} /> : <Copy size={13} />}
                <span>Code: <strong style={{ fontFamily: "monospace" }}>{referralCode}</strong></span>
              </button>

              <button
                type="button"
                onClick={copyLink}
                className="admin-button"
              >
                {copiedLink ? <Check size={14} /> : <ExternalLink size={14} />}
                <span>{copiedLink ? "Link Copied!" : "Copy Registration Link"}</span>
              </button>
            </>
          )}

          <Link
            href="/student/dm-templates"
            className="admin-button admin-button-secondary"
          >
            <MessageSquareText size={14} />
            <span>Outreach DM Templates</span>
          </Link>
        </div>
      </div>

      {/* Global Alerts */}
      {notice && (
        <p className="admin-toast" role="status">
          {notice}
          <button onClick={() => setNotice("")} aria-label="Dismiss notice">
            <X size={14} />
          </button>
        </p>
      )}
      {error && (
        <div className="admin-inline-error" role="alert">
          {error}
          <button onClick={() => setError("")} aria-label="Dismiss error">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Privacy Notice Banner */}
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
        <ShieldCheck size={16} style={{ color: "#7257ce", flexShrink: 0, marginTop: "2px" }} />
        <div>
          <b style={{ fontSize: "11px", color: "#2d3045" }}>Creator Privacy & Security Protection</b>
          <p style={{ margin: "2px 0 0", fontSize: "10.5px", color: "#777a8e", lineHeight: "1.5" }}>
            In adherence to privacy regulations and creator onboarding terms, sensitive contact information (such as personal phone numbers, emails, and financial contracts) is accessible only to agency administrators.
          </p>
        </div>
      </div>

      {/* Search & Toolbar */}
      <div className="admin-toolbar">
        <div className="admin-search">
          <Search size={14} />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search creators by name or @handle…"
          />
        </div>

        <div className="admin-filter-note">
          Showing <b>{filteredItems.length}</b> of {items.length} records
        </div>
      </div>

      {/* Referrals Table Panel */}
      <div className="admin-panel admin-table-panel">
        {loading ? (
          <div className="admin-empty-state" style={{ minHeight: "280px" }}>
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
            <b>Loading creator referrals…</b>
            <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#8a8d9e" }}>
              Retrieving live verification data from database.
            </p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="admin-empty-state" style={{ minHeight: "260px" }}>
            {filterType === "verified" ? (
              <CheckCircle2 size={32} style={{ color: "#c4c7d6", marginBottom: "8px" }} />
            ) : filterType === "pending" ? (
              <Clock size={32} style={{ color: "#c4c7d6", marginBottom: "8px" }} />
            ) : (
              <Users size={32} style={{ color: "#c4c7d6", marginBottom: "8px" }} />
            )}
            <b>
              {search
                ? "No creators match your search"
                : filterType === "verified"
                ? "No verified creator referrals yet"
                : filterType === "pending"
                ? "No pending creator referrals"
                : "No referred creators yet"}
            </b>
            <p style={{ margin: "5px 0 16px", fontSize: "11px", color: "#8b8fa2", maxWidth: "420px" }}>
              {search
                ? "Try clearing the search query or verifying the creator handle."
                : filterType === "verified"
                ? "Once agency administrators inspect and verify follower counts for your referred creators, they will appear here with approved commission amounts."
                : filterType === "pending"
                ? "When creators register through your link, they are automatically queued for quality and follower verification."
                : `Pitch Instagram creators using your code (${referralCode || "ARCLIVO"}). Once they register, their profiles will appear here.`}
            </p>
            <Link href="/student/dm-templates" className="admin-button">
              <MessageSquareText size={14} />
              <span>Browse Outreach DM Templates</span>
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
                  <th>VERIFICATION STATUS</th>
                  <th style={{ textAlign: "right" }}>COMMISSION EARNED</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((ref) => (
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
    </div>
  );
}
