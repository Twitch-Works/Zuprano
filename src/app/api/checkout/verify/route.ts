import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/admin";
import { OrderError, finalizePaidOrder, verifyPaymentSignature } from "@/lib/orders.server";

export async function POST(req: Request) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) throw new OrderError("Missing payment details");
    if (!verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
      throw new OrderError("Payment verification failed", 400);
    }
    const order = await finalizePaidOrder(getServiceSupabase(), razorpay_order_id, razorpay_payment_id);
    return NextResponse.json({ orderNumber: order.order_number, trackingId: order.tracking_id });
  } catch (err) {
    if (err instanceof OrderError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("payment verify failed", err);
    return NextResponse.json({ error: "Could not confirm payment" }, { status: 500 });
  }
}
