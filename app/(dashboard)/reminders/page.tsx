"use client";

import { useEffect, useState } from "react";

interface Reminder {
  id: string;
  stage: number;
  scheduledDate: string;
  status: string;
  subject: string;
  body: string;
  invoice: {
    id: string;
    clientName: string;
    amount: string;
    invoiceNumber: string | null;
  };
}

const stageNames = ["", "Friendly Nudge", "Soft Deadline", "Late Fee Notice", "Escalation Warning"];

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<Reminder | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchReminders();
  }, []);

  async function fetchReminders() {
    const res = await fetch("/api/reminders");
    if (res.ok) setReminders(await res.json());
    setLoading(false);
  }

  async function handleSend(id: string) {
    setSending(true);
    const res = await fetch(`/api/reminders/${id}/send`, { method: "POST" });
    if (res.ok) {
      setPreview(null);
      await fetchReminders();
    }
    setSending(false);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Pending Reminders</h1>

      {loading ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading...</div>
      ) : reminders.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">No pending reminders. Create reminders from your invoice details.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reminders.map((r) => (
            <div key={r.id} className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {r.invoice.clientName}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      ${parseFloat(r.invoice.amount).toFixed(2)}
                    </span>
                    {r.invoice.invoiceNumber && (
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        #{r.invoice.invoiceNumber}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Stage {r.stage}: {stageNames[r.stage]} — Scheduled{" "}
                    {new Date(r.scheduledDate).toLocaleDateString()}
                  </div>
                </div>
                <button
                  onClick={() => setPreview(r)}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Review & Send
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {preview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg max-w-lg w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Review Email — {preview.invoice.clientName}
              </h3>
              <button
                onClick={() => setPreview(null)}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-xl"
              >
                &times;
              </button>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-4 mb-4">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Subject</div>
              <div className="text-sm text-gray-900 dark:text-white font-medium">{preview.subject}</div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-4 mb-6">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Body</div>
              <div className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{preview.body}</div>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setPreview(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSend(preview.id)}
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
