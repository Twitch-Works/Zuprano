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
      <div className="bg-white border-b border-gray-100 pt-20 pb-12">
        <div className="max-w-full mx-auto px-8 lg:px-24 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="bg-orange-600 text-white text-[9px] font-black uppercase tracking-[0.3em] px-3 py-1 rounded-full">Elite Member</span>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Member ID: {memberId}</span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-black text-[#1d1d1f] tracking-tighter uppercase leading-none">
              Control <span className="text-orange-600">Center.</span>
            </h1>
          </div>
          <div className="flex items-center gap-10 pb-2">
            <div className="text-right">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Last Login</p>
              <p className="text-sm font-black uppercase tracking-tighter">{lastLogin ? formatDate(lastLogin) : "Today"}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</p>
              <p className="text-sm font-black uppercase tracking-tighter text-green-600 flex items-center gap-2 justify-end">
                <ShieldCheck size={14} /> Encrypted
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-full mx-auto px-8 lg:px-24 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          <aside className="lg:col-span-3 xl:col-span-2">
            <div className="sticky top-32 space-y-1">
              <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em] mb-6 px-4">Navigation</p>
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`w-full flex items-center justify-between px-5 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all group ${
                    tab === t.id ? "bg-black text-white shadow-xl shadow-black/10 scale-[1.02]" : "text-gray-400 hover:text-black hover:bg-white"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className={tab === t.id ? "text-orange-500" : "text-gray-300 group-hover:text-black"}>{t.icon}</span>
                    {t.label}
                  </div>
                  {tab === t.id && <ChevronRight size={14} className="text-white/40" />}
                </button>
              ))}
              <div className="pt-10 mt-10 border-t border-gray-100 px-4">
                <button
                  onClick={terminate}
                  className="flex items-center gap-3 text-red-500 hover:text-red-700 transition-colors text-[10px] font-black uppercase tracking-widest"
                >
                  <LogOut size={16} /> Terminate Session
                </button>
              </div>
            </div>
          </aside>

          <main className="lg:col-span-9 xl:col-span-10">
            {tab === "Profile" && (
              <div className="bg-white rounded-[2.5rem] border border-gray-100 p-10 lg:p-16 animate-in">
                <div className="max-w-4xl space-y-12">
                  <div className="space-y-2">
                    <h2 className="text-3xl font-black tracking-tighter uppercase">Identity Details</h2>
                    <p className="text-gray-400 text-[11px] font-bold uppercase tracking-widest">Update your personal encryption and contact nodes.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Input label="Full Identity Name" value={profile.name} onChange={(e) => setProfile((prev) => ({ ...prev, name: e.target.value }))} />
                    <Input label="Primary Email Node" type="email" value={user.email} disabled />
                    <Input label="Secure Contact Number" value={profile.phone} onChange={(e) => setProfile((prev) => ({ ...prev, phone: e.target.value }))} />
                    <Input label="Date of Activation" value={formatDate(user.createdAt)} disabled />
                  </div>
                  <div className="pt-8 flex items-center gap-6">
                    <Button isLoading={saving} onClick={saveProfile} className="px-10 py-5 rounded-xl uppercase tracking-widest text-xs">
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
                <div className="bg-white rounded-[2.5rem] border border-gray-100 p-16 flex flex-col items-center justify-center text-center min-h-[600px] animate-in">
                  <div className="relative mb-10">
                    <div className="w-40 h-40 bg-gray-50 rounded-full flex items-center justify-center border border-dashed border-gray-200">
                      <Package size={48} className="text-gray-200" />
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-orange-600 text-white p-3 rounded-full shadow-xl">
                      <Clock size={20} />
                    </div>
                  </div>
                  <h3 className="text-4xl font-black tracking-tighter uppercase mb-4">No Drops Detected</h3>
                  <p className="text-gray-400 text-sm font-medium max-w-sm mx-auto mb-10 leading-relaxed uppercase tracking-tight">
                    Your transaction history is empty. Launch your first mission with our latest collection.
                  </p>
                  <Link href="/shop">
                    <Button className="px-12 py-5 rounded-full text-xs font-black uppercase tracking-widest bg-black text-white hover:bg-orange-600 transition-colors">
                      Browse Arsenal
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-6 animate-in">
                  {orders.map((o) => (
                    <div key={o.id} className="bg-white rounded-3xl border border-gray-100 p-8">
                      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Order</p>
                          <p className="text-xl font-black tracking-tight">#{o.orderNumber}</p>
                          <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mt-1">{formatDate(o.createdAt)}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${STATUS_STYLE[o.status]}`}>{o.status}</span>
                          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-gray-100 text-gray-600">
                            {o.paymentMethod === "cod" ? "COD" : o.paymentStatus}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-3 border-t border-gray-100 pt-6">
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
                            <p className="text-sm font-black">₹{(i.price * i.quantity).toLocaleString("en-IN")}</p>
                          </div>
                        ))}
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-gray-100 pt-6 mt-6">
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
              <div className="bg-white rounded-[2.5rem] border border-gray-100 p-10 lg:p-16 animate-in">
                <div className="flex justify-between items-center mb-12 gap-4">
                  <div className="space-y-2">
                    <h2 className="text-3xl font-black tracking-tighter uppercase">Delivery Nodes</h2>
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
                  <div className="mb-10 p-8 border-2 border-dashed border-gray-200 rounded-3xl space-y-6">
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {user.addresses.map((a) => (
                      <div key={a.id} className={`bg-gray-50/50 border-2 rounded-3xl p-10 relative ${a.isDefault ? "border-black" : "border-gray-100"}`}>
                        {a.isDefault && (
                          <span className="absolute top-8 right-8 bg-black text-white text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full">
                            Primary Node
                          </span>
                        )}
                        <MapPin size={24} className="text-orange-600 mb-6" />
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
                        <div className="mt-8 flex gap-4 pt-8 border-t border-gray-100">
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
              <div className="bg-white rounded-[2.5rem] border border-gray-100 p-10 lg:p-16 animate-in">
                <h2 className="text-3xl font-black tracking-tighter uppercase mb-12">Security &amp; Preferences</h2>
                <div className="space-y-4 max-w-2xl">
                  {PREFS.map((p) => {
                    const on = prefs(p.key, p.default);
                    return (
                      <button
                        key={p.key}
                        onClick={() => togglePref(p.key, p.default)}
                        className="w-full flex items-center justify-between p-6 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors cursor-pointer group text-left"
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
