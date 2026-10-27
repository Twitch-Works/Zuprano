"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Input } from "./ui";
import { formatDate, formatDateTime } from "@/lib/format";
import type { OrderStatus, StatusEvent } from "@/lib/types";

interface TrackingResult {
  orderNumber: string;
  trackingId: string | null;
  status: OrderStatus;
  carrier: string;
  estimatedDelivery: string;
  destination: string;
  history: StatusEvent[];
}

const LABELS: Record<OrderStatus, { title: string; details: string }> = {
  pending: { title: "Order Placed", details: "We have received your order" },
  processing: { title: "Confirmed", details: "Order confirmed and being packed" },
  shipped: { title: "Shipped", details: "Parcel shipped from warehouse" },
  delivered: { title: "Delivered", details: "Package delivered successfully" },
  cancelled: { title: "Cancelled", details: "This order was cancelled" },
};

export function TrackingView({ initialId = "" }: { initialId?: string }) {
  const [id, setId] = useState(initialId);
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const track = useCallback(async (value: string) => {
    if (!value.trim()) return setError("Please enter a tracking ID");
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/tracking?q=${encodeURIComponent(value.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not find that order");
      setResult(data);
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : "Could not find that order");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialId) track(initialId);
  }, [initialId, track]);

  const events = result ? [...result.history].reverse() : [];
  const statusLabel = result ? (result.status === "processing" ? "confirmed" : result.status) : "";

  return (
    <div className="bg-[#fcfcfc] min-h-[80vh] pt-12 pb-24 font-sans">
      <div className="max-w-[800px] mx-auto px-6">
        <div className="text-center mb-12">
          <h1 className="text-3xl lg:text-4xl font-black text-[#1d1d1f] tracking-tighter uppercase mb-2">Track Order</h1>
          <p className="text-[11px] font-black uppercase tracking-widest text-[#86868b]">Real-time delivery updates</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-[#eee] p-8 md:p-10 mb-8 max-w-2xl mx-auto animate-in">
          <div className="flex flex-col sm:flex-row gap-4 relative">
            <div className="flex-1 w-full">
              <Input placeholder="E.g., TRK123456789" value={id} onChange={(e) => setId(e.target.value)} onKeyDown={(e) => e.key === "Enter" && track(id)} />
            </div>
            <Button onClick={() => track(id)} disabled={loading} className="w-full sm:w-auto h-[50px]">
              {loading ? "Processing..." : "Track"}
            </Button>
          </div>
          {error && <p className="text-[10px] font-black uppercase tracking-widest text-red-600 mt-4 text-center">{error}</p>}
        </div>

        {result && (
          <div className="space-y-8 max-w-2xl mx-auto animate-in">
            <div className="bg-white rounded-2xl shadow-sm border border-[#eee] p-8 md:p-10 text-center">
              <span className="inline-block px-3 py-1 bg-orange-50 text-orange-600 text-[10px] font-black uppercase tracking-[0.2em] rounded mb-4">{statusLabel}</span>
              <h2 className="text-3xl font-black text-[#1d1d1f] tracking-tight mb-2">
                {result.status === "cancelled" ? "—" : formatDate(result.estimatedDelivery)}
              </h2>
              <p className="text-[13px] font-medium text-[#86868b] uppercase tracking-widest">
                {result.status === "delivered" ? "Delivered" : "Estimated Delivery"}
              </p>
              <p className="text-[11px] font-bold text-[#86868b] uppercase tracking-widest mt-4">
                Order #{result.orderNumber} · {result.carrier}
                {result.trackingId ? ` · ${result.trackingId}` : ""}
              </p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-[#eee] p-8 md:p-10">
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#1d1d1f] mb-8 border-b border-[#eee] pb-4">Tracking History</h3>
              <div className="space-y-8 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-[#eee] before:to-transparent">
                {events.map((ev, i) => (
                  <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                    <div className="flex items-center justify-center w-5 h-5 rounded-full border-4 border-white bg-black text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10" />
                    <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.5rem)] p-4 rounded-xl border border-[#eee] bg-[#f9f9f9] shadow-sm">
                      <div className="flex items-center justify-between mb-1 gap-2">
                        <div className="font-bold text-[#1d1d1f] text-sm">{LABELS[ev.status]?.title ?? ev.status}</div>
                        <div className="text-[9px] font-black text-[#86868b] uppercase tracking-widest">{formatDate(ev.at)}</div>
                      </div>
                      <div className="text-[12px] text-[#86868b] mb-2">
                        {ev.status === "delivered" && result.destination ? result.destination : "Zuprano Fulfilment Centre"} · {formatDateTime(ev.at)}
                      </div>
                      <div className="text-[11px] font-bold text-[#1d1d1f]">{ev.note || LABELS[ev.status]?.details}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {!result && !loading && (
          <div className="text-center mt-16 max-w-sm mx-auto">
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#1d1d1f] mb-4">How it works</h3>
            <p className="text-[13px] text-[#86868b] font-medium leading-relaxed">
              Find your tracking ID in your order confirmation email and enter it above to see real-time updates directly from our courier partners.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
