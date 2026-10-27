"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Download, Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { useDealers, useOrders, useProducts } from "@/lib/admin/data";
import {
  ErrorBanner,
  Field,
  Loading,
  Modal,
  ModalActions,
  ORDER_STATUS_STYLE,
  PAYMENT_STATUS_STYLE,
  PageHeader,
  Pill,
  PrimaryButton,
  SearchBox,
  SelectField,
  StatGrid,
  TableCard,
  TextField,
  downloadCsv,
  td,
  th,
} from "@/components/admin/ui";
import { normalizeVariants } from "@/lib/mappers";
import { formatDate, formatDateTime, formatINR } from "@/lib/format";
import type { Order, OrderStatus, PaymentStatus } from "@/lib/types";

const STATUSES: OrderStatus[] = ["pending", "processing", "shipped", "delivered", "cancelled"];
const PAYMENT_STATUSES: PaymentStatus[] = ["pending", "paid", "failed", "refunded"];
const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

function OrdersContent() {
  const params = useSearchParams();
  const { orders, loading, error, updateOrder, createOrder } = useOrders();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [viewing, setViewing] = useState<Order | null>(null);
  const [editing, setEditing] = useState<Order | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const open = params.get("open");
    if (open && orders.length) setViewing(orders.find((o) => o.id === open) ?? null);
  }, [params, orders]);

  const q = search.toLowerCase();
  const filtered = orders.filter(
    (o) =>
      (o.orderNumber.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q) || (o.trackingId ?? "").toLowerCase().includes(q)) &&
      (!status || o.status === status),
  );

  const daily = useMemo(() => {
    const today = new Date();
    const yesterday = new Date(Date.now() - 864e5);
    const live = orders.filter((o) => o.status !== "cancelled");
    const todays = live.filter((o) => sameDay(new Date(o.createdAt), today));
    const yesterdays = live.filter((o) => sameDay(new Date(o.createdAt), yesterday));
    const sum = (l: Order[]) => l.reduce((s, o) => s + o.totalAmount, 0);
    const weekAgo = Date.now() - 7 * 864e5;
    const thisWeek = live.filter((o) => new Date(o.createdAt).getTime() >= weekAgo);
    const prevWeek = live.filter((o) => {
      const t = new Date(o.createdAt).getTime();
      return t < weekAgo && t >= weekAgo - 7 * 864e5;
    });
    const avg = (l: Order[]) => (l.length ? sum(l) / l.length : 0);
    const signed = (n: number, money = false) => `${n >= 0 ? "+" : "−"}${money ? formatINR(Math.abs(n)) : Math.abs(n)}`;
    return [
      { title: "Today's Orders", value: todays.length.toString(), trend: `${signed(todays.length - yesterdays.length)} from yesterday`, color: "bg-blue-50" },
      { title: "Total Revenue Today", value: formatINR(sum(todays)), trend: `${signed(sum(todays) - sum(yesterdays), true)} from yesterday`, color: "bg-green-50" },
      { title: "Avg Order Value", value: formatINR(avg(live)), trend: `${signed(avg(thisWeek) - avg(prevWeek), true)} vs last week`, color: "bg-purple-50" },
    ];
  }, [orders]);

  if (loading) return <Loading label="Loading orders..." />;
  if (error) return <div className="p-8 text-center bg-red-50 text-red-600 border border-red-100 rounded-lg">Error: {error}</div>;

  const exportCsv = () =>
    downloadCsv(`orders-${new Date().toISOString().slice(0, 10)}.csv`, [
      ["Order", "Date", "Customer", "Email", "Phone", "Dealer", "Items", "Subtotal", "Discount", "Tax", "Shipping", "Total", "Status", "Payment", "Method", "Tracking"],
      ...filtered.map((o) => [
        o.orderNumber,
        o.createdAt,
        o.customerName,
        o.customerEmail,
        o.customerPhone,
        o.dealerName,
        o.items.map((i) => `${i.name}${i.variant ? ` (${i.variant})` : ""} x${i.quantity}`).join("; "),
        o.subtotal,
        o.discount,
        o.tax,
        o.shipping,
        o.totalAmount,
        o.status,
        o.paymentStatus,
        o.paymentMethod,
        o.trackingId,
      ]),
    ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Orders" subtitle="Track and manage all orders" action={<PrimaryButton onClick={() => setCreating(true)}>New Order</PrimaryButton>} />

      <StatGrid
        items={[
          { label: "Total Orders", value: orders.length, color: "bg-blue-50" },
          { label: "Pending", value: orders.filter((o) => o.status === "pending").length, color: "bg-amber-50" },
          { label: "Shipped", value: orders.filter((o) => o.status === "shipped").length, color: "bg-purple-50" },
          { label: "Cancelled", value: orders.filter((o) => o.status === "cancelled").length, color: "bg-red-50" },
        ]}
      />

      <SearchBox value={search} onChange={setSearch} placeholder="Search by Order ID, Customer or Tracking ID...">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="">All Status</option>
          {STATUSES.map((s) => (
            <option key={s} value={s} className="capitalize">
              {s[0].toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
      </SearchBox>

      <TableCard
        title={`Order List (${filtered.length})`}
        action={
          <button onClick={exportCsv} className="text-sm font-medium text-orange-600 hover:text-orange-700 flex items-center gap-1">
            <Download size={16} /> Export CSV
          </button>
        }
      >
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className={th}>Order ID</th>
              <th className={th}>Customer</th>
              <th className={th}>Dealer</th>
              <th className={th}>Date</th>
              <th className={`${th} text-right`}>Items</th>
              <th className={`${th} text-right`}>Amount</th>
              <th className={th}>Status</th>
              <th className={th}>Payment</th>
              <th className={th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-sm text-gray-500">
                  No orders found.
                </td>
              </tr>
            ) : (
              filtered.map((o) => (
                <tr key={o.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className={`${td} font-semibold text-orange-600 cursor-pointer hover:text-orange-700 whitespace-nowrap`} onClick={() => setViewing(o)}>
                    {o.orderNumber}
                  </td>
                  <td className={`${td} text-gray-900`}>{o.customerName}</td>
                  <td className={`${td} text-gray-600`}>{o.dealerName}</td>
                  <td className={`${td} text-gray-600 whitespace-nowrap`}>{formatDate(o.createdAt)}</td>
                  <td className={`${td} text-right text-gray-700`}>{o.items.reduce((s, i) => s + i.quantity, 0)}</td>
                  <td className={`${td} font-semibold text-gray-900 text-right`}>{formatINR(o.totalAmount)}</td>
                  <td className={td}>
                    <Pill className={ORDER_STATUS_STYLE[o.status]}>{o.status}</Pill>
                  </td>
                  <td className={td}>
                    <Pill className={PAYMENT_STATUS_STYLE[o.paymentStatus]}>{o.paymentMethod === "cod" && o.paymentStatus === "pending" ? "COD" : o.paymentStatus}</Pill>
                  </td>
                  <td className={td}>
                    <div className="flex items-center gap-2">
                      <button type="button" aria-label="View" onClick={() => setViewing(o)} className="p-2 hover:bg-blue-100 rounded text-blue-600 transition-colors">
                        <Eye size={16} />
                      </button>
                      <button type="button" aria-label="Edit" onClick={() => setEditing(o)} className="p-2 hover:bg-orange-100 rounded text-orange-600 transition-colors">
                        <Pencil size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </TableCard>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {daily.map((d) => (
          <div key={d.title} className={`${d.color} rounded-lg border border-gray-100 p-6 hover:shadow-md transition-shadow duration-300`}>
            <p className="text-sm font-medium text-gray-600">{d.title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{d.value}</p>
            <p className="text-xs text-gray-600 mt-2">{d.trend}</p>
          </div>
        ))}
      </div>

      <OrderDetails order={viewing} onClose={() => setViewing(null)} onEdit={(o) => (setViewing(null), setEditing(o))} />
      <EditOrder order={editing} onClose={() => setEditing(null)} onSave={updateOrder} />
      <NewOrder open={creating} onClose={() => setCreating(false)} onCreate={createOrder} />
    </div>
  );
}

function OrderDetails({ order, onClose, onEdit }: { order: Order | null; onClose: () => void; onEdit: (o: Order) => void }) {
  if (!order) return null;
  const a = order.shippingAddress;
  return (
    <Modal
      open
      onClose={onClose}
      title={`Order ${order.orderNumber}`}
      footer={
        <button onClick={() => onEdit(order)} className="px-6 py-2 bg-orange-600 text-white rounded-lg font-medium">
          Update Order
        </button>
      }
    >
      <div className="flex flex-wrap gap-2">
        <Pill className={ORDER_STATUS_STYLE[order.status]}>{order.status}</Pill>
        <Pill className={PAYMENT_STATUS_STYLE[order.paymentStatus]}>Payment: {order.paymentStatus}</Pill>
        <Pill className="bg-gray-100 text-gray-700">{order.paymentMethod}</Pill>
        <Pill className="bg-gray-100 text-gray-700">Source: {order.source}</Pill>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
        <div>
          <h4 className="font-semibold text-gray-900 mb-2">Customer</h4>
          <p className="text-gray-700">{order.customerName}</p>
          <p className="text-gray-500">{order.customerEmail}</p>
          <p className="text-gray-500">{order.customerPhone}</p>
        </div>
        <div>
          <h4 className="font-semibold text-gray-900 mb-2">Ship to</h4>
          <p className="text-gray-700">{a.street || "—"}</p>
          <p className="text-gray-500">
            {[a.city, a.state].filter(Boolean).join(", ")} {a.postalCode}
          </p>
        </div>
        <div>
          <h4 className="font-semibold text-gray-900 mb-2">Fulfilment</h4>
          <p className="text-gray-700">Dealer: {order.dealerName}</p>
          <p className="text-gray-500">
            {order.carrier} · {order.trackingId ?? "No tracking ID"}
          </p>
        </div>
        <div>
          <h4 className="font-semibold text-gray-900 mb-2">Payment</h4>
          <p className="text-gray-700">Placed {formatDateTime(order.createdAt)}</p>
          {order.razorpayPaymentId && <p className="text-gray-500 font-mono text-xs">{order.razorpayPaymentId}</p>}
        </div>
      </div>
      <div className="border border-gray-100 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left py-2 px-4 font-semibold text-gray-700">Item</th>
              <th className="text-right py-2 px-4 font-semibold text-gray-700">Qty</th>
              <th className="text-right py-2 px-4 font-semibold text-gray-700">Price</th>
              <th className="text-right py-2 px-4 font-semibold text-gray-700">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((i) => (
              <tr key={`${i.productId}-${i.variantId}`} className="border-b border-gray-100 last:border-0">
                <td className="py-2 px-4 text-gray-900">
                  {i.name}
                  {i.variant && <span className="text-gray-500"> · {i.variant}</span>}
                </td>
                <td className="py-2 px-4 text-right text-gray-700">{i.quantity}</td>
                <td className="py-2 px-4 text-right text-gray-700">{formatINR(i.price)}</td>
                <td className="py-2 px-4 text-right text-gray-900 font-medium">{formatINR(i.price * i.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="ml-auto max-w-xs space-y-1 text-sm">
        {[
          ["Subtotal", order.subtotal],
          ["Discount", -order.discount],
          ["GST", order.tax],
          ["Shipping", order.shipping],
        ].map(([k, v]) => (
          <div key={k as string} className="flex justify-between text-gray-600">
            <span>{k}</span>
            <span>{formatINR(v as number)}</span>
          </div>
        ))}
        <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-100">
          <span>Total</span>
          <span>{formatINR(order.totalAmount)}</span>
        </div>
      </div>
      {order.statusHistory.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-2 text-sm">Timeline</h4>
          <ul className="space-y-1 text-sm text-gray-600">
            {order.statusHistory.map((h, i) => (
              <li key={i} className="capitalize">
                {formatDateTime(h.at)} — {h.status}
                {h.note ? ` (${h.note})` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}
      {order.notes && <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">Note: {order.notes}</p>}
    </Modal>
  );
}

function EditOrder({ order, onClose, onSave }: { order: Order | null; onClose: () => void; onSave: ReturnType<typeof useOrders>["updateOrder"] }) {
  const [form, setForm] = useState({ status: "pending" as OrderStatus, paymentStatus: "pending" as PaymentStatus, trackingId: "", carrier: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (order)
      setForm({ status: order.status, paymentStatus: order.paymentStatus, trackingId: order.trackingId ?? "", carrier: order.carrier, notes: order.notes ?? "" });
    setError(null);
  }, [order]);

  if (!order) return null;
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.status === "cancelled" && order.status !== "cancelled" && !window.confirm("Cancel this order? Reserved stock will be returned to inventory.")) return;
    setSaving(true);
    try {
      await onSave(order.id, form);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update order");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={`Update ${order.orderNumber}`} width="max-w-lg" footer={<ModalActions onCancel={onClose} submitLabel="Save Changes" loading={saving} form="edit-order" />}>
      <form id="edit-order" onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <SelectField label="Order Status" value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as OrderStatus }))} disabled={order.status === "cancelled"}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s[0].toUpperCase() + s.slice(1)}
              </option>
            ))}
          </SelectField>
          <SelectField label="Payment Status" value={form.paymentStatus} onChange={(e) => setForm((prev) => ({ ...prev, paymentStatus: e.target.value as PaymentStatus }))}>
            {PAYMENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s[0].toUpperCase() + s.slice(1)}
              </option>
            ))}
          </SelectField>
          <Field label="Carrier" value={form.carrier} onChange={(e) => setForm((prev) => ({ ...prev, carrier: e.target.value }))} />
          <Field label="Tracking ID" value={form.trackingId} onChange={(e) => setForm((prev) => ({ ...prev, trackingId: e.target.value.toUpperCase() }))} />
        </div>
        <TextField label="Internal Notes" rows={3} value={form.notes} onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))} />
        {order.status === "cancelled" && <p className="text-xs text-gray-500">Cancelled orders cannot be reopened. Create a new order instead.</p>}
        <ErrorBanner message={error} />
      </form>
    </Modal>
  );
}

interface Line {
  productId: string;
  variantId: string;
  quantity: number;
}

function NewOrder({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (input: unknown) => Promise<{ orderNumber: string }> }) {
  const { products } = useProducts();
  const { dealers } = useDealers();
  const [form, setForm] = useState({ customerName: "", customerEmail: "", customerPhone: "", street: "", city: "", postalCode: "", dealerId: "", status: "processing", paymentStatus: "pending", paymentMethod: "manual", notes: "" });
  const [lines, setLines] = useState<Line[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setForm({ customerName: "", customerEmail: "", customerPhone: "", street: "", city: "", postalCode: "", dealerId: "", status: "processing", paymentStatus: "pending", paymentMethod: "manual", notes: "" });
    setLines([]);
    setError(null);
  }, [open]);

  const productById = new Map(products.map((p) => [p.id, p]));
  const addLine = () => {
    const first = products.find((p) => p.stock > 0);
    if (first) setLines([...lines, { productId: first.id, variantId: normalizeVariants(first)[0].id, quantity: 1 }]);
  };
  const lineTotal = lines.reduce((s, l) => {
    const p = productById.get(l.productId);
    const v = p && normalizeVariants(p).find((x) => x.id === l.variantId);
    return s + (v?.price ?? 0) * l.quantity;
  }, 0);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerName.trim()) return setError("Customer name is required");
    if (lines.length === 0) return setError("Add at least one item");
    setSaving(true);
    setError(null);
    try {
      await onCreate({
        customerName: form.customerName,
        customerEmail: form.customerEmail,
        customerPhone: form.customerPhone,
        address: { street: form.street, city: form.city, postalCode: form.postalCode },
        dealerId: form.dealerId || null,
        items: lines,
        status: form.status,
        paymentStatus: form.paymentStatus,
        paymentMethod: form.paymentMethod,
        notes: form.notes,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create order");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Create New Order" footer={<ModalActions onCancel={onClose} submitLabel="Create Order" loading={saving} form="new-order" />}>
      <form id="new-order" onSubmit={submit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Customer Name" value={form.customerName} onChange={(e) => setForm((prev) => ({ ...prev, customerName: e.target.value }))} required />
          <Field label="Email" type="email" value={form.customerEmail} onChange={(e) => setForm((prev) => ({ ...prev, customerEmail: e.target.value }))} />
          <Field label="Phone" value={form.customerPhone} onChange={(e) => setForm((prev) => ({ ...prev, customerPhone: e.target.value }))} />
          <Field label="Street" className="md:col-span-3" value={form.street} onChange={(e) => setForm((prev) => ({ ...prev, street: e.target.value }))} />
          <Field label="City" value={form.city} onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))} />
          <Field label="Postal Code" value={form.postalCode} onChange={(e) => setForm((prev) => ({ ...prev, postalCode: e.target.value }))} />
          <SelectField label="Dealer" value={form.dealerId} onChange={(e) => setForm((prev) => ({ ...prev, dealerId: e.target.value }))}>
            <option value="">Direct (no dealer)</option>
            {dealers
              .filter((d) => d.status === "active")
              .map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
          </SelectField>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-semibold text-gray-900">Items</label>
            <button type="button" onClick={addLine} className="text-sm font-medium text-orange-600 hover:text-orange-700 flex items-center gap-1">
              <Plus size={16} /> Add Item
            </button>
          </div>
          {lines.length === 0 && <p className="text-sm text-gray-500">No items yet.</p>}
          {lines.map((l, idx) => {
            const p = productById.get(l.productId);
            const variants = p ? normalizeVariants(p) : [];
            const v = variants.find((x) => x.id === l.variantId);
            const update = (patch: Partial<Line>) => setLines(lines.map((x, i) => (i === idx ? { ...x, ...patch } : x)));
            return (
              <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                <select
                  value={l.productId}
                  onChange={(e) => {
                    const np = productById.get(e.target.value)!;
                    update({ productId: np.id, variantId: normalizeVariants(np)[0].id });
                  }}
                  className="col-span-5 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                >
                  {products.map((pr) => (
                    <option key={pr.id} value={pr.id} disabled={pr.stock <= 0}>
                      {pr.name} ({pr.stock} in stock)
                    </option>
                  ))}
                </select>
                <select value={l.variantId} onChange={(e) => update({ variantId: e.target.value })} className="col-span-3 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
                  {variants.map((vv) => (
                    <option key={vv.id} value={vv.id}>
                      {vv.value} · {formatINR(vv.price)}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={1}
                  max={v?.stock ?? 1}
                  value={l.quantity}
                  onChange={(e) => update({ quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                  className="col-span-2 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
                <button type="button" aria-label="Remove item" onClick={() => setLines(lines.filter((_, i) => i !== idx))} className="col-span-2 p-2 text-red-600 hover:bg-red-50 rounded-lg justify-self-end">
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
          {lines.length > 0 && <p className="text-sm text-gray-600 text-right">Items subtotal: {formatINR(lineTotal)} (GST & shipping added on save)</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SelectField label="Order Status" value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}>
            {STATUSES.filter((s) => s !== "cancelled").map((s) => (
              <option key={s} value={s}>
                {s[0].toUpperCase() + s.slice(1)}
              </option>
            ))}
          </SelectField>
          <SelectField label="Payment Status" value={form.paymentStatus} onChange={(e) => setForm((prev) => ({ ...prev, paymentStatus: e.target.value }))}>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
          </SelectField>
          <SelectField label="Payment Method" value={form.paymentMethod} onChange={(e) => setForm((prev) => ({ ...prev, paymentMethod: e.target.value }))}>
            <option value="manual">Manual / Bank transfer</option>
            <option value="cod">Cash on Delivery</option>
          </SelectField>
        </div>
        <TextField label="Notes" rows={2} value={form.notes} onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))} />
        <ErrorBanner message={error} />
      </form>
    </Modal>
  );
}

export default function OrdersPage() {
  return (
    <Suspense>
      <OrdersContent />
    </Suspense>
  );
}
