"use client";

import { useState } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { useCustomers, useDealers, useOrders } from "@/lib/admin/data";
import { DAY, RANGES, dealerStats, fmtPct, inRange, liveOrders, paidOrders, pctChange, productStats, revenueBuckets, sum, type RangeKey } from "@/lib/admin/analytics";
import { Loading } from "@/components/admin/ui";
import { formatINR } from "@/lib/format";

export default function AnalyticsPage() {
  const { orders, loading: lo } = useOrders();
  const { users, loading: lu } = useCustomers();
  const { dealers, loading: ld } = useDealers();
  const [range, setRange] = useState<RangeKey>("week");
  if (lo || lu || ld) return <Loading label="Loading analytics..." />;

  const days = RANGES[range].days;
  const now = Date.now();
  const cur = inRange(orders, now - days * DAY);
  const prev = inRange(orders, now - 2 * days * DAY, now - days * DAY);
  const newUsers = (from: number, to: number) => users.filter((u) => new Date(u.createdAt).getTime() >= from && new Date(u.createdAt).getTime() < to).length;
  const activeDealers = dealers.filter((d) => d.status === "active");

  const cards = [
    { label: "Revenue", value: formatINR(sum(paidOrders(cur))), change: pctChange(sum(paidOrders(cur)), sum(paidOrders(prev))), color: "bg-blue-50" },
    { label: "Orders", value: liveOrders(cur).length.toLocaleString("en-IN"), change: pctChange(liveOrders(cur).length, liveOrders(prev).length), color: "bg-green-50" },
    {
      label: "Customers",
      value: users.length.toString(),
      change: pctChange(newUsers(now - days * DAY, now), newUsers(now - 2 * days * DAY, now - days * DAY)),
      color: "bg-purple-50",
    },
    {
      label: "Active Dealers",
      value: activeDealers.length.toString(),
      // Growth of the network: dealers onboarded this period vs the previous one.
      change: pctChange(
        dealers.filter((d) => new Date(d.createdAt).getTime() >= now - days * DAY).length,
        dealers.filter((d) => new Date(d.createdAt).getTime() >= now - 2 * days * DAY && new Date(d.createdAt).getTime() < now - days * DAY).length,
      ),
      color: "bg-orange-50",
    },
  ];

  const buckets = revenueBuckets(orders, days);
  const maxBucket = Math.max(...buckets.map((b) => b.revenue), 1);
  const top = productStats(cur).slice(0, 4);
  const maxTop = Math.max(...top.map((t) => t.revenue), 1);
  const placed = cur.length;
  const funnel = [
    { stage: "Orders Placed", count: placed },
    { stage: "Payment Received", count: cur.filter((o) => o.paymentStatus === "paid" || (o.paymentMethod === "cod" && o.status === "delivered")).length },
    { stage: "Processing", count: cur.filter((o) => ["processing", "shipped", "delivered"].includes(o.status)).length },
    { stage: "Shipped", count: cur.filter((o) => ["shipped", "delivered"].includes(o.status)).length },
    { stage: "Delivered", count: cur.filter((o) => o.status === "delivered").length },
  ];
  const dealerRows = dealerStats(dealers, orders).slice(0, 8);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics &amp; Insights</h1>
          <p className="text-gray-600 mt-2">Detailed business performance and user metrics</p>
        </div>
        <div className="flex gap-2">
          <select
            value={range}
            onChange={(e) => setRange(e.target.value as RangeKey)}
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            {(["week", "month", "quarter"] as const).map((k) => (
              <option key={k} value={k}>
                {RANGES[k].label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((c) => {
          const up = c.change >= 0;
          const Icon = up ? TrendingUp : TrendingDown;
          return (
            <div key={c.label} className={`${c.color} rounded-lg p-6 border border-gray-100 hover:shadow-md transition-shadow duration-300`}>
              <h3 className="text-sm font-medium text-gray-600">{c.label}</h3>
              <div className="flex items-baseline justify-between mt-2">
                <p className="text-2xl font-bold text-gray-900">{c.value}</p>
                <div className={`flex items-center text-xs font-semibold ${up ? "text-green-600" : "text-red-600"}`}>
                  <Icon size={14} className="mr-1" />
                  {fmtPct(c.change)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow duration-300">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Revenue Trend</h2>
          <p className="text-sm text-gray-600 mb-6">{RANGES[range].label}</p>
          <div className="h-64 flex items-end justify-around gap-2">
            {buckets.map((b) => (
              <div key={b.label} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                <div className="absolute -top-1 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap -translate-y-full">
                  {formatINR(b.revenue)} · {b.orders} orders
                </div>
                <div className="w-full bg-orange-500 rounded-t hover:bg-orange-600 transition-colors min-h-[2px]" style={{ height: `${(b.revenue / maxBucket) * 100}%` }} />
                <span className="text-[10px] text-gray-600 mt-2 whitespace-nowrap">{b.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow duration-300">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Top Products</h2>
          <p className="text-sm text-gray-600 mb-6">By revenue</p>
          <div className="space-y-4">
            {top.length === 0 && <p className="text-sm text-gray-500">No sales in this period yet.</p>}
            {top.map((t) => (
              <div key={t.key}>
                <div className="flex items-center justify-between mb-2 gap-4">
                  <span className="text-sm font-medium text-gray-900 truncate">{t.name}</span>
                  <span className="text-sm font-bold text-orange-600 whitespace-nowrap">{formatINR(t.revenue)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-orange-500 h-2 rounded-full transition-all" style={{ width: `${(t.revenue / maxTop) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow duration-300">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Conversion Funnel</h2>
        <p className="text-sm text-gray-600 mb-6">Order journey metrics</p>
        <div className="space-y-4">
          {funnel.map((f) => {
            const rate = placed ? (f.count / placed) * 100 : 0;
            return (
              <div key={f.stage}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">{f.stage}</span>
                  <span className="text-sm text-gray-600">
                    {f.count.toLocaleString("en-IN")} ({rate.toFixed(rate % 1 ? 1 : 0)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-blue-500 h-3 rounded-full transition-all" style={{ width: `${rate}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow duration-300">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Dealer Performance</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Dealer Name</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Orders</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Revenue</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Growth (30d)</th>
              </tr>
            </thead>
            <tbody>
              {dealerRows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-500">
                    No dealers yet.
                  </td>
                </tr>
              ) : (
                dealerRows.map((d) => (
                  <tr key={d.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 font-medium text-gray-900">{d.name}</td>
                    <td className="py-3 px-4 text-right text-gray-700">{d.totalOrders}</td>
                    <td className="py-3 px-4 text-right font-medium text-gray-900">{formatINR(d.totalRevenue)}</td>
                    <td className={`py-3 px-4 text-right font-medium ${d.growth >= 0 ? "text-green-600" : "text-red-600"}`}>{fmtPct(d.growth)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
