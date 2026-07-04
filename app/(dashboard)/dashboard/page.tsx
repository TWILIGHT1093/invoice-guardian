"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Stats {
  totalInvoices: number;
  unpaidCount: number;
  overdueCount: number;
  paidCount: number;
  totalOutstanding: number;
}

interface RecentInvoice {
  id: string;
  clientName: string;
  amount: string;
  dueDate: string;
  status: string;
  currentStage: number;
}

const stageNames = ["", "Friendly Nudge", "Soft Deadline", "Late Fee Notice", "Escalation Warning"];

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentInvoices, setRecentInvoices] = useState<RecentInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/invoices");
      if (res.ok) {
        const invoices = await res.json();
        const now = new Date();

        let unpaidCount = 0;
        let overdueCount = 0;
        let paidCount = 0;
        let totalOutstanding = 0;

        for (const inv of invoices) {
          if (inv.status === "paid") {
            paidCount++;
          } else {
            const due = new Date(inv.dueDate);
            const daysOverdue = Math.max(0, Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)));
            if (daysOverdue > 0) {
              overdueCount++;
            } else {
              unpaidCount++;
            }
            totalOutstanding += parseFloat(inv.amount);
          }
        }

        setStats({
          totalInvoices: invoices.length,
          unpaidCount,
          overdueCount,
          paidCount,
          totalOutstanding,
        });

        setRecentInvoices(invoices.slice(0, 5));
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading dashboard...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <Link
          href="/invoices"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          View All Invoices
        </Link>
      </div>

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Invoices</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.totalInvoices}</div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="text-sm text-gray-500 dark:text-gray-400">Unpaid</div>
            <div className="text-3xl font-bold text-amber-600 dark:text-amber-400 mt-1">{stats.unpaidCount}</div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="text-sm text-gray-500 dark:text-gray-400">Overdue</div>
            <div className="text-3xl font-bold text-red-600 dark:text-red-400 mt-1">{stats.overdueCount}</div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="text-sm text-gray-500 dark:text-gray-400">Outstanding</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mt-1">${stats.totalOutstanding.toFixed(2)}</div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Recent Invoices</h2>
          <Link href="/invoices" className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
            View all
          </Link>
        </div>
        {recentInvoices.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">No invoices yet. Add your first invoice to get started.</p>
        ) : (
          <div className="space-y-3">
            {recentInvoices.map((inv) => {
              const now = new Date();
              const due = new Date(inv.dueDate);
              const daysOverdue = Math.max(0, Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)));
              const status = inv.status === "paid" ? "paid" : daysOverdue > 0 ? "overdue" : "unpaid";

              return (
                <Link
                  key={inv.id}
                  href={`/invoices/${inv.id}`}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{inv.clientName}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Due {new Date(inv.dueDate).toLocaleDateString()}
                        {inv.currentStage > 0 && ` · ${stageNames[inv.currentStage]}`}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        status === "paid"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : status === "overdue"
                          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                      }`}
                    >
                      {status}
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">${parseFloat(inv.amount).toFixed(2)}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
