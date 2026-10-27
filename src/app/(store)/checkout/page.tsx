"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ChevronRight, LoaderCircle, Lock, ShieldCheck, Truck } from "lucide-react";
import { computeTotals } from "@/lib/pricing";
import { useCart } from "@/stores/cart";
import { useAuth } from "@/stores/auth";
import { useCatalog } from "@/stores/catalog";
import { useUI } from "@/stores/ui";

type Step = "address" | "payment" | "confirmation";
type Method = "card" | "upi" | "cod";

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay?: any;
  }
}

const onlineEnabled = !!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

const inputCls =
  "w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 bg-[#f9f9f9] border border-[#d2d2d7] rounded-md focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors text-[11px] sm:text-[12px] md:text-[13px] font-medium text-[#1d1d1f]";
const labelCls = "text-[8px] sm:text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-[#86868b]";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart } = useCart();
  const user = useAuth((s) => s.user);
  const { tiers, fetchTiers } = useCatalog();
  const showToast = useUI((s) => s.showToast);

  const [step, setStep] = useState<Step>("address");
  const [method, setMethod] = useState<Method>(onlineEnabled ? "card" : "cod");
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ orderNumber: string; trackingId: string | null } | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", street: "", city: "", state: "", postalCode: "" });

  useEffect(() => {
    fetchTiers();
  }, [fetchTiers]);

  // Prefill from the signed-in profile and its default saved address.
  useEffect(() => {
    if (!user) return;
    const addr = user.addresses.find((a) => a.isDefault) ?? user.addresses[0];
    setForm((f) => ({
      name: f.name || addr?.name || user.name,
      email: f.email || user.email,
      phone: f.phone || addr?.phone || user.phone,
      street: f.street || addr?.street || "",
      city: f.city || addr?.city || "",
      state: f.state || addr?.state || "",
      postalCode: f.postalCode || addr?.postalCode || "",
    }));
  }, [user]);

  const totals = useMemo(
    () => computeTotals(items.map((i) => ({ productId: i.productId, name: i.name, category: i.category, price: i.price, quantity: i.quantity })), tiers),
    [items, tiers],
  );

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((prev) => ({ ...prev, [k]: e.target.value }));

  const continueToPayment = () => {
    if (items.length === 0) return setError("Your cart is empty");
    if (!form.name || !form.email || !form.phone || !form.street || !form.city || !form.postalCode) {
      return setError("Please fill in all delivery details");
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return setError("Please enter a valid email address");
    if (form.phone.replace(/\D/g, "").length < 10) return setError("Please enter a valid phone number");
    if (!/^\d{6}$/.test(form.postalCode)) return setError("Please enter a valid 6-digit postal code");
    setError("");
    setStep("payment");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const complete = (orderNumber: string, trackingId: string | null) => {
    setResult({ orderNumber, trackingId });
    clearCart();
    setStep("confirmation");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const pay = async () => {
    setError("");
    setPlacing(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity })),
          customer: { name: form.name, email: form.email, phone: form.phone },
          address: { street: form.street, city: form.city, state: form.state, postalCode: form.postalCode },
          paymentMethod: method === "cod" ? "cod" : "razorpay",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed");

      if (method === "cod") {
        complete(data.orderNumber, data.trackingId);
        return;
      }

      if (!(await loadRazorpay())) throw new Error("Could not load the payment window. Check your connection.");
      await new Promise<void>((resolve, reject) => {
        const rzp = new window.Razorpay({
          key: data.razorpay.keyId,
          amount: data.razorpay.amount,
          currency: data.razorpay.currency,
          order_id: data.razorpay.orderId,
          name: "Zuprano",
          description: `Order ${data.orderNumber}`,
          prefill: { ...data.razorpay.prefill, method: method === "upi" ? "upi" : "card" },
          theme: { color: "#EA580C" },
          handler: async (resp: RazorpayResponse) => {
            try {
              const v = await fetch("/api/checkout/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(resp),
              });
              const vd = await v.json();
              if (!v.ok) throw new Error(vd.error || "Payment verification failed");
              complete(vd.orderNumber, vd.trackingId);
              resolve();
            } catch (e) {
              reject(e);
            }
          },
          modal: { ondismiss: () => reject(new Error("Payment cancelled")) },
        });
        rzp.on("payment.failed", (r: { error?: { description?: string } }) => reject(new Error(r.error?.description || "Payment failed")));
        rzp.open();
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Checkout failed";
      setError(msg);
      showToast("error", msg);
    } finally {
      setPlacing(false);
    }
  };

  const payLabel = method === "cod" ? `Place Order ₹${totals.total.toLocaleString("en-IN")}` : `Pay ₹${totals.total.toLocaleString("en-IN")}`;

  if (items.length === 0 && step !== "confirmation") {
    return (
      <div className="bg-[#f9f9f9] min-h-[60vh] flex items-center justify-center">
        <div className="text-center p-12 bg-white rounded-2xl shadow-sm border border-[#eee] max-w-md w-full mx-6">
          <h2 className="text-2xl font-black text-[#1d1d1f] uppercase tracking-tighter mb-4">Your Cart is Empty</h2>
          <p className="text-[#86868b] text-[13px] font-medium mb-8">Add a few drops to your arsenal before checking out.</p>
          <Link
            href="/shop"
            className="block w-full bg-[#1d1d1f] text-white px-8 py-4 rounded-md text-[13px] font-black uppercase tracking-widest hover:bg-black transition-all"
          >
            Browse Shop
          </Link>
        </div>
      </div>
    );
  }

  const methods: { id: Method; label: string; hint: string; disabled: boolean }[] = [
    { id: "card", label: "Credit / Debit Card", hint: "Visa, Mastercard, RuPay & Amex via Razorpay", disabled: !onlineEnabled },
    { id: "upi", label: "UPI / Digital Wallet", hint: "GPay, PhonePe, Paytm & wallets via Razorpay", disabled: !onlineEnabled },
    { id: "cod", label: "Cash on Delivery", hint: "Pay when your order arrives", disabled: false },
  ];

  return (
    <div className="bg-[#f9f9f9] min-h-screen pt-4 sm:pt-8 md:pt-12 pb-32 sm:pb-40 md:pb-24 lg:pb-8 font-sans">
      <div className="max-w-[1200px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="mb-6 sm:mb-8 md:mb-12">
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-[#1d1d1f] tracking-tighter uppercase mb-2 sm:mb-3 md:mb-4">Secure Checkout</h1>
          <div className="flex items-center gap-1.5 sm:gap-2 text-[7px] sm:text-[8px] md:text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-[#86868b] flex-wrap">
            <span className={step === "address" ? "text-orange-600" : ""}>Shipping Address</span>
            <ChevronRight size={12} className="text-[#d2d2d7]" />
            <span className={step === "payment" ? "text-orange-600" : ""}>Secure Payment</span>
            <ChevronRight size={12} className="text-[#d2d2d7]" />
            <span className={step === "confirmation" ? "text-orange-600" : ""}>Order Complete</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 md:gap-8 lg:gap-12">
          <div className="lg:col-span-7">
            {step === "address" && (
              <div className="bg-white rounded-lg md:rounded-xl lg:rounded-2xl shadow-sm border border-[#eee] p-4 sm:p-6 md:p-8 lg:p-10 space-y-4 sm:space-y-6 md:space-y-8 animate-in">
                <div className="flex items-center gap-2 sm:gap-3 border-b border-[#eee] pb-3 sm:pb-4">
                  <div className="w-6 sm:w-7 md:w-8 h-6 sm:h-7 md:h-8 rounded-full bg-black text-white flex items-center justify-center font-bold text-[10px] sm:text-xs md:text-sm">1</div>
                  <h2 className="text-base sm:text-lg md:text-xl font-black text-[#1d1d1f] tracking-tighter uppercase">Delivery Details</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                  <div className="space-y-1.5 sm:space-y-2 sm:col-span-2">
                    <label className={labelCls}>Full Name</label>
                    <input type="text" value={form.name} onChange={set("name")} autoComplete="name" className={inputCls} />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2 sm:col-span-2">
                    <label className={labelCls}>Email Address</label>
                    <input type="email" value={form.email} onChange={set("email")} autoComplete="email" className={inputCls} />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2 sm:col-span-2">
                    <label className={labelCls}>Phone Number</label>
                    <input type="tel" value={form.phone} onChange={set("phone")} autoComplete="tel" className={inputCls} />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2 sm:col-span-2">
                    <label className={labelCls}>Street Address</label>
                    <input type="text" value={form.street} onChange={set("street")} autoComplete="street-address" className={inputCls} />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <label className={labelCls}>City</label>
                    <input type="text" value={form.city} onChange={set("city")} autoComplete="address-level2" className={inputCls} />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <label className={labelCls}>Postal Code</label>
                    <input type="text" inputMode="numeric" value={form.postalCode} onChange={set("postalCode")} autoComplete="postal-code" className={inputCls} />
                  </div>
                </div>
                {error && <p className="text-[10px] font-black uppercase tracking-widest text-red-600">{error}</p>}
                <div className="pt-6 lg:flex hidden">
                  <button
                    onClick={continueToPayment}
                    className="w-full bg-[#1d1d1f] text-white px-6 md:px-8 py-4 md:py-5 rounded-md text-[12px] md:text-[13px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-sm flex items-center justify-center gap-3"
                  >
                    Continue to Payment
                  </button>
                </div>
              </div>
            )}

            {step === "payment" && (
              <div className="bg-white rounded-lg md:rounded-xl lg:rounded-2xl shadow-sm border border-[#eee] p-4 sm:p-6 md:p-8 lg:p-10 space-y-4 sm:space-y-6 md:space-y-8 animate-in">
                <div className="flex items-center gap-2 sm:gap-3 border-b border-[#eee] pb-3 sm:pb-4">
                  <div className="w-6 sm:w-7 md:w-8 h-6 sm:h-7 md:h-8 rounded-full bg-black text-white flex items-center justify-center font-bold text-[10px] sm:text-xs md:text-sm">2</div>
                  <h2 className="text-base sm:text-lg md:text-xl font-black text-[#1d1d1f] tracking-tighter uppercase flex items-center gap-2">
                    <Lock size={18} className="text-orange-600" /> Secure Payment
                  </h2>
                </div>
                <div className="bg-[#f9f9f9] rounded-lg p-3 text-[10px] sm:text-[11px] text-[#86868b] font-medium">
                  Delivering to <span className="text-[#1d1d1f] font-bold">{form.name}</span>, {form.street}, {form.city} - {form.postalCode}.{" "}
                  <button onClick={() => setStep("address")} className="text-orange-600 font-bold">
                    Change
                  </button>
                </div>
                <div className="space-y-3 sm:space-y-4">
                  {methods.map((m) => (
                    <label
                      key={m.id}
                      className={`border-2 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 transition flex items-center justify-between gap-3 group ${
                        m.disabled ? "opacity-40 cursor-not-allowed border-[#eee]" : "cursor-pointer"
                      } ${method === m.id ? "border-black bg-[#f9f9f9]" : "border-[#eee] hover:border-black"}`}
                    >
                      <div className="flex items-center gap-2 sm:gap-3">
                        <input
                          type="radio"
                          name="payment"
                          checked={method === m.id}
                          disabled={m.disabled}
                          onChange={() => setMethod(m.id)}
                          className="w-4 h-4 accent-black flex-shrink-0"
                        />
                        <div>
                          <span
                            className={`block font-bold text-[10px] sm:text-xs md:text-sm uppercase tracking-widest ${
                              method === m.id ? "text-[#1d1d1f]" : "text-[#86868b] group-hover:text-[#1d1d1f]"
                            }`}
                          >
                            {m.label}
                          </span>
                          <span className="block text-[9px] sm:text-[10px] text-[#86868b] mt-0.5">
                            {m.disabled ? "Online payments are not configured yet" : m.hint}
                          </span>
                        </div>
                      </div>
                      {m.id !== "cod" && (
                        <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                          <div className="w-6 sm:w-7 h-4 sm:h-5 bg-[#eee] rounded" />
                          <div className="w-6 sm:w-7 h-4 sm:h-5 bg-[#eee] rounded" />
                        </div>
                      )}
                    </label>
                  ))}
                </div>
                {error && <p className="text-[10px] font-black uppercase tracking-widest text-red-600">{error}</p>}
                <div className="flex-col sm:flex-row gap-3 sm:gap-4 pt-4 sm:pt-6 hidden lg:flex">
                  <button
                    onClick={() => setStep("address")}
                    className="flex-1 px-4 sm:px-6 py-3 sm:py-4 border-2 border-[#eee] text-[#1d1d1f] rounded-md text-[11px] sm:text-[12px] md:text-[13px] font-black uppercase tracking-widest hover:border-black transition"
                  >
                    Back to Shipping
                  </button>
                  <button
                    onClick={pay}
                    disabled={placing}
                    className="flex-1 bg-[#1d1d1f] text-white px-6 sm:px-8 py-3 sm:py-4 md:py-5 rounded-md text-[11px] sm:text-[12px] md:text-[13px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {placing ? <LoaderCircle size={16} className="animate-spin" /> : <Lock size={16} />} {payLabel}
                  </button>
                </div>
              </div>
            )}

            {step === "confirmation" && result && (
              <div className="bg-white rounded-lg md:rounded-xl lg:rounded-2xl shadow-sm border border-[#eee] p-6 sm:p-8 md:p-10 lg:p-16 space-y-4 sm:space-y-6 md:space-y-8 animate-in text-center">
                <div className="w-12 sm:w-16 md:w-20 lg:w-24 h-12 sm:h-16 md:h-20 lg:h-24 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 md:mb-6">
                  <ShieldCheck className="text-orange-600 w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12" />
                </div>
                <div className="space-y-1.5 sm:space-y-2 md:space-y-4">
                  <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-[#1d1d1f] tracking-tighter uppercase">Order Confirmed</h2>
                  <p className="text-[9px] sm:text-[10px] md:text-[11px] lg:text-[13px] font-medium text-[#86868b] uppercase tracking-widest">
                    Order <span className="text-[#1d1d1f] font-black">#{result.orderNumber}</span> has been placed.
                  </p>
                  {result.trackingId && (
                    <p className="text-[9px] sm:text-[10px] md:text-[11px] font-medium text-[#86868b] uppercase tracking-widest">
                      Tracking ID <span className="text-[#1d1d1f] font-black">{result.trackingId}</span>
                    </p>
                  )}
                  <p className="text-[12px] sm:text-sm md:text-base font-medium text-[#1d1d1f] max-w-sm mx-auto leading-relaxed">
                    Keep your tracking ID handy to follow your delivery in real time.
                  </p>
                </div>
                <div className="pt-6 sm:pt-8">
                  <button
                    onClick={() => router.push(result.trackingId ? `/tracking/${result.trackingId}` : "/account?tab=Orders")}
                    className="bg-[#1d1d1f] text-white px-6 sm:px-8 md:px-10 py-3 sm:py-4 rounded-md text-[11px] sm:text-[12px] md:text-[13px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-sm"
                  >
                    Track My Order
                  </button>
                </div>
              </div>
            )}
          </div>

          {step !== "confirmation" && (
            <div className="lg:col-span-5">
              <div className="bg-white rounded-lg md:rounded-xl lg:rounded-2xl shadow-sm border border-[#eee] p-4 sm:p-6 lg:p-8 lg:sticky lg:top-24 space-y-4 sm:space-y-6 lg:space-y-8">
                <h3 className="font-black text-[#1d1d1f] tracking-tighter uppercase border-b border-[#eee] pb-3 sm:pb-4 text-sm sm:text-base md:text-lg">Order Summary</h3>
                <div className="space-y-4 sm:space-y-6 max-h-[40vh] overflow-y-auto pr-2 no-scrollbar">
                  {items.map((i) => (
                    <div key={i.id} className="flex gap-3 sm:gap-4">
                      <div className="w-14 sm:w-16 h-14 sm:h-16 bg-[#f9f9f9] rounded-lg overflow-visible border border-[#eee] flex items-center justify-center relative flex-shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={i.thumbnail} alt="" className="w-full h-full object-contain mix-blend-multiply" />
                        <span className="absolute -top-2 -right-2 w-5 h-5 bg-[#1d1d1f] text-white text-[9px] sm:text-[10px] font-bold flex items-center justify-center rounded-full">
                          {i.quantity}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[#1d1d1f] text-[11px] sm:text-sm line-clamp-1">{i.name}</p>
                        <p className="text-[8px] sm:text-[9px] uppercase font-black tracking-widest text-[#86868b] mb-1">{i.variantLabel === "STD" ? "" : i.variantLabel}</p>
                        <p className="text-xs sm:text-sm font-black text-[#1d1d1f]">₹{(i.price * i.quantity).toLocaleString("en-IN")}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="space-y-3 sm:space-y-4 border-t border-[#eee] pt-4 sm:pt-6">
                  <Row label="Subtotal" value={`₹${totals.subtotal.toLocaleString("en-IN")}`} />
                  {totals.discount > 0 && <Row label="Bulk Discount" value={`−₹${totals.discount.toLocaleString("en-IN")}`} accent />}
                  <Row label="GST (18%)" value={`₹${totals.tax.toLocaleString("en-IN")}`} />
                  <div className="flex justify-between items-center text-[11px] sm:text-[12px] md:text-[13px] font-semibold text-[#86868b]">
                    <span>Express Shipping</span>
                    <span className="text-orange-600 font-black uppercase tracking-widest text-[9px] sm:text-[10px] md:text-[11px]">
                      {totals.shipping === 0 ? "FREE" : `₹${totals.shipping}`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-3 sm:pt-4 border-t border-[#eee]">
                    <span className="text-xs sm:text-sm font-black tracking-widest uppercase text-[#1d1d1f]">Total to Pay</span>
                    <span className="text-lg sm:text-xl md:text-2xl font-black text-[#1d1d1f] tracking-tight">₹{totals.total.toLocaleString("en-IN")}</span>
                  </div>
                </div>
                <div className="bg-[#f9f9f9] rounded-lg sm:rounded-xl p-3 sm:p-4 flex flex-col gap-3 sm:gap-4 border border-[#eee] mt-3 sm:mt-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <ShieldCheck size={18} className="text-orange-600 flex-shrink-0" />
                    <p className="text-[8px] sm:text-[9px] md:text-[10px] font-black text-[#1d1d1f] uppercase tracking-[0.1em]">256-bit Secure Encryption</p>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Truck size={18} className="text-orange-600 flex-shrink-0" />
                    <p className="text-[8px] sm:text-[9px] md:text-[10px] font-black text-[#1d1d1f] uppercase tracking-[0.1em]">Ships same day if ordered before 2PM</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step !== "confirmation" && (
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#eee] p-3 sm:p-4 shadow-xl z-40 safe-bottom">
              {step === "address" ? (
                <button
                  onClick={continueToPayment}
                  className="w-full bg-[#1d1d1f] text-white px-4 sm:px-6 py-3 sm:py-4 rounded-lg text-[11px] sm:text-[12px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-sm"
                >
                  Continue to Payment
                </button>
              ) : (
                <button
                  onClick={pay}
                  disabled={placing}
                  className="w-full bg-[#1d1d1f] text-white px-4 sm:px-6 py-3 sm:py-4 rounded-lg text-[11px] sm:text-[12px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {placing ? <LoaderCircle size={14} className="animate-spin" /> : <Lock size={14} />} {payLabel}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between items-center text-[11px] sm:text-[12px] md:text-[13px] font-semibold text-[#86868b]">
      <span>{label}</span>
      <span className={accent ? "text-green-600" : "text-[#1d1d1f]"}>{value}</span>
    </div>
  );
}
