"use client";

import { useEffect, useState } from "react";

interface Settings {
  stage1DaysAfterDue: number;
  stage2DaysAfterDue: number;
  stage3DaysAfterDue: number;
  stage4DaysAfterDue: number;
}

interface Template {
  id: string;
  stage: number;
  name: string;
  subject: string;
  body: string;
}

interface UserData {
  stripeAccountId: string | null;
  stripeOnboardingComplete: boolean;
}

interface SubscriptionData {
  subscriptionStatus: string;
  trialEndsAt: string | null;
  hasSubscription: boolean;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchSubscription();
  }, []);

  async function fetchSettings() {
    const res = await fetch("/api/settings");
    if (res.ok) {
      const data = await res.json();
      setSettings(data.settings);
      setTemplates(data.templates);
      setUserData(data.user);
    }
    setLoading(false);
  }

  async function fetchSubscription() {
    const res = await fetch("/api/subscription/status");
    if (res.ok) {
      const data = await res.json();
      setSubscription(data);
    }
  }

  async function handleManageBilling() {
    setPortalLoading(true);
    const res = await fetch("/api/portal", { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      window.location.href = data.url;
    }
    setPortalLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings, templates }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleConnectStripe() {
    setConnecting(true);
    const res = await fetch("/api/stripe/connect", { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      window.location.href = data.url;
    }
    setConnecting(false);
  }

  if (loading) return <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading...</div>;

  const stageNames = ["", "Friendly Nudge", "Soft Deadline", "Late Fee Notice", "Escalation Warning"];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Settings</h1>

      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Billing & Subscription</h2>
          {subscription?.hasSubscription ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    subscription.subscriptionStatus === "active"
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                      : subscription.subscriptionStatus === "trialing"
                      ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                  }`}
                >
                  {subscription.subscriptionStatus === "active"
                    ? "Active"
                    : subscription.subscriptionStatus === "trialing"
                    ? "Free Trial"
                    : subscription.subscriptionStatus}
                </span>
                {subscription.subscriptionStatus === "trialing" && subscription.trialEndsAt && (
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Trial ends {new Date(subscription.trialEndsAt).toLocaleDateString()}
                  </span>
                )}
              </div>
              <button
                onClick={handleManageBilling}
                disabled={portalLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                {portalLoading ? "Loading..." : "Manage Billing"}
              </button>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                You're on the free plan. Upgrade to access all features.
              </p>
              <a
                href="/pricing"
                className="inline-block px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
              >
                View Plans
              </a>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Stripe Connection</h2>
          {userData?.stripeAccountId ? (
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                Connected
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">{userData.stripeAccountId}</span>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                Connect your Stripe account to automatically sync unpaid invoices.
              </p>
              <button
                onClick={handleConnectStripe}
                disabled={connecting}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {connecting ? "Connecting..." : "Connect Stripe Account"}
              </button>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Escalation Timing</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            Set how many days after the due date each reminder stage triggers.
          </p>
          {settings && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((stage) => (
                <div key={stage}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Stage {stage}: {stageNames[stage]}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      value={
                        settings[`stage${stage}DaysAfterDue` as keyof Settings]
                      }
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          [`stage${stage}DaysAfterDue`]: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                    <span className="text-sm text-gray-500 dark:text-gray-400">days after due</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Email Templates</h2>
          <div className="space-y-4">
            {templates.map((t) => (
              <div key={t.id} className="border border-gray-200 dark:border-gray-700 rounded-md p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Stage {t.stage}: {t.name}
                  </span>
                </div>
                <input
                  type="text"
                  value={t.subject}
                  onChange={(e) =>
                    setTemplates(
                      templates.map((tm) =>
                        tm.id === t.id ? { ...tm, subject: e.target.value } : tm
                      )
                    )
                  }
                  placeholder="Subject"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm mb-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                />
                <textarea
                  value={t.body}
                  onChange={(e) =>
                    setTemplates(
                      templates.map((tm) =>
                        tm.id === t.id ? { ...tm, body: e.target.value } : tm
                      )
                    )
                  }
                  rows={5}
                  placeholder="Email body..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                />
                <div className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                  Variables: {"{{client_name}}"}, {"{{amount}}"}, {"{{invoice_number}}"}, {"{{due_date}}"}, {"{{days_overdue}}"}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : saved ? "Saved!" : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}
