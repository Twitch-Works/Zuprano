"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronRight, Clock, LogOut, MapPin, Package, Settings, ShieldCheck, User } from "lucide-react";
import { Button, Input } from "@/components/store/ui";
import { SignInRequired } from "@/components/store/SignInRequired";
import { getSupabase } from "@/lib/supabase/client";
import { toOrder } from "@/lib/mappers";
import { formatDate } from "@/lib/format";
import type { Address, Order } from "@/lib/types";
import { useAuth } from "@/stores/auth";
import { useUI } from "@/stores/ui";

type Tab = "Profile" | "Orders" | "Addresses" | "Settings";

const TABS: { id: Tab; icon: React.ReactNode; label: string }[] = [
  { id: "Profile", icon: <User size={16} />, label: "Member Profile" },
  { id: "Orders", icon: <Package size={16} />, label: "Order History" },
  { id: "Addresses", icon: <MapPin size={16} />, label: "Saved Shipping" },
  { id: "Settings", icon: <Settings size={16} />, label: "Preferences" },
];

const PREFS = [
  { key: "orderSms", label: "Real-time Order SMS Triggers", icon: null, default: true },
  { key: "twoFactor", label: "Two-Factor Authentication (Vault-2FA)", icon: <ShieldCheck size={14} />, default: false },
  { key: "earlyAccess", label: "Early Access Priority Drops", icon: null, default: true },
  { key: "analytics", label: "Marketing Analytics Participation", icon: null, default: false },
];

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  processing: "bg-blue-100 text-blue-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const emptyAddress = (): Address => ({ id: crypto.randomUUID(), name: "", phone: "", street: "", city: "", state: "", postalCode: "" });

function AccountContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, session, initialized, updateProfile, logout } = useAuth();
  const showToast = useUI((s) => s.showToast);
  const [tab, setTab] = useState<Tab>("Profile");
  const [profile, setProfile] = useState({ name: "", phone: "" });
  const [saving, setSaving] = useState(false);
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [editing, setEditing] = useState<Address | null>(null);

  useEffect(() => {
    const t = params.get("tab") as Tab | null;
    if (t && TABS.some((x) => x.id === t)) setTab(t);
  }, [params]);

  useEffect(() => {
    if (user) setProfile({ name: user.name, phone: user.phone });
  }, [user]);

  useEffect(() => {
    if (!user || tab !== "Orders") return;
    getSupabase()
      .from("orders")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setOrders((data ?? []).map(toOrder)));
  }, [user, tab]);

  if (!initialized) return <div className="text-center py-32 text-[#86868b] text-[11px] font-black uppercase tracking-widest">Loading...</div>;
  if (!user) return <SignInRequired message="Sign in to manage your profile, orders and saved addresses." />;

  const memberId = `ZP-${new Date(user.createdAt).getFullYear()}-${user.id.replace(/-/g, "").slice(-4).toUpperCase()}`;
  const lastLogin = session?.user.last_sign_in_at;
  const prefs = (key: string, fallback: boolean) => user.preferences[key] ?? fallback;

  const saveProfile = async () => {
    if (!profile.name.trim()) return showToast("error", "Name cannot be empty");
    setSaving(true);
    try {
      await updateProfile({ name: profile.name.trim(), phone: profile.phone.trim() });
      showToast("success", "Profile updated");
    } catch (e) {
      showToast("error", e instanceof Error ? e.message : "Could not update profile");
    } finally {
      setSaving(false);
    }
  };

  const saveAddress = async () => {
    if (!editing) return;
    if (!editing.name || !editing.street || !editing.city || !/^\d{6}$/.test(editing.postalCode)) {
      return showToast("error", "Please fill name, street, city and a 6-digit postal code");
    }
    const exists = user.addresses.some((a) => a.id === editing.id);
    let next = exists ? user.addresses.map((a) => (a.id === editing.id ? editing : a)) : [...user.addresses, editing];
    if (next.length === 1 || editing.isDefault) next = next.map((a) => ({ ...a, isDefault: a.id === editing.id }));
    try {
      await updateProfile({ addresses: next });
      setEditing(null);
      showToast("success", "Address saved");
    } catch (e) {
      showToast("error", e instanceof Error ? e.message : "Could not save address");
    }
  };

  const removeAddress = async (id: string) => {
    let next = user.addresses.filter((a) => a.id !== id);
    if (next.length && !next.some((a) => a.isDefault)) next = next.map((a, i) => ({ ...a, isDefault: i === 0 }));
    await updateProfile({ addresses: next });
    showToast("success", "Address removed");
  };

  const makePrimary = async (id: string) => {
    await updateProfile({ addresses: user.addresses.map((a) => ({ ...a, isDefault: a.id === id })) });
  };

  const togglePref = async (key: string, fallback: boolean) => {
    await updateProfile({ preferences: { ...user.preferences, [key]: !prefs(key, fallback) } });
  };

  const terminate = async () => {
    await logout();
    router.push("/");
  };

  return (
    <div className="bg-[#fcfcfc] min-h-screen w-full">
      <div className="bg-white border-b border-gray-100 pt-2 pb-6 md:pt-8 md:pb-10">
        <div className="max-w-full mx-auto flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="bg-orange-600 text-white text-[10px] font-black uppercase tracking-[0.3em] px-3 py-1 rounded-full">Elite Member</span>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Member ID: {memberId}</span>
            </div>
            <h1 className="text-3xl sm:text-5xl lg:text-7xl font-black text-[#1d1d1f] tracking-tighter uppercase leading-none">
              Control <span className="text-orange-600">Center.</span>
            </h1>
          </div>
          <div className="flex items-center gap-6 md:gap-10 md:pb-2">
            <div className="md:text-right">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Last Login</p>
              <p className="text-sm font-black uppercase tracking-tighter">{lastLogin ? formatDate(lastLogin) : "Today"}</p>
            </div>
            <div className="md:text-right">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</p>
              <p className="text-sm font-black uppercase tracking-tighter text-green-600 flex items-center gap-2 md:justify-end">
                <ShieldCheck size={14} /> Encrypted
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-full mx-auto py-5 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-16">
          <aside className="lg:col-span-3 xl:col-span-2 min-w-0">
            {/* A scrolling tab strip on phones, a sticky side menu from lg up. */}
            <div className="-mx-4 px-4 sm:mx-0 sm:px-0 flex lg:block gap-2 overflow-x-auto no-scrollbar lg:sticky lg:top-32 lg:space-y-1">
              <p className="hidden lg:block text-[10px] font-black text-gray-300 uppercase tracking-[0.4em] mb-6 px-4">Navigation</p>
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`shrink-0 lg:w-full flex items-center justify-between gap-3 px-4 lg:px-5 py-2.5 lg:py-3.5 rounded-full lg:rounded-2xl text-[11px] lg:text-[10px] font-black uppercase tracking-widest transition-all group ${
                    tab === t.id ? "bg-black text-white shadow-xl shadow-black/10 lg:scale-[1.02]" : "text-gray-500 bg-gray-100 lg:bg-transparent hover:text-black lg:hover:bg-white"
                  }`}
                >
                  <div className="flex items-center gap-2 lg:gap-4 whitespace-nowrap">
                    <span className={tab === t.id ? "text-orange-500" : "text-gray-300 group-hover:text-black"}>{t.icon}</span>
                    {t.label}
                  </div>
                  {tab === t.id && <ChevronRight size={14} className="hidden lg:block text-white/40" />}
                </button>
              ))}
              <div className="shrink-0 flex items-center lg:block lg:pt-10 lg:mt-10 lg:border-t border-gray-100 px-2 lg:px-4">
                <button
                  onClick={terminate}
                  className="flex items-center gap-3 whitespace-nowrap text-red-500 hover:text-red-700 transition-colors text-[10px] font-black uppercase tracking-widest"
                >
                  <LogOut size={16} /> Terminate Session
                </button>
              </div>
            </div>
          </aside>

          <main className="lg:col-span-9 xl:col-span-10 min-w-0">
            {tab === "Profile" && (
              <div className="bg-white rounded-2xl md:rounded-[2.5rem] border border-gray-100 p-4 sm:p-8 lg:p-16 animate-in">
                <div className="max-w-4xl space-y-8 md:space-y-12">
                  <div className="space-y-2">
                    <h2 className="text-2xl md:text-3xl font-black tracking-tighter uppercase">Identity Details</h2>
                    <p className="text-gray-400 text-[11px] font-bold uppercase tracking-widest">Update your personal encryption and contact nodes.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8">
                    <Input label="Full Identity Name" value={profile.name} onChange={(e) => setProfile((prev) => ({ ...prev, name: e.target.value }))} />
                    <Input label="Primary Email Node" type="email" value={user.email} disabled />
                    <Input label="Secure Contact Number" value={profile.phone} onChange={(e) => setProfile((prev) => ({ ...prev, phone: e.target.value }))} />
                    <Input label="Date of Activation" value={formatDate(user.createdAt)} disabled />
                  </div>
                  <div className="pt-2 md:pt-8 flex flex-wrap items-center gap-4 md:gap-6">
                    <Button isLoading={saving} onClick={saveProfile} className="w-full sm:w-auto px-10 py-4 md:py-5 rounded-xl uppercase tracking-widest text-xs">
                      Update Profile
                    </Button>
                    <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest italic">Changes sync instantly</span>
                  </div>
                </div>
              </div>
            )}

            {tab === "Orders" &&
              (orders === null ? (
                <div className="text-center py-32 text-[#86868b] text-[11px] font-black uppercase tracking-widest">Loading orders...</div>
              ) : orders.length === 0 ? (
                <div className="bg-white rounded-2xl md:rounded-[2.5rem] border border-gray-100 p-8 md:p-16 flex flex-col items-center justify-center text-center md:min-h-[600px] animate-in">
                  <div className="relative mb-8 md:mb-10">
                    <div className="w-28 h-28 md:w-40 md:h-40 bg-gray-50 rounded-full flex items-center justify-center border border-dashed border-gray-200">
                      <Package size={48} className="text-gray-200" />
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-orange-600 text-white p-3 rounded-full shadow-xl">
                      <Clock size={20} />
                    </div>
                  </div>
                  <h3 className="text-2xl md:text-4xl font-black tracking-tighter uppercase mb-4">No orders yet</h3>
                  <p className="text-gray-400 text-sm font-medium max-w-sm mx-auto mb-8 md:mb-10 leading-relaxed">
                    When you buy a phone or accessory, your orders and tracking will show up here.
                  </p>
                  <Link href="/shop">
                    <Button className="px-12 py-5 rounded-full text-xs font-black uppercase tracking-widest bg-black text-white hover:bg-orange-600 transition-colors">
                      Start Shopping
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-6 animate-in">
                  {orders.map((o) => (
                    <div key={o.id} className="bg-white rounded-2xl md:rounded-3xl border border-gray-100 p-4 sm:p-6 md:p-8">
                      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Order</p>
                          <p className="text-xl font-black tracking-tight">#{o.orderNumber}</p>
                          <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mt-1">{formatDate(o.createdAt)}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 md:gap-3">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${STATUS_STYLE[o.status]}`}>{o.status}</span>
                          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-gray-100 text-gray-600">
                            {o.paymentMethod === "cod" ? "COD" : o.paymentStatus}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-3 border-t border-gray-100 pt-4 md:pt-6">
                        {o.items.map((i) => (
                          <div key={`${i.productId}-${i.variantId}`} className="flex items-center gap-4">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={i.image} alt="" className="w-12 h-12 rounded-lg object-contain bg-gray-50 mix-blend-multiply" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold truncate">{i.name}</p>
                              <p className="text-[10px] text-gray-400 font-bold uppercase">
                                {i.variant ? `${i.variant} · ` : ""}Qty {i.quantity}
                              </p>
                            </div>
                            <p className="text-sm font-black shrink-0">₹{(i.price * i.quantity).toLocaleString("en-IN")}</p>
                          </div>
                        ))}
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-gray-100 pt-4 mt-4 md:pt-6 md:mt-6">
                        <p className="text-lg font-black">Total ₹{o.totalAmount.toLocaleString("en-IN")}</p>
                        {o.trackingId && (
                          <Link
                            href={`/tracking/${o.trackingId}`}
                            className="text-[10px] font-black uppercase tracking-widest border-b-2 border-black pb-1 hover:text-orange-600 hover:border-orange-600"
                          >
                            Track · {o.trackingId}
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ))}

            {tab === "Addresses" && (
              <div className="bg-white rounded-2xl md:rounded-[2.5rem] border border-gray-100 p-4 sm:p-8 lg:p-16 animate-in">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 md:mb-12 gap-4">
                  <div className="space-y-2">
                    <h2 className="text-2xl md:text-3xl font-black tracking-tighter uppercase">Saved Addresses</h2>
                    <p className="text-gray-400 text-[11px] font-bold uppercase tracking-widest">Saved locations for priority fulfillment.</p>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => setEditing({ ...emptyAddress(), name: user.name, phone: user.phone })}
                    className="px-6 py-3 rounded-xl border-gray-100 text-[10px] font-black uppercase tracking-widest"
                  >
                    + New Address
                  </Button>
                </div>
                {editing && (
                  <div className="mb-8 md:mb-10 p-4 md:p-8 border-2 border-dashed border-gray-200 rounded-3xl space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Input label="Name" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
                      <Input label="Phone" value={editing.phone} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} />
                      <div className="md:col-span-2">
                        <Input label="Street Address" value={editing.street} onChange={(e) => setEditing({ ...editing, street: e.target.value })} />
                      </div>
                      <Input label="City" value={editing.city} onChange={(e) => setEditing({ ...editing, city: e.target.value })} />
                      <Input label="State" value={editing.state} onChange={(e) => setEditing({ ...editing, state: e.target.value })} />
                      <Input label="Postal Code" value={editing.postalCode} onChange={(e) => setEditing({ ...editing, postalCode: e.target.value })} />
                    </div>
                    <div className="flex gap-4">
                      <Button size="sm" onClick={saveAddress}>
                        Save Address
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
                {user.addresses.length === 0 && !editing ? (
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">No saved addresses yet.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                    {user.addresses.map((a) => (
                      <div key={a.id} className={`bg-gray-50/50 border-2 rounded-2xl md:rounded-3xl p-5 md:p-10 relative ${a.isDefault ? "border-black" : "border-gray-100"}`}>
                        {a.isDefault && (
                          <span className="absolute top-5 right-5 md:top-8 md:right-8 bg-black text-white text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full">
                            Default
                          </span>
                        )}
                        <MapPin size={24} className="text-orange-600 mb-4 md:mb-6" />
                        <p className="text-lg font-black uppercase tracking-tighter mb-4">{a.name}</p>
                        <p className="text-[13px] text-gray-500 font-bold uppercase tracking-widest leading-loose">
                          {a.street}
                          <br />
                          {a.city}
                          {a.state ? `, ${a.state}` : ""}
                          <br />
                          {a.postalCode}
                          {a.phone ? (
                            <>
                              <br />
                              {a.phone}
                            </>
                          ) : null}
                        </p>
                        <div className="mt-6 md:mt-8 flex flex-wrap gap-4 pt-5 md:pt-8 border-t border-gray-100">
                          <button
                            onClick={() => setEditing(a)}
                            className="text-[10px] font-black uppercase tracking-widest text-black hover:text-orange-600 transition-colors"
                          >
                            Edit
                          </button>
                          {!a.isDefault && (
                            <button
                              onClick={() => makePrimary(a.id)}
                              className="text-[10px] font-black uppercase tracking-widest text-black hover:text-orange-600 transition-colors"
                            >
                              Make Primary
                            </button>
                          )}
                          <button
                            onClick={() => removeAddress(a.id)}
                            className="text-[10px] font-black uppercase tracking-widest text-gray-300 hover:text-red-500 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === "Settings" && (
              <div className="bg-white rounded-2xl md:rounded-[2.5rem] border border-gray-100 p-4 sm:p-8 lg:p-16 animate-in">
                <h2 className="text-2xl md:text-3xl font-black tracking-tighter uppercase mb-6 md:mb-12">Security &amp; Preferences</h2>
                <div className="space-y-4 max-w-2xl">
                  {PREFS.map((p) => {
                    const on = prefs(p.key, p.default);
                    return (
                      <button
                        key={p.key}
                        onClick={() => togglePref(p.key, p.default)}
                        className="w-full flex items-center justify-between gap-4 p-4 md:p-6 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors cursor-pointer group text-left"
                      >
                        <div className="flex items-center gap-4">
                          {p.icon && <span className="text-orange-600">{p.icon}</span>}
                          <span className="text-xs font-black text-black uppercase tracking-widest group-hover:text-orange-600">{p.label}</span>
                        </div>
                        <div className={`w-12 h-6 rounded-full transition-all relative shrink-0 ${on ? "bg-orange-600" : "bg-gray-200"}`}>
                          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${on ? "left-7" : "left-1"}`} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense>
      <AccountContent />
    </Suspense>
  );
}
