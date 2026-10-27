import "server-only";
import crypto from "node:crypto";
import Razorpay from "razorpay";
import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeVariants, toPricingTier, toProduct } from "./mappers";
import { computeTotals } from "./pricing";
import type { OrderItem } from "./types";

export class OrderError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

export interface LineInput {
  productId: string;
  variantId: string;
  quantity: number;
}

export function razorpayConfigured() {
  return !!(process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

export function getRazorpay() {
  if (!razorpayConfigured()) throw new OrderError("Online payments are not configured yet. Please choose Cash on Delivery.", 503);
  return new Razorpay({ key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!, key_secret: process.env.RAZORPAY_KEY_SECRET! });
}

const safeEqual = (a: string, b: string) => {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
};

export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string) {
  const expected = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!).update(`${orderId}|${paymentId}`).digest("hex");
  return safeEqual(expected, signature);
}

export function verifyWebhookSignature(rawBody: string, signature: string) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return safeEqual(expected, signature);
}

/**
 * Re-prices a cart from the database (never trust client prices), checks stock and applies
 * active bulk-pricing tiers. Only public, active products can be bought from the storefront;
 * staff-created orders may include drafts.
 */
export async function priceLines(db: SupabaseClient, lines: LineInput[], { allowDrafts = false } = {}) {
  if (!Array.isArray(lines) || lines.length === 0) throw new OrderError("Your cart is empty");
  const ids = Array.from(new Set(lines.map((l) => l.productId)));
  const { data: rows, error } = await db.from("products").select("*").in("id", ids);
  if (error) throw new OrderError("Could not load products", 500);
  const products = new Map((rows ?? []).map((r) => [r.id as string, toProduct(r)]));
  // The service role bypasses RLS, so enforce category visibility here as well.
  const { data: visibleCats } = await db.from("categories").select("name").eq("is_visible", true);
  const visible = new Set((visibleCats ?? []).map((c) => c.name as string));

  const items: OrderItem[] = [];
  const perProduct = new Map<string, number>();
  for (const line of lines) {
    const qty = Math.floor(Number(line.quantity));
    if (!Number.isFinite(qty) || qty < 1) throw new OrderError("Invalid quantity");
    const p = products.get(line.productId);
    if (!p || (!allowDrafts && (!p.isPublic || !p.isActive || !visible.has(p.category)))) throw new OrderError("A product in your cart is no longer available");
    const variants = normalizeVariants(p);
    const v = variants.find((x) => x.id === line.variantId) ?? (variants.length === 1 ? variants[0] : undefined);
    if (!v) throw new OrderError(`Selected option for ${p.name} is no longer available`);
    if (v.stock < qty) throw new OrderError(v.stock > 0 ? `Only ${v.stock} left of ${p.name}` : `${p.name} is out of stock`, 409);
    perProduct.set(p.id, (perProduct.get(p.id) ?? 0) + qty);
    if ((perProduct.get(p.id) ?? 0) > p.stock) throw new OrderError(`Only ${p.stock} left of ${p.name}`, 409);
    items.push({
      productId: p.id,
      variantId: v.id,
      name: p.name,
      variant: v.id === "default" ? "" : v.value,
      image: p.thumbnail,
      price: v.price,
      quantity: qty,
    });
  }

  const { data: tierRows } = await db.from("pricing").select("*").eq("status", "active");
  const totals = computeTotals(
    items.map((i) => ({ productId: i.productId, name: i.name, category: products.get(i.productId)?.category, price: i.price, quantity: i.quantity })),
    (tierRows ?? []).map(toPricingTier),
  );
  return { items, totals };
}

/** Mark a Razorpay order paid and reserve stock. Safe to call more than once (verify + webhook). */
export async function finalizePaidOrder(db: SupabaseClient, razorpayOrderId: string, paymentId: string) {
  const { data: order } = await db.from("orders").select("*").eq("razorpay_order_id", razorpayOrderId).maybeSingle();
  if (!order) throw new OrderError("Order not found", 404);
  if (order.payment_status === "paid" && order.stock_committed) return order;

  await db
    .from("orders")
    .update({ payment_status: "paid", razorpay_payment_id: paymentId, status: order.status === "pending" ? "processing" : order.status })
    .eq("id", order.id);

  const { data: committed, error } = await db.rpc("commit_order_stock", { p_order_id: order.id });
  if (error) {
    // Paid but stock ran out between checkout and payment: refund and cancel.
    try {
      await getRazorpay().payments.refund(paymentId, { amount: Math.round(Number(order.total_amount) * 100) });
      await db.from("orders").update({ payment_status: "refunded", status: "cancelled", notes: `Auto-refunded: ${error.message}` }).eq("id", order.id);
    } catch (refundErr) {
      await db
        .from("orders")
        .update({ notes: `Stock commit failed (${error.message}); refund failed: ${String(refundErr)}` })
        .eq("id", order.id);
    }
    throw new OrderError(`${error.message}. Your payment has been refunded.`, 409);
  }
  return committed;
}
