"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

interface Invoice {
  id: string;
  clientName: string;
  clientEmail: string | null;
  amount: string;
  currency: string;
  invoiceNumber: string | null;
  dueDate: string;
  status: string;
  currentStage: number;
  nextFollowUpDate: string | null;
  source: string;
}

interface Reminder {
  id: string;
  stage: number;
  scheduledDate: string;
  status: string;
  sentAt: string | null;
  subject: string;
  body: string;
}

const stageNames = ["", "Friendly Nudge", "Soft Deadline", "Late Fee Notice", "Escalation Warning"];

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [previewReminder, setPreviewReminder] = useState<Reminder | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/invoices/${params.id}`);
      if (res.ok) {
        setInvoice(await res.json());
      }

      const remRes = await fetch(`/api/invoices/${params.id}/reminders`);
      if (remRes.ok) {
        setReminders(await remRes.json());
      }

      setLoading(false);
    }
    load();
  }, [params.id]);

  async function handleCreateReminder() {
    setCreating(true);
    const res = await fetch(`/api/invoices/${params.id}/reminders`, {
      method: "POST",
    });
    if (res.ok) {
      const reminder = await res.json();
      setPreviewReminder(reminder);
    }
    setCreating(false);
  }

  async function handleSendReminder(reminderId: string) {
    setSending(true);
    const res = await fetch(`/api/reminders/${reminderId}/send`, {
      method: "POST",
    });
    if (res.ok) {
      setPreviewReminder(null);
      const remRes = await fetch(`/api/invoices/${params.id}/reminders`);
      if (remRes.ok) {
        setReminders(await remRes.json());
      }
    }
    setSending(false);
  }

  async function handleMarkPaid() {
    if (!invoice) return;
    const res = await fetch(`/api/invoices/${invoice.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "paid" }),
    });
    if (res.ok) {
      setInvoice({ ...invoice, status: "paid" });
    }
  }

  async function handleDelete() {
    if (!invoice || !confirm("Are you sure you want to delete this invoice?")) return;
    const res = await fetch(`/api/invoices/${invoice.id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/invoices");
    }
  }

  function getDaysOverdue(dueDate: string) {
    const now = new Date();
    const due = new Date(dueDate);
    const diff = now.getTime() - due.getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  }

  if (loading) return <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading...</div>;
  if (!invoice) return <div className="text-center py-12 text-gray-500 dark:text-gray-400">Invoice not found</div>;

  const daysOverdue = getDaysOverdue(invoice.dueDate);

  return (
    <div>
      <button
        onClick={() => router.push("/invoices")}
        className="mb-4 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
      >
        &larr; Back to invoices
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">{invoice.clientName}</h1>
                {invoice.clientEmail && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">{invoice.clientEmail}</p>
                )}
              </div>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  invoice.status === "paid"
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                    : daysOverdue > 0
                    ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                    : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                }`}
              >
                {invoice.status === "paid" ? "Paid" : daysOverdue > 0 ? "Overdue" : "Unpaid"}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 uppercase">Amount</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  ${parseFloat(invoice.amount).toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 uppercase">Due Date</div>
                <div className="text-sm text-gray-900 dark:text-white">
                  {new Date(invoice.dueDate).toLocaleDateString()}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 uppercase">Days Overdue</div>
                <div className="text-sm text-gray-900 dark:text-white">
                  {daysOverdue > 0 ? daysOverdue : "None"}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 uppercase">Current Stage</div>
                <div className="text-sm text-gray-900 dark:text-white">
                  {invoice.currentStage > 0 ? stageNames[invoice.currentStage] : "Not started"}
                </div>
              </div>
            </div>

            {invoice.invoiceNumber && (
              <div className="mt-4">
                <div className="text-xs text-gray-500 dark:text-gray-400 uppercase">Invoice #</div>
                <div className="text-sm text-gray-900 dark:text-white">{invoice.invoiceNumber}</div>
              </div>
            )}

            <div className="mt-4">
              <div className="text-xs text-gray-500 dark:text-gray-400 uppercase">Source</div>
              <div className="text-sm text-gray-900 dark:text-white uppercase">{invoice.source}</div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Actions</h2>
            <div className="space-y-2">
              <button
                onClick={handleCreateReminder}
                disabled={creating || invoice.status === "paid" || invoice.currentStage >= 4}
                className="w-full py-2 px-4 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? "Creating..." : "Create Next Reminder"}
              </button>
              {invoice.status !== "paid" && (
                <button
                  onClick={handleMarkPaid}
                  className="w-full py-2 px-4 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700"
                >
                  Mark as Paid
                </button>
              )}
              <button
                onClick={handleDelete}
                className="w-full py-2 px-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium rounded-md hover:bg-red-100 dark:hover:bg-red-900/30"
              >
                Delete Invoice
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mt-4">
            <h2 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Reminder History</h2>
            {reminders.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No reminders yet.</p>
            ) : (
              <div className="space-y-3">
                {reminders.map((r) => (
                  <div key={r.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-900 dark:text-white">
                        Stage {r.stage}: {stageNames[r.stage]}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          r.status === "sent"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : r.status === "draft"
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                            : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                        }`}
                      >
                        {r.status}
                      </span>
                    </div>
                    {r.status === "draft" && (
                      <button
                        onClick={() => setPreviewReminder(r)}
                        className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                      >
                        Review & Send
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {previewReminder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg max-w-lg w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Review Email</h3>
              <button
                onClick={() => setPreviewReminder(null)}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              >
                &times;
              </button>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-4 mb-4">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Subject</div>
              <div className="text-sm text-gray-900 dark:text-white font-medium">
                {previewReminder.subject}
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-4 mb-4">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Body</div>
              <div className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                {previewReminder.body}
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setPreviewReminder(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSendReminder(previewReminder.id)}
                disabled={sending}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {sending ? "Sending..." : "Send Email"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
