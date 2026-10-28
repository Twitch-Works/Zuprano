import type { PricingTier } from "./types";

export const TAX_RATE = 0.18;
export const FREE_SHIPPING_THRESHOLD = 500;
export const SHIPPING_FEE = 49;

export interface PricedLine {
  productId: string;
  name: string;
  category?: string;
  /** Parent group of the category, so a tier on "Mobile Phones" covers every brand under it. */
  group?: string;
  price: number;
  quantity: number;
}

export interface Totals {
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  total: number;
}

const today = () => new Date().toISOString().slice(0, 10);

function tierApplies(tier: PricingTier, line: PricedLine) {
  if (tier.status !== "active") return false;
  const d = today();
  if (tier.startDate && tier.startDate > d) return false;
  if (tier.endDate && tier.endDate < d) return false;
  if (line.quantity < tier.minQty) return false;
  if (tier.maxQty !== null && tier.maxQty > 0 && line.quantity > tier.maxQty) return false;
  if (tier.applicableProducts.length === 0) return true;
  const keys = [line.productId, line.name, line.category ?? "", line.group ?? ""].map((k) => k.toLowerCase());
  return tier.applicableProducts.some((a) => keys.includes(a.trim().toLowerCase()));
}

/** Bulk discount for one line: the best applicable active pricing tier wins. */
export function lineDiscount(line: PricedLine, tiers: PricingTier[]) {
  const best = tiers
    .filter((t) => tierApplies(t, line))
    .reduce((max, t) => Math.max(max, t.discountPercent), 0);
  return (line.price * line.quantity * best) / 100;
}

/** Same arithmetic as the original storefront cart: 18% GST, free shipping above ₹500. */
export function computeTotals(lines: PricedLine[], tiers: PricingTier[] = []): Totals {
  const subtotal = lines.reduce((s, l) => s + l.price * l.quantity, 0);
  const discount = Math.round(lines.reduce((s, l) => s + lineDiscount(l, tiers), 0));
  const tax = Math.round((subtotal - discount) * TAX_RATE);
  const shipping = subtotal === 0 || subtotal > FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  return { subtotal, discount, tax, shipping, total: Math.round(subtotal - discount + tax + shipping) };
}
