"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Award,
  Calendar,
  CheckCircle2,
  Download,
  HelpCircle,
  Sparkles,
  User,
  X,
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
    <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
      {/* Header */}
      <div className="admin-page-heading">
        <div>
          <span className="admin-eyebrow">HONORS & CREDENTIALS</span>
          <h1>My Certificate</h1>
          <p>
            Official ArclivoLabs Campus Ambassador certificates of excellence, leadership awards, and verified credentials.
          </p>
        </div>

        <div className="admin-heading-actions">
          <Link
            href="/student/support"
            className="admin-button admin-button-secondary"
          >
            <HelpCircle size={14} />
            <span>Certificate Inquiries</span>
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

      {/* Program Information Notice */}
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
        <Sparkles size={16} style={{ color: "#7257ce", flexShrink: 0, marginTop: "2px" }} />
        <div>
          <b style={{ fontSize: "11px", color: "#2d3045" }}>Campus Ambassador Credential Program</b>
          <p style={{ margin: "2px 0 0", fontSize: "10.5px", color: "#777a8e", lineHeight: "1.5" }}>
            Certificates are issued and authenticated individually by ArclivoLabs executive administration based on outreach milestones and verified creator onboardings. Each certificate contains a unique verifiable credential ID.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="admin-panel admin-empty-state" style={{ minHeight: "280px" }}>
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
          <b>Loading certificate credentials…</b>
        </div>
      ) : certificates.length === 0 ? (
        <div className="admin-panel admin-empty-state" style={{ minHeight: "320px", padding: "40px 24px" }}>
          <div className="admin-kpi-icon admin-tone-violet" style={{ width: "42px", height: "42px", borderRadius: "50%", marginBottom: "14px" }}>
            <Award size={22} />
          </div>
          <b style={{ fontSize: "15px" }}>No Certificates Awarded Yet</b>
          <p style={{ margin: "6px 0 20px", fontSize: "11px", color: "#8a8e9f", maxWidth: "440px", lineHeight: "1.6" }}>
            Ambassador certificates are not issued automatically upon signup. As you invite creators and achieve verification milestones, administration will issue and publish your personalized certificate of excellence here.
          </p>
          <Link href="/student/dm-templates" className="admin-button">
            <span>Explore DM Outreach Templates</span>
          </Link>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "16px" }}>
          {certificates.map((cert) => (
            <div
              key={cert._id}
              className="admin-panel"
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                overflow: "hidden",
              }}
            >
              {/* Certificate Top Banner */}
              <div
                style={{
                  padding: "18px 20px",
                  background: "linear-gradient(135deg, #faf9ff 0%, #f0edff 100%)",
                  borderBottom: "1px solid #e7e2fa",
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: "12px",
                }}
              >
                <div>
                  <span
                    style={{
                      fontSize: "8.5px",
                      fontWeight: "700",
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      color: "#7257ce",
                    }}
                  >
                    OFFICIAL CREDENTIAL
                  </span>
                  <h3
                    style={{
                      margin: "4px 0 8px",
                      fontFamily: "var(--admin-font-serif, Georgia, serif)",
                      fontSize: "17px",
                      fontWeight: "500",
                      color: "#1e2030",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {cert.title}
                  </h3>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <span
                      style={{
                        fontFamily: "monospace",
                        fontSize: "10px",
                        fontWeight: "700",
                        color: "#6044bf",
                        background: "white",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        border: "1px solid #d9d2f8",
                      }}
                    >
                      {cert.certificateId}
                    </span>

                    <span className="admin-status-pill admin-status-approved">
                      <CheckCircle2 size={10} style={{ marginRight: "3px" }} />
                      Verified & Active
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    width: "38px",
                    height: "38px",
                    display: "grid",
                    placeItems: "center",
                    borderRadius: "50%",
                    background: "white",
                    border: "1px solid #dcd7f5",
                    color: "#7257ce",
                    boxShadow: "0 2px 6px rgba(114, 87, 206, 0.08)",
                    flexShrink: 0,
                  }}
                >
                  <Award size={18} />
                </div>
              </div>

              {/* Certificate Details */}
              <div style={{ padding: "18px 20px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <p style={{ margin: "0 0 16px", fontSize: "11px", color: "#6c7083", lineHeight: "1.6" }}>
                    {cert.description ||
                      "Awarded for outstanding contribution, creator onboarding, and campus brand ambassador excellence with ArclivoLabs."}
                  </p>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "12px",
                      paddingTop: "14px",
                      borderTop: "1px solid #f0f1f5",
                    }}
                  >
                    <div>
                      <span style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: "700", color: "#9da0b1", display: "block" }}>
                        Issued To
                      </span>
                      <strong style={{ fontSize: "11.5px", color: "#25273a", display: "block", marginTop: "2px" }}>
                        {studentName}
                      </strong>
                      <span style={{ fontSize: "9.5px", color: "#8e91a2", fontFamily: "monospace" }}>
                        {studentId}
                      </span>
                    </div>

                    <div>
                      <span style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: "700", color: "#9da0b1", display: "block" }}>
                        Issue Date
                      </span>
                      <strong style={{ fontSize: "11.5px", color: "#25273a", display: "block", marginTop: "2px" }}>
                        {new Date(cert.issueDate).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Download Footer */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginTop: "18px",
                    paddingTop: "14px",
                    borderTop: "1px solid #f0f1f5",
                  }}
                >
                  <span style={{ fontSize: "9.5px", color: "#9da0b1", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {cert.fileName} ({(cert.fileSize / 1024 / 1024).toFixed(2)} MB)
                  </span>

                  <a
                    href={cert.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={cert.fileName}
                    className="admin-button"
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
