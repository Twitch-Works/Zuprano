import type { Dealer, Order } from "@/lib/types";

export const DAY = 864e5;

/** Orders that count as sales (not cancelled). */
export const liveOrders = (orders: Order[]) => orders.filter((o) => o.status !== "cancelled");
export const paidOrders = (orders: Order[]) => orders.filter((o) => o.paymentStatus === "paid");

export const inRange = (orders: Order[], from: number, to = Date.now()) =>
  orders.filter((o) => {
    const t = new Date(o.createdAt).getTime();
    return t >= from && t < to;
  });

export const sum = (orders: Order[]) => orders.reduce((s, o) => s + o.totalAmount, 0);

export function pctChange(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : 100;
  return ((current - previous) / previous) * 100;
}

export const fmtPct = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;

/** Splits [now - days, now) into `buckets` equal slices and totals live revenue in each. */
export function revenueBuckets(orders: Order[], days: number, buckets = 7) {
  const end = Date.now();
  const start = end - days * DAY;
  const size = (end - start) / buckets;
  return Array.from({ length: buckets }, (_, i) => {
    const from = start + i * size;
    const to = from + size;
    const slice = inRange(liveOrders(orders), from, to);
    const label = new Date(to - 1).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
    return { label, revenue: sum(slice), orders: slice.length };
  });
}

export interface ProductStat {
  key: string;
  name: string;
  units: number;
  revenue: number;
}

export function productStats(orders: Order[]): ProductStat[] {
  const map = new Map<string, ProductStat>();
  for (const o of liveOrders(orders)) {
    for (const i of o.items) {
      const cur = map.get(i.productId) ?? { key: i.productId, name: i.name, units: 0, revenue: 0 };
      cur.units += i.quantity;
      cur.revenue += i.price * i.quantity;
      map.set(i.productId, cur);
    }
  }
  return [...map.values()].sort((a, b) => b.revenue - a.revenue);
}

export function dealerStats(dealers: Dealer[], orders: Order[]) {
  const now = Date.now();
  const recent = inRange(liveOrders(orders), now - 30 * DAY);
  const prior = inRange(liveOrders(orders), now - 60 * DAY, now - 30 * DAY);
  return dealers
    .map((d) => {
      const r = recent.filter((o) => o.dealerId === d.id).length;
      const p = prior.filter((o) => o.dealerId === d.id).length;
      return { ...d, growth: pctChange(r, p) };
    })
    .sort((a, b) => b.totalRevenue - a.totalRevenue);
}

export function monthlyTrend(orders: Order[], months = 4) {
  const now = new Date();
  return Array.from({ length: months }, (_, i) => {
    const start = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
    const slice = inRange(liveOrders(orders), start.getTime(), end.getTime());
    return {
      month: start.toLocaleDateString("en-IN", { month: "short" }),
      sales: sum(slice),
      orders: slice.length,
      dealers: new Set(slice.map((o) => o.dealerId).filter(Boolean)).size,
    };
  });
}

export const RANGES = {
  week: { label: "Last 7 Days", days: 7 },
  month: { label: "Last 30 Days", days: 30 },
  quarter: { label: "Last Quarter", days: 90 },
  year: { label: "Last Year", days: 365 },
} as const;
export type RangeKey = keyof typeof RANGES;
