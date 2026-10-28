"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff, ListChecks, LoaderCircle, Package, Plus, Settings2, Tag, Trash2, Upload, X } from "lucide-react";
import { uploadProductImage, useCategories } from "@/lib/admin/data";
import { PHONES_SLUG, buildTree, canonicalCategory, groupOf } from "@/lib/catalog";
import type { Product, Spec } from "@/lib/types";

const PHONE_SPEC_LABELS = ["Display", "Processor", "RAM", "Storage", "Camera", "Front Camera", "Battery", "OS", "Network"];

/** Phone brand subcategories whose maker name differs from the category name. */
const BRAND_FOR_CATEGORY: Record<string, string> = { "Google Pixel": "Google" };

interface FormState {
  name: string;
  description: string;
  sku: string;
  brand: string;
  category: string;
  price: string;
  originalPrice: string;
  discount: string;
  stock: string;
  dealerId: string;
  images: string[];
  isPublic: boolean;
  isActive: boolean;
  tags: string;
  compatibility: string;
  variants: string;
  specs: Spec[];
}

const empty: FormState = {
  name: "",
  description: "",
  sku: "",
  brand: "",
  category: "",
  price: "",
  originalPrice: "",
  discount: "",
  stock: "",
  dealerId: "Warehouse",
  images: [],
  isPublic: false,
  isActive: true,
  tags: "",
  compatibility: "",
  variants: "",
  specs: [],
};

export type ProductDraft = Partial<Product> & { id?: string };

export function ProductModal({
  isOpen,
  onClose,
  product,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  product: ProductDraft | null;
  onSubmit: (p: Partial<Product>) => Promise<void>;
}) {
  const { categories } = useCategories();
  const tree = buildTree(categories);
  const firstCategory = tree[0]?.children[0]?.name ?? tree[0]?.name ?? categories[0]?.name ?? "Uncategorized";
  const [form, setForm] = useState<FormState>(empty);
  const [urlInput, setUrlInput] = useState("");
  const [tab, setTab] = useState<"general" | "pricing" | "specs" | "advanced">("general");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setTab("general");
    setError("");
    if (!product) return setForm({ ...empty, category: firstCategory });
    setForm({
      name: product.name ?? "",
      description: product.description ?? "",
      sku: product.sku ?? "",
      brand: product.brand ?? "",
      category: product.category || firstCategory,
      price: product.price?.toString() ?? "",
      originalPrice: product.originalPrice?.toString() ?? "",
      discount: product.discount?.toString() ?? "",
      stock: product.stock?.toString() ?? "",
      dealerId: product.dealerId || "Warehouse",
      images: product.images?.length ? product.images : product.thumbnail ? [product.thumbnail] : [],
      isPublic: product.isPublic ?? false,
      isActive: product.isActive ?? true,
      tags: product.tags?.join(", ") ?? "",
      compatibility: product.compatibility?.join(", ") ?? "",
      variants: product.variants && product.variants.length ? JSON.stringify(product.variants) : "",
      specs: product.specs ?? [],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product, isOpen]);

  if (!isOpen) return null;

  const isPhone = canonicalCategory(groupOf(form.category, categories)?.name ?? "") === PHONES_SLUG;
  const system = categories.find((c) => c.isSystem);
  const byId = new Map(categories.map((c) => [c.id, c]));
  const selectedHidden = (() => {
    const c = categories.find((x) => x.name === form.category);
    return !!c && (!c.isVisible || (!!c.parentId && byId.get(c.parentId)?.isVisible === false));
  })();

  // Picking a phone brand fills in the brand when it is still empty.
  const onCategory = (name: string) =>
    setForm((f) => {
      const c = categories.find((x) => x.name === name);
      const group = c?.parentId ? byId.get(c.parentId) : undefined;
      const brandFromCategory = group && canonicalCategory(group.name) === PHONES_SLUG ? BRAND_FOR_CATEGORY[name] ?? name : "";
      return { ...f, category: name, brand: f.brand.trim() ? f.brand : brandFromCategory };
    });

  const setSpec = (i: number, patch: Partial<Spec>) => setForm((f) => ({ ...f, specs: f.specs.map((s, j) => (j === i ? { ...s, ...patch } : s)) }));
  const addPhoneTemplate = () =>
    setForm((f) => {
      const have = new Set(f.specs.map((s) => s.label.toLowerCase()));
      return { ...f, specs: [...f.specs, ...PHONE_SPEC_LABELS.filter((l) => !have.has(l.toLowerCase())).map((label) => ({ label, value: "" }))] };
    });

  // Selling price, MRP and discount stay consistent whichever one is edited.
  const onPrice = (v: string) => {
    const p = parseFloat(v);
    const op = parseFloat(form.originalPrice);
    const discount = !isNaN(p) && !isNaN(op) && op > 0 ? Math.round(((op - p) / op) * 100).toString() : form.discount;
    setForm((f) => ({ ...f, price: v, discount }));
  };
  const onOriginal = (v: string) => {
    const op = parseFloat(v);
    const d = parseFloat(form.discount);
    const price = !isNaN(op) && !isNaN(d) ? Math.round(op - op * (d / 100)).toString() : form.price;
    setForm((f) => ({ ...f, originalPrice: v, price }));
  };
  const onDiscount = (v: string) => {
    const d = parseFloat(v);
    const op = parseFloat(form.originalPrice);
    const price = !isNaN(d) && !isNaN(op) ? Math.round(op - op * (d / 100)).toString() : form.price;
    setForm((f) => ({ ...f, discount: v, price }));
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || form.images.length >= 5) return;
    setUploading(true);
    setError("");
    try {
      const url = await uploadProductImage(file);
      setForm((f) => ({ ...f, images: [...f.images, url] }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const addUrl = () => {
    if (urlInput.trim() && form.images.length < 5) {
      setForm((f) => ({ ...f, images: [...f.images, urlInput.trim()] }));
      setUrlInput("");
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.sku.trim()) {
      setTab("general");
      return setError("Product title and SKU are required");
    }
    if (form.price === "" || form.stock === "") {
      setTab("pricing");
      return setError("Selling price and inventory stock are required");
    }
    let variants: unknown[] = [];
    if (form.variants.trim()) {
      try {
        const parsed = JSON.parse(form.variants);
        variants = Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        variants = form.variants.split(",").map((s) => s.trim()).filter(Boolean);
      }
    }
    const split = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);
    setSaving(true);
    setError("");
    try {
      await onSubmit({
        name: form.name.trim(),
        description: form.description,
        sku: form.sku.trim(),
        brand: form.brand.trim(),
        category: form.category,
        price: parseFloat(form.price) || 0,
        originalPrice: form.originalPrice !== "" ? parseFloat(form.originalPrice) : undefined,
        discount: form.discount !== "" ? parseFloat(form.discount) : undefined,
        stock: parseInt(form.stock) || 0,
        dealerId: form.dealerId,
        images: form.images,
        isPublic: form.isPublic,
        isActive: form.isActive,
        tags: split(form.tags),
        compatibility: split(form.compatibility),
        variants,
        specs: form.specs.map((x) => ({ label: x.label.trim(), value: x.value.trim() })).filter((x) => x.label && x.value),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: "general" as const, label: "General Info", icon: Package },
    { id: "pricing" as const, label: "Pricing & Availability", icon: Tag },
    { id: "specs" as const, label: isPhone ? "Phone Specs" : "Specifications", icon: ListChecks },
    { id: "advanced" as const, label: "Variants & Details", icon: Settings2 },
  ];
  const smallLabel = "block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3";
  const label = "block text-xs font-black text-gray-400 uppercase tracking-widest mb-2";
  const input = "w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-orange-500 transition-all outline-none font-bold text-gray-900";

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 pointer-events-none">
        <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-3xl w-full max-h-[94vh] sm:max-h-[90vh] overflow-hidden shadow-2xl flex flex-col pointer-events-auto animate-in">
          <div className="p-4 sm:p-6 md:p-8 border-b border-gray-100 flex items-center justify-between gap-4 bg-white shrink-0">
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 tracking-tight font-display">{product?.id ? "Edit Product" : "Create Product"}</h2>
              <p className="text-[10px] font-bold text-gray-400 mt-1 md:mt-2 uppercase tracking-[0.2em] truncate">
                {product?.id ? `Product Reference: ${product.id}` : "Catalog Entry Details"}
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="p-2.5 hover:bg-gray-50 rounded-2xl text-gray-400 hover:text-gray-900 transition-all border border-transparent hover:border-gray-100"
            >
              <X size={20} />
            </button>
          </div>

          <div className="bg-gray-50/50 border-b border-gray-100 px-4 md:px-8 flex items-center gap-5 md:gap-8 shrink-0 overflow-x-auto no-scrollbar">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`py-4 text-[10px] font-bold uppercase tracking-[0.2em] border-b-2 transition-all flex items-center gap-2.5 relative whitespace-nowrap ${
                  tab === t.id ? "border-orange-600 text-orange-600" : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                <t.icon size={14} strokeWidth={tab === t.id ? 3 : 2} />
                {t.label}
              </button>
            ))}
          </div>

          <form id="product-form" onSubmit={submit} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-8 custom-scrollbar">
            {tab === "general" && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Product Gallery (Max 5)</label>
                    <span className="text-[10px] font-bold text-gray-300">{form.images.length}/5 Images</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Paste image URL here..."
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addUrl())}
                      className="flex-1 px-4 py-2.5 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-orange-500 transition-all outline-none text-[13px] font-bold text-gray-900"
                    />
                    <button
                      type="button"
                      onClick={addUrl}
                      disabled={form.images.length >= 5 || !urlInput.trim()}
                      className="bg-gray-900 text-white px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-[0.1em] disabled:opacity-20 transition-all active:scale-95 shadow-lg shadow-gray-900/10"
                    >
                      Add URL
                    </button>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                    {form.images.map((src, i) => (
                      <div key={`${src}-${i}`} className="relative group aspect-square">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt="" className="w-full h-full object-cover rounded-xl border border-gray-100 shadow-sm" />
                        {i === 0 && (
                          <span className="absolute bottom-1 left-1 bg-gray-900/80 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase">Cover</span>
                        )}
                        <button
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, images: f.images.filter((_, j) => j !== i) }))}
                          aria-label="Remove image"
                          className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-1 shadow-lg sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                    {form.images.length < 5 && (
                      <div className="relative border-2 border-dashed border-gray-200 rounded-xl aspect-square flex flex-col items-center justify-center hover:border-orange-500 hover:bg-orange-50/50 transition-all cursor-pointer group">
                        <input type="file" accept="image/*" onChange={onFile} disabled={uploading} className="absolute inset-0 opacity-0 cursor-pointer" />
                        {uploading ? (
                          <LoaderCircle size={20} className="animate-spin text-orange-500" />
                        ) : (
                          <Upload size={20} className="text-gray-300 group-hover:text-orange-500" />
                        )}
                        <span className="text-[10px] font-bold text-gray-300 mt-1 uppercase">{uploading ? "Uploading" : "Upload"}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className={smallLabel}>Product Title</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-orange-500 transition-all outline-none font-bold text-gray-900 text-lg tracking-tight placeholder-gray-300"
                      placeholder="e.g., Samsung Galaxy S24 Ultra or iPhone 16 Rugged Case"
                    />
                  </div>
                  <div>
                    <label className={label}>SKU</label>
                    <input type="text" value={form.sku} onChange={(e) => setForm((prev) => ({ ...prev, sku: e.target.value }))} className={input} placeholder="SKU-001" />
                  </div>
                  <div>
                    <label className={label}>Category</label>
                    <select value={form.category} onChange={(e) => onCategory(e.target.value)} className={input}>
                      {tree.map((g) =>
                        g.children.length ? (
                          <optgroup key={g.id} label={g.isVisible ? g.name : `${g.name} (hidden)`}>
                            {g.children.map((c) => (
                              <option key={c.id} value={c.name}>
                                {c.name}
                                {c.isVisible ? "" : " (hidden)"}
                              </option>
                            ))}
                            <option value={g.name}>{g.name} (general)</option>
                          </optgroup>
                        ) : (
                          <option key={g.id} value={g.name}>
                            {g.name}
                            {g.isVisible ? "" : " (hidden)"}
                          </option>
                        ),
                      )}
                      {system && <option value={system.name}>{system.name} (hidden from store)</option>}
                    </select>
                    {selectedHidden && (
                      <p className="text-[11px] text-amber-600 mt-2 font-medium">Products in this category are not shown in the store.</p>
                    )}
                  </div>
                  <div className="sm:col-span-2">
                    <label className={label}>Description</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                      className={`${input} min-h-[100px]`}
                      placeholder="Deeply detailed features..."
                    />
                  </div>
                </div>
              </div>
            )}

            {tab === "pricing" && (
              <div className="space-y-8 animate-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className={smallLabel}>Selling Price (SP)</label>
                    <div className="relative group">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.price}
                        onChange={(e) => onPrice(e.target.value)}
                        className="w-full pl-8 pr-4 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-orange-500 transition-all outline-none font-black text-xl text-gray-900"
                      />
                    </div>
                  </div>
                  <div>
                    <label className={smallLabel}>Original Price (CP)</label>
                    <div className="relative group">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.originalPrice}
                        onChange={(e) => onOriginal(e.target.value)}
                        className="w-full pl-8 pr-4 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-orange-500 transition-all outline-none font-bold text-lg text-gray-400"
                      />
                    </div>
                  </div>
                  <div>
                    <label className={smallLabel}>Discount</label>
                    <div className="relative group">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={form.discount}
                        onChange={(e) => onDiscount(e.target.value)}
                        className="w-full px-4 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-orange-500 transition-all outline-none font-bold text-lg text-red-500 pr-16"
                        placeholder="0"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-red-500">% Off</span>
                    </div>
                  </div>
                  <div>
                    <label className={smallLabel}>Inventory Stock</label>
                    <input
                      type="number"
                      min="0"
                      value={form.stock}
                      onChange={(e) => setForm((prev) => ({ ...prev, stock: e.target.value }))}
                      className="w-full px-4 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-orange-500 transition-all outline-none font-bold text-lg text-gray-900"
                    />
                  </div>
                </div>
                <Toggle
                  on={form.isPublic}
                  onToggle={() => setForm((f) => ({ ...f, isPublic: !f.isPublic }))}
                  title="Public Visibility"
                  description="Determine if this product is visible to customers"
                  icon={form.isPublic ? <Eye size={24} /> : <EyeOff size={24} />}
                  tone="orange"
                />
                <Toggle
                  on={form.isActive}
                  onToggle={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}
                  title="Internal Status"
                  description="Inactive products are hidden from the store and cannot be ordered"
                  icon={<Package size={24} />}
                  tone="green"
                />
              </div>
            )}

            {tab === "specs" && (
              <div className="space-y-4 animate-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <p className="text-xs text-gray-500">
                    {isPhone
                      ? "Shown as key highlights and a full spec sheet on the product page, and as a short line on product cards."
                      : "Optional. Shown in the Specifications section of the product page."}
                  </p>
                  <button
                    type="button"
                    onClick={addPhoneTemplate}
                    className="shrink-0 px-4 py-2 rounded-xl bg-gray-900 text-white text-[10px] font-bold uppercase tracking-[0.1em]"
                  >
                    Add phone spec fields
                  </button>
                </div>
                {form.specs.length === 0 && <p className="text-sm text-gray-400 py-6 text-center border border-dashed border-gray-200 rounded-xl">No specifications yet.</p>}
                {form.specs.map((sp, i) => (
                  <div key={i} className="grid grid-cols-[1fr_auto] sm:grid-cols-[180px_1fr_auto] gap-2 items-center">
                    <input
                      type="text"
                      value={sp.label}
                      onChange={(e) => setSpec(i, { label: e.target.value })}
                      placeholder="Label, e.g. RAM"
                      className={`${input} col-span-2 sm:col-span-1 text-sm`}
                    />
                    <input
                      type="text"
                      value={sp.value}
                      onChange={(e) => setSpec(i, { value: e.target.value })}
                      placeholder={sp.label === "Display" ? 'e.g. 6.7" AMOLED, 120Hz' : "Value"}
                      className={`${input} text-sm font-medium`}
                    />
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, specs: f.specs.filter((_, j) => j !== i) }))}
                      aria-label="Remove specification"
                      className="p-3 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, specs: [...f.specs, { label: "", value: "" }] }))}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-orange-600 hover:text-orange-700"
                >
                  <Plus size={16} /> Add specification
                </button>
              </div>
            )}

            {tab === "advanced" && (
              <div className="space-y-6">
                <div>
                  <label className={label}>Manufacturer / Brand</label>
                  <input type="text" value={form.brand} onChange={(e) => setForm((prev) => ({ ...prev, brand: e.target.value }))} className={input} placeholder="e.g., Zuprano Premium" />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Tags (Comma separated)</label>
                  <input type="text" value={form.tags} onChange={(e) => setForm((prev) => ({ ...prev, tags: e.target.value }))} className={input} placeholder="luxury, protective, case, slim" />
                  <div className="flex flex-wrap gap-2 mt-3">
                    {form.tags
                      .split(",")
                      .filter((t) => t.trim())
                      .map((t, i) => (
                        <span key={i} className="px-2 py-1 bg-orange-100 text-orange-600 rounded text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                          <Tag size={10} /> {t.trim()}
                        </span>
                      ))}
                  </div>
                </div>
                <div>
                  <label className={label}>{isPhone ? "Device Compatibility (usually empty for phones)" : "Device Compatibility"}</label>
                  <textarea
                    value={form.compatibility}
                    onChange={(e) => setForm((prev) => ({ ...prev, compatibility: e.target.value }))}
                    className={`${input} min-h-[80px]`}
                    placeholder="iPhone 15, iPhone 16..."
                  />
                </div>
                <div>
                  <label className={label}>Variants (JSON or List)</label>
                  <textarea
                    value={form.variants}
                    onChange={(e) => setForm((prev) => ({ ...prev, variants: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-orange-500 transition-all outline-none font-mono text-xs font-bold text-blue-600 min-h-[80px]"
                    placeholder={
                      isPhone
                        ? '[{"id": "8-128", "name": "Storage", "value": "8GB / 128GB", "price": 19999, "stock": 10}, {"id": "8-256", "name": "Storage", "value": "8GB / 256GB", "price": 21999, "stock": 10}]'
                        : '[{"id": "black", "name": "Color", "value": "Black", "price": 499, "stock": 10}]'
                    }
                  />
                  <p className="text-[10px] text-gray-400 mt-2">
                    Each variant may set its own price and stock{isPhone ? " (e.g. one per RAM / storage option)" : ""}. A plain list like{" "}
                    <span className="font-mono">Red, Blue</span> also works.
                  </p>
                </div>
              </div>
            )}
            {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>}
          </form>

          <div className="p-4 md:p-8 border-t border-gray-100 bg-white flex items-center justify-end gap-4 md:gap-5 shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <button
              type="button"
              onClick={onClose}
              className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 hover:text-gray-900 transition-colors"
            >
              Dismiss Changes
            </button>
            <button
              form="product-form"
              type="submit"
              disabled={saving || uploading}
              className="px-6 md:px-10 py-3 md:py-4 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-orange-600/20 active:scale-95 transition-all disabled:opacity-50"
            >
              {saving ? "Saving..." : product?.id ? "Synchronize Updates" : "Publish Product"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function Toggle({
  on,
  onToggle,
  title,
  description,
  icon,
  tone,
}: {
  on: boolean;
  onToggle: () => void;
  title: string;
  description: string;
  icon: React.ReactNode;
  tone: "orange" | "green";
}) {
  const active = tone === "orange" ? "bg-orange-600" : "bg-green-600";
  return (
    <div className={`${tone === "orange" ? "bg-orange-50 border-orange-100" : "bg-gray-50 border-gray-100"} rounded-2xl p-4 md:p-6 flex items-center justify-between border gap-4`}>
      <div className="flex items-center gap-4">
        <div className={`hidden sm:flex w-12 h-12 rounded-xl items-center justify-center transition-colors shrink-0 ${on ? `${active} text-white` : "bg-gray-200 text-gray-400"}`}>{icon}</div>
        <div>
          <h4 className="font-bold text-gray-900">{title}</h4>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={on}
        className={`w-14 h-8 rounded-full relative transition-all duration-300 shadow-inner shrink-0 ${on ? active : "bg-gray-300"}`}
      >
        <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-sm transition-all duration-300 ${on ? "left-7" : "left-1"}`} />
      </button>
    </div>
  );
}
