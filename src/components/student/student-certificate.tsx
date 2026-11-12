"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  FileText,
  HelpCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

type CertificateItem = {
  _id: string;
  certificateId: string;
  title: string;
  description?: string;
  issueDate: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
};

export function StudentCertificate() {
  const [certificates, setCertificates] = useState<CertificateItem[]>([]);
  const [studentName, setStudentName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCertificates() {
      try {
        const res = await fetch("/api/student/certificates", { credentials: "same-origin" });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.message || "Failed to load certificates.");
        }
        setCertificates(json.data.certificates || []);
        setStudentName(json.data.studentName || "Ambassador");
        setStudentId(json.data.studentId || "");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error loading certificates.");
      } finally {
        setLoading(false);
      }
    }
    loadCertificates();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-bold tracking-widest text-[#7459d2] uppercase block mb-1">
            Credentials & Honors
          </span>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">My Certificate</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Verified ArclivoLabs Campus Ambassador certificates of excellence and completion.
          </p>
        </div>

        <Link
          href="/student/support"
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors shadow-xs shrink-0"
        >
          <HelpCircle size={14} />
          <span>Certificate Inquiries</span>
        </Link>
      </div>

      {/* Program Information Notice */}
      <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl text-xs text-indigo-950 flex items-start gap-3">
        <Sparkles size={16} className="text-indigo-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <p className="font-semibold text-indigo-950">Ambassador Credential Program:</p>
          <p className="text-[11px] text-indigo-800 mt-0.5">
            Certificates are issued manually by ArclivoLabs administration based on outreach milestones and verified creator referrals. Only verified, active certificates assigned to your account are accessible here.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-16 text-center text-gray-400">
          <div className="w-8 h-8 border-2 border-[#7459d2] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs">Loading certificate credentials…</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 text-center">
          <p>{error}</p>
        </div>
      ) : certificates.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-gray-300 p-12 text-center">
          <div className="w-14 h-14 rounded-full bg-purple-50 text-[#7459d2] flex items-center justify-center mx-auto mb-3">
            <Award size={28} />
          </div>
          <h3 className="text-base font-bold text-gray-900">No Certificates Awarded Yet</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto mt-1 leading-relaxed">
            Certificates are not issued automatically upon signup. As you actively refer creators and achieve verification milestones, administration will upload and assign your official certificate.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link
              href="/student/dm-templates"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#7459d2] hover:bg-[#6247bf] rounded-lg transition-colors shadow-xs"
            >
              <span>Explore DM Outreach Templates</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {certificates.map((cert) => (
            <div
              key={cert._id}
              className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden flex flex-col justify-between hover:border-purple-300 transition-colors"
            >
              {/* Certificate Top Banner */}
              <div className="p-6 bg-gradient-to-br from-[#f8f6ff] to-[#ece7fc] border-b border-purple-100 flex items-start justify-between">
                <div>
                  <span className="text-[10px] tracking-widest font-extrabold text-[#7459d2] uppercase block">
                    OFFICIAL CREDENTIAL
                  </span>
                  <h3 className="text-lg font-serif font-bold text-gray-900 mt-1">{cert.title}</h3>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="font-mono text-[10px] bg-white px-2 py-0.5 rounded border border-purple-200 text-[#6247bf] font-bold">
                      {cert.certificateId}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <CheckCircle2 size={10} />
                      <span>Verified</span>
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-full bg-white text-[#7459d2] shadow-xs flex items-center justify-center shrink-0 border border-purple-100">
                  <Award size={24} />
                </div>
              </div>

              {/* Certificate Details */}
              <div className="p-6 space-y-4 flex-1 flex flex-col justify-between text-xs">
                <div>
                  <div className="text-gray-600 leading-relaxed text-[11px]">
                    {cert.description ||
                      "Awarded for outstanding contribution, creator onboarding, and campus brand ambassador excellence with ArclivoLabs."}
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100 mt-4 text-[11px]">
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase font-bold">
                        Issued To
                      </span>
                      <span className="font-semibold text-gray-900">{studentName}</span>
                      <span className="block text-[10px] text-gray-400 font-mono">{studentId}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase font-bold">
                        Issue Date
                      </span>
                      <span className="font-semibold text-gray-900">
                        {new Date(cert.issueDate).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Download Button */}
                <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
                  <div className="text-[10px] text-gray-400 truncate">
                    {cert.fileName} ({(cert.fileSize / 1024 / 1024).toFixed(2)} MB)
                  </div>
                  <a
                    href={cert.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={cert.fileName}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#7459d2] hover:bg-[#6247bf] rounded-lg transition-colors shadow-xs shrink-0"
                  >
                    <Download size={13} />
                    <span>Download Certificate</span>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
