import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/admin";
import { finalizePaidOrder, verifyWebhookSignature } from "@/lib/orders.server";

// Backup path in case the shopper closes the tab before /api/checkout/verify runs.
export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";
  if (!verifyWebhookSignature(raw, signature)) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });

  const event = JSON.parse(raw);
  const payment = event?.payload?.payment?.entity;
  const db = getServiceSupabase();
  try {
    if ((event.event === "payment.captured" || event.event === "order.paid") && payment?.order_id) {
      await finalizePaidOrder(db, payment.order_id, payment.id);
    } else if (event.event === "payment.failed" && payment?.order_id) {
      await db.from("orders").update({ payment_status: "failed" }).eq("razorpay_order_id", payment.order_id).eq("payment_status", "pending");
    }
  } catch (err) {
    console.error("webhook handling failed", err);
  }
  // Always 200 once the signature is valid so Razorpay does not retry business-rule failures.
  return NextResponse.json({ ok: true });
}
