import { errorResponse, requireStaff, HttpError } from "@/lib/admin/server";
import { priceLines, type LineInput } from "@/lib/orders.server";

interface ManualOrderBody {
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  address?: { street?: string; city?: string; state?: string; postalCode?: string };
  dealerId?: string | null;
  items: LineInput[];
  status?: string;
  paymentStatus?: string;
  paymentMethod?: "manual" | "cod";
  notes?: string;
}

// Staff-created orders (phone / dealer / walk-in). Stock is reserved immediately.
export async function POST(req: Request) {
  try {
    const { db } = await requireStaff();
    const body = (await req.json()) as ManualOrderBody;
    if (!body.customerName?.trim()) throw new HttpError("Customer name is required", 400);
    const { items, totals } = await priceLines(db, body.items, { allowDrafts: true });

    let dealerName = "Direct";
    if (body.dealerId) {
      const { data: dealer } = await db.from("dealers").select("name").eq("id", body.dealerId).maybeSingle();
      if (!dealer) throw new HttpError("Dealer not found", 400);
      dealerName = dealer.name;
    }

    const status = ["pending", "processing", "shipped", "delivered"].includes(body.status ?? "") ? body.status : "processing";
    const paymentStatus = ["pending", "paid"].includes(body.paymentStatus ?? "") ? body.paymentStatus : "pending";
    const { data: order, error } = await db
      .from("orders")
      .insert({
        customer_name: body.customerName.trim(),
        customer_email: body.customerEmail?.trim() || null,
        customer_phone: body.customerPhone?.trim() || null,
        shipping_address: { name: body.customerName.trim(), phone: body.customerPhone ?? "", ...body.address },
        dealer_id: body.dealerId || null,
        dealer_name: dealerName,
        items,
        subtotal: totals.subtotal,
        discount: totals.discount,
        tax: totals.tax,
        shipping: totals.shipping,
        total_amount: totals.total,
        status,
        payment_status: paymentStatus,
        payment_method: body.paymentMethod === "cod" ? "cod" : "manual",
        source: "admin",
        notes: body.notes?.trim() || null,
      })
      .select("id, order_number")
      .single();
    if (error) throw new Error(error.message);

    const { error: commitErr } = await db.rpc("commit_order_stock", { p_order_id: order.id });
    if (commitErr) {
      await db.from("orders").delete().eq("id", order.id);
      throw new HttpError(commitErr.message, 409);
    }
    return Response.json({ orderId: order.id, orderNumber: order.order_number });
  } catch (err) {
    return errorResponse(err);
  }
}
