"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Copy, Filter, LayoutGrid, List, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useCategories, useProducts } from "@/lib/admin/data";
import { ProductModal, type ProductDraft } from "@/components/admin/ProductModal";
import { formatINR } from "@/lib/format";
import type { Product } from "@/lib/types";

const FALLBACK_IMG = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&h=200&fit=crop";

function ProductsContent() {
  const params = useSearchParams();
  const { categories: allCategories } = useCategories();
  const { products, loading, error, addProduct, updateProduct, deleteProduct } = useProducts();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");

  useEffect(() => {
    setCategory(params.get("category") ?? "");
  }, [params]);
  const [view, setView] = useState<"list" | "grid">("list");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ProductDraft | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const q = search.toLowerCase();
  const filtered = products.filter(
    (p) =>
      (p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q)) && (!category || p.category === category),
  );
  const categories = Array.from(new Set([...allCategories.map((c) => c.name), ...products.map((p) => p.category)]));
  const hiddenCategories = new Set(allCategories.filter((c) => !c.isVisible).map((c) => c.name));

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (p: Product) => {
    setEditing(p);
    setModalOpen(true);
  };
  const duplicate = (p: Product) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, createdAt, updatedAt, ...rest } = p;
    setEditing({ ...rest, name: `${p.name} (Copy)`, sku: p.sku ? `${p.sku}-COPY` : "", isPublic: false });
    setModalOpen(true);
  };
  const remove = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await deleteProduct(id);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Failed to delete product");
    }
  };
  const save = async (data: Partial<Product>) => {
    if (editing?.id) await updateProduct(editing.id, data);
    else await addProduct(data);
  };

  if (loading) return <div className="p-8 text-center bg-white rounded-lg border border-gray-100 italic text-gray-500">Loading products...</div>;

  const shownError = error || actionError;
  const stats = [
    { label: "Total Products", value: products.length, color: "text-blue-600", bg: "bg-blue-50/50" },
    { label: "Live Products", value: products.filter((p) => p.isPublic).length, color: "text-green-600", bg: "bg-green-50/50" },
    { label: "Low Stock", value: products.filter((p) => p.stock > 0 && p.stock <= 50).length, color: "text-amber-600", bg: "bg-amber-50/50" },
    { label: "Drafts", value: products.filter((p) => !p.isPublic).length, color: "text-gray-600", bg: "bg-gray-50/50" },
  ];

  return (
    <div className="space-y-6">
      {shownError && (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-100 flex items-center justify-between">
          <span>Error: {shownError}</span>
          <button onClick={() => window.location.reload()} className="text-sm underline">
            Retry
          </button>
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600 mt-2">Manage your product catalog and inventory</p>
        </div>
        <button
          onClick={openCreate}
          type="button"
          className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors duration-150 shadow-lg shadow-orange-600/20 w-fit"
        >
          <Plus size={18} /> Add Product
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((s) => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-6 border border-white shadow-sm backdrop-blur-sm`}>
            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{s.label}</h3>
            <p className={`text-4xl font-black ${s.color} mt-2`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4 lg:items-center">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, SKU or brand..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-transparent rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all"
            />
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 bg-gray-100/50 p-1 rounded-xl border border-gray-200">
              <button
                onClick={() => setView("list")}
                title="List View"
                className={`p-2 rounded-lg transition-all ${view === "list" ? "bg-white shadow-sm text-orange-600" : "text-gray-400 hover:text-gray-600"}`}
              >
                <List size={18} />
              </button>
              <button
                onClick={() => setView("grid")}
                title="Grid View"
                className={`p-2 rounded-lg transition-all ${view === "grid" ? "bg-white shadow-sm text-orange-600" : "text-gray-400 hover:text-gray-600"}`}
              >
                <LayoutGrid size={18} />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <Filter size={16} className="text-gray-400" />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="min-h-[400px]">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Search size={48} className="mx-auto text-gray-200 mb-4" />
            <h3 className="text-lg font-bold text-gray-900">No products found</h3>
            <p className="text-gray-500">Try adjusting your search or filters.</p>
            <button
              onClick={() => {
                setSearch("");
                setCategory("");
              }}
              className="mt-4 text-orange-600 font-medium hover:underline"
            >
              Clear all filters
            </button>
          </div>
        ) : view === "list" ? (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="bg-gray-50/50 border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-lg text-gray-900 font-black tracking-tight uppercase">Inventory List</h2>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{filtered.length} Total Items</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    {["Image", "Product & Brand", "Status", "Price", "Stock"].map((h) => (
                      <th key={h} className="text-left py-4 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
                        {h}
                      </th>
                    ))}
                    <th className="text-right py-4 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="py-4 px-6">
                        <div className="relative inline-block">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={p.thumbnail || FALLBACK_IMG}
                            alt={p.name}
                            className="w-12 h-12 rounded-xl object-cover border border-gray-100 shadow-sm"
                            onError={(e) => (e.currentTarget.src = FALLBACK_IMG)}
                          />
                          {p.images.length > 1 && (
                            <span className="absolute -top-1.5 -right-1.5 bg-gray-900 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full border-2 border-white shadow-sm">
                              +{p.images.length - 1}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900 line-clamp-1">{p.name}</span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[9px] font-black text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded uppercase">{p.brand || "No Brand"}</span>
                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">{p.sku}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${p.isPublic ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" : "bg-gray-300"}`} />
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${p.isPublic ? "text-green-600" : "text-gray-400"}`}>
                            {p.isPublic ? "Live" : "Draft"}
                          </span>
                          {!p.isActive && <span className="text-[9px] font-bold uppercase text-red-500">Inactive</span>}
                          {hiddenCategories.has(p.category) && (
                            <span className="text-[9px] font-bold uppercase text-amber-600" title={`Category "${p.category}" is hidden from the store`}>
                              Category hidden
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-col">
                          <span className="font-black text-gray-900">{formatINR(p.price)}</span>
                          {!!p.discount && p.discount > 0 && <span className="text-[9px] font-bold text-red-500">-{p.discount}% Off</span>}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-col gap-1.5">
                          <span className={`text-xs font-bold ${p.stock <= 20 ? "text-red-600" : "text-gray-900"}`}>{p.stock} units</span>
                          <div className="w-20 h-1 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${p.stock <= 20 ? "bg-red-500" : p.stock <= 50 ? "bg-amber-500" : "bg-green-500"}`}
                              style={{ width: `${Math.min(p.stock, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center gap-1 lg:opacity-0 lg:group-hover:opacity-100 transition-all justify-end lg:translate-x-2 lg:group-hover:translate-x-0">
                          <button onClick={() => openEdit(p)} title="Edit" className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                            <Pencil size={16} />
                          </button>
                          <button onClick={() => duplicate(p)} title="Duplicate" className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all">
                            <Copy size={16} />
                          </button>
                          <button onClick={() => remove(p.id)} title="Delete" className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group shadow-sm flex flex-col"
              >
                <div className="aspect-square relative overflow-hidden bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.thumbnail || FALLBACK_IMG}
                    alt={p.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    onError={(e) => (e.currentTarget.src = FALLBACK_IMG)}
                  />
                  <div className="absolute top-3 left-3 flex flex-col gap-2">
                    <span className="px-2 py-1 bg-white/90 backdrop-blur-sm text-[9px] font-black uppercase tracking-widest text-gray-900 rounded shadow-sm">{p.category}</span>
                    <span
                      className={`px-2 py-1 backdrop-blur-sm text-[9px] font-black uppercase tracking-widest rounded shadow-sm ${
                        p.isPublic ? "bg-green-500/90 text-white" : "bg-gray-100/90 text-gray-500"
                      }`}
                    >
                      {p.isPublic ? "Live" : "Draft"}
                    </span>
                  </div>
                  {p.images.length > 1 && (
                    <div className="absolute bottom-3 right-3 bg-gray-900/80 backdrop-blur-sm text-white text-[10px] font-black px-2 py-1 rounded-lg z-10">
                      {p.images.length} Images
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-3 backdrop-blur-[2px] z-20">
                    <button
                      onClick={() => openEdit(p)}
                      title="Edit"
                      className="w-10 h-10 bg-white text-gray-900 rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={() => duplicate(p)}
                      title="Duplicate"
                      className="w-10 h-10 bg-white text-orange-600 rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
                    >
                      <Copy size={18} />
                    </button>
                    <button
                      onClick={() => remove(p.id)}
                      title="Delete"
                      className="w-10 h-10 bg-red-600 text-white rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest">{p.brand || "GENERIC"}</span>
                    <h3 className="font-bold text-gray-900 line-clamp-2 leading-tight mt-1 group-hover:text-orange-600 transition-colors uppercase tracking-tight antialiased">
                      {p.name}
                    </h3>
                  </div>
                  <div className="flex items-end justify-between mt-4">
                    <div className="flex flex-col">
                      <span className="text-xl font-black text-gray-900 tracking-tighter">{formatINR(p.price)}</span>
                      {!!p.originalPrice && p.originalPrice > p.price && (
                        <span className="text-[10px] text-gray-400 line-through">{formatINR(p.originalPrice)}</span>
                      )}
                    </div>
                    <span className={`text-[10px] font-black px-2 py-1 rounded ${p.stock < 10 ? "bg-red-50 text-red-600" : "bg-gray-50 text-gray-500"}`}>{p.stock} PCS</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ProductModal isOpen={modalOpen} onClose={() => setModalOpen(false)} product={editing} onSubmit={save} />
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense>
      <ProductsContent />
    </Suspense>
  );
}
