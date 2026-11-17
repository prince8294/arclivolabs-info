"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  GraduationCap,
  Key,
  Lock,
  Phone,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";

type ProfileData = {
  name: string;
  email: string;
  studentId: string;
  referralCode: string;
  phone?: string;
  institution?: string;
  status: string;
  createdAt: string;
};

export function StudentProfile() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Edit fields
  const [phone, setPhone] = useState("");
  const [institution, setInstitution] = useState("");
  const [savingContact, setSavingContact] = useState(false);

  // Change password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/student/me", { credentials: "same-origin" });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.message || "Failed to load profile.");
        }
        setProfile(json.data.student);
        setPhone(json.data.student.phone || "");
        setInstitution(json.data.student.institution || "");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error loading profile.");
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  function copyCode() {
    if (!profile) return;
    navigator.clipboard.writeText(profile.referralCode);
    setCopiedCode(true);
    setNotice("Referral code copied to clipboard!");
    setTimeout(() => {
      setCopiedCode(false);
      setNotice("");
    }, 2500);
  }

  function copyLink() {
    if (!profile) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "https://arclivolabs.com";
    navigator.clipboard.writeText(`${origin}/join-as-creator/${profile.referralCode}`);
    setCopiedLink(true);
    setNotice("Creator registration link copied to clipboard!");
    setTimeout(() => {
      setCopiedLink(false);
      setNotice("");
    }, 2500);
  }

  async function handleSaveContact(e: React.FormEvent) {
    e.preventDefault();
    setSavingContact(true);
    setError("");
    setNotice("");
    try {
      const res = await fetch("/api/student/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ phone, institution }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to update profile.");
      }
      setNotice("Contact & institution details updated successfully.");
      setTimeout(() => setNotice(""), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error saving profile.");
    } finally {
      setSavingContact(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }
    if (newPassword.length < 12 || !/[a-z]/.test(newPassword) || !/[A-Z]/.test(newPassword)
      || !/[0-9]/.test(newPassword) || !/[^A-Za-z0-9]/.test(newPassword)) {
      setError("Use at least 12 characters with upper- and lowercase letters, a number, and a symbol.");
      return;
    }

    setSavingPassword(true);
    setError("");
    setNotice("");
    try {
      const res = await fetch("/api/student/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to update password.");
      }
      setNotice("Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setNotice(""), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error changing password.");
    } finally {
      setSavingPassword(false);
    }
  }

  if (loading) {
    return (
      <div className="admin-panel admin-empty-state" style={{ minHeight: "320px" }}>
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
        <b>Loading student profile…</b>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="admin-inline-error" role="alert">
        <span>Unable to load profile data.</span>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
      {/* Header */}
      <div className="admin-page-heading">
        <div>
          <span className="admin-eyebrow">AMBASSADOR ACCOUNT & SETTINGS</span>
          <h1>Student Profile</h1>
          <p>
            Review your student identity credentials, referral code, contact details, and update your portal password.
          </p>
        </div>

        <div className="admin-heading-actions">
          <button
            type="button"
            onClick={copyCode}
            className="admin-button admin-button-secondary"
          >
            {copiedCode ? <Check size={14} style={{ color: "#168d65" }} /> : <Copy size={13} />}
            <span>Code: <strong style={{ fontFamily: "monospace" }}>{profile.referralCode}</strong></span>
          </button>

          <button
            type="button"
            onClick={copyLink}
            className="admin-button"
          >
            {copiedLink ? <Check size={14} /> : <ExternalLink size={14} />}
            <span>{copiedLink ? "Link Copied!" : "Copy Registration Link"}</span>
          </button>
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

      {/* Student Identity Card */}
      <div className="admin-panel admin-panel-padding">
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "18px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                width: "56px",
                height: "56px",
                display: "grid",
                placeItems: "center",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #7257ce 0%, #4a3791 100%)",
                color: "white",
                fontFamily: "var(--admin-font-serif, Georgia, serif)",
                fontSize: "24px",
                boxShadow: "0 4px 12px rgba(114, 87, 206, 0.2)",
                flexShrink: 0,
              }}
            >
              {profile.name.charAt(0).toUpperCase()}
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <h2 style={{ fontSize: "16px", fontWeight: "700", color: "#25273a", margin: 0 }}>
                  {profile.name}
                </h2>
                <span className="admin-status-pill admin-status-approved">
                  <CheckCircle2 size={10} style={{ marginRight: "3px" }} />
                  Active Ambassador
                </span>
              </div>

              <p style={{ margin: "3px 0 0", fontSize: "11px", color: "#838699" }}>
                {profile.email}
              </p>

              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "6px", fontSize: "10.5px", color: "#9295a6" }}>
                <span>
                  Student ID: <b style={{ color: "#36384a", fontFamily: "monospace" }}>{profile.studentId}</b>
                </span>
                <span>•</span>
                <span>
                  Member since:{" "}
                  <b style={{ color: "#36384a" }}>
                    {new Date(profile.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    })}
                  </b>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Code Badge */}
          <div
            style={{
              padding: "10px 14px",
              background: "#faf9ff",
              border: "1px solid #e7e2fa",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div>
              <span style={{ fontSize: "8.5px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.12em", color: "#7257ce", display: "block" }}>
                Referral Code
              </span>
              <strong style={{ fontFamily: "monospace", fontSize: "15px", color: "#7257ce", letterSpacing: "0.06em" }}>
                {profile.referralCode}
              </strong>
            </div>
            <button
              type="button"
              onClick={copyCode}
              className="admin-small-button"
              title="Copy referral code"
            >
              {copiedCode ? <Check size={12} style={{ color: "#168d65" }} /> : <Copy size={12} />}
              <span>Copy</span>
            </button>
          </div>
        </div>
      </div>

      {/* Forms Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "16px" }}>
        {/* Contact Info Form */}
        <div className="admin-panel admin-panel-padding">
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <UserRound size={15} style={{ color: "#7257ce" }} />
            <h3 style={{ fontSize: "13px", fontWeight: "650", color: "#25273a", margin: 0 }}>
              Contact & Education Details
            </h3>
          </div>

          <form onSubmit={handleSaveContact} className="admin-form-grid" style={{ gap: "12px" }}>
            <label className="admin-form-field" style={{ gridColumn: "1 / -1" }}>
              <span>Full Name</span>
              <input
                type="text"
                disabled
                value={profile.name}
                style={{ background: "#f8f8fa", color: "#8a8d9f", cursor: "not-allowed" }}
              />
              <small style={{ color: "#9da0b1", fontSize: "9.5px", marginTop: "3px" }}>
                Name can only be modified by agency administration.
              </small>
            </label>

            <label className="admin-form-field" style={{ gridColumn: "1 / -1" }}>
              <span>Email Address</span>
              <input
                type="email"
                disabled
                value={profile.email}
                style={{ background: "#f8f8fa", color: "#8a8d9f", cursor: "not-allowed" }}
              />
            </label>

            <label className="admin-form-field" style={{ gridColumn: "1 / -1" }}>
              <span>Phone / WhatsApp Number</span>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
              />
            </label>

            <label className="admin-form-field" style={{ gridColumn: "1 / -1" }}>
              <span>Institution / College</span>
              <input
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="e.g. IIT Delhi / Delhi University"
              />
            </label>

            <div style={{ gridColumn: "1 / -1", paddingTop: "6px" }}>
              <button
                type="submit"
                disabled={savingContact}
                className="admin-button"
              >
                {savingContact ? "Saving Details…" : "Save Contact Info"}
              </button>
            </div>
          </form>
        </div>

        {/* Change Password Form */}
        <div className="admin-panel admin-panel-padding">
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <Lock size={15} style={{ color: "#7257ce" }} />
            <h3 style={{ fontSize: "13px", fontWeight: "650", color: "#25273a", margin: 0 }}>
              Change Security Password
            </h3>
          </div>

          <form onSubmit={handleChangePassword} className="admin-form-grid" style={{ gap: "12px" }}>
            <label className="admin-form-field" style={{ gridColumn: "1 / -1" }}>
              <span>Current Password *</span>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
              />
            </label>

            <label className="admin-form-field" style={{ gridColumn: "1 / -1" }}>
              <span>New Password *</span>
              <input
                type="password"
                required
                autoComplete="new-password"
                minLength={12}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="12+ characters, number & symbol"
              />
            </label>

            <label className="admin-form-field" style={{ gridColumn: "1 / -1" }}>
              <span>Confirm New Password *</span>
              <input
                type="password"
                required
                autoComplete="new-password"
                minLength={12}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
              />
            </label>

            <div style={{ gridColumn: "1 / -1", paddingTop: "6px" }}>
              <button
                type="submit"
                disabled={savingPassword}
                className="admin-button"
              >
                {savingPassword ? "Updating Password…" : "Update Password"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
