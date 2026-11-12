"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  GraduationCap,
  Key,
  Lock,
  Phone,
  ShieldCheck,
  UserRound,
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
  const [success, setSuccess] = useState("");

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
    setTimeout(() => setCopiedCode(false), 2000);
  }

  async function handleSaveContact(e: React.FormEvent) {
    e.preventDefault();
    setSavingContact(true);
    setError("");
    setSuccess("");
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
      setSuccess("Contact details updated successfully.");
      setTimeout(() => setSuccess(""), 4000);
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
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }

    setSavingPassword(true);
    setError("");
    setSuccess("");
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
      setSuccess("Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error changing password.");
    } finally {
      setSavingPassword(false);
    }
  }

  if (loading) {
    return (
      <div className="py-20 text-center text-gray-400">
        <div className="w-8 h-8 border-2 border-[#7459d2] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs">Loading profile…</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
        <p className="font-semibold">Unable to load profile data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <span className="text-xs font-bold tracking-widest text-[#7459d2] uppercase block mb-1">
          Account Settings
        </span>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Student Profile</h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Review your student credentials, referral code, and update your password.
        </p>
      </div>

      {/* Global Notices */}
      {success && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle size={16} className="text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Student Identity Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#9075ec] to-[#50417d] text-white font-serif text-2xl font-bold flex items-center justify-center shrink-0 shadow-xs">
            {profile.name.charAt(0).toUpperCase()}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-gray-900">{profile.name}</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Active Ambassador
              </span>
            </div>
            <p className="text-xs text-gray-500">{profile.email}</p>
            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
              <span className="text-gray-400 font-mono">
                Student ID: <b className="text-gray-800 font-mono">{profile.studentId}</b>
              </span>
              <span className="text-gray-300">•</span>
              <span className="text-gray-400">
                Joined:{" "}
                <b className="text-gray-800">
                  {new Date(profile.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                  })}
                </b>
              </span>
            </div>
          </div>

          <div className="sm:ml-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-xl border border-purple-200">
              <div>
                <div className="text-[10px] uppercase font-bold text-[#7459d2]">Referral Code</div>
                <div className="font-mono text-base font-extrabold text-[#7459d2]">{profile.referralCode}</div>
              </div>
              <button
                type="button"
                onClick={copyCode}
                className="ml-2 p-2 rounded-lg bg-white hover:bg-purple-100 text-[#7459d2] border border-purple-200 transition-colors"
                title="Copy referral code"
              >
                {copiedCode ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                const link = `${window.location.origin}/join-as-creator/${profile.referralCode}`;
                navigator.clipboard.writeText(link);
                setSuccess("Personal registration link copied to clipboard!");
                setTimeout(() => setSuccess(""), 3000);
              }}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-[#7459d2] hover:bg-[#6247bf] rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <Copy size={13} />
              <span>Copy Registration Link</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact Info Form */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-6">
          <div className="flex items-center gap-2 mb-4">
            <UserRound size={16} className="text-[#7459d2]" />
            <h3 className="text-sm font-bold text-gray-900">Contact & Education Details</h3>
          </div>

          <form onSubmit={handleSaveContact} className="space-y-4 text-xs">
            <div>
              <label className="block text-gray-600 font-medium mb-1">Full Name</label>
              <input
                type="text"
                disabled
                value={profile.name}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed"
              />
              <p className="text-[10px] text-gray-400 mt-1">Name can only be modified by administration.</p>
            </div>

            <div>
              <label className="block text-gray-600 font-medium mb-1">Email Address</label>
              <input
                type="email"
                disabled
                value={profile.email}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-1">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7459d2]/20 focus:border-[#7459d2]"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-1">Institution / College</label>
              <input
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="e.g. IIT Delhi / Delhi University"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7459d2]/20 focus:border-[#7459d2]"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingContact}
                className="px-4 py-2 bg-[#7459d2] hover:bg-[#6247bf] text-white font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-50"
              >
                {savingContact ? "Saving…" : "Save Contact Info"}
              </button>
            </div>
          </form>
        </div>

        {/* Change Password Form */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lock size={16} className="text-[#7459d2]" />
            <h3 className="text-sm font-bold text-gray-900">Change Password</h3>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
            <div>
              <label className="block text-gray-700 font-semibold mb-1">Current Password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7459d2]/20 focus:border-[#7459d2]"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-1">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7459d2]/20 focus:border-[#7459d2]"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-type new password"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7459d2]/20 focus:border-[#7459d2]"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingPassword}
                className="px-4 py-2 bg-gray-900 hover:bg-black text-white font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-50"
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

