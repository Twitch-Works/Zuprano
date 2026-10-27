"use client";

import { useEffect, useState } from "react";
import { Bell, Copy, Eye, EyeOff, Key, Save, Settings, UserPlus, Users } from "lucide-react";
import { DEFAULT_SETTINGS, useSettings, useStaff } from "@/lib/admin/data";
import { useAdminAuth } from "@/lib/admin/auth";
import { getSupabase } from "@/lib/supabase/client";
import { ErrorBanner, Loading } from "@/components/admin/ui";
import { UserModal } from "@/components/admin/UserModal";
import type { BusinessSettings, Profile } from "@/lib/types";

const TABS = [
  { id: "general", label: "General Settings", icon: Settings },
  { id: "security", label: "Security & API", icon: Key },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "admin", label: "Admin Management", icon: Users },
] as const;

const PREFERENCES = [
  { key: "bulkOrders", label: "Enable Bulk Orders", description: "Allow dealers to place bulk orders" },
  { key: "autoship", label: "Enable Autoship", description: "Enable automatic recurring orders" },
  { key: "returns", label: "Enable Returns", description: "Allow customers to request returns" },
  { key: "loyaltyProgram", label: "Enable Loyalty Program", description: "Activate dealer loyalty rewards" },
];

const NOTIFICATION_GROUPS = [
  { category: "Order Notifications", events: ["New Order", "Order Status Update", "Delivery Confirmation"] },
  { category: "Dealer Notifications", events: ["New Dealer Registration", "Dealer Performance Alert", "Commission Payout"] },
  { category: "System Notifications", events: ["Stock Alert", "System Maintenance", "Security Alert"] },
];

const ROLE_LABEL: Record<string, string> = { admin: "Super Admin", manager: "Manager", support: "Support" };
const input = "w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500";

function KeyRow({ name, value, env }: { name: string; value: string; env: string }) {
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);
  return (
    <div className="p-4 border border-gray-200 rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="font-medium text-gray-900">{name}</p>
          <p className="text-xs text-gray-600 mt-1">Environment: {env}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${value ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>{value ? "Active" : "Not set"}</span>
      </div>
      <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg font-mono text-sm">
        <span className="text-gray-600 flex-1 break-all">{value ? (show ? value : "•".repeat(Math.min(value.length, 32))) : "—"}</span>
        <button onClick={() => setShow(!show)} aria-label="Toggle visibility" className="p-2 hover:bg-gray-200 rounded text-gray-600 transition-colors">
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
        <button
          onClick={async () => {
            if (!value) return;
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          title="Copy"
          className="p-2 hover:bg-gray-200 rounded text-gray-600 transition-colors"
        >
          {copied ? <span className="text-xs font-sans text-green-600">Copied</span> : <Copy size={16} />}
        </button>
      </div>
    </div>
  );
}

function ChangePassword() {
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.length < 6) return setMsg({ ok: false, text: "Password must be at least 6 characters" });
    if (pw !== confirm) return setMsg({ ok: false, text: "Passwords do not match" });
    setSaving(true);
    const { error } = await getSupabase().auth.updateUser({ password: pw });
    setSaving(false);
    setMsg(error ? { ok: false, text: error.message } : { ok: true, text: "Password updated" });
    if (!error) {
      setPw("");
      setConfirm("");
    }
  };
  return (
    <form onSubmit={submit} className="p-3 border border-gray-100 rounded-lg space-y-3">
      <p className="font-medium text-gray-900">Change Your Password</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input type="password" placeholder="New password" value={pw} onChange={(e) => setPw(e.target.value)} className={input} autoComplete="new-password" />
        <input type="password" placeholder="Confirm password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={input} autoComplete="new-password" />
        <button type="submit" disabled={saving} className="bg-gray-900 text-white rounded-lg px-4 py-2 font-medium disabled:opacity-50">
          {saving ? "Updating..." : "Update Password"}
        </button>
      </div>
      {msg && <p className={`text-sm ${msg.ok ? "text-green-600" : "text-red-600"}`}>{msg.text}</p>}
    </form>
  );
}

export default function SettingsPage() {
  const { settings, loading, updateSettings } = useSettings();
  const { staff, refresh } = useStaff();
  const admin = useAdminAuth((s) => s.admin);
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("general");
  const [form, setForm] = useState<BusinessSettings>(DEFAULT_SETTINGS);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [staffModal, setStaffModal] = useState<{ user: Profile | null } | null>(null);

  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  if (loading) return <Loading label="Loading settings..." />;

  const save = async (next: BusinessSettings = form) => {
    setSaving(true);
    setStatus(null);
    try {
      await updateSettings(next);
      setStatus({ ok: true, text: "Settings saved successfully!" });
    } catch (e) {
      setStatus({ ok: false, text: e instanceof Error ? e.message : "Failed to save settings" });
    } finally {
      setSaving(false);
    }
  };

  const notificationOn = (event: string) => form.notifications?.[event] ?? true;
  const rzpKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">Manage system configuration and preferences</p>
      </div>
      <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => {
              setTab(id);
              setStatus(null);
            }}
            className={`flex items-center gap-2 px-6 py-3 font-medium border-b-2 transition-colors whitespace-nowrap ${
              tab === id ? "border-orange-600 text-orange-600" : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
      </div>

      {status && <div className={`p-3 rounded-lg text-sm border ${status.ok ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-600"}`}>{status.text}</div>}

      {tab === "general" && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Business Information</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Business Name</label>
                  <input type="text" value={form.businessName ?? ""} onChange={(e) => setForm((prev) => ({ ...prev, businessName: e.target.value }))} className={input} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Business Email</label>
                  <input type="email" value={form.businessEmail ?? ""} onChange={(e) => setForm((prev) => ({ ...prev, businessEmail: e.target.value }))} className={input} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                  <select value={form.currency ?? "INR"} onChange={(e) => setForm((prev) => ({ ...prev, currency: e.target.value }))} className={`${input} bg-white`}>
                    <option value="INR">Indian Rupee (₹)</option>
                    <option value="USD">US Dollar ($)</option>
                    <option value="EUR">Euro (€)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                  <select value={form.timezone ?? "IST"} onChange={(e) => setForm((prev) => ({ ...prev, timezone: e.target.value }))} className={`${input} bg-white`}>
                    <option value="IST">India Standard Time (IST)</option>
                    <option value="UTC">UTC</option>
                    <option value="PST">Pacific Time (PST)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Business Address</label>
                <textarea value={form.address ?? ""} onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))} rows={3} className={input} />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">System Preferences</h2>
            <div className="space-y-4">
              {PREFERENCES.map((p) => (
                <div key={p.key} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 gap-4">
                  <div>
                    <p className="font-medium text-gray-900">{p.label}</p>
                    <p className="text-sm text-gray-600 mt-1">{p.description}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={form.preferences?.[p.key] ?? false}
                      onChange={(e) => setForm((prev) => ({ ...prev, preferences: { ...prev.preferences, [p.key]: e.target.checked } }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600" />
                  </label>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => save()}
              disabled={saving}
              className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors duration-150 disabled:opacity-50"
            >
              <Save size={18} /> {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </div>
      )}

      {tab === "security" && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">API Keys</h2>
            <p className="text-sm text-gray-600 mb-4">Public keys this deployment uses. Secret keys live only in server environment variables and are never shown here.</p>
            <div className="space-y-4">
              <KeyRow name="Razorpay Key ID" value={rzpKey} env={rzpKey.startsWith("rzp_live") ? "Production" : "Test / Development"} />
              <KeyRow name="Supabase Project URL" value={process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""} env="Database & Auth" />
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Security Settings</h2>
            <div className="space-y-4">
              {[
                { label: "Row Level Security", status: "Enabled" },
                { label: "Payment Signature Verification", status: "Enabled" },
                { label: "Admin Session Timeout", status: "24 hours" },
              ].map((s) => (
                <div key={s.label} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50">
                  <p className="font-medium text-gray-900">{s.label}</p>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${s.status === "Enabled" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>{s.status}</span>
                </div>
              ))}
              <ChangePassword />
            </div>
          </div>
        </div>
      )}

      {tab === "notifications" && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">Notification Preferences</h2>
          <div className="space-y-4">
            {NOTIFICATION_GROUPS.map((g) => (
              <div key={g.category} className="border border-gray-100 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">{g.category}</h3>
                <div className="space-y-2 ml-4">
                  {g.events.map((ev) => (
                    <label key={ev} className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={notificationOn(ev)}
                        onChange={(e) => setForm((prev) => ({ ...prev, notifications: { ...prev.notifications, [ev]: e.target.checked } }))}
                        className="w-4 h-4 rounded border-gray-300 accent-orange-600"
                      />
                      <span className="text-sm text-gray-700">{ev}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => save()}
              disabled={saving}
              className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors duration-150 disabled:opacity-50"
            >
              <Save size={18} /> {saving ? "Saving..." : "Save Preferences"}
            </button>
          </div>
        </div>
      )}

      {tab === "admin" && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6 gap-4">
              <h2 className="text-lg font-semibold text-gray-900">Admin Users</h2>
              {admin?.role === "admin" && (
                <button
                  type="button"
                  onClick={() => setStaffModal({ user: null })}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors duration-150"
                >
                  <UserPlus size={18} /> Add Admin
                </button>
              )}
            </div>
            <ErrorBanner message={admin?.role !== "admin" ? "Only Super Admins can add or edit staff accounts." : null} />
            <div className="space-y-3 mt-3">
              {staff.map((s) => (
                <div key={s.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 gap-3">
                  <div>
                    <p className="font-medium text-gray-900">
                      {s.name} {s.id === admin?.id && <span className="text-xs text-gray-400">(you)</span>}
                    </p>
                    <p className="text-sm text-gray-600">{s.email}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">{ROLE_LABEL[s.role] ?? s.role}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${s.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>{s.status}</span>
                    {admin?.role === "admin" && (
                      <button type="button" onClick={() => setStaffModal({ user: s })} className="p-2 hover:bg-blue-100 rounded text-blue-600 transition-colors">
                        Edit
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <UserModal open={!!staffModal} user={staffModal?.user ?? null} role="admin" onClose={() => setStaffModal(null)} onSaved={refresh} />
    </div>
  );
}
