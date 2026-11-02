"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

type Row = Record<string, unknown> & { _id?: string; id?: string };
type Envelope<T> = { success: boolean; message: string; data?: T; errors?: Array<{ message: string }> };
type PayoutData = { payments: Row[]; pagination: { page: number; pages: number; total: number } };

async function request<T>(url: string, init?: RequestInit): Promise<Envelope<T>> {
  const response = await fetch(url, {
    ...init,
    credentials: "same-origin",
    cache: "no-store",
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const result = await response.json() as Envelope<T>;
  if (!response.ok || !result.success || result.data === undefined) {
    throw new Error(result.errors?.[0]?.message ? `${result.message} ${result.errors[0].message}` : result.message);
  }
  return result;
}

function display(value: unknown) {
  if (typeof value !== "object" || value === null) return String(value ?? "—");
  const record = value as Row;
  return String(record.fullName ?? record.title ?? record.companyName ?? "—");
}

export function FinancePayoutsPanel({ canManage }: { canManage: boolean }) {
  const [data, setData] = useState<PayoutData | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [referenceFor, setReferenceFor] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await request<PayoutData>(`/api/admin/payments?page=${page}&limit=25`);
      setData(response.data ?? null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load creator payable records.");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function createPayout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await request("/api/admin/payments", {
        method: "POST",
        body: JSON.stringify({
          collaborationId: form.get("collaborationId"),
          amount: Number(form.get("amount")),
          currency: String(form.get("currency")).toUpperCase(),
          status: "pending",
        }),
      });
      setNotice(response.message);
      event.currentTarget.reset();
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to create payable record.");
    } finally {
      setSaving(false);
    }
  }

  async function updatePayout(payment: Row, status: "paid" | "failed", reference?: string) {
    const paymentId = String(payment._id ?? payment.id ?? "");
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await request(`/api/admin/payments/${paymentId}`, {
        method: "PATCH",
        body: JSON.stringify({ status, ...(reference ? { reference } : {}) }),
      });
      setNotice(response.message);
      setReferenceFor("");
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to update payable record.");
    } finally {
      setSaving(false);
    }
  }

  return <section className="admin-panel admin-panel-padding">
    <div className="admin-panel-heading"><div><h2>Creator payable records</h2><p>Finance-tracked amounts and references only; this does not trigger a bank transfer.</p></div></div>
    {notice && <p className="admin-toast" role="status">{notice}</p>}
    {error && <p className="admin-inline-error" role="alert">{error}</p>}
    {canManage && <details className="admin-panel admin-invite-form">
      <summary className="admin-button admin-button-secondary">Record creator payable</summary>
      <form className="admin-inline-fields" onSubmit={(event) => void createPayout(event)}>
        <label>Collaboration ID<input name="collaborationId" required pattern="[a-fA-F0-9]{24}" title="Enter a 24-character collaboration ID" /></label>
        <label>Amount<input name="amount" type="number" min="0.01" step="0.01" max="1000000000" required /></label>
        <label>Currency<input name="currency" defaultValue="INR" pattern="[A-Za-z]{3}" required /></label>
        <button className="admin-button" disabled={saving}>{saving ? "Saving…" : "Create pending record"}</button>
      </form>
    </details>}
    <div className="admin-table-scroll">
      <table className="admin-table">
        <thead><tr><th>Creator</th><th>Campaign</th><th>Amount</th><th>Status</th><th>Reference</th><th>History</th><th>Actions</th></tr></thead>
        <tbody>
          {data?.payments.length ? data.payments.map((payment) => {
            const paymentId = String(payment._id ?? payment.id ?? "");
            const history = Array.isArray(payment.history) ? payment.history as Row[] : [];
            return <tr key={paymentId}>
              <td>{display(payment.creator)}</td><td>{display(payment.campaign)}</td>
              <td>{String(payment.amount)} {String(payment.currency)}</td><td>{String(payment.status)}</td>
              <td>{String(payment.reference ?? "—")}</td>
              <td>{history.length ? history.map((entry) => `${String(entry.status)} · ${new Date(String(entry.recordedAt)).toLocaleDateString()}`).join("; ") : "No history"}</td>
              <td>{canManage && payment.status === "pending" ? <div className="admin-row-actions">
                {referenceFor === paymentId
                  ? <form onSubmit={(event) => { event.preventDefault(); const reference = new FormData(event.currentTarget).get("reference"); if (typeof reference === "string" && reference.trim()) void updatePayout(payment, "paid", reference.trim()); }}><input name="reference" aria-label="Verified payout reference" placeholder="Payout reference" required maxLength={120} /><button className="admin-small-button admin-approve" disabled={saving}>Record paid</button></form>
                  : <button className="admin-small-button admin-approve" onClick={() => setReferenceFor(paymentId)}>Record paid</button>}
                <button className="admin-small-button admin-reject" disabled={saving} onClick={() => void updatePayout(payment, "failed")}>Mark failed</button>
              </div> : "—"}</td>
            </tr>;
          }) : <tr><td colSpan={7}>{loading ? "Loading payable records…" : "No creator payable records found."}</td></tr>}
        </tbody>
      </table>
    </div>
    {data && <div className="admin-pagination"><span>{data.pagination.total} creator payable records</span><div><button disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</button><span>Page {page} of {Math.max(1, data.pagination.pages)}</span><button disabled={page >= data.pagination.pages} onClick={() => setPage((value) => Math.min(data.pagination.pages, value + 1))}>Next</button></div></div>}
  </section>;
}
