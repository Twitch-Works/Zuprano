"use client";

import { useState } from "react";
import { ChartColumn, Download, Package, TrendingUp, Users } from "lucide-react";
import { useDealers, useOrders, useProducts } from "@/lib/admin/data";
import { DAY, RANGES, fmtPct, inRange, liveOrders, monthlyTrend, paidOrders, pctChange, productStats, sum, type RangeKey } from "@/lib/admin/analytics";
import { Loading, downloadCsv } from "@/components/admin/ui";
import { formatINR, formatLakh } from "@/lib/format";
import type { Order } from "@/lib/types";

function monthWindow(offset: number) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - offset, 1).getTime();
  const end = new Date(now.getFullYear(), now.getMonth() - offset + 1, 1).getTime();
  return [start, end] as const;
}

const aov = (orders: Order[]) => (orders.length ? sum(orders) / orders.length : 0);

export default function ReportsPage() {
  const { orders, loading: lo } = useOrders();
  const { products, loading: lp } = useProducts();
  const { dealers, loading: ld } = useDealers();
  const [range, setRange] = useState<RangeKey>("month");
  if (lo || lp || ld) return <Loading label="Loading reports..." />;

  const now = Date.now();
  const days = RANGES[range].days;
  const ranged = inRange(orders, now - days * DAY);
  const prevRanged = inRange(orders, now - 2 * days * DAY, now - days * DAY);

  const [thisStart] = monthWindow(0);
  const [lastStart, lastEnd] = monthWindow(1);
  const thisMonth = liveOrders(inRange(orders, thisStart));
  const lastMonth = liveOrders(inRange(orders, lastStart, lastEnd));
  const growth = pctChange(sum(thisMonth), sum(lastMonth));

  const cards = [
    { title: "Sales Report", icon: TrendingUp, description: "Monthly sales performance and trends", color: "bg-blue-50", value: formatINR(sum(paidOrders(orders))), subtitle: "Total Sales (All Time)" },
    { title: "Dealer Performance", icon: ChartColumn, description: "Top performing dealers and rankings", color: "bg-green-50", value: dealers.filter((d) => d.status === "active").length.toString(), subtitle: "Active Dealers" },
    { title: "Product Analytics", icon: Package, description: "Best selling products and categories", color: "bg-purple-50", value: products.length.toString(), subtitle: "Total Products" },
    { title: "Revenue Trends", icon: Users, description: "Revenue growth and forecasting", color: "bg-orange-50", value: fmtPct(growth), subtitle: "Growth vs Last Month" },
  ];

  const trend = monthlyTrend(orders, 4);
  const maxSales = Math.max(...trend.map((t) => t.sales), 1);

  const curStats = productStats(ranged);
  const prevStats = new Map(productStats(prevRanged).map((p) => [p.key, p.revenue]));
  const topProducts = curStats.slice(0, 4).map((p) => ({ ...p, trend: pctChange(p.revenue, prevStats.get(p.key) ?? 0) }));
  const topDealers = [...dealers].sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 4);

  // Dealer retention: of dealers who ordered last month, how many ordered again this month.
  const lastDealers = new Set(lastMonth.map((o) => o.dealerId).filter(Boolean));
  const thisDealers = new Set(thisMonth.map((o) => o.dealerId).filter(Boolean));
  const retained = [...lastDealers].filter((d) => thisDealers.has(d)).length;
  const retention = lastDealers.size ? (retained / lastDealers.size) * 100 : 0;

  // Repeat orders: share of customers (by email/phone) with more than one order.
  const repeatRate = (list: Order[]) => {
    const counts = new Map<string, number>();
    list.forEach((o) => {
      const k = (o.customerEmail || o.customerPhone || o.customerName).toLowerCase();
      counts.set(k, (counts.get(k) ?? 0) + 1);
    });
    return counts.size ? ([...counts.values()].filter((c) => c > 1).length / counts.size) * 100 : 0;
  };
  const paidRate = (list: Order[]) => (list.length ? (list.filter((o) => o.paymentStatus === "paid").length / list.length) * 100 : 0);
  const prevMonthAll = inRange(orders, lastStart, lastEnd);
  const thisMonthAll = inRange(orders, thisStart);

  const kpis = [
    { label: "Avg Order Value", value: formatINR(aov(thisMonth)), prev: formatINR(aov(lastMonth)), change: pctChange(aov(thisMonth), aov(lastMonth)) },
    { label: "Payment Success Rate", value: `${paidRate(thisMonthAll).toFixed(1)}%`, prev: `${paidRate(prevMonthAll).toFixed(1)}%`, change: pctChange(paidRate(thisMonthAll), paidRate(prevMonthAll)) },
    { label: "Dealer Retention", value: `${retention.toFixed(0)}%`, prev: `${lastDealers.size} active`, change: pctChange(thisDealers.size, lastDealers.size) },
    {
      label: "Repeat Orders",
      value: `${repeatRate(liveOrders(orders)).toFixed(0)}%`,
      prev: `${repeatRate(liveOrders(inRange(orders, 0, thisStart))).toFixed(0)}%`,
      change: pctChange(repeatRate(liveOrders(orders)), repeatRate(liveOrders(inRange(orders, 0, thisStart)))),
    },
  ];

  const exportReport = () =>
    downloadCsv(`zuprano-report-${range}-${new Date().toISOString().slice(0, 10)}.csv`, [
      ["Report", RANGES[range].label],
      ["Generated", new Date().toLocaleString("en-IN")],
      [],
      ["Summary", "Value"],
      ["Orders", ranged.length],
      ["Revenue (paid)", sum(paidOrders(ranged))],
      ["Revenue (all live orders)", sum(liveOrders(ranged))],
      ["Avg order value", Math.round(aov(liveOrders(ranged)))],
      [],
      ["Product", "Units", "Revenue"],
      ...curStats.map((p) => [p.name, p.units, p.revenue]),
      [],
      ["Dealer", "Orders", "Revenue", "Rating"],
      ...topDealers.map((d) => [d.name, d.totalOrders, d.totalRevenue, d.rating]),
    ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports &amp; Analytics</h1>
          <p className="text-gray-600 mt-2">Analyze performance and generate business insights</p>
        </div>
        <div className="flex gap-2">
          <select
            value={range}
            onChange={(e) => setRange(e.target.value as RangeKey)}
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            {(Object.keys(RANGES) as RangeKey[]).map((k) => (
              <option key={k} value={k}>
                {RANGES[k].label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={exportReport}
            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors duration-150"
          >
            <Download size={18} /> Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map(({ title, icon: Icon, description, color, value, subtitle }) => (
          <div key={title} className={`${color} rounded-lg p-6 border border-gray-100 hover:shadow-md transition-shadow duration-300`}>
            <div className="flex items-start justify-between mb-4">
              <Icon size={24} className="text-gray-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
            <p className="text-sm text-gray-600 mb-4">{description}</p>
            <div className="border-t border-gray-200 pt-4">
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-600 mt-1">{subtitle}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow duration-300">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Sales Trend (Last 4 Months)</h2>
        <div className="space-y-4">
          {trend.map((t) => (
            <div key={t.month} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">{t.month}</span>
                <div className="flex gap-6 text-sm">
                  <span className="text-gray-600">
                    Dealers: <span className="font-medium text-gray-900">{t.dealers}</span>
                  </span>
                  <span className="text-gray-600">
                    Orders: <span className="font-medium text-gray-900">{t.orders}</span>
                  </span>
                </div>
              </div>
              <div className="w-full h-8 bg-gray-100 rounded-lg overflow-hidden">
                <div className="h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-lg" style={{ width: `${(t.sales / maxSales) * 100}%` }} />
              </div>
              <div className="text-right text-sm font-medium text-gray-900">{formatLakh(t.sales)}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow duration-300">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Selling Products</h2>
          <div className="space-y-3">
            {topProducts.length === 0 && <p className="text-sm text-gray-500">No sales in {RANGES[range].label.toLowerCase()}.</p>}
            {topProducts.map((p) => (
              <div key={p.key} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 gap-4">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate">{p.name}</p>
                  <p className="text-xs text-gray-600 mt-1">{p.units} units sold</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{formatINR(p.revenue)}</p>
                  <p className={`text-xs font-medium ${p.trend >= 0 ? "text-green-600" : "text-red-600"}`}>{fmtPct(p.trend)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow duration-300">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Dealers</h2>
          <div className="space-y-3">
            {topDealers.length === 0 && <p className="text-sm text-gray-500">No dealers yet.</p>}
            {topDealers.map((d) => (
              <div key={d.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50">
                <div>
                  <p className="font-medium text-gray-900">{d.name}</p>
                  <p className="text-xs text-gray-600 mt-1">{d.totalOrders} orders</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{formatINR(d.totalRevenue)}</p>
                  <p className="text-xs text-amber-600 font-medium">{d.rating.toFixed(1)}★</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow duration-300">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Key Performance Indicators</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((k) => (
            <div key={k.label} className="p-4 border border-gray-100 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">{k.label}</p>
              <p className="text-2xl font-bold text-gray-900">{k.value}</p>
              <div className="flex items-center justify-between mt-2 text-xs">
                <span className="text-gray-600">Prev: {k.prev}</span>
                <span className={`font-medium ${k.change >= 0 ? "text-green-600" : "text-red-600"}`}>{fmtPct(k.change)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
