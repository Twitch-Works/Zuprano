import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { getServiceSupabase } from "@/lib/supabase/admin";
import { OrderError, getRazorpay, priceLines, type LineInput } from "@/lib/orders.server";

interface CheckoutBody {
  items: LineInput[];
  customer: { name: string; email: string; phone: string };
  address: { street: string; city: string; state?: string; postalCode: string };
  paymentMethod: "razorpay" | "cod";
}

const clean = (s: unknown, max = 200) => (typeof s === "string" ? s.trim().slice(0, max) : "");

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CheckoutBody;
    const name = clean(body.customer?.name);
    const email = clean(body.customer?.email);
    const phone = clean(body.customer?.phone, 20);
    const street = clean(body.address?.street, 300);
    const city = clean(body.address?.city, 100);
    const postalCode = clean(body.address?.postalCode, 12);
    if (!name || !email || !phone || !street || !city || !postalCode) throw new OrderError("Please fill in all delivery details");
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new OrderError("Please enter a valid email address");
    if (phone.replace(/\D/g, "").length < 10) throw new OrderError("Please enter a valid phone number");
    if (!/^\d{6}$/.test(postalCode)) throw new OrderError("Please enter a valid 6-digit postal code");
    const method = body.paymentMethod === "cod" ? "cod" : "razorpay";

    const {
      data: { user },
    } = await (await getServerSupabase()).auth.getUser();
    const db = getServiceSupabase();
    const { items, totals } = await priceLines(db, body.items);

    // Create the Razorpay order before writing ours so a gateway failure leaves nothing behind.
    let rzpOrder: { id: string; amount: number | string; currency: string } | null = null;
    const amountPaise = Math.round(totals.total * 100);
    if (method === "razorpay") {
      rzpOrder = await getRazorpay().orders.create({
        amount: amountPaise,
        currency: "INR",
        receipt: `zup_${Date.now()}`,
      });
    }

    const { data: order, error } = await db
      .from("orders")
      .insert({
        user_id: user?.id ?? null,
        customer_name: name,
        customer_email: email,
        customer_phone: phone,
        shipping_address: { name, phone, street, city, state: clean(body.address?.state, 100), postalCode },
        items,
        subtotal: totals.subtotal,
        discount: totals.discount,
        tax: totals.tax,
        shipping: totals.shipping,
        total_amount: totals.total,
        payment_method: method,
        razorpay_order_id: rzpOrder?.id ?? null,
        source: "store",
      })
      .select("*")
      .single();
    if (error) throw new OrderError("Could not create order", 500);

    if (method === "cod") {
      const { data: committed, error: commitErr } = await db.rpc("commit_order_stock", { p_order_id: order.id });
      if (commitErr) {
        await db.from("orders").delete().eq("id", order.id);
        throw new OrderError(commitErr.message, 409);
      }
      return NextResponse.json({ orderId: order.id, orderNumber: order.order_number, trackingId: committed.tracking_id, totals });
    }

    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.order_number,
      totals,
      razorpay: {
        keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        orderId: rzpOrder!.id,
        amount: amountPaise,
        currency: "INR",
        prefill: { name, email, contact: phone },
      },
    });
  } catch (err) {
    if (err instanceof OrderError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("checkout failed", err);
    return NextResponse.json({ error: "Checkout failed. Please try again." }, { status: 500 });
  }
}
