"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Clock,
  HelpCircle,
  Mail,
  MessageCircle,
  MessageSquare,
  Plus,
  Send,
  Sparkles,
  X,
  XCircle,
} from "lucide-react";

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
  const [success, setSuccess] = useState("");

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
    setSuccess("");

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

      setSuccess(`Support request ${json.data.ticketNumber} submitted successfully.`);
      setCreateModalOpen(false);
      setSubject("");
      setMessage("");
      loadTickets();
      setTimeout(() => setSuccess(""), 5000);
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-bold tracking-widest text-[#7459d2] uppercase block mb-1">
            Help Desk & Assistance
          </span>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Support Desk</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Submit questions, track referral inquiries, and communicate directly with the agency administration.
          </p>
        </div>

        <button
          onClick={() => {
            setError("");
            setCreateModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-[#7459d2] hover:bg-[#6247bf] rounded-lg transition-colors shadow-xs shrink-0"
        >
          <Plus size={15} />
          <span>New Support Request</span>
        </button>
      </div>

      {/* Global Alerts */}
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

      {/* Tickets List Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Your Support Requests</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Review replies from the agency coordinator team ({tickets.length} total).
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-gray-400">
            <div className="w-7 h-7 border-2 border-[#7459d2] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs">Loading support requests…</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-purple-50 text-[#7459d2] flex items-center justify-center mx-auto mb-3">
              <MessageSquare size={22} />
            </div>
            <h3 className="text-sm font-bold text-gray-900">No support tickets yet</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 leading-relaxed">
              Have questions regarding creator attribution, follower verification, or payouts? Submit a ticket and our team will assist you.
            </p>
            <div className="mt-5">
              <button
                onClick={() => setCreateModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#7459d2] bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors border border-purple-200"
              >
                <Plus size={13} />
                <span>Create Support Request</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-500 uppercase tracking-wider text-[10px] font-bold">
                  <th className="py-3 px-4">Ticket ID</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Last Reply</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tickets.map((t) => (
                  <tr key={t._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#6247bf]">
                      {t.ticketNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-700">
                        {t.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-gray-900">
                      <div>{t.subject}</div>
                      {t.latestMessageSnippet && (
                        <div className="text-[11px] text-gray-400 truncate max-w-xs mt-0.5">
                          {t.latestMessageSnippet}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {t.status === "open" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Clock size={11} />
                          <span>Open</span>
                        </span>
                      ) : t.status === "in_progress" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          <MessageCircle size={11} />
                          <span>In Progress</span>
                        </span>
                      ) : t.status === "resolved" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-[#7459d2] border border-purple-200">
                          <CheckCircle2 size={11} />
                          <span>Resolved</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                          <XCircle size={11} />
                          <span>Closed</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-gray-400 text-[11px] whitespace-nowrap">
                      {new Date(t.lastReplyAt || t.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      <span className="block text-[10px] text-gray-400">
                        by {t.lastReplyBy === "admin" ? "Admin" : "You"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => openTicketThread(t._id)}
                        className="px-3 py-1.5 text-xs font-semibold text-[#7459d2] hover:bg-purple-50 rounded-lg border border-purple-200 transition-colors"
                      >
                        View & Reply
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Support Request Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-gray-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-900">New Support Request</h3>
                <p className="text-xs text-gray-500 mt-0.5">Submit an inquiry to the agency support team</p>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#7459d2]"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  required
                  placeholder="Brief summary of your request"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#7459d2]"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Message</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Provide all relevant details (e.g. creator handle, dates, questions)..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#7459d2]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#7459d2] hover:bg-[#6247bf] rounded-lg transition-colors disabled:opacity-50"
                >
                  {submitting ? "Submitting…" : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ticket Conversation Modal */}
      {activeTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-xl border border-gray-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#6247bf]">
                    {activeTicket.ticketNumber}
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-700">
                    {activeTicket.category}
                  </span>
                  <span className="capitalize text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-[#7459d2]">
                    Status: {activeTicket.status.replace("_", " ")}
                  </span>
                </div>
                <h3 className="text-base font-bold text-gray-900 mt-1">{activeTicket.subject}</h3>
              </div>
              <button
                onClick={() => setActiveTicket(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={18} />
              </button>
            </div>

            {/* Conversation Messages */}
            <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs bg-gray-50/50">
              {activeTicket.messages?.map((msg) => (
                <div
                  key={msg._id}
                  className={`flex flex-col ${
                    msg.senderRole === "student" ? "items-end" : "items-start"
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1 text-[11px] text-gray-500">
                    <span className="font-semibold text-gray-800">
                      {msg.senderRole === "student" ? "You" : `${msg.senderName} (Admin)`}
                    </span>
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
                    className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                      msg.senderRole === "student"
                        ? "bg-[#7459d2] text-white rounded-tr-none shadow-xs"
                        : "bg-white text-gray-800 border border-gray-200 rounded-tl-none shadow-xs"
                    }`}
                  >
                    {msg.message}
                  </div>
                </div>
              ))}
            </div>

            {/* Reply Input Box */}
            <form onSubmit={handleSendReply} className="p-4 bg-white border-t border-gray-100">
              <div className="flex gap-2">
                <textarea
                  rows={2}
                  required
                  placeholder="Type your reply here..."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#7459d2] resize-none"
                />
                <button
                  type="submit"
                  disabled={replySubmitting || !replyMessage.trim()}
                  className="px-4 py-2 bg-[#7459d2] hover:bg-[#6247bf] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 self-end"
                >
                  <Send size={13} />
                  <span>{replySubmitting ? "Sending…" : "Reply"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Frequently Asked Questions Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-6">
        <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
          <HelpCircle size={16} className="text-[#7459d2]" />
          <span>Frequently Asked Questions</span>
        </h3>
        <div className="space-y-3 text-xs">
          {[
            {
              q: "How does the creator referral link work?",
              a: "When you share your personal registration link (arclivolabs.com/join-as-creator/YOUR_CODE), your referral code is automatically captured and attributed to your student account permanently upon form submission.",
            },
            {
              q: "When will my pending commission be approved?",
              a: "Administration verifies creator profiles within 24-48 hours. Once verified and follower counts are confirmed, commission is instantly credited to your Total Earnings balance.",
            },
            {
              q: "How are ambassador payouts disbursed?",
              a: "Payouts are disbursed via UPI or Bank Transfer once approved by administration. You can view all processed transactions under Payment History.",
            },
          ].map((item, idx) => (
            <div key={idx} className="border border-gray-100 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                className="w-full text-left p-3 font-semibold text-gray-800 flex items-center justify-between hover:bg-gray-50"
              >
                <span>{item.q}</span>
                <ChevronDown
                  size={14}
                  className={`text-gray-400 transition-transform ${
                    openFaqIndex === idx ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openFaqIndex === idx && (
                <div className="p-3 text-gray-600 bg-gray-50/50 border-t border-gray-100 leading-relaxed text-[11px]">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
