import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/admin";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim().toUpperCase();
  if (!q || q.length < 4 || q.length > 40) return NextResponse.json({ error: "Please enter a valid tracking ID" }, { status: 400 });

  const { data } = await getServiceSupabase()
    .from("orders")
    .select("order_number, tracking_id, status, carrier, created_at, status_history, shipping_address, payment_status")
    .or(`tracking_id.eq.${q.replace(/[^A-Z0-9-]/g, "")},order_number.eq.${q.replace(/[^A-Z0-9-]/g, "")}`)
    .maybeSingle();
  if (!data) return NextResponse.json({ error: "No order found for that tracking ID" }, { status: 404 });

  const eta = new Date(data.created_at);
  eta.setDate(eta.getDate() + 5);
  return NextResponse.json({
    orderNumber: data.order_number,
    trackingId: data.tracking_id,
    status: data.status,
    paymentStatus: data.payment_status,
    carrier: data.carrier,
    estimatedDelivery: eta.toISOString(),
    destination: data.shipping_address?.city ?? "",
    history: data.status_history ?? [],
  });
}
