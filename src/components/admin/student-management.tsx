"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertCircle,
  ArrowRight,
  Award,
  Check,
  CheckCircle2,
  Clock,
  Coins,
  Copy,
  Download,
  Edit2,
  ExternalLink,
  FileText,
  Filter,
  GraduationCap,
  HelpCircle,
  Info,
  Key,
  MessageCircle,
  MessageSquare,
  Plus,
  Receipt,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  Upload,
  UserCheck,
  UserX,
  Users,
  Wallet,
  X,
  XCircle,
} from "lucide-react";
import { generateReferralCode, generateStudentId } from "@/lib/student-utils";

function AdminModalPortal({ children }: { children: React.ReactNode }) {
  if (typeof document === "undefined") return null;
  return createPortal(children, document.querySelector(".admin-frame") ?? document.body);
}

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

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------
type StudentRecord = {
  _id: string;
  name: string;
  email: string;
  studentId: string;
  referralCode: string;
  phone?: string;
  institution?: string;
  status: "active" | "deactivated";
  notes?: string;
  totalCreatorsReferred: number;
  verifiedCreators: number;
  pendingVerification: number;
  totalEarnings: number;
  paidAmount: number;
  pendingPayment: number;
  hasCustomCommissionRates?: boolean;
  customCommissionRates?: Array<{
    minFollowers: number;
    maxFollowers: number | null;
    amount: number;
    label: string;
  }>;
  createdAt: string;
  updatedAt: string;
};

type PerformanceItem = {
  _id: string;
  name: string;
  studentId: string;
  referralCode: string;
  email: string;
  phone?: string;
  institution?: string;
  status: "active" | "deactivated";
  hasCustomCommissionRates?: boolean;
  totalCreatorsReferred: number;
  verifiedCreators: number;
  pendingVerification: number;
  rejectedCreators: number;
  totalCommissionEarned: number;
  totalAmountPaid: number;
  pendingPayment: number;
  currency: string;
  createdAt: string;
};

type ReferredCreator = {
  _id: string;
  creatorName: string;
  creatorHandle: string;
  referralCode?: string;
  platform: string;
  category: string;
  followers: number;
  confirmedFollowers?: number;
  status: "pending" | "verified" | "rejected";
  verifiedAt?: string;
  verifiedBy?: { _id: string; name: string; email: string };
  rejectionReason?: string;
  commissionEarned: number;
  commissionApproved: boolean;
  commissionTierLabel?: string;
  currency: string;
  registrationDate: string;
  createdAt: string;
  student?: { _id: string; name: string; email: string; studentId: string; referralCode: string };
  estimatedCommission?: number;
  applicableTier?: string;
  auditLog?: Array<{
    action: string;
    performedByName?: string;
    timestamp: string;
    details: string;
  }>;
};

type CommissionTier = {
  tierKey: string;
  minFollowers: number;
  maxFollowers: number | null;
  label: string;
  amount: number;
  currency: string;
  order: number;
  isActive: boolean;
};

type PaymentItem = {
  _id: string;
  amount: number;
  currency: string;
  paymentDate: string;
  paymentMethod: "UPI" | "Bank Transfer" | "Other";
  transactionReference?: string;
  internalNote?: string;
  status: "pending" | "processing" | "paid" | "rejected";
  createdAt: string;
  paidAt?: string;
  student?: {
    _id: string;
    name: string;
    email: string;
    studentId: string;
    referralCode: string;
    totalEarnings: number;
    paidAmount: number;
    pendingPayment: number;
  };
  recordedBy?: { name: string; email: string };
  auditLog?: Array<{
    action: string;
    performedByName: string;
    timestamp: string;
    details: string;
  }>;
};

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
  status: "published" | "revoked";
  student?: {
    _id: string;
    name: string;
    email: string;
    studentId: string;
    referralCode: string;
  };
  issuedBy?: { name: string; email: string };
  issuedByName: string;
  createdAt: string;
};

type TicketMessage = {
  _id: string;
  senderRole: "student" | "admin";
  senderName: string;
  message: string;
  createdAt: string;
};

type SupportTicketItem = {
  _id: string;
  ticketNumber: string;
  studentName: string;
  studentEmail: string;
  studentId: string;
  category: string;
  subject: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: string;
  createdAt: string;
  lastReplyAt: string;
  lastReplyBy: string;
  messages: TicketMessage[];
};

type TabType =
  | "students"
  | "performance"
  | "referrals"
  | "commissions"
  | "payments"
  | "certificates"
  | "support";

export function StudentManagement() {
  const [activeTab, setActiveTab] = useState<TabType>("students");

  // Notifications
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Sync tab with URL search parameter if present
  useEffect(() => {
    if (typeof window !== "undefined") {
      const tabParam = new URLSearchParams(window.location.search).get("tab") as TabType | null;
      if (
        tabParam &&
        [
          "students",
          "performance",
          "referrals",
          "commissions",
          "payments",
          "certificates",
          "support",
        ].includes(tabParam)
      ) {
        setActiveTab(tabParam);
      }
    }
  }, []);

  function copyToClipboard(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  }

  // --------------------------------------------------------------------------
  // TAB 1: Student Ambassadors State
  // --------------------------------------------------------------------------
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [studentStats, setStudentStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    deactivatedStudents: 0,
    totalReferrals: 0,
  });
  const [studentLoading, setStudentLoading] = useState(true);
  const [studentSearch, setStudentSearch] = useState("");
  const [studentStatusFilter, setStudentStatusFilter] = useState("");
  const [studentPage, setStudentPage] = useState(1);
  const [studentTotalPages, setStudentTotalPages] = useState(1);

  // Modals for students
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalRecord, setEditModalRecord] = useState<StudentRecord | null>(null);

  const [createName, setCreateName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createStudentId, setCreateStudentId] = useState("");
  const [createReferralCode, setCreateReferralCode] = useState("");
  const [createPhone, setCreatePhone] = useState("");
  const [createInstitution, setCreateInstitution] = useState("");
  const [createStatus, setCreateStatus] = useState<"active" | "deactivated">("active");
  const [createNotes, setCreateNotes] = useState("");
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createModalError, setCreateModalError] = useState("");

  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editStudentId, setEditStudentId] = useState("");
  const [editReferralCode, setEditReferralCode] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editInstitution, setEditInstitution] = useState("");
  const [editStatus, setEditStatus] = useState<"active" | "deactivated">("active");
  const [editNotes, setEditNotes] = useState("");
  const [editNewPassword, setEditNewPassword] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editModalError, setEditModalError] = useState("");

  // Fetch Students
  const fetchStudents = useCallback(async () => {
    setStudentLoading(true);
    setError("");
    try {
      const query = new URLSearchParams({
        page: String(studentPage),
        limit: "20",
        ...(studentSearch ? { search: studentSearch } : {}),
        ...(studentStatusFilter ? { status: studentStatusFilter } : {}),
      });

      const res = await fetch(`/api/admin/students?${query.toString()}`, { credentials: "same-origin" });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to load students.");

      setStudents(data.data.items || []);
      setStudentTotalPages(data.data.pages || 1);
      if (data.data.stats) setStudentStats(data.data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error fetching students.");
    } finally {
      setStudentLoading(false);
    }
  }, [studentPage, studentSearch, studentStatusFilter]);

  // --------------------------------------------------------------------------
  // TAB 2: Student Performance State
  // --------------------------------------------------------------------------
  const [performanceItems, setPerformanceItems] = useState<PerformanceItem[]>([]);
  const [performanceLoading, setPerformanceLoading] = useState(false);
  const [performanceSearch, setPerformanceSearch] = useState("");
  const [performanceStatusFilter, setPerformanceStatusFilter] = useState("");
  const [performanceSortBy, setPerformanceSortBy] = useState("recent");
  const [performancePage, setPerformancePage] = useState(1);
  const [performanceTotalPages, setPerformanceTotalPages] = useState(1);
  const [performanceSummary, setPerformanceSummary] = useState({
    allStudentsCount: 0,
    activeCount: 0,
    inactiveCount: 0,
  });

  const fetchPerformance = useCallback(async () => {
    setPerformanceLoading(true);
    setError("");
    try {
      const query = new URLSearchParams({
        page: String(performancePage),
        limit: "20",
        sortBy: performanceSortBy,
        ...(performanceSearch ? { search: performanceSearch } : {}),
        ...(performanceStatusFilter ? { status: performanceStatusFilter } : {}),
      });

      const res = await fetch(`/api/admin/students/performance?${query.toString()}`, {
        credentials: "same-origin",
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to load performance metrics.");

      setPerformanceItems(data.data.items || []);
      setPerformanceTotalPages(data.data.pages || 1);
      if (data.data.summary) setPerformanceSummary(data.data.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error fetching performance data.");
    } finally {
      setPerformanceLoading(false);
    }
  }, [performancePage, performanceSearch, performanceStatusFilter, performanceSortBy]);

  // --------------------------------------------------------------------------
  // TAB 3: Referred Creators & Verification State
  // --------------------------------------------------------------------------
  const [referrals, setReferrals] = useState<ReferredCreator[]>([]);
  const [referralStats, setReferralStats] = useState({
    totalCount: 0,
    pendingCount: 0,
    verifiedCount: 0,
    rejectedCount: 0,
  });
  const [referralLoading, setReferralLoading] = useState(false);
  const [referralSearch, setReferralSearch] = useState("");
  const [referralStatusFilter, setReferralStatusFilter] = useState("");
  const [referralPage, setReferralPage] = useState(1);
  const [referralTotalPages, setReferralTotalPages] = useState(1);

  // Verification modal state
  const [verifyTarget, setVerifyTarget] = useState<ReferredCreator | null>(null);
  const [verifyConfirmedFollowers, setVerifyConfirmedFollowers] = useState<number>(0);
  const [verifyOverrideAmount, setVerifyOverrideAmount] = useState<string>("");
  const [verifyNotes, setVerifyNotes] = useState("");
  const [verifySubmitting, setVerifySubmitting] = useState(false);

  // Rejection modal state
  const [rejectTarget, setRejectTarget] = useState<ReferredCreator | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectSubmitting, setRejectSubmitting] = useState(false);

  // Audit modal
  const [auditTarget, setAuditTarget] = useState<ReferredCreator | null>(null);

  const fetchReferrals = useCallback(async () => {
    setReferralLoading(true);
    setError("");
    try {
      const query = new URLSearchParams({
        page: String(referralPage),
        limit: "20",
        ...(referralSearch ? { search: referralSearch } : {}),
        ...(referralStatusFilter ? { status: referralStatusFilter } : {}),
      });

      const res = await fetch(`/api/admin/referrals?${query.toString()}`, { credentials: "same-origin" });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to load referrals.");

      setReferrals(data.data.items || []);
      setReferralTotalPages(data.data.pages || 1);
      if (data.data.stats) setReferralStats(data.data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error fetching referrals.");
    } finally {
      setReferralLoading(false);
    }
  }, [referralPage, referralSearch, referralStatusFilter]);

  // --------------------------------------------------------------------------
  // TAB 4: Commission Management State
  // --------------------------------------------------------------------------
  const [commissionTiers, setCommissionTiers] = useState<CommissionTier[]>([]);
  const [commissionLoading, setCommissionLoading] = useState(false);
  const [savingCommissions, setSavingCommissions] = useState(false);

  // Custom student commission modal
  const [customRateStudent, setCustomRateStudent] = useState<StudentRecord | null>(null);
  const [hasCustomRates, setHasCustomRates] = useState(false);
  const [customRatesInput, setCustomRatesInput] = useState<
    Array<{ minFollowers: number; maxFollowers: number | null; amount: number; label: string }>
  >([]);
  const [savingCustomRates, setSavingCustomRates] = useState(false);

  const fetchCommissions = useCallback(async () => {
    setCommissionLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/commission-rules", { credentials: "same-origin" });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to load commission rules.");
      setCommissionTiers(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error fetching commission tiers.");
    } finally {
      setCommissionLoading(false);
    }
  }, []);

  // --------------------------------------------------------------------------
  // TAB 5: Payment Management State
  // --------------------------------------------------------------------------
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [paymentStats, setPaymentStats] = useState({
    totalApprovedCommissions: 0,
    totalPaid: 0,
    totalPendingBalance: 0,
    totalPaymentsCount: 0,
  });
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentSearch, setPaymentSearch] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("");
  const [paymentPage, setPaymentPage] = useState(1);
  const [paymentTotalPages, setPaymentTotalPages] = useState(1);

  // Create payment modal state
  const [createPaymentModalOpen, setCreatePaymentModalOpen] = useState(false);
  const [selectedStudentForPayment, setSelectedStudentForPayment] = useState<StudentRecord | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = useState<"UPI" | "Bank Transfer" | "Other">("UPI");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [paymentStatusChoice, setPaymentStatusChoice] = useState<"pending" | "processing" | "paid">("paid");
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);

  const fetchPayments = useCallback(async () => {
    setPaymentLoading(true);
    setError("");
    try {
      const query = new URLSearchParams({
        page: String(paymentPage),
        limit: "20",
        ...(paymentSearch ? { search: paymentSearch } : {}),
        ...(paymentStatusFilter ? { status: paymentStatusFilter } : {}),
      });

      const res = await fetch(`/api/admin/students/payments?${query.toString()}`, {
        credentials: "same-origin",
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to load payments.");

      setPayments(data.data.items || []);
      setPaymentTotalPages(data.data.pages || 1);
      if (data.data.stats) setPaymentStats(data.data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error fetching payments.");
    } finally {
      setPaymentLoading(false);
    }
  }, [paymentPage, paymentSearch, paymentStatusFilter]);

  // --------------------------------------------------------------------------
  // TAB 6: Certificate Management State
  // --------------------------------------------------------------------------
  const [certificates, setCertificates] = useState<CertificateItem[]>([]);
  const [certificateStats, setCertificateStats] = useState({
    total: 0,
    published: 0,
    revoked: 0,
  });
  const [certificateLoading, setCertificateLoading] = useState(false);
  const [certificateSearch, setCertificateSearch] = useState("");
  const [certificateStatusFilter, setCertificateStatusFilter] = useState("");
  const [certificatePage, setCertificatePage] = useState(1);
  const [certificateTotalPages, setCertificateTotalPages] = useState(1);

  // Issue Certificate Modal
  const [issueCertModalOpen, setIssueCertModalOpen] = useState(false);
  const [certTargetStudent, setCertTargetStudent] = useState<StudentRecord | null>(null);
  const [certTitle, setCertTitle] = useState("Certificate of Campus Ambassador Excellence");
  const [certIdInput, setCertIdInput] = useState("");
  const [certIssueDate, setCertIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [certDescription, setCertDescription] = useState("");
  const [certFile, setCertFile] = useState<File | null>(null);
  const [certUploading, setCertUploading] = useState(false);

  const fetchCertificates = useCallback(async () => {
    setCertificateLoading(true);
    setError("");
    try {
      const query = new URLSearchParams({
        page: String(certificatePage),
        limit: "20",
        ...(certificateSearch ? { search: certificateSearch } : {}),
        ...(certificateStatusFilter ? { status: certificateStatusFilter } : {}),
      });

      const res = await fetch(`/api/admin/students/certificates?${query.toString()}`, {
        credentials: "same-origin",
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to load certificates.");

      setCertificates(data.data.items || []);
      setCertificateTotalPages(data.data.pages || 1);
      if (data.data.stats) setCertificateStats(data.data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error fetching certificates.");
    } finally {
      setCertificateLoading(false);
    }
  }, [certificatePage, certificateSearch, certificateStatusFilter]);

  // --------------------------------------------------------------------------
  // TAB 7: Support Management State
  // --------------------------------------------------------------------------
  const [tickets, setTickets] = useState<SupportTicketItem[]>([]);
  const [ticketStats, setTicketStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
  });
  const [ticketLoading, setTicketLoading] = useState(false);
  const [ticketSearch, setTicketSearch] = useState("");
  const [ticketStatusFilter, setTicketStatusFilter] = useState("");
  const [ticketPage, setTicketPage] = useState(1);
  const [ticketTotalPages, setTicketTotalPages] = useState(1);

  // Active Ticket Viewer & Reply Modal
  const [activeTicket, setActiveTicket] = useState<SupportTicketItem | null>(null);
  const [adminReplyText, setAdminReplyText] = useState("");
  const [adminReplyStatus, setAdminReplyStatus] = useState<
    "open" | "in_progress" | "resolved" | "closed"
  >("resolved");
  const [adminReplySubmitting, setAdminReplySubmitting] = useState(false);

  const fetchTickets = useCallback(async () => {
    setTicketLoading(true);
    setError("");
    try {
      const query = new URLSearchParams({
        page: String(ticketPage),
        limit: "20",
        ...(ticketSearch ? { search: ticketSearch } : {}),
        ...(ticketStatusFilter ? { status: ticketStatusFilter } : {}),
      });

      const res = await fetch(`/api/admin/students/support?${query.toString()}`, {
        credentials: "same-origin",
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to load tickets.");

      setTickets(data.data.items || []);
      setTicketTotalPages(data.data.pages || 1);
      if (data.data.stats) setTicketStats(data.data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error fetching support tickets.");
    } finally {
      setTicketLoading(false);
    }
  }, [ticketPage, ticketSearch, ticketStatusFilter]);

  // Trigger loads based on active tab
  useEffect(() => {
    if (activeTab === "students") fetchStudents();
    if (activeTab === "performance") fetchPerformance();
    if (activeTab === "referrals") fetchReferrals();
    if (activeTab === "commissions") fetchCommissions();
    if (activeTab === "payments") fetchPayments();
    if (activeTab === "certificates") fetchCertificates();
    if (activeTab === "support") fetchTickets();
  }, [
    activeTab,
    fetchStudents,
    fetchPerformance,
    fetchReferrals,
    fetchCommissions,
    fetchPayments,
    fetchCertificates,
    fetchTickets,
  ]);

  // Auto-generate student IDs
  function handleOpenCreateModal() {
    setCreateName("");
    setCreateEmail("");
    setCreatePassword("Student@" + Math.floor(1000 + Math.random() * 9000));
    setCreateStudentId(generateStudentId());
    setCreateReferralCode(generateReferralCode());
    setCreatePhone("");
    setCreateInstitution("");
    setCreateStatus("active");
    setCreateNotes("");
    setCreateModalError("");
    setCreateModalOpen(true);
  }

  // Handle student creation
  async function handleCreateStudent(e: React.FormEvent) {
    e.preventDefault();
    setCreateSubmitting(true);
    setCreateModalError("");
    setError("");
    setNotice("");
    try {
      const res = await fetch("/api/admin/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          name: createName,
          email: createEmail,
          password: createPassword,
          studentId: createStudentId,
          referralCode: createReferralCode,
          phone: createPhone || undefined,
          institution: createInstitution || undefined,
          status: createStatus,
          notes: createNotes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to create student.");

      setNotice(`Student "${createName}" [${createStudentId}] created successfully.`);
      setCreateModalOpen(false);
      fetchStudents();
      setTimeout(() => setNotice(""), 5000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error creating student.";
      setCreateModalError(msg);
      setError(msg);
    } finally {
      setCreateSubmitting(false);
    }
  }

  // Handle student editing
  function handleOpenEditModal(record: StudentRecord) {
    setEditModalRecord(record);
    setEditName(record.name);
    setEditEmail(record.email);
    setEditStudentId(record.studentId);
    setEditReferralCode(record.referralCode);
    setEditPhone(record.phone || "");
    setEditInstitution(record.institution || "");
    setEditStatus(record.status);
    setEditNotes(record.notes || "");
    setEditNewPassword("");
    setEditModalError("");
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editModalRecord) return;
    setEditSubmitting(true);
    setEditModalError("");
    setError("");
    setNotice("");
    try {
      const res = await fetch(`/api/admin/students/${editModalRecord._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          name: editName,
          email: editEmail,
          studentId: editStudentId,
          referralCode: editReferralCode,
          phone: editPhone || undefined,
          institution: editInstitution || undefined,
          status: editStatus,
          notes: editNotes || undefined,
          newPassword: editNewPassword || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to update student.");

      setNotice(`Student "${editName}" updated successfully.`);
      setEditModalRecord(null);
      fetchStudents();
      setTimeout(() => setNotice(""), 5000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error updating student.";
      setEditModalError(msg);
      setError(msg);
    } finally {
      setEditSubmitting(false);
    }
  }

  async function handleToggleStatus(record: StudentRecord) {
    const nextStatus = record.status === "active" ? "deactivated" : "active";
    setError("");
    setNotice("");
    try {
      const res = await fetch(`/api/admin/students/${record._id}/toggle-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to change status.");

      setNotice(`Student "${record.name}" is now ${nextStatus}.`);
      fetchStudents();
      setTimeout(() => setNotice(""), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error toggling status.");
    }
  }

  // Handle creator verification
  function handleOpenVerifyModal(creator: ReferredCreator) {
    setVerifyTarget(creator);
    setVerifyConfirmedFollowers(creator.followers || 0);
    setVerifyOverrideAmount("");
    setVerifyNotes("");
  }

  async function handleConfirmVerification(e: React.FormEvent) {
    e.preventDefault();
    if (!verifyTarget) return;

    setVerifySubmitting(true);
    setError("");
    setNotice("");
    try {
      const overrideVal = verifyOverrideAmount.trim() ? Number(verifyOverrideAmount) : undefined;
      const res = await fetch(`/api/admin/referrals/${verifyTarget._id}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          confirmedFollowers: Number(verifyConfirmedFollowers),
          overrideCommissionAmount: overrideVal,
          notes: verifyNotes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to verify creator.");

      setNotice(data.message || "Creator verified successfully.");
      setVerifyTarget(null);
      fetchReferrals();
      setTimeout(() => setNotice(""), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error verifying creator.");
    } finally {
      setVerifySubmitting(false);
    }
  }

  // Handle creator rejection
  async function handleConfirmRejection(e: React.FormEvent) {
    e.preventDefault();
    if (!rejectTarget) return;

    setRejectSubmitting(true);
    setError("");
    setNotice("");
    try {
      const res = await fetch(`/api/admin/referrals/${rejectTarget._id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ reason: rejectReason || undefined }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to reject creator.");

      setNotice(data.message || "Creator has been rejected.");
      setRejectTarget(null);
      fetchReferrals();
      setTimeout(() => setNotice(""), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error rejecting creator.");
    } finally {
      setRejectSubmitting(false);
    }
  }

  // Handle Commission Tiers Update
  async function handleSaveCommissionTiers(e: React.FormEvent) {
    e.preventDefault();
    setSavingCommissions(true);
    setError("");
    setNotice("");
    try {
      const res = await fetch("/api/admin/commission-rules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ tiers: commissionTiers }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to update commission rates.");

      setNotice("Commission rates updated and saved successfully.");
      setCommissionTiers(data.data || []);
      setTimeout(() => setNotice(""), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error saving commission rates.");
    } finally {
      setSavingCommissions(false);
    }
  }

  // Handle Custom Student Commission Rates
  function handleOpenCustomRates(student: StudentRecord) {
    setCustomRateStudent(student);
    setHasCustomRates(Boolean(student.hasCustomCommissionRates));
    if (student.customCommissionRates && student.customCommissionRates.length > 0) {
      setCustomRatesInput(student.customCommissionRates);
    } else {
      // Seed with standard tier copies
      setCustomRatesInput(
        commissionTiers.map((t) => ({
          minFollowers: t.minFollowers,
          maxFollowers: t.maxFollowers,
          amount: t.amount,
          label: t.label,
        }))
      );
    }
  }

  async function handleSaveCustomRates(e: React.FormEvent) {
    e.preventDefault();
    if (!customRateStudent) return;
    setSavingCustomRates(true);
    setError("");
    setNotice("");
    try {
      const res = await fetch(`/api/admin/students/${customRateStudent._id}/commission-rates`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          hasCustomCommissionRates: hasCustomRates,
          customCommissionRates: hasCustomRates ? customRatesInput : [],
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to update custom rates.");

      setNotice(`Custom rates for ${customRateStudent.name} saved.`);
      setCustomRateStudent(null);
      fetchStudents();
      setTimeout(() => setNotice(""), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error saving custom commission rates.");
    } finally {
      setSavingCustomRates(false);
    }
  }

  // Handle Payment Creation
  function handleOpenPaymentModal(student?: StudentRecord) {
    if (student) {
      setSelectedStudentForPayment(student);
      setPaymentAmount(String(student.pendingPayment || ""));
    } else if (students.length > 0) {
      setSelectedStudentForPayment(students[0]);
      setPaymentAmount(String(students[0].pendingPayment || ""));
    }
    setPaymentDate(new Date().toISOString().split("T")[0]);
    setPaymentMethod("UPI");
    setPaymentReference("");
    setPaymentNote("");
    setPaymentStatusChoice("paid");
    setCreatePaymentModalOpen(true);
  }

  async function handleCreatePayment(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedStudentForPayment) return;

    const amt = Number(paymentAmount);
    if (!amt || amt <= 0) {
      setError("Please enter a valid payment amount greater than 0.");
      return;
    }

    setPaymentSubmitting(true);
    setError("");
    setNotice("");
    try {
      const res = await fetch("/api/admin/students/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          studentId: selectedStudentForPayment._id,
          amount: amt,
          paymentDate,
          paymentMethod,
          transactionReference: paymentReference.trim() || undefined,
          internalNote: paymentNote.trim() || undefined,
          status: paymentStatusChoice,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to create payment.");

      setNotice(data.message || "Payment created successfully.");
      setCreatePaymentModalOpen(false);
      fetchPayments();
      fetchStudents();
      setTimeout(() => setNotice(""), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error creating payment.");
    } finally {
      setPaymentSubmitting(false);
    }
  }

  async function handleUpdatePaymentStatus(
    paymentId: string,
    nextStatus: "pending" | "processing" | "paid" | "rejected"
  ) {
    setError("");
    setNotice("");
    try {
      const res = await fetch(`/api/admin/students/payments/${paymentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to update payment status.");

      setNotice(`Payment marked as ${nextStatus}.`);
      fetchPayments();
      fetchStudents();
      setTimeout(() => setNotice(""), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error updating payment status.");
    }
  }

  // Handle Certificate Issue
  function handleOpenCertificateModal(student?: StudentRecord) {
    if (student) {
      setCertTargetStudent(student);
    } else if (students.length > 0) {
      setCertTargetStudent(students[0]);
    }
    setCertTitle("Certificate of Campus Ambassador Excellence");
    setCertIdInput(`ARCL-CERT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
    setCertIssueDate(new Date().toISOString().split("T")[0]);
    setCertDescription("");
    setCertFile(null);
    setIssueCertModalOpen(true);
  }

  async function handleIssueCertificate(e: React.FormEvent) {
    e.preventDefault();
    if (!certTargetStudent) {
      setError("Please select a student.");
      return;
    }
    if (!certFile) {
      setError("Please select a certificate file (PDF, JPG, or PNG).");
      return;
    }

    setCertUploading(true);
    setError("");
    setNotice("");

    try {
      // Step 1: Upload file
      const uploadData = new FormData();
      uploadData.append("file", certFile);

      const uploadRes = await fetch("/api/admin/students/certificates/upload", {
        method: "POST",
        credentials: "same-origin",
        body: uploadData,
      });
      const uploadJson = await uploadRes.json();
      if (!uploadRes.ok || !uploadJson.success) {
        throw new Error(uploadJson.message || "Failed to upload certificate file.");
      }

      const { fileUrl, fileName, fileType, fileSize } = uploadJson.data;

      // Step 2: Create certificate record
      const certRes = await fetch("/api/admin/students/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          studentId: certTargetStudent._id,
          certificateId: certIdInput.trim().toUpperCase(),
          title: certTitle.trim(),
          description: certDescription.trim() || undefined,
          issueDate: certIssueDate,
          fileUrl,
          fileName,
          fileType,
          fileSize,
          status: "published",
        }),
      });
      const certJson = await certRes.json();
      if (!certRes.ok || !certJson.success) {
        throw new Error(certJson.message || "Failed to save certificate record.");
      }

      setNotice(`Certificate ${certIdInput} assigned to ${certTargetStudent.name}.`);
      setIssueCertModalOpen(false);
      fetchCertificates();
      setTimeout(() => setNotice(""), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error issuing certificate.");
    } finally {
      setCertUploading(false);
    }
  }

  async function handleToggleCertificateStatus(certId: string, currentStatus: "published" | "revoked") {
    const nextStatus = currentStatus === "published" ? "revoked" : "published";
    setError("");
    setNotice("");
    try {
      const res = await fetch(`/api/admin/students/certificates/${certId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to change certificate status.");

      setNotice(`Certificate status is now ${nextStatus}.`);
      fetchCertificates();
      setTimeout(() => setNotice(""), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error changing certificate status.");
    }
  }

  // Handle Admin Support Reply
  async function handleAdminReply(e: React.FormEvent) {
    e.preventDefault();
    if (!activeTicket || !adminReplyText.trim()) return;

    setAdminReplySubmitting(true);
    setError("");
    setNotice("");
    try {
      const res = await fetch(`/api/admin/students/support/${activeTicket._id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          message: adminReplyText.trim(),
          status: adminReplyStatus,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to reply to ticket.");

      setNotice(`Reply sent on ticket ${activeTicket.ticketNumber}.`);
      setActiveTicket(data.data);
      setAdminReplyText("");
      fetchTickets();
      setTimeout(() => setNotice(""), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error sending reply.");
    } finally {
      setAdminReplySubmitting(false);
    }
  }

  async function handleAdminTicketStatusChange(
    ticketId: string,
    newStatus: "open" | "in_progress" | "resolved" | "closed"
  ) {
    try {
      const res = await fetch(`/api/admin/students/support/${ticketId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to change ticket status.");

      if (activeTicket && activeTicket._id === ticketId) {
        setActiveTicket(data.data);
      }
      fetchTickets();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error updating ticket status.");
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
      {/* Page Header */}
      <div className="admin-page-heading">
        <div>
          <span className="admin-eyebrow">CAMPUS AMBASSADORS</span>
          <h1>Student Management</h1>
          <p>
            Manage student ambassador accounts, performance metrics, referral approvals, commissions, payments, and certificates.
          </p>
        </div>

        <div className="admin-heading-actions">
          {activeTab === "students" && (
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="admin-button"
            >
              <Plus size={15} />
              <span>Create student account</span>
            </button>
          )}

          {activeTab === "payments" && (
            <button
              type="button"
              onClick={() => handleOpenPaymentModal()}
              className="admin-button"
            >
              <Plus size={15} />
              <span>Record student payment</span>
            </button>
          )}

          {activeTab === "certificates" && (
            <button
              type="button"
              onClick={() => handleOpenCertificateModal()}
              className="admin-button"
            >
              <Upload size={15} />
              <span>Issue & assign certificate</span>
            </button>
          )}
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

      {/* Navigation Tabs (All 7 Sections) */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          overflowX: "auto",
          paddingBottom: "4px",
          borderBottom: "1px solid var(--admin-line)",
        }}
      >
        {[
          { id: "students" as const, label: "Student Ambassadors", icon: Users, count: studentStats.totalStudents },
          { id: "performance" as const, label: "Student Performance", icon: TrendingUp },
          { id: "referrals" as const, label: "Referred Creators", icon: UserCheck, count: referralStats.pendingCount, alert: referralStats.pendingCount > 0 },
          { id: "commissions" as const, label: "Commission Management", icon: Coins },
          { id: "payments" as const, label: "Payment Management", icon: Receipt },
          { id: "certificates" as const, label: "Certificates", icon: Award },
          { id: "support" as const, label: "Support Tickets", icon: MessageSquare, count: ticketStats.open, alert: ticketStats.open > 0 },
        ].map((tab) => {
          const active = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 14px",
                borderRadius: "6px",
                fontSize: "11.5px",
                fontWeight: active ? "650" : "500",
                color: active ? "#ffffff" : "#666660",
                background: active ? "var(--admin-black)" : "transparent",
                border: "none",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.15s ease",
              }}
            >
              <Icon size={14} style={{ color: active ? "#ffffff" : "#999990" }} />
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  style={{
                    padding: "1px 6px",
                    borderRadius: "999px",
                    fontSize: "9.5px",
                    fontWeight: "700",
                    background: active
                      ? (tab.alert ? "#ff5c5c" : "rgba(255,255,255,0.2)")
                      : (tab.alert ? "#ffebee" : "#ebebeb"),
                    color: active ? "#ffffff" : (tab.alert ? "#d32f2f" : "#444"),
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: STUDENT AMBASSADORS                                          */}
      {/* ==================================================================== */}
      {activeTab === "students" && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <section className="admin-kpi-grid" aria-label="Student metrics">
            <article className="admin-kpi-card">
              <span className="admin-kpi-icon admin-tone-violet"><Users size={18} /></span>
              <span className="admin-kpi-label">Total students</span>
              <b className="admin-kpi-value">{studentStats.totalStudents}</b>
              <span className="admin-kpi-sub">Onboarded ambassadors</span>
            </article>
            <article className="admin-kpi-card">
              <span className="admin-kpi-icon admin-tone-green"><UserCheck size={18} /></span>
              <span className="admin-kpi-label">Active accounts</span>
              <b className="admin-kpi-value">{studentStats.activeStudents}</b>
              <span className="admin-kpi-sub">Permitted to refer creators</span>
            </article>
            <article className="admin-kpi-card">
              <span className="admin-kpi-icon admin-tone-amber"><TrendingUp size={18} /></span>
              <span className="admin-kpi-label">Total referrals</span>
              <b className="admin-kpi-value">{studentStats.totalReferrals}</b>
              <span className="admin-kpi-sub">Creator applications submitted</span>
            </article>
            <article className="admin-kpi-card">
              <span className="admin-kpi-icon admin-tone-blue"><UserX size={18} /></span>
              <span className="admin-kpi-label">Deactivated</span>
              <b className="admin-kpi-value">{studentStats.deactivatedStudents}</b>
              <span className="admin-kpi-sub">Paused accounts</span>
            </article>
          </section>

          {/* Search & Filters */}
          <div className="admin-toolbar">
            <label className="admin-search">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search by name, student ID, code, or email…"
                value={studentSearch}
                onChange={(e) => {
                  setStudentSearch(e.target.value);
                  setStudentPage(1);
                }}
                aria-label="Search students"
              />
            </label>

            <label className="admin-filter-control">
              <span>Status</span>
              <select
                value={studentStatusFilter}
                onChange={(e) => {
                  setStudentStatusFilter(e.target.value);
                  setStudentPage(1);
                }}
              >
                <option value="">All statuses</option>
                <option value="active">Active</option>
                <option value="deactivated">Deactivated</option>
              </select>
            </label>
          </div>

          {/* Table */}
          <div className="admin-panel admin-table-panel">
            {studentLoading ? (
              <div className="admin-table-skeleton">
                <div style={{ textAlign: "center", padding: "30px 0", color: "var(--admin-muted)", fontSize: "11px" }}>
                  Loading students…
                </div>
              </div>
            ) : students.length === 0 ? (
              <div className="admin-empty-state">
                <span className="admin-empty-icon"><Search size={20} /></span>
                <b>No students found</b>
                <p>
                  {studentSearch || studentStatusFilter
                    ? "Try changing your search query or status filter."
                    : "Click 'Create student account' to register your first ambassador."}
                </p>
                <button type="button" className="admin-button" onClick={handleOpenCreateModal}>
                  <Plus size={15} /> Create student account
                </button>
              </div>
            ) : (
              <div className="admin-table-scroll">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Student ID</th>
                      <th>Referral Code</th>
                      <th>Status</th>
                      <th>Referrals</th>
                      <th>Earnings / Pending</th>
                      <th className="admin-actions-head">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr key={student._id}>
                        <td>
                          <div style={{ fontWeight: "650", color: "var(--admin-ink)" }}>{student.name}</div>
                          <div style={{ fontSize: "10.5px", color: "var(--admin-muted)" }}>{student.email}</div>
                        </td>
                        <td>
                          <span style={{ fontFamily: "monospace", fontWeight: "700" }}>{student.studentId}</span>
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(student.referralCode, student._id)}
                            className="admin-button admin-button-secondary"
                            style={{ minHeight: "26px", padding: "0 8px", fontSize: "10.5px", fontFamily: "monospace" }}
                            title="Click to copy referral code"
                          >
                            <span>{student.referralCode}</span>
                            {copiedKey === student._id ? <Check size={11} /> : <Copy size={11} />}
                          </button>
                        </td>
                        <td>
                          <span
                            className={`admin-status-pill admin-status-${
                              student.status === "active" ? "approved" : "rejected"
                            }`}
                          >
                            {student.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: "600" }}>{student.totalCreatorsReferred} total</div>
                          <small style={{ color: "var(--admin-muted)", fontSize: "9.5px" }}>
                            {student.verifiedCreators} verified · {student.pendingVerification} pending
                          </small>
                        </td>
                        <td>
                          <div style={{ fontWeight: "700" }}>
                            ₹{(student.totalEarnings || 0).toLocaleString()}
                          </div>
                          <small style={{ color: "#a2701f", fontSize: "9.5px", fontWeight: "600" }}>
                            Pending: ₹{(student.pendingPayment ?? Math.max(0, (student.totalEarnings || 0) - (student.paidAmount || 0))).toLocaleString()}
                          </small>
                        </td>
                        <td>
                          <div className="admin-row-actions">
                            <button
                              type="button"
                              onClick={() => handleOpenCustomRates(student)}
                              title="Set custom commission rates"
                              className="admin-icon-button"
                              aria-label="Set custom commission rates"
                            >
                              <Coins size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenPaymentModal(student)}
                              title="Record payment"
                              className="admin-icon-button"
                              aria-label="Record payment"
                            >
                              <Receipt size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenCertificateModal(student)}
                              title="Issue certificate"
                              className="admin-icon-button"
                              aria-label="Issue certificate"
                            >
                              <Award size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(student)}
                              title="Edit student"
                              className="admin-icon-button"
                              aria-label="Edit student"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(student)}
                              title={student.status === "active" ? "Deactivate account" : "Activate account"}
                              className={`admin-icon-button ${student.status === "active" ? "admin-delete-button" : ""}`}
                              aria-label={student.status === "active" ? "Deactivate account" : "Activate account"}
                            >
                              {student.status === "active" ? <UserX size={14} /> : <UserCheck size={14} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: STUDENT PERFORMANCE                                          */}
      {/* ==================================================================== */}
      {activeTab === "performance" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Summary KPIs */}
          <section className="admin-kpi-grid" aria-label="Performance metrics">
            <article className="admin-kpi-card">
              <span className="admin-kpi-icon admin-tone-violet"><Users size={18} /></span>
              <span className="admin-kpi-label">Active ambassadors</span>
              <b className="admin-kpi-value">
                {performanceSummary.activeCount} / {performanceSummary.allStudentsCount}
              </b>
              <span className="admin-kpi-sub">Onboarded student accounts</span>
            </article>

            <article className="admin-kpi-card">
              <span className="admin-kpi-icon admin-tone-green"><TrendingUp size={18} /></span>
              <span className="admin-kpi-label">Rankings sort</span>
              <b className="admin-kpi-value" style={{ textTransform: "capitalize" }}>
                {performanceSortBy.replace("_", " ")}
              </b>
              <span className="admin-kpi-sub">Real-time verified records</span>
            </article>

            <article className="admin-kpi-card">
              <span className="admin-kpi-icon admin-tone-amber"><Filter size={18} /></span>
              <span className="admin-kpi-label">Account filter</span>
              <b className="admin-kpi-value">
                {performanceStatusFilter ? `${performanceStatusFilter}` : "All"}
              </b>
              <span className="admin-kpi-sub">Filtered by account active status</span>
            </article>
          </section>

          {/* Controls: Search & Filters */}
          <div className="admin-toolbar">
            <label className="admin-search">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search students by name, email, or student ID…"
                value={performanceSearch}
                onChange={(e) => setPerformanceSearch(e.target.value)}
                aria-label="Search performance"
              />
            </label>

            <label className="admin-filter-control">
              <span>Account</span>
              <select
                value={performanceStatusFilter}
                onChange={(e) => setPerformanceStatusFilter(e.target.value)}
              >
                <option value="">All accounts</option>
                <option value="active">Active students</option>
                <option value="deactivated">Inactive students</option>
              </select>
            </label>

            <label className="admin-filter-control">
              <span>Sort by</span>
              <select
                value={performanceSortBy}
                onChange={(e) => setPerformanceSortBy(e.target.value)}
              >
                <option value="recent">Recently Added</option>
                <option value="verified">Highest Verified Creators</option>
                <option value="earnings">Highest Earnings</option>
                <option value="referred">Highest Total Referred</option>
              </select>
            </label>
          </div>

          {/* Performance Table */}
          <div className="admin-panel admin-table-panel">
            {performanceLoading ? (
              <div className="admin-table-skeleton">
                <div style={{ textAlign: "center", padding: "30px 0", color: "var(--admin-muted)", fontSize: "11px" }}>
                  Loading performance data…
                </div>
              </div>
            ) : performanceItems.length === 0 ? (
              <div className="admin-empty-state">
                <span className="admin-empty-icon"><Search size={20} /></span>
                <b>No performance records found</b>
                <p>Try modifying your search query or sorting options.</p>
              </div>
            ) : (
              <div className="admin-table-scroll">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Student Name & ID</th>
                      <th>Referral Code</th>
                      <th>Referred</th>
                      <th>Verified</th>
                      <th>Pending</th>
                      <th>Rejected</th>
                      <th>Commission Earned</th>
                      <th>Amount Paid</th>
                      <th>Pending Payment</th>
                      <th>Status</th>
                      <th className="admin-actions-head">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {performanceItems.map((s) => (
                      <tr key={s._id}>
                        <td>
                          <div style={{ fontWeight: "650", color: "var(--admin-ink)" }}>{s.name}</div>
                          <div style={{ fontSize: "10px", color: "var(--admin-muted)", fontFamily: "monospace" }}>
                            ID: {s.studentId}
                          </div>
                        </td>
                        <td>
                          <span style={{ fontFamily: "monospace", fontWeight: "700" }}>{s.referralCode}</span>
                        </td>
                        <td>
                          <b>{s.totalCreatorsReferred}</b>
                        </td>
                        <td>
                          <span className="admin-status-pill admin-status-approved">
                            {s.verifiedCreators} verified
                          </span>
                        </td>
                        <td>
                          <span style={{ color: "#a2701f", fontWeight: "600" }}>{s.pendingVerification}</span>
                        </td>
                        <td>
                          <span style={{ color: "var(--admin-muted)" }}>{s.rejectedCreators}</span>
                        </td>
                        <td>
                          <div style={{ fontWeight: "700" }}>₹{s.totalCommissionEarned.toLocaleString()}</div>
                        </td>
                        <td>
                          <div style={{ fontWeight: "700", color: "#15845f" }}>₹{s.totalAmountPaid.toLocaleString()}</div>
                        </td>
                        <td>
                          <span style={{ color: "#a2701f", fontWeight: "700" }}>₹{s.pendingPayment.toLocaleString()}</span>
                        </td>
                        <td>
                          <span
                            className={`admin-status-pill admin-status-${
                              s.status === "active" ? "approved" : "rejected"
                            }`}
                          >
                            {s.status === "active" ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td>
                          <div className="admin-row-actions">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveTab("payments");
                                setPaymentSearch(s.studentId);
                              }}
                              className="admin-button admin-button-secondary"
                              style={{ minHeight: "26px", padding: "0 8px", fontSize: "10.5px" }}
                            >
                              View payouts
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: REFERRED CREATORS & VERIFICATION                             */}
      {/* ==================================================================== */}
      {activeTab === "referrals" && (
        <div className="space-y-6">
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
              <span className="text-gray-500 text-[11px] font-semibold block">Total Referrals</span>
              <div className="text-2xl font-bold text-gray-900 mt-1">{referralStats.totalCount}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
              <span className="text-gray-500 text-[11px] font-semibold block">Pending Review</span>
              <div className="text-2xl font-bold text-amber-600 mt-1">{referralStats.pendingCount}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
              <span className="text-gray-500 text-[11px] font-semibold block">Verified Creators</span>
              <div className="text-2xl font-bold text-emerald-600 mt-1">{referralStats.verifiedCount}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
              <span className="text-gray-500 text-[11px] font-semibold block">Rejected</span>
              <div className="text-2xl font-bold text-rose-600 mt-1">{referralStats.rejectedCount}</div>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search creator handle, student, or code…"
                value={referralSearch}
                onChange={(e) => setReferralSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#7459d2]"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={referralStatusFilter}
                onChange={(e) => setReferralStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white text-gray-700"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending Verification</option>
                <option value="verified">Verified</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {/* Referrals Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
            {referralLoading ? (
              <div className="py-16 text-center text-gray-400 text-xs">Loading referrals…</div>
            ) : referrals.length === 0 ? (
              <div className="py-16 text-center text-gray-400 text-xs">No referrals found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider text-[10px] font-bold">
                      <th className="py-3 px-4">Creator</th>
                      <th className="py-3 px-4">Referring Student</th>
                      <th className="py-3 px-4">Followers</th>
                      <th className="py-3 px-4">Registration Date</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Commission</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {referrals.map((ref) => (
                      <tr key={ref._id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-gray-900">{ref.creatorName}</div>
                          <div className="text-[#7459d2] font-mono text-[11px] flex items-center gap-1 mt-0.5">
                            <InstagramIcon size={11} />
                            <span>@{ref.creatorHandle}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          {ref.student ? (
                            <div>
                              <div className="font-semibold text-gray-900">{ref.student.name}</div>
                              <div className="text-[10px] text-gray-400 font-mono">
                                ID: {ref.student.studentId} • Code: {ref.student.referralCode}
                              </div>
                            </div>
                          ) : (
                            <span className="font-mono text-gray-400">{ref.referralCode || "—"}</span>
                          )}
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
                        <td className="py-3.5 px-4 text-gray-500 whitespace-nowrap">
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
                              <span>Pending Review</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-gray-900">
                            ₹{ref.status === "verified" ? ref.commissionEarned : (ref.estimatedCommission || 0)}
                          </div>
                          <div className="text-[10px] text-gray-400">
                            {ref.commissionTierLabel || ref.applicableTier || "—"}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {ref.status === "pending" ? (
                              <>
                                <button
                                  onClick={() => handleOpenVerifyModal(ref)}
                                  className="px-2.5 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded transition-colors"
                                >
                                  Verify
                                </button>
                                <button
                                  onClick={() => {
                                    setRejectTarget(ref);
                                    setRejectReason("");
                                  }}
                                  className="px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded border border-rose-200 transition-colors"
                                >
                                  Reject
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => setAuditTarget(ref)}
                                className="px-2.5 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded border border-gray-200 transition-colors"
                              >
                                Audit Log
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 4: COMMISSION MANAGEMENT                                        */}
      {/* ==================================================================== */}
      {activeTab === "commissions" && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-900">Default Follower-Based Commission Tiers</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Set baseline commission rates rewarded to student ambassadors upon creator verification.
                </p>
              </div>
              <button
                onClick={handleSaveCommissionTiers}
                disabled={savingCommissions}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#7459d2] hover:bg-[#6247bf] rounded-lg transition-colors shadow-xs disabled:opacity-50"
              >
                <Save size={14} />
                <span>{savingCommissions ? "Saving Rates…" : "Save Commission Rates"}</span>
              </button>
            </div>

            <form onSubmit={handleSaveCommissionTiers} className="mt-6">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider text-[10px] font-bold">
                      <th className="py-3 px-4">Tier Key</th>
                      <th className="py-3 px-4">Follower Range Label</th>
                      <th className="py-3 px-4">Min Followers</th>
                      <th className="py-3 px-4">Max Followers</th>
                      <th className="py-3 px-4">Commission Rate (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {commissionTiers.map((tier, idx) => (
                      <tr key={tier.tierKey} className="hover:bg-gray-50/50">
                        <td className="py-3 px-4 font-mono text-gray-500">{tier.tierKey}</td>
                        <td className="py-3 px-4 font-semibold text-gray-900">{tier.label}</td>
                        <td className="py-3 px-4 font-mono">{tier.minFollowers.toLocaleString()}</td>
                        <td className="py-3 px-4 font-mono">
                          {tier.maxFollowers ? tier.maxFollowers.toLocaleString() : "Unlimited (500K+)"}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            <span className="font-bold text-gray-500">₹</span>
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={tier.amount}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setCommissionTiers((prev) =>
                                  prev.map((item, i) => (i === idx ? { ...item, amount: val } : item))
                                );
                              }}
                              className="w-24 px-2.5 py-1 border border-gray-300 rounded font-bold text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#7459d2]"
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 5: PAYMENT MANAGEMENT                                           */}
      {/* ==================================================================== */}
      {activeTab === "payments" && (
        <div className="space-y-6">
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
              <span className="text-gray-500 text-[11px] font-semibold block">Total Approved Commissions</span>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                ₹{paymentStats.totalApprovedCommissions.toLocaleString()}
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
              <span className="text-gray-500 text-[11px] font-semibold block">Total Amount Paid</span>
              <div className="text-2xl font-bold text-emerald-600 mt-1">
                ₹{paymentStats.totalPaid.toLocaleString()}
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
              <span className="text-gray-500 text-[11px] font-semibold block">Pending Balance</span>
              <div className="text-2xl font-bold text-amber-600 mt-1">
                ₹{paymentStats.totalPendingBalance.toLocaleString()}
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
              <span className="text-gray-500 text-[11px] font-semibold block">Payment Records</span>
              <div className="text-2xl font-bold text-[#7459d2] mt-1">{paymentStats.totalPaymentsCount}</div>
            </div>
          </div>

          {/* Search & Status Filter */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search payments by student, UTR, or note…"
                value={paymentSearch}
                onChange={(e) => setPaymentSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#7459d2]"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white text-gray-700"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="paid">Paid</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {/* Payments Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
            {paymentLoading ? (
              <div className="py-16 text-center text-gray-400 text-xs">Loading payment records…</div>
            ) : payments.length === 0 ? (
              <div className="py-16 text-center text-gray-400 text-xs">No payment records found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider text-[10px] font-bold">
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Payment Date</th>
                      <th className="py-3 px-4">Method</th>
                      <th className="py-3 px-4">Reference / UTR</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Note</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {payments.map((p) => (
                      <tr key={p._id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-gray-900">{p.student?.name || "Ambassador"}</div>
                          <div className="text-[10px] text-gray-400 font-mono">
                            ID: {p.student?.studentId} • Code: {p.student?.referralCode}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-extrabold text-gray-900 whitespace-nowrap">
                          ₹{p.amount.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-gray-600 whitespace-nowrap">
                          {new Date(p.paymentDate).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-700">
                            {p.paymentMethod}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-gray-700">
                          {p.transactionReference ? (
                            <span className="bg-purple-50 text-[#6247bf] px-2 py-0.5 rounded border border-purple-100">
                              {p.transactionReference}
                            </span>
                          ) : (
                            <span className="text-gray-400 italic">None</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {p.status === "paid" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 size={11} />
                              <span>Paid</span>
                            </span>
                          ) : p.status === "processing" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                              <Clock size={11} />
                              <span>Processing</span>
                            </span>
                          ) : p.status === "rejected" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              <XCircle size={11} />
                              <span>Rejected</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock size={11} />
                              <span>Pending</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-gray-500 max-w-xs truncate text-[11px]">
                          {p.internalNote || <span className="text-gray-300">—</span>}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {p.status !== "paid" && (
                              <button
                                onClick={() => handleUpdatePaymentStatus(p._id, "paid")}
                                className="px-2 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200"
                              >
                                Mark Paid
                              </button>
                            )}
                            {p.status === "pending" && (
                              <button
                                onClick={() => handleUpdatePaymentStatus(p._id, "processing")}
                                className="px-2 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200"
                              >
                                Processing
                              </button>
                            )}
                            {p.status !== "rejected" && (
                              <button
                                onClick={() => handleUpdatePaymentStatus(p._id, "rejected")}
                                className="px-2 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 rounded"
                              >
                                Reject
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 6: CERTIFICATE MANAGEMENT                                       */}
      {/* ==================================================================== */}
      {activeTab === "certificates" && (
        <div className="space-y-6">
          {/* Summary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
              <span className="text-gray-500 text-[11px] font-semibold block">Total Issued</span>
              <div className="text-2xl font-bold text-gray-900 mt-1">{certificateStats.total}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
              <span className="text-gray-500 text-[11px] font-semibold block">Published & Active</span>
              <div className="text-2xl font-bold text-emerald-600 mt-1">{certificateStats.published}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
              <span className="text-gray-500 text-[11px] font-semibold block">Revoked</span>
              <div className="text-2xl font-bold text-rose-600 mt-1">{certificateStats.revoked}</div>
            </div>
          </div>

          {/* Search & Status Filter */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search certificates by title, ID, or student…"
                value={certificateSearch}
                onChange={(e) => setCertificateSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#7459d2]"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={certificateStatusFilter}
                onChange={(e) => setCertificateStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white text-gray-700"
              >
                <option value="">All Statuses</option>
                <option value="published">Published</option>
                <option value="revoked">Revoked</option>
              </select>
            </div>
          </div>

          {/* Certificates Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
            {certificateLoading ? (
              <div className="py-16 text-center text-gray-400 text-xs">Loading certificates…</div>
            ) : certificates.length === 0 ? (
              <div className="py-16 text-center text-gray-400 text-xs">No certificates found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider text-[10px] font-bold">
                      <th className="py-3 px-4">Certificate ID</th>
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-4">Title</th>
                      <th className="py-3 px-4">Issue Date</th>
                      <th className="py-3 px-4">File</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {certificates.map((cert) => (
                      <tr key={cert._id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-[#6247bf]">
                          {cert.certificateId}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-gray-900">{cert.student?.name || "Student"}</div>
                          <div className="text-[10px] text-gray-400 font-mono">
                            {cert.student?.studentId} • {cert.student?.email}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-gray-900">{cert.title}</td>
                        <td className="py-3.5 px-4 text-gray-500 whitespace-nowrap">
                          {new Date(cert.issueDate).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                        <td className="py-3.5 px-4">
                          <a
                            href={cert.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[#7459d2] hover:underline font-medium text-[11px]"
                          >
                            <ExternalLink size={11} />
                            <span>Preview</span>
                          </a>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              cert.status === "published"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-rose-50 text-rose-700 border border-rose-200"
                            }`}
                          >
                            {cert.status === "published" ? "Published" : "Revoked"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleToggleCertificateStatus(cert._id, cert.status)}
                            className={`px-2.5 py-1 text-xs font-semibold rounded border transition-colors ${
                              cert.status === "published"
                                ? "text-rose-600 border-rose-200 hover:bg-rose-50"
                                : "text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                            }`}
                          >
                            {cert.status === "published" ? "Revoke" : "Publish"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 7: SUPPORT MANAGEMENT                                           */}
      {/* ==================================================================== */}
      {activeTab === "support" && (
        <div className="space-y-6">
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
              <span className="text-gray-500 text-[11px] font-semibold block">Total Tickets</span>
              <div className="text-2xl font-bold text-gray-900 mt-1">{ticketStats.total}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
              <span className="text-gray-500 text-[11px] font-semibold block">Open Tickets</span>
              <div className="text-2xl font-bold text-rose-600 mt-1">{ticketStats.open}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
              <span className="text-gray-500 text-[11px] font-semibold block">In Progress</span>
              <div className="text-2xl font-bold text-blue-600 mt-1">{ticketStats.inProgress}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
              <span className="text-gray-500 text-[11px] font-semibold block">Resolved</span>
              <div className="text-2xl font-bold text-emerald-600 mt-1">{ticketStats.resolved}</div>
            </div>
          </div>

          {/* Search & Status Filter */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search tickets by ID, student, or subject…"
                value={ticketSearch}
                onChange={(e) => setTicketSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#7459d2]"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={ticketStatusFilter}
                onChange={(e) => setTicketStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white text-gray-700"
              >
                <option value="">All Statuses</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>

          {/* Tickets Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
            {ticketLoading ? (
              <div className="py-16 text-center text-gray-400 text-xs">Loading tickets…</div>
            ) : tickets.length === 0 ? (
              <div className="py-16 text-center text-gray-400 text-xs">No tickets found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider text-[10px] font-bold">
                      <th className="py-3 px-4">Ticket ID</th>
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Subject</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Last Activity</th>
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
                          <div className="font-semibold text-gray-900">{t.studentName}</div>
                          <div className="text-[10px] text-gray-400 font-mono">
                            {t.studentId} • {t.studentEmail}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-700">
                            {t.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-gray-900 max-w-xs truncate">
                          {t.subject}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              t.status === "open"
                                ? "bg-rose-50 text-rose-700 border border-rose-200"
                                : t.status === "in_progress"
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : t.status === "resolved"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-gray-100 text-gray-600 border border-gray-200"
                            }`}
                          >
                            {t.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-gray-500 whitespace-nowrap text-[11px]">
                          {new Date(t.lastReplyAt || t.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => {
                              setActiveTicket(t);
                              setAdminReplyText("");
                              setAdminReplyStatus(t.status === "open" ? "in_progress" : t.status);
                            }}
                            className="px-2.5 py-1 text-xs font-semibold text-[#7459d2] hover:bg-purple-50 rounded border border-purple-200 transition-colors"
                          >
                            Open & Reply
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODALS                                                               */}
      {/* ==================================================================== */}

      {/* CREATE STUDENT MODAL */}
      {createModalOpen && (
        <AdminModalPortal>
          <div
            className="admin-modal-backdrop"
            role="presentation"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setCreateModalOpen(false);
            }}
          >
            <form className="admin-modal" onSubmit={handleCreateStudent}>
              <div className="admin-modal-heading">
                <div>
                  <span className="admin-eyebrow">NEW STUDENT ACCOUNT</span>
                  <h2>Create student account</h2>
                </div>
                <button
                  type="button"
                  className="admin-icon-button"
                  onClick={() => setCreateModalOpen(false)}
                  aria-label="Close dialog"
                >
                  <X size={18} />
                </button>
              </div>

              {createModalError && (
                <div className="admin-inline-error" style={{ marginBottom: "16px" }} role="alert">
                  <AlertCircle size={15} style={{ flexShrink: 0 }} />
                  <span>{createModalError}</span>
                </div>
              )}

              <div className="admin-form-grid">
                <label className="admin-form-field admin-field-wide">
                  <span>Student full name <i>*</i></span>
                  <input
                    type="text"
                    required
                    value={createName}
                    onChange={(e) => {
                      const newName = e.target.value;
                      setCreateName(newName);
                      if (!createReferralCode || createReferralCode.startsWith("ARCL")) {
                        setCreateReferralCode(generateReferralCode(newName));
                      }
                    }}
                    placeholder="e.g. Rahul Sharma"
                    autoFocus
                  />
                </label>

                <label className="admin-form-field admin-field-wide">
                  <span>Email address <i>*</i></span>
                  <input
                    type="email"
                    required
                    value={createEmail}
                    onChange={(e) => setCreateEmail(e.target.value)}
                    placeholder="student@university.edu"
                  />
                </label>

                <label className="admin-form-field">
                  <span>Student ID <i>*</i></span>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <input
                      type="text"
                      required
                      value={createStudentId}
                      onChange={(e) => setCreateStudentId(e.target.value.toUpperCase())}
                      style={{ fontFamily: "monospace", textTransform: "uppercase" }}
                    />
                    <button
                      type="button"
                      className="admin-button admin-button-secondary"
                      style={{ flexShrink: 0, padding: "0 10px" }}
                      onClick={() => setCreateStudentId(generateStudentId())}
                      title="Generate new ID"
                    >
                      <RefreshCw size={13} />
                    </button>
                  </div>
                  <small>Auto-generated campus ID (ARCL-STU-XXXX)</small>
                </label>

                <label className="admin-form-field">
                  <span>Referral code <i>*</i></span>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <input
                      type="text"
                      required
                      value={createReferralCode}
                      onChange={(e) => setCreateReferralCode(e.target.value.toUpperCase())}
                      style={{ fontFamily: "monospace", textTransform: "uppercase" }}
                    />
                    <button
                      type="button"
                      className="admin-button admin-button-secondary"
                      style={{ flexShrink: 0, padding: "0 10px" }}
                      onClick={() => setCreateReferralCode(generateReferralCode(createName))}
                      title="Generate new referral code"
                    >
                      <RefreshCw size={13} />
                    </button>
                  </div>
                  <small>Creators register via /join-as-creator/[CODE]</small>
                </label>

                <label className="admin-form-field admin-field-wide">
                  <span>Initial password <i>*</i></span>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <input
                      type="text"
                      required
                      value={createPassword}
                      onChange={(e) => setCreatePassword(e.target.value)}
                      style={{ fontFamily: "monospace" }}
                    />
                    <button
                      type="button"
                      className="admin-button admin-button-secondary"
                      style={{ flexShrink: 0, padding: "0 10px" }}
                      onClick={() =>
                        setCreatePassword("Student@" + Math.floor(1000 + Math.random() * 9000))
                      }
                      title="Generate new password"
                    >
                      <Key size={13} />
                    </button>
                  </div>
                  <small>Initial login credentials for the student portal</small>
                </label>

                <label className="admin-form-field">
                  <span>Phone / WhatsApp</span>
                  <input
                    type="tel"
                    value={createPhone}
                    onChange={(e) => setCreatePhone(e.target.value)}
                    placeholder="+91 98765 43210"
                  />
                </label>

                <label className="admin-form-field">
                  <span>Institution / College</span>
                  <input
                    type="text"
                    value={createInstitution}
                    onChange={(e) => setCreateInstitution(e.target.value)}
                    placeholder="e.g. Delhi University"
                  />
                </label>

                <label className="admin-form-field">
                  <span>Initial account status</span>
                  <select
                    value={createStatus}
                    onChange={(e) => setCreateStatus(e.target.value as "active" | "deactivated")}
                  >
                    <option value="active">Active (Can refer creators)</option>
                    <option value="deactivated">Deactivated</option>
                  </select>
                </label>

                <label className="admin-form-field admin-field-wide">
                  <span>Internal onboarding note (optional)</span>
                  <textarea
                    rows={2}
                    value={createNotes}
                    onChange={(e) => setCreateNotes(e.target.value)}
                    placeholder="Any onboarding remarks or ambassador specifics..."
                  />
                </label>
              </div>

              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="admin-button admin-button-secondary"
                  onClick={() => setCreateModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="admin-button" disabled={createSubmitting}>
                  {createSubmitting ? "Creating…" : "Create student account"}
                </button>
              </div>
            </form>
          </div>
        </AdminModalPortal>
      )}

      {/* EDIT STUDENT MODAL */}
      {editModalRecord && (
        <AdminModalPortal>
          <div
            className="admin-modal-backdrop"
            role="presentation"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setEditModalRecord(null);
            }}
          >
            <form className="admin-modal" onSubmit={handleSaveEdit}>
              <div className="admin-modal-heading">
                <div>
                  <span className="admin-eyebrow">UPDATE RECORD</span>
                  <h2>Edit student account</h2>
                </div>
                <button
                  type="button"
                  className="admin-icon-button"
                  onClick={() => setEditModalRecord(null)}
                  aria-label="Close dialog"
                >
                  <X size={18} />
                </button>
              </div>

              {editModalError && (
                <div className="admin-inline-error" style={{ marginBottom: "16px" }} role="alert">
                  <AlertCircle size={15} style={{ flexShrink: 0 }} />
                  <span>{editModalError}</span>
                </div>
              )}

              <div className="admin-form-grid">
                <label className="admin-form-field admin-field-wide">
                  <span>Student full name <i>*</i></span>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                </label>

                <label className="admin-form-field admin-field-wide">
                  <span>Email address <i>*</i></span>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                  />
                </label>

                <label className="admin-form-field">
                  <span>Student ID <i>*</i></span>
                  <input
                    type="text"
                    required
                    value={editStudentId}
                    onChange={(e) => setEditStudentId(e.target.value.toUpperCase())}
                    style={{ fontFamily: "monospace", textTransform: "uppercase" }}
                  />
                </label>

                <label className="admin-form-field">
                  <span>Referral code <i>*</i></span>
                  <input
                    type="text"
                    required
                    value={editReferralCode}
                    onChange={(e) => setEditReferralCode(e.target.value.toUpperCase())}
                    style={{ fontFamily: "monospace", textTransform: "uppercase" }}
                  />
                </label>

                <label className="admin-form-field">
                  <span>Phone / WhatsApp</span>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                  />
                </label>

                <label className="admin-form-field">
                  <span>Institution / College</span>
                  <input
                    type="text"
                    value={editInstitution}
                    onChange={(e) => setEditInstitution(e.target.value)}
                  />
                </label>

                <label className="admin-form-field">
                  <span>Account status</span>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as "active" | "deactivated")}
                  >
                    <option value="active">Active</option>
                    <option value="deactivated">Deactivated</option>
                  </select>
                </label>

                <label className="admin-form-field">
                  <span>Reset password (leave blank to keep current)</span>
                  <input
                    type="text"
                    placeholder="New password…"
                    value={editNewPassword}
                    onChange={(e) => setEditNewPassword(e.target.value)}
                    style={{ fontFamily: "monospace" }}
                  />
                </label>

                <label className="admin-form-field admin-field-wide">
                  <span>Admin notes</span>
                  <textarea
                    rows={2}
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                  />
                </label>
              </div>

              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="admin-button admin-button-secondary"
                  onClick={() => setEditModalRecord(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="admin-button" disabled={editSubmitting}>
                  {editSubmitting ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </AdminModalPortal>
      )}

      {/* VERIFY CREATOR MODAL */}
      {verifyTarget && (
        <AdminModalPortal>
          <div
            className="admin-modal-backdrop"
            role="presentation"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setVerifyTarget(null);
            }}
          >
            <form className="admin-modal" onSubmit={handleConfirmVerification}>
              <div className="admin-modal-heading">
                <div>
                  <span className="admin-eyebrow">REFERRAL VERIFICATION</span>
                  <h2>Verify creator referral</h2>
                </div>
                <button
                  type="button"
                  className="admin-icon-button"
                  onClick={() => setVerifyTarget(null)}
                  aria-label="Close dialog"
                >
                  <X size={18} />
                </button>
              </div>

              <div
                style={{
                  padding: "12px 14px",
                  background: "#fafaf6",
                  border: "1px solid var(--admin-line)",
                  borderRadius: "6px",
                  marginBottom: "16px",
                }}
              >
                <b style={{ display: "block", color: "var(--admin-ink)", fontSize: "12px" }}>
                  {verifyTarget.creatorName}
                </b>
                <span style={{ fontFamily: "monospace", fontSize: "11px", color: "var(--admin-muted)" }}>
                  @{verifyTarget.creatorHandle}
                </span>
                <div style={{ marginTop: "4px", fontSize: "10.5px", color: "var(--admin-muted)" }}>
                  Referred by:{" "}
                  <b style={{ color: "var(--admin-ink)" }}>
                    {verifyTarget.student?.name || "Ambassador"}
                  </b>{" "}
                  (Code: {verifyTarget.referralCode || verifyTarget.student?.referralCode})
                </div>
              </div>

              <div className="admin-form-grid">
                <label className="admin-form-field">
                  <span>Confirmed followers count <i>*</i></span>
                  <input
                    type="number"
                    required
                    min="0"
                    value={verifyConfirmedFollowers}
                    onChange={(e) => setVerifyConfirmedFollowers(Number(e.target.value))}
                    style={{ fontWeight: "700" }}
                  />
                  <small>Followers verified on Instagram</small>
                </label>

                <label className="admin-form-field">
                  <span>Manual commission override (₹)</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="Leave blank for automatic tier"
                    value={verifyOverrideAmount}
                    onChange={(e) => setVerifyOverrideAmount(e.target.value)}
                  />
                  <small>Default tier rules apply if blank</small>
                </label>

                <label className="admin-form-field admin-field-wide">
                  <span>Internal note (optional)</span>
                  <textarea
                    rows={2}
                    placeholder="Verification notes or Instagram audit remarks..."
                    value={verifyNotes}
                    onChange={(e) => setVerifyNotes(e.target.value)}
                  />
                </label>
              </div>

              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="admin-button admin-button-secondary"
                  onClick={() => setVerifyTarget(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="admin-button" disabled={verifySubmitting}>
                  {verifySubmitting ? "Verifying…" : "Confirm verification & approve"}
                </button>
              </div>
            </form>
          </div>
        </AdminModalPortal>
      )}

      {/* REJECT CREATOR MODAL */}
      {rejectTarget && (
        <AdminModalPortal>
          <div
            className="admin-modal-backdrop"
            role="presentation"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setRejectTarget(null);
            }}
          >
            <form className="admin-modal" onSubmit={handleConfirmRejection}>
              <div className="admin-modal-heading">
                <div>
                  <span className="admin-eyebrow">REFERRAL REJECTION</span>
                  <h2>Reject creator referral</h2>
                </div>
                <button
                  type="button"
                  className="admin-icon-button"
                  onClick={() => setRejectTarget(null)}
                  aria-label="Close dialog"
                >
                  <X size={18} />
                </button>
              </div>

              <p className="admin-muted" style={{ marginBottom: "14px" }}>
                Are you sure you want to reject @{rejectTarget.creatorHandle}? This will set their
                status to rejected and no commission will be credited to{" "}
                {rejectTarget.student?.name ?? "the student"}.
              </p>

              <div className="admin-form-grid">
                <label className="admin-form-field admin-field-wide">
                  <span>Reason for rejection <i>*</i></span>
                  <textarea
                    rows={3}
                    required
                    placeholder="e.g. Ineligible follower metrics, inactive account, duplicate submission..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                  />
                </label>
              </div>

              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="admin-button admin-button-secondary"
                  onClick={() => setRejectTarget(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-button admin-button-danger"
                  disabled={rejectSubmitting}
                >
                  {rejectSubmitting ? "Rejecting…" : "Confirm rejection"}
                </button>
              </div>
            </form>
          </div>
        </AdminModalPortal>
      )}

      {/* AUDIT LOG MODAL */}
      {auditTarget && (
        <AdminModalPortal>
          <div
            className="admin-modal-backdrop"
            role="presentation"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setAuditTarget(null);
            }}
          >
            <div className="admin-modal">
              <div className="admin-modal-heading">
                <div>
                  <span className="admin-eyebrow">AUDIT TRAIL</span>
                  <h2>Referral audit history</h2>
                  <p className="admin-muted" style={{ margin: "4px 0 0", fontFamily: "monospace" }}>
                    @{auditTarget.creatorHandle}
                  </p>
                </div>
                <button
                  type="button"
                  className="admin-icon-button"
                  onClick={() => setAuditTarget(null)}
                  aria-label="Close dialog"
                >
                  <X size={18} />
                </button>
              </div>

              <div style={{ maxHeight: "360px", overflowY: "auto", margin: "16px 0" }}>
                {auditTarget.auditLog && auditTarget.auditLog.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {auditTarget.auditLog.map((log, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: "10px 12px",
                          border: "1px solid var(--admin-line)",
                          borderRadius: "6px",
                          background: "#fafaf6",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "4px",
                          }}
                        >
                          <b style={{ fontSize: "11px", color: "var(--admin-ink)" }}>{log.action}</b>
                          <small style={{ fontSize: "9px", color: "var(--admin-muted)" }}>
                            {new Date(log.timestamp).toLocaleString()}
                          </small>
                        </div>
                        <p style={{ margin: 0, fontSize: "10.5px", color: "#555" }}>{log.details}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="admin-muted" style={{ textAlign: "center", padding: "24px 0" }}>
                    No audit records recorded yet.
                  </p>
                )}
              </div>

              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="admin-button"
                  onClick={() => setAuditTarget(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </AdminModalPortal>
      )}

      {/* CUSTOM RATES MODAL FOR INDIVIDUAL STUDENT */}
      {customRateStudent && (
        <AdminModalPortal>
          <div
            className="admin-modal-backdrop"
            role="presentation"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setCustomRateStudent(null);
            }}
          >
            <form className="admin-modal" onSubmit={handleSaveCustomRates}>
              <div className="admin-modal-heading">
                <div>
                  <span className="admin-eyebrow">COMMISSION OVERRIDE</span>
                  <h2>Custom commission rates</h2>
                  <p className="admin-muted" style={{ margin: "4px 0 0" }}>
                    {customRateStudent.name} ({customRateStudent.studentId})
                  </p>
                </div>
                <button
                  type="button"
                  className="admin-icon-button"
                  onClick={() => setCustomRateStudent(null)}
                  aria-label="Close dialog"
                >
                  <X size={18} />
                </button>
              </div>

              <div style={{ margin: "16px 0" }}>
                <label className="admin-checkbox-row" style={{ cursor: "pointer", marginBottom: "14px" }}>
                  <input
                    type="checkbox"
                    id="enableCustom"
                    checked={hasCustomRates}
                    onChange={(e) => setHasCustomRates(e.target.checked)}
                  />
                  <b>Enable custom commission rates for this student</b>
                </label>

                {hasCustomRates && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <span
                      style={{
                        fontSize: "9.5px",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: "var(--admin-muted)",
                        fontWeight: "600",
                      }}
                    >
                      Tier Amounts (₹)
                    </span>
                    {customRatesInput.map((tier, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "8px 12px",
                          border: "1px solid var(--admin-line)",
                          borderRadius: "6px",
                          background: "#fafaf6",
                        }}
                      >
                        <b style={{ fontSize: "11px", color: "var(--admin-ink)" }}>{tier.label}</b>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span>₹</span>
                          <input
                            type="number"
                            min="0"
                            value={tier.amount}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setCustomRatesInput((prev) =>
                                prev.map((t, i) => (i === idx ? { ...t, amount: val } : t))
                              );
                            }}
                            style={{
                              width: "80px",
                              padding: "4px 8px",
                              border: "1px solid var(--admin-line)",
                              borderRadius: "4px",
                              fontWeight: "700",
                              textAlign: "right",
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="admin-button admin-button-secondary"
                  onClick={() => setCustomRateStudent(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="admin-button" disabled={savingCustomRates}>
                  {savingCustomRates ? "Saving…" : "Save custom rates"}
                </button>
              </div>
            </form>
          </div>
        </AdminModalPortal>
      )}

      {/* CREATE PAYMENT MODAL */}
      {createPaymentModalOpen && (
        <AdminModalPortal>
          <div
            className="admin-modal-backdrop"
            role="presentation"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setCreatePaymentModalOpen(false);
            }}
          >
            <form className="admin-modal" onSubmit={handleCreatePayment}>
              <div className="admin-modal-heading">
                <div>
                  <span className="admin-eyebrow">FINANCE RECORD</span>
                  <h2>Record student payment</h2>
                </div>
                <button
                  type="button"
                  className="admin-icon-button"
                  onClick={() => setCreatePaymentModalOpen(false)}
                  aria-label="Close dialog"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="admin-form-grid">
                <label className="admin-form-field admin-field-wide">
                  <span>Select student ambassador <i>*</i></span>
                  <select
                    value={selectedStudentForPayment?._id || ""}
                    onChange={(e) => {
                      const found = students.find((s) => s._id === e.target.value);
                      if (found) {
                        setSelectedStudentForPayment(found);
                        setPaymentAmount(String(found.pendingPayment || ""));
                      }
                    }}
                  >
                    {students.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name} ({s.studentId}) — Available Balance: ₹
                        {(
                          s.pendingPayment ?? Math.max(0, s.totalEarnings - s.paidAmount)
                        ).toLocaleString()}
                      </option>
                    ))}
                  </select>
                </label>

                {selectedStudentForPayment && (
                  <div
                    className="admin-field-wide"
                    style={{
                      padding: "10px 14px",
                      background: "#fafaf6",
                      border: "1px solid var(--admin-line)",
                      borderRadius: "6px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span className="admin-muted">Available Approved Balance:</span>
                    <b
                      style={{
                        color: "var(--admin-ink)",
                        fontSize: "14px",
                        fontFamily: "var(--admin-font-serif)",
                      }}
                    >
                      ₹
                      {(
                        selectedStudentForPayment.pendingPayment ??
                        Math.max(
                          0,
                          selectedStudentForPayment.totalEarnings - selectedStudentForPayment.paidAmount
                        )
                      ).toLocaleString()}
                    </b>
                  </div>
                )}

                <label className="admin-form-field">
                  <span>Payment amount (₹) <i>*</i></span>
                  <input
                    type="number"
                    required
                    min="1"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    style={{ fontWeight: "700" }}
                  />
                </label>

                <label className="admin-form-field">
                  <span>Payment date <i>*</i></span>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                  />
                </label>

                <label className="admin-form-field">
                  <span>Payment method <i>*</i></span>
                  <select
                    value={paymentMethod}
                    onChange={(e) =>
                      setPaymentMethod(e.target.value as "UPI" | "Bank Transfer" | "Other")
                    }
                  >
                    <option value="UPI">UPI</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Other">Other</option>
                  </select>
                </label>

                <label className="admin-form-field">
                  <span>Payment status <i>*</i></span>
                  <select
                    value={paymentStatusChoice}
                    onChange={(e) =>
                      setPaymentStatusChoice(e.target.value as "pending" | "processing" | "paid")
                    }
                  >
                    <option value="paid">Paid (Confirmed)</option>
                    <option value="processing">Processing</option>
                    <option value="pending">Pending</option>
                  </select>
                </label>

                <label className="admin-form-field admin-field-wide">
                  <span>Transaction reference / UTR number (optional)</span>
                  <input
                    type="text"
                    placeholder="e.g. UTR-49102849102"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    style={{ fontFamily: "monospace" }}
                  />
                </label>

                <label className="admin-form-field admin-field-wide">
                  <span>Internal note (optional)</span>
                  <textarea
                    rows={2}
                    placeholder="Payment remarks or bank confirmation notes..."
                    value={paymentNote}
                    onChange={(e) => setPaymentNote(e.target.value)}
                  />
                </label>
              </div>

              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="admin-button admin-button-secondary"
                  onClick={() => setCreatePaymentModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="admin-button" disabled={paymentSubmitting}>
                  {paymentSubmitting ? "Recording…" : "Save payment record"}
                </button>
              </div>
            </form>
          </div>
        </AdminModalPortal>
      )}

      {/* ISSUE CERTIFICATE MODAL */}
      {issueCertModalOpen && (
        <AdminModalPortal>
          <div
            className="admin-modal-backdrop"
            role="presentation"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setIssueCertModalOpen(false);
            }}
          >
            <form className="admin-modal" onSubmit={handleIssueCertificate}>
              <div className="admin-modal-heading">
                <div>
                  <span className="admin-eyebrow">CERTIFICATE ISSUANCE</span>
                  <h2>Issue & assign certificate</h2>
                </div>
                <button
                  type="button"
                  className="admin-icon-button"
                  onClick={() => setIssueCertModalOpen(false)}
                  aria-label="Close dialog"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="admin-form-grid">
                <label className="admin-form-field admin-field-wide">
                  <span>Assign to student <i>*</i></span>
                  <select
                    value={certTargetStudent?._id || ""}
                    onChange={(e) => {
                      const found = students.find((s) => s._id === e.target.value);
                      if (found) setCertTargetStudent(found);
                    }}
                  >
                    {students.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name} ({s.studentId})
                      </option>
                    ))}
                  </select>
                </label>

                <label className="admin-form-field admin-field-wide">
                  <span>Certificate title <i>*</i></span>
                  <input
                    type="text"
                    required
                    value={certTitle}
                    onChange={(e) => setCertTitle(e.target.value)}
                  />
                </label>

                <label className="admin-form-field">
                  <span>Unique certificate ID <i>*</i></span>
                  <input
                    type="text"
                    required
                    value={certIdInput}
                    onChange={(e) => setCertIdInput(e.target.value.toUpperCase())}
                    style={{ fontFamily: "monospace", textTransform: "uppercase" }}
                  />
                </label>

                <label className="admin-form-field">
                  <span>Issue date <i>*</i></span>
                  <input
                    type="date"
                    required
                    value={certIssueDate}
                    onChange={(e) => setCertIssueDate(e.target.value)}
                  />
                </label>

                <label className="admin-form-field admin-field-wide">
                  <span>Upload certificate file (PDF, JPG, PNG) <i>*</i></span>
                  <input
                    type="file"
                    required
                    accept=".pdf,image/png,image/jpeg,image/webp"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setCertFile(e.target.files[0]);
                      }
                    }}
                  />
                  <small>Max file size 10MB (PDF, PNG, JPG)</small>
                </label>

                <label className="admin-form-field admin-field-wide">
                  <span>Optional description</span>
                  <textarea
                    rows={2}
                    placeholder="Honors or milestone remarks..."
                    value={certDescription}
                    onChange={(e) => setCertDescription(e.target.value)}
                  />
                </label>
              </div>

              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="admin-button admin-button-secondary"
                  onClick={() => setIssueCertModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="admin-button" disabled={certUploading}>
                  {certUploading ? "Uploading & Assigning…" : "Assign certificate"}
                </button>
              </div>
            </form>
          </div>
        </AdminModalPortal>
      )}

      {/* ADMIN SUPPORT TICKET MODAL */}
      {activeTicket && (
        <AdminModalPortal>
          <div
            className="admin-modal-backdrop"
            role="presentation"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setActiveTicket(null);
            }}
          >
            <div className="admin-modal" style={{ width: "min(100%, 750px)" }}>
              <div className="admin-modal-heading">
                <div>
                  <span className="admin-eyebrow">SUPPORT TICKET · {activeTicket.ticketNumber}</span>
                  <h2>{activeTicket.subject}</h2>
                  <p className="admin-muted" style={{ margin: "4px 0 0" }}>
                    From: {activeTicket.studentName} ({activeTicket.studentId} · {activeTicket.studentEmail})
                  </p>
                </div>
                <button
                  type="button"
                  className="admin-icon-button"
                  onClick={() => setActiveTicket(null)}
                  aria-label="Close dialog"
                >
                  <X size={18} />
                </button>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "10px 0 16px" }}>
                <span className="admin-status-pill">{activeTicket.category}</span>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "11px",
                    color: "var(--admin-muted)",
                  }}
                >
                  <span>Status:</span>
                  <select
                    value={activeTicket.status}
                    onChange={(e) =>
                      handleAdminTicketStatusChange(
                        activeTicket._id,
                        e.target.value as "open" | "in_progress" | "resolved" | "closed"
                      )
                    }
                    style={{
                      padding: "4px 8px",
                      border: "1px solid var(--admin-line)",
                      borderRadius: "4px",
                      fontSize: "11px",
                      fontWeight: "600",
                    }}
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </label>
              </div>

              {/* Conversation Log */}
              <div
                className="admin-note-list"
                style={{
                  maxHeight: "320px",
                  background: "#fafaf6",
                  padding: "14px",
                  borderRadius: "6px",
                  border: "1px solid var(--admin-line)",
                }}
              >
                {activeTicket.messages?.map((msg, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: "10px 0",
                      borderTop: idx === 0 ? "none" : "1px solid var(--admin-line)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "4px",
                      }}
                    >
                      <b style={{ color: "var(--admin-ink)", fontSize: "11px" }}>
                        {msg.senderRole === "admin" ? `You (${msg.senderName})` : msg.senderName}
                      </b>
                      <small style={{ color: "var(--admin-muted)", fontSize: "9px" }}>
                        {new Date(msg.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </small>
                    </div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "11px",
                        color: "#333",
                        whiteSpace: "pre-wrap",
                        lineHeight: 1.6,
                      }}
                    >
                      {msg.message}
                    </p>
                  </div>
                ))}
              </div>

              {/* Reply Form */}
              <form onSubmit={handleAdminReply} style={{ marginTop: "16px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "8px",
                    fontSize: "11px",
                  }}
                >
                  <b style={{ color: "var(--admin-ink)" }}>Reply to Student:</b>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span className="admin-muted">Set status:</span>
                    <select
                      value={adminReplyStatus}
                      onChange={(e) =>
                        setAdminReplyStatus(
                          e.target.value as "open" | "in_progress" | "resolved" | "closed"
                        )
                      }
                      style={{
                        padding: "3px 6px",
                        border: "1px solid var(--admin-line)",
                        borderRadius: "4px",
                        fontSize: "10.5px",
                      }}
                    >
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="open">Open</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </div>

                <div className="admin-note-form">
                  <textarea
                    rows={2}
                    required
                    placeholder="Type official reply to student..."
                    value={adminReplyText}
                    onChange={(e) => setAdminReplyText(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="submit"
                    disabled={adminReplySubmitting || !adminReplyText.trim()}
                    className="admin-button"
                  >
                    <Send size={14} />
                    <span>{adminReplySubmitting ? "Sending…" : "Send reply"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </AdminModalPortal>
      )}
    </div>
  );
}
