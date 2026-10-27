"use client";

import Link from "next/link";
import { ChartColumn, CircleAlert, Clock, ShoppingCart, TrendingUp, Users } from "lucide-react";
import { useDashboardStats, useProducts } from "@/lib/admin/data";
import { Loading, ORDER_STATUS_STYLE } from "@/components/admin/ui";
import { formatINR } from "@/lib/format";

const LOW_STOCK_THRESHOLD = 50;

export default function DashboardPage() {
  const { stats, loading } = useDashboardStats();
  const { products } = useProducts();
  if (loading) return <Loading label="Loading dashboard..." />;

  const cards = [
    { label: "Total Revenue", value: formatINR(stats.totalRevenue), change: "+12.5%", icon: TrendingUp, color: "bg-blue-50" },
    { label: "Total Orders", value: stats.totalOrders.toLocaleString("en-IN"), change: "+8.2%", icon: ShoppingCart, color: "bg-green-50" },
    { label: "Active Dealers", value: stats.activeDealers.toString(), change: "+2", icon: Users, color: "bg-purple-50" },
    { label: "Conversion Rate", value: `${stats.conversionRate}%`, change: "+0.8%", icon: ChartColumn, color: "bg-orange-50" },
  ];
  const lowStock = products
    .filter((p) => p.stock <= LOW_STOCK_THRESHOLD)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 3);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back! Here&apos;s your business overview.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map(({ label, value, change, icon: Icon, color }) => (
          <div key={label} className={`${color} rounded-lg p-6 border border-gray-100 hover:shadow-md transition-shadow duration-300`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">{label}</p>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-sm text-green-600 mt-2 font-medium">{change} vs last month</p>
              </div>
              <div className="p-3 bg-white rounded-lg">
                <Icon size={24} className="text-gray-700" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-300">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
                <Link href="/admin/orders" className="text-sm font-medium text-orange-600 hover:text-orange-700">
                  View All →
                </Link>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {["Order ID", "Customer", "Dealer", "Amount", "Status"].map((h) => (
                      <th key={h} className="text-left py-3 px-6 text-sm font-semibold text-gray-700">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stats.recentOrders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-sm text-gray-500">
                        No orders yet.
                      </td>
                    </tr>
                  ) : (
                    stats.recentOrders.map((o) => (
                      <tr key={o.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-6 text-sm font-medium text-orange-600">
                          <Link href={`/admin/orders?open=${o.id}`}>{o.orderNumber}</Link>
                        </td>
                        <td className="py-3 px-6 text-sm text-gray-700">{o.customerName}</td>
                        <td className="py-3 px-6 text-sm text-gray-600">{o.dealerName}</td>
                        <td className="py-3 px-6 text-sm font-medium text-gray-900">{formatINR(o.totalAmount)}</td>
                        <td className="py-3 px-6 text-sm">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${ORDER_STATUS_STYLE[o.status]}`}>{o.status}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-red-200 overflow-hidden hover:shadow-md transition-shadow duration-300">
            <div className="p-6 bg-red-50 border-b border-red-100">
              <div className="flex items-center gap-2">
                <CircleAlert size={20} className="text-red-600" />
                <h3 className="font-semibold text-gray-900">Low Stock Alert</h3>
              </div>
            </div>
            <div className="p-6 space-y-3">
              {lowStock.length === 0 ? (
                <p className="text-sm text-gray-500">All products are well stocked.</p>
              ) : (
                lowStock.map((p) => (
                  <div key={p.id} className="pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                    <div className="flex items-start justify-between mb-1 gap-2">
                      <p className="text-sm font-medium text-gray-900">{p.name}</p>
                      <span className="text-xs font-semibold text-red-600 whitespace-nowrap">{p.stock} units</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-600">{p.dealerId || "Warehouse"}</p>
                      <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-red-500" style={{ width: `${Math.min((p.stock / LOW_STOCK_THRESHOLD) * 100, 100)}%` }} />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center gap-2 mb-4">
              <Clock size={20} className="text-blue-600" />
              <h3 className="font-semibold text-gray-900">Business Summary</h3>
            </div>
            <div className="space-y-3">
              {[
                ["Total Orders", stats.totalOrders],
                ["Total Revenue", formatINR(stats.totalRevenue)],
                ["Active Dealers", stats.activeDealers],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{k}</span>
                  <span className="text-lg font-semibold text-gray-900">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
