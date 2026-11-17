"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Clock,
  HelpCircle,
  MessageCircle,
  MessageSquare,
  Plus,
  Send,
  Sparkles,
  X,
  XCircle,
} from "lucide-react";

function StudentModalPortal({ children }: { children: React.ReactNode }) {
  if (typeof document === "undefined") return null;
  return createPortal(children, document.querySelector(".admin-frame") ?? document.body);
}

type TicketMessage = {
  _id: string;
  sender: string;
  senderRole: "student" | "admin";
  senderName: string;
  message: string;
  createdAt: string;
};

type SupportTicket = {
  _id: string;
  ticketNumber: string;
  category: string;
  subject: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: string;
  createdAt: string;
  lastReplyAt: string;
  lastReplyBy: string;
  messagesCount: number;
  latestMessageSnippet?: string;
  messages?: TicketMessage[];
};

const categories = [
  "Commission & Payouts",
  "Referral Tracking",
  "Creator Verification",
  "Account & Profile",
  "General Support",
] as const;

export function StudentSupport() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Create Ticket Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [category, setCategory] = useState<string>(categories[0]);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Active Ticket Thread Modal
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);
  const [activeTicketLoading, setActiveTicketLoading] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const [replySubmitting, setReplySubmitting] = useState(false);

  // FAQ Accordion
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  async function loadTickets() {
    try {
      const res = await fetch("/api/student/support", { credentials: "same-origin" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to load support tickets.");
      }
      setTickets(json.data.tickets || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading support tickets.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTickets();
  }, []);

  async function handleCreateTicket(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      setError("Please fill in both the subject and your message.");
      return;
    }

    setSubmitting(true);
    setError("");
    setNotice("");

    try {
      const res = await fetch("/api/student/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ category, subject, message }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to submit support request.");
      }

      setNotice(`Support request ${json.data.ticketNumber} submitted successfully.`);
      setCreateModalOpen(false);
      setSubject("");
      setMessage("");
      loadTickets();
      setTimeout(() => setNotice(""), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error creating ticket.");
    } finally {
      setSubmitting(false);
    }
  }

  async function openTicketThread(ticketId: string) {
    setActiveTicketLoading(true);
    try {
      const res = await fetch(`/api/student/support/${ticketId}`, { credentials: "same-origin" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to load ticket details.");
      }
      setActiveTicket(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load ticket conversation.");
    } finally {
      setActiveTicketLoading(false);
    }
  }

  async function handleSendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!activeTicket || !replyMessage.trim()) return;

    setReplySubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/student/support/${activeTicket._id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ message: replyMessage }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to send reply.");
      }

      setActiveTicket(json.data);
      setReplyMessage("");
      loadTickets();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error sending reply.");
    } finally {
      setReplySubmitting(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
      {/* Header */}
      <div className="admin-page-heading">
        <div>
          <span className="admin-eyebrow">AMBASSADOR ASSISTANCE & DESK</span>
          <h1>Support Desk</h1>
          <p>
            Submit inquiries, track creator verification status, ask payout questions, and receive direct replies from agency coordinators.
          </p>
        </div>

        <div className="admin-heading-actions">
          <button
            type="button"
            onClick={() => {
              setError("");
              setCreateModalOpen(true);
            }}
            className="admin-button"
          >
            <Plus size={15} />
            <span>New Support Request</span>
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

      {/* Tickets List Table Panel */}
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
              Your Support Requests
            </h2>
            <p style={{ fontSize: "11px", color: "#85889d", margin: "4px 0 0" }}>
              Track ticket correspondence with the agency coordinator team ({tickets.length} total).
            </p>
          </div>
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
            <b>Loading support tickets…</b>
          </div>
        ) : tickets.length === 0 ? (
          <div className="admin-empty-state" style={{ minHeight: "260px" }}>
            <MessageSquare size={32} style={{ color: "#c4c7d6", marginBottom: "8px" }} />
            <b>No support requests opened yet</b>
            <p style={{ margin: "5px 0 16px", fontSize: "11px", color: "#8b8fa2", maxWidth: "420px" }}>
              Need assistance with follower verification, referral attribution, or payment processing? Submit a support ticket and our team will get back to you promptly.
            </p>
            <button
              type="button"
              onClick={() => setCreateModalOpen(true)}
              className="admin-button"
            >
              <Plus size={14} />
              <span>Open Support Request</span>
            </button>
          </div>
        ) : (
          <div className="admin-table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>TICKET #</th>
                  <th>CATEGORY</th>
                  <th>SUBJECT</th>
                  <th>STATUS</th>
                  <th>LAST ACTIVITY</th>
                  <th style={{ textAlign: "right" }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr key={t._id}>
                    <td>
                      <span
                        style={{
                          fontFamily: "monospace",
                          fontWeight: "700",
                          color: "#7257ce",
                          fontSize: "10.5px",
                        }}
                      >
                        {t.ticketNumber}
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
                        {t.category}
                      </span>
                    </td>
                    <td>
                      <div>
                        <span className="admin-primary-cell" style={{ maxWidth: "260px" }}>
                          {t.subject}
                        </span>
                        {t.latestMessageSnippet && (
                          <div style={{ fontSize: "9.5px", color: "#9598a8", maxWidth: "260px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {t.latestMessageSnippet}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      {t.status === "open" ? (
                        <span className="admin-status-pill admin-status-approved">
                          <Clock size={10} style={{ marginRight: "3px" }} />
                          Open
                        </span>
                      ) : t.status === "in_progress" ? (
                        <span className="admin-status-pill admin-status-proposal_sent">
                          <MessageCircle size={10} style={{ marginRight: "3px" }} />
                          In Progress
                        </span>
                      ) : t.status === "resolved" ? (
                        <span className="admin-status-pill admin-status-approved">
                          <CheckCircle2 size={10} style={{ marginRight: "3px" }} />
                          Resolved
                        </span>
                      ) : (
                        <span className="admin-status-pill admin-status-rejected">
                          <XCircle size={10} style={{ marginRight: "3px" }} />
                          Closed
                        </span>
                      )}
                    </td>
                    <td>
                      <span style={{ color: "#676a7c", fontSize: "10px" }}>
                        {new Date(t.lastReplyAt || t.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <span style={{ display: "block", fontSize: "9px", color: "#9da0b1" }}>
                        by {t.lastReplyBy === "admin" ? "Coordinator" : "You"}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        type="button"
                        onClick={() => openTicketThread(t._id)}
                        className="admin-small-button"
                      >
                        <span>View thread</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Frequently Asked Questions */}
      <div className="admin-panel admin-panel-padding">
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
          <HelpCircle size={15} style={{ color: "#7257ce" }} />
          <h2 style={{ fontSize: "13px", fontWeight: "650", color: "#25273a", margin: 0 }}>
            Frequently Asked Ambassador Questions
          </h2>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {[
            {
              q: "How does the creator referral link work?",
              a: "When you share your personal registration link (arclivolabs.com/join-as-creator/YOUR_CODE), your referral code is captured automatically and attributed to your student account permanently upon creator form submission.",
            },
            {
              q: "When will my pending commission be approved?",
              a: "Administration reviews creator profiles within 24-48 business hours. Once verified and follower metrics are confirmed, commission is automatically credited to your Total Earnings ledger balance.",
            },
            {
              q: "How are ambassador payouts disbursed?",
              a: "Payouts are disbursed via UPI or direct bank transfer once recorded by administration. You can inspect all processed transactions under the Payment History section with their UTR numbers.",
            },
            {
              q: "Can I reach out to creators across different niches?",
              a: "Yes! ArclivoLabs collaborates with creators in lifestyle, fashion, tech, gaming, beauty, fitness, travel, and business. Choose relevant DM templates from the outreach toolkit.",
            },
          ].map((item, idx) => (
            <div
              key={idx}
              style={{
                border: "1px solid #ebecef",
                borderRadius: "7px",
                overflow: "hidden",
                background: "white",
              }}
            >
              <button
                type="button"
                onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "11px 14px",
                  fontSize: "11px",
                  fontWeight: "600",
                  color: "#282a3c",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: openFaqIndex === idx ? "#faf9ff" : "white",
                  border: 0,
                  cursor: "pointer",
                }}
              >
                <span>{item.q}</span>
                <ChevronDown
                  size={14}
                  style={{
                    color: "#999caa",
                    transform: openFaqIndex === idx ? "rotate(180deg)" : "none",
                    transition: "transform 0.16s",
                  }}
                />
              </button>
              {openFaqIndex === idx && (
                <div
                  style={{
                    padding: "12px 14px",
                    fontSize: "11px",
                    lineHeight: "1.6",
                    color: "#696c7e",
                    background: "#fbfbfc",
                    borderTop: "1px solid #ebecef",
                  }}
                >
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* New Support Request Modal (Portal) */}
      {createModalOpen && (
        <StudentModalPortal>
          <div
            className="admin-modal-backdrop"
            onClick={() => setCreateModalOpen(false)}
          >
            <div
              className="admin-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="admin-modal-heading">
                <div>
                  <span className="admin-eyebrow">SUPPORT REQUEST</span>
                  <h2 style={{ fontFamily: "var(--admin-font-serif, Georgia, serif)", fontSize: "20px" }}>
                    Create Support Ticket
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="admin-icon-button"
                  aria-label="Close modal"
                >
                  <X size={15} />
                </button>
              </div>

              <form onSubmit={handleCreateTicket} className="admin-form-grid">
                <label className="admin-form-field">
                  <span>Category *</span>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="admin-form-field">
                  <span>Subject *</span>
                  <input
                    type="text"
                    required
                    placeholder="Brief summary of your inquiry"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </label>

                <label className="admin-form-field" style={{ gridColumn: "1 / -1" }}>
                  <span>Message *</span>
                  <textarea
                    required
                    rows={4}
                    placeholder="Provide all relevant details (e.g. creator @handle, dates, questions)..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </label>

                <div className="admin-modal-actions" style={{ gridColumn: "1 / -1" }}>
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(false)}
                    className="admin-button admin-button-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="admin-button"
                  >
                    {submitting ? "Submitting…" : "Submit Request"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </StudentModalPortal>
      )}

      {/* Ticket Conversation Modal (Portal) */}
      {activeTicket && (
        <StudentModalPortal>
          <div
            className="admin-modal-backdrop"
            onClick={() => setActiveTicket(null)}
          >
            <div
              className="admin-modal"
              style={{ width: "min(100%, 720px)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="admin-modal-heading">
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                    <span
                      style={{
                        fontFamily: "monospace",
                        fontSize: "11px",
                        fontWeight: "700",
                        color: "#7257ce",
                      }}
                    >
                      {activeTicket.ticketNumber}
                    </span>
                    <span className="admin-status-pill admin-status-approved">
                      {activeTicket.category}
                    </span>
                    <span
                      style={{
                        fontSize: "9px",
                        padding: "2px 6px",
                        borderRadius: "99px",
                        background: "#f0f1f5",
                        color: "#5f6274",
                        textTransform: "capitalize",
                      }}
                    >
                      Status: {activeTicket.status.replace("_", " ")}
                    </span>
                  </div>
                  <h2 style={{ fontFamily: "var(--admin-font-serif, Georgia, serif)", fontSize: "18px", margin: 0 }}>
                    {activeTicket.subject}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTicket(null)}
                  className="admin-icon-button"
                  aria-label="Close conversation"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Message Thread */}
              <div
                style={{
                  maxHeight: "340px",
                  overflowY: "auto",
                  padding: "16px",
                  background: "#f9f9fc",
                  borderRadius: "8px",
                  border: "1px solid #ebecef",
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                  marginBottom: "16px",
                }}
              >
                {activeTicket.messages?.map((msg) => (
                  <div
                    key={msg._id}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: msg.senderRole === "student" ? "flex-end" : "flex-start",
                    }}
                  >
                    <div style={{ fontSize: "10px", color: "#8a8d9f", marginBottom: "4px", display: "flex", gap: "6px" }}>
                      <strong style={{ color: "#343649" }}>
                        {msg.senderRole === "student" ? "You" : `${msg.senderName} (Coordinator)`}
                      </strong>
                      <span>•</span>
                      <span>
                        {new Date(msg.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <div
                      style={{
                        maxWidth: "85%",
                        padding: "10px 14px",
                        borderRadius: "8px",
                        fontSize: "11px",
                        lineHeight: "1.55",
                        whiteSpace: "pre-wrap",
                        background: msg.senderRole === "student" ? "#7257ce" : "white",
                        color: msg.senderRole === "student" ? "white" : "#282a3c",
                        border: msg.senderRole === "student" ? "none" : "1px solid #e5e6ee",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                      }}
                    >
                      {msg.message}
                    </div>
                  </div>
                ))}
              </div>

              {/* Reply Input */}
              <form onSubmit={handleSendReply}>
                <div style={{ display: "flex", gap: "8px" }}>
                  <textarea
                    rows={2}
                    required
                    placeholder="Type your response to the coordinator team…"
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      fontSize: "11px",
                      border: "1px solid #e2e4ec",
                      borderRadius: "6px",
                      outline: 0,
                      color: "#282a3c",
                      resize: "none",
                    }}
                  />
                  <button
                    type="submit"
                    disabled={replySubmitting || !replyMessage.trim()}
                    className="admin-button"
                    style={{ alignSelf: "flex-end" }}
                  >
                    <Send size={13} />
                    <span>{replySubmitting ? "Sending…" : "Reply"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </StudentModalPortal>
      )}
    </div>
  );
}
