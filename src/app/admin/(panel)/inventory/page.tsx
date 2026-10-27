"use client";

import { useEffect, useState } from "react";
import { ArrowRightLeft, Pencil, TriangleAlert } from "lucide-react";
import { useDealers, useProducts } from "@/lib/admin/data";
import { useTable } from "@/lib/admin/useTable";
import { ErrorBanner, Field, Loading, Modal, ModalActions, PageHeader, PrimaryButton, SearchBox, SelectField, StatGrid, TableCard, TextField, td, th } from "@/components/admin/ui";
import { formatDateTime, formatINR } from "@/lib/format";
import type { Product } from "@/lib/types";

type MoveType = "restock" | "transfer" | "adjustment";

interface Movement {
  id: string;
  productId: string;
  type: MoveType;
  quantity: number;
  dealerId: string | null;
  note: string | null;
  createdAt: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toMovement = (r: any): Movement => ({
  id: r.id,
  productId: r.product_id,
  type: r.type,
  quantity: r.quantity,
  dealerId: r.dealer_id,
  note: r.note,
  createdAt: r.created_at,
});

export default function InventoryPage() {
  const { products, loading, error, moveStock } = useProducts();
  const { dealers } = useDealers();
  const movements = useTable("stock_movements", toMovement, { orderBy: "created_at", limit: 20 });
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<{ mode: "transfer" | "edit"; product: Product | null } | null>(null);

  if (loading) return <Loading label="Loading inventory..." />;
  if (error) return <div className="p-8 text-center bg-red-50 text-red-600 border border-red-100 rounded-lg">Error: {error}</div>;

  const q = search.toLowerCase();
  const filtered = products.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
  const low = products.filter((p) => p.stock <= 50);
  const productName = new Map(products.map((p) => [p.id, p.name]));
  const dealerName = new Map(dealers.map((d) => [d.id, d.name]));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory Management"
        subtitle="Track stock levels across warehouse and dealers"
        action={<PrimaryButton onClick={() => setModal({ mode: "transfer", product: null })}>Stock Transfer</PrimaryButton>}
      />

      <StatGrid
        items={[
          { label: "Total Stock Value", value: formatINR(products.reduce((s, p) => s + p.price * p.stock, 0)), color: "bg-blue-50" },
          { label: "Items in Stock", value: products.reduce((s, p) => s + p.stock, 0).toLocaleString("en-IN"), color: "bg-green-50" },
          { label: "Low Stock Items", value: low.length, color: "bg-red-50" },
          { label: "Out of Stock", value: products.filter((p) => p.stock === 0).length, color: "bg-purple-50" },
        ]}
      />

      <SearchBox value={search} onChange={setSearch} placeholder="Search by product name or SKU..." />

      <TableCard title="Stock Levels">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className={th}>Product</th>
              <th className={th}>SKU</th>
              <th className={th}>Category</th>
              <th className={`${th} text-right`}>Current Stock</th>
              <th className={`${th} text-right`}>Stock Value</th>
              <th className={th}>Status</th>
              <th className={th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className={`${td} font-medium text-gray-900`}>{p.name}</td>
                <td className={`${td} text-gray-600`}>{p.sku}</td>
                <td className={`${td} text-gray-600`}>{p.category}</td>
                <td className={`${td} text-right text-gray-900 font-medium`}>{p.stock}</td>
                <td className={`${td} text-right text-gray-900`}>{formatINR(p.price * p.stock)}</td>
                <td className={td}>
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                      p.stock <= 50 ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                    }`}
                  >
                    {p.stock <= 50 && <TriangleAlert size={14} />}
                    {p.stock === 0 ? "Out of Stock" : p.stock <= 50 ? "Low Stock" : "Good"}
                  </span>
                </td>
                <td className={td}>
                  <div className="flex items-center gap-2">
                    <button type="button" aria-label="Edit" onClick={() => setModal({ mode: "edit", product: p })} className="p-2 hover:bg-blue-100 rounded text-blue-600 transition-colors">
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      aria-label="Transfer"
                      onClick={() => setModal({ mode: "transfer", product: p })}
                      className="p-2 hover:bg-amber-100 rounded text-amber-600 transition-colors"
                    >
                      <ArrowRightLeft size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>

      {low.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <TriangleAlert className="text-red-600 mt-1 flex-shrink-0" size={24} />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900 mb-1">Critical Stock Alert</h3>
              <p className="text-red-700 text-sm mb-3">The following items are below reorder levels and need immediate attention:</p>
              <ul className="space-y-1 text-sm text-red-700">
                {low.map((p) => (
                  <li key={p.id}>
                    • {p.name} (Current Stock: {p.stock})
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <TableCard title="Recent Stock Movements">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className={th}>When</th>
              <th className={th}>Product</th>
              <th className={th}>Type</th>
              <th className={`${th} text-right`}>Qty</th>
              <th className={th}>Dealer</th>
              <th className={th}>Note</th>
            </tr>
          </thead>
          <tbody>
            {movements.rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-500">
                  No stock movements recorded yet.
                </td>
              </tr>
            ) : (
              movements.rows.map((m) => (
                <tr key={m.id} className="border-b border-gray-100">
                  <td className={`${td} text-gray-600 whitespace-nowrap`}>{formatDateTime(m.createdAt)}</td>
                  <td className={`${td} text-gray-900`}>{productName.get(m.productId) ?? "Deleted product"}</td>
                  <td className={`${td} capitalize text-gray-700`}>{m.type}</td>
                  <td className={`${td} text-right font-medium ${m.quantity < 0 ? "text-red-600" : "text-green-600"}`}>
                    {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                  </td>
                  <td className={`${td} text-gray-600`}>{m.dealerId ? dealerName.get(m.dealerId) ?? "—" : "—"}</td>
                  <td className={`${td} text-gray-600`}>{m.note}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </TableCard>

      <StockModal
        state={modal}
        products={products}
        dealers={dealers.filter((d) => d.status === "active")}
        onClose={() => setModal(null)}
        onSubmit={async (productId, type, qty, dealerId, note) => {
          await moveStock(productId, type, qty, dealerId, note);
          await movements.refresh();
        }}
      />
    </div>
  );
}

function StockModal({
  state,
  products,
  dealers,
  onClose,
  onSubmit,
}: {
  state: { mode: "transfer" | "edit"; product: Product | null } | null;
  products: Product[];
  dealers: { id: string; name: string }[];
  onClose: () => void;
  onSubmit: (productId: string, type: MoveType, qty: number, dealerId: string | null, note: string) => Promise<void>;
}) {
  const [productId, setProductId] = useState("");
  const [type, setType] = useState<"restock" | "transfer">("transfer");
  const [qty, setQty] = useState("");
  const [newStock, setNewStock] = useState("");
  const [dealerId, setDealerId] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!state) return;
    setProductId(state.product?.id ?? products[0]?.id ?? "");
    setType("transfer");
    setQty("");
    setNewStock(state.product ? String(state.product.stock) : "");
    setDealerId("");
    setNote("");
    setError(null);
  }, [state, products]);

  if (!state) return null;
  const product = products.find((p) => p.id === productId);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return setError("Choose a product");
    setError(null);
    let delta: number;
    let moveType: MoveType;
    if (state.mode === "edit") {
      const target = parseInt(newStock);
      if (isNaN(target) || target < 0) return setError("Enter a valid stock level");
      delta = target - product.stock;
      moveType = "adjustment";
      if (delta === 0) return onClose();
    } else {
      const n = parseInt(qty);
      if (isNaN(n) || n <= 0) return setError("Enter a quantity greater than zero");
      if (type === "transfer" && !dealerId) return setError("Choose the dealer receiving this stock");
      if (type === "transfer" && n > product.stock) return setError(`Only ${product.stock} units available`);
      delta = type === "transfer" ? -n : n;
      moveType = type;
    }
    setSaving(true);
    try {
      await onSubmit(product.id, moveType, delta, state.mode === "transfer" && type === "transfer" ? dealerId : null, note);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update stock");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={state.mode === "edit" ? "Adjust Stock" : "Stock Transfer"}
      width="max-w-lg"
      footer={<ModalActions onCancel={onClose} submitLabel={state.mode === "edit" ? "Update Stock" : "Confirm Transfer"} loading={saving} form="stock-form" />}
    >
      <form id="stock-form" onSubmit={submit} className="space-y-4">
        <SelectField label="Product" value={productId} onChange={(e) => setProductId(e.target.value)} disabled={!!state.product}>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} — {p.stock} in stock
            </option>
          ))}
        </SelectField>
        {state.mode === "edit" ? (
          <Field label="New Stock Level" type="number" min={0} value={newStock} onChange={(e) => setNewStock(e.target.value)} />
        ) : (
          <>
            <SelectField label="Movement" value={type} onChange={(e) => setType(e.target.value as "restock" | "transfer")}>
              <option value="transfer">Transfer out to dealer</option>
              <option value="restock">Restock warehouse (inbound)</option>
            </SelectField>
            <Field label="Quantity" type="number" min={1} value={qty} onChange={(e) => setQty(e.target.value)} />
            {type === "transfer" && (
              <SelectField label="Dealer" value={dealerId} onChange={(e) => setDealerId(e.target.value)}>
                <option value="">Select dealer</option>
                {dealers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </SelectField>
            )}
          </>
        )}
        <TextField label="Note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional reason or reference" />
        <ErrorBanner message={error} />
      </form>
    </Modal>
  );
}
