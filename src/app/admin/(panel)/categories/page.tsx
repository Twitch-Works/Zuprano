"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Eye, EyeOff, FolderTree, LoaderCircle, Lock, Pencil, Trash2, TriangleAlert, Upload } from "lucide-react";
import { uploadProductImage, useCategories, useProducts } from "@/lib/admin/data";
import { ErrorBanner, Field, Loading, Modal, ModalActions, PageHeader, PrimaryButton, SearchBox, StatGrid, TableCard, TextField, td, th } from "@/components/admin/ui";
import type { Category } from "@/lib/types";

function CategoryModal({
  open,
  category,
  nextOrder,
  onClose,
  onSubmit,
}: {
  open: boolean;
  category: Category | null;
  nextOrder: number;
  onClose: () => void;
  onSubmit: (c: Partial<Category>) => Promise<void>;
}) {
  const [form, setForm] = useState({ name: "", description: "", image: "", sortOrder: "0", isVisible: true });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    setForm(
      category
        ? { name: category.name, description: category.description, image: category.image, sortOrder: String(category.sortOrder), isVisible: category.isVisible }
        : { name: "", description: "", image: "", sortOrder: String(nextOrder), isVisible: true },
    );
  }, [category, open, nextOrder]);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadProductImage(file);
      setForm((prev) => ({ ...prev, image: url }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return setError("Category name is required");
    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        name: form.name.trim(),
        description: form.description,
        image: form.image.trim(),
        sortOrder: parseInt(form.sortOrder) || 0,
        ...(category?.isSystem ? {} : { isVisible: form.isVisible }),
      });
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save category";
      setError(msg.includes("duplicate") ? "A category with this name already exists" : msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={category ? "Edit Category" : "Add Category"}
      width="max-w-lg"
      footer={<ModalActions onCancel={onClose} submitLabel={category ? "Save Changes" : "Create Category"} loading={saving || uploading} form="category-form" />}
    >
      <form id="category-form" onSubmit={submit} className="space-y-4">
        <Field
          label="Category Name"
          required
          disabled={category?.isSystem}
          value={form.name}
          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="e.g., Screen Protectors"
        />
        {category && !category.isSystem && <p className="text-xs text-gray-500 -mt-2">Renaming updates every product in this category automatically.</p>}
        <TextField label="Description" rows={2} value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} />
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">Image</label>
          <div className="flex gap-3 items-center">
            {form.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.image} alt="" className="w-14 h-14 rounded-lg object-cover border border-gray-100" />
            ) : (
              <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300">
                <FolderTree size={20} />
              </div>
            )}
            <input
              type="text"
              placeholder="Paste image URL..."
              value={form.image}
              onChange={(e) => setForm((prev) => ({ ...prev, image: e.target.value }))}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <label className="relative p-2.5 border border-gray-200 rounded-lg cursor-pointer hover:border-orange-500 text-gray-500" title="Upload">
              {uploading ? <LoaderCircle size={18} className="animate-spin" /> : <Upload size={18} />}
              <input type="file" accept="image/*" onChange={onFile} className="absolute inset-0 opacity-0 cursor-pointer" />
            </label>
          </div>
        </div>
        <Field label="Display Order" type="number" value={form.sortOrder} onChange={(e) => setForm((prev) => ({ ...prev, sortOrder: e.target.value }))} />
        {!category?.isSystem && (
          <label className="flex items-center justify-between p-3 border border-gray-100 rounded-lg cursor-pointer">
            <div>
              <p className="font-medium text-gray-900">Visible to shoppers</p>
              <p className="text-xs text-gray-500">Hidden categories hide all of their products from the store.</p>
            </div>
            <input
              type="checkbox"
              checked={form.isVisible}
              onChange={(e) => setForm((prev) => ({ ...prev, isVisible: e.target.checked }))}
              className="w-5 h-5 accent-orange-600"
            />
          </label>
        )}
        <ErrorBanner message={error} />
      </form>
    </Modal>
  );
}

function DeleteModal({
  category,
  categories,
  productCount,
  onClose,
  onConfirm,
}: {
  category: Category | null;
  categories: Category[];
  productCount: number;
  onClose: () => void;
  onConfirm: (targetId: string | null) => Promise<void>;
}) {
  const [mode, setMode] = useState<"default" | "other">("default");
  const [target, setTarget] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const options = categories.filter((c) => c.id !== category?.id && !c.isSystem);
  const defaultCategory = categories.find((c) => c.isSystem);

  useEffect(() => {
    setMode("default");
    setTarget(options[0]?.id ?? "");
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  if (!category) return null;
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "other" && !target) return setError("Choose the category the products should move to");
    setSaving(true);
    try {
      await onConfirm(mode === "other" ? target : null);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete category");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={`Delete "${category.name}"`}
      width="max-w-lg"
      footer={
        <>
          <button type="button" onClick={onClose} className="px-6 py-2 border border-gray-200 rounded-lg">
            Cancel
          </button>
          <button type="submit" form="delete-category" disabled={saving} className="px-6 py-2 bg-red-600 text-white rounded-lg font-medium disabled:opacity-50">
            {saving ? "Deleting..." : "Delete Category"}
          </button>
        </>
      }
    >
      <form id="delete-category" onSubmit={submit} className="space-y-4">
        {productCount === 0 ? (
          <p className="text-sm text-gray-600">This category has no products. It will be removed permanently.</p>
        ) : (
          <>
            <p className="text-sm text-gray-600">
              <strong>{productCount}</strong> product{productCount === 1 ? "" : "s"} currently belong{productCount === 1 ? "s" : ""} to this category. Where should{" "}
              {productCount === 1 ? "it" : "they"} go?
            </p>
            <label className={`flex gap-3 p-4 border-2 rounded-lg cursor-pointer ${mode === "default" ? "border-orange-600 bg-orange-50/40" : "border-gray-100"}`}>
              <input type="radio" name="dest" checked={mode === "default"} onChange={() => setMode("default")} className="mt-1 accent-orange-600" />
              <div>
                <p className="font-medium text-gray-900">Move to {defaultCategory?.name ?? "Uncategorized"}</p>
                <p className="text-xs text-gray-500">Products stay hidden from shoppers until you assign each one a new category.</p>
              </div>
            </label>
            <label
              className={`flex gap-3 p-4 border-2 rounded-lg ${options.length ? "cursor-pointer" : "opacity-50"} ${mode === "other" ? "border-orange-600 bg-orange-50/40" : "border-gray-100"}`}
            >
              <input
                type="radio"
                name="dest"
                disabled={!options.length}
                checked={mode === "other"}
                onChange={() => setMode("other")}
                className="mt-1 accent-orange-600"
              />
              <div className="flex-1 space-y-2">
                <p className="font-medium text-gray-900">Move all products to another category</p>
                <select
                  value={target}
                  onChange={(e) => {
                    setTarget(e.target.value);
                    setMode("other");
                  }}
                  disabled={!options.length}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm"
                >
                  {options.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                      {c.isVisible ? "" : " (hidden)"}
                    </option>
                  ))}
                </select>
              </div>
            </label>
          </>
        )}
        <ErrorBanner message={error} />
      </form>
    </Modal>
  );
}

export default function CategoriesPage() {
  const { categories, loading, error, createCategory, updateCategory, deleteCategory } = useCategories();
  const { products } = useProducts();
  const [search, setSearch] = useState("");
  const [editModal, setEditModal] = useState<{ category: Category | null } | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

  if (loading) return <Loading label="Loading categories..." />;
  if (error) return <div className="p-8 text-center bg-red-50 text-red-600 border border-red-100 rounded-lg">Error: {error}</div>;

  const counts = new Map<string, { total: number; live: number }>();
  products.forEach((p) => {
    const c = counts.get(p.category) ?? { total: 0, live: 0 };
    c.total += 1;
    if (p.isPublic && p.isActive) c.live += 1;
    counts.set(p.category, c);
  });
  const system = categories.find((c) => c.isSystem);
  const regular = categories.filter((c) => !c.isSystem);
  const uncategorized = system ? counts.get(system.name)?.total ?? 0 : 0;
  const q = search.toLowerCase();
  const filtered = categories.filter((c) => c.name.toLowerCase().includes(q) || c.slug.includes(q));

  const toggleVisibility = async (c: Category) => {
    const n = counts.get(c.name)?.total ?? 0;
    if (c.isVisible && n > 0 && !window.confirm(`Hide "${c.name}"? Its ${n} product${n === 1 ? "" : "s"} will disappear from the store until you show it again.`)) return;
    try {
      await updateCategory(c.id, { isVisible: !c.isVisible });
      setNotice({ ok: true, text: `"${c.name}" is now ${c.isVisible ? "hidden from" : "visible in"} the store.` });
    } catch (e) {
      setNotice({ ok: false, text: e instanceof Error ? e.message : "Could not update visibility" });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categories"
        subtitle="Organise your catalogue and control what shoppers can see"
        action={<PrimaryButton onClick={() => setEditModal({ category: null })}>Add Category</PrimaryButton>}
      />

      <StatGrid
        items={[
          { label: "Total Categories", value: regular.length, color: "bg-blue-50" },
          { label: "Visible", value: regular.filter((c) => c.isVisible).length, color: "bg-green-50" },
          { label: "Hidden", value: regular.filter((c) => !c.isVisible).length, color: "bg-gray-50" },
          { label: "Uncategorized Products", value: uncategorized, color: uncategorized ? "bg-amber-50" : "bg-purple-50" },
        ]}
      />

      {uncategorized > 0 && system && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <TriangleAlert size={20} className="text-amber-600 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-900">
              <strong>{uncategorized}</strong> product{uncategorized === 1 ? " is" : "s are"} in <strong>{system.name}</strong> and hidden from shoppers. Assign a category to
              show {uncategorized === 1 ? "it" : "them"} again.
            </p>
          </div>
          <Link href={`/admin/products?category=${encodeURIComponent(system.name)}`} className="text-sm font-medium text-orange-600 hover:text-orange-700 whitespace-nowrap">
            Review products →
          </Link>
        </div>
      )}

      {notice && (
        <div className={`p-3 rounded-lg text-sm border ${notice.ok ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-600"}`}>{notice.text}</div>
      )}

      <SearchBox value={search} onChange={setSearch} placeholder="Search categories..." />

      <TableCard title={`Category List (${filtered.length})`}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className={th}>Category</th>
              <th className={`${th} text-right`}>Products</th>
              <th className={`${th} text-right`}>Order</th>
              <th className={th}>Visibility</th>
              <th className={th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => {
              const n = counts.get(c.name) ?? { total: 0, live: 0 };
              return (
                <tr key={c.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${c.isSystem ? "bg-gray-50/60" : ""}`}>
                  <td className={td}>
                    <div className="flex items-center gap-3">
                      {c.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.image} alt="" className="w-10 h-10 rounded-lg object-cover border border-gray-100" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300">
                          <FolderTree size={18} />
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-gray-900 flex items-center gap-2">
                          {c.name}
                          {c.isSystem && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-gray-900 text-white px-1.5 py-0.5 rounded">
                              <Lock size={10} /> Default
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">/{c.slug}</div>
                        {c.description && <div className="text-xs text-gray-500 mt-0.5 line-clamp-1 max-w-md">{c.description}</div>}
                      </div>
                    </div>
                  </td>
                  <td className={`${td} text-right`}>
                    <Link href={`/admin/products?category=${encodeURIComponent(c.name)}`} className="font-medium text-gray-900 hover:text-orange-600">
                      {n.total}
                    </Link>
                    <div className="text-xs text-gray-500">{n.live} live</div>
                  </td>
                  <td className={`${td} text-right text-gray-600`}>{c.sortOrder}</td>
                  <td className={td}>
                    {c.isSystem ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        <EyeOff size={12} /> Always hidden
                      </span>
                    ) : (
                      <button
                        onClick={() => toggleVisibility(c)}
                        title={c.isVisible ? "Hide from store" : "Show in store"}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          c.isVisible ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                      >
                        {c.isVisible ? <Eye size={12} /> : <EyeOff size={12} />}
                        {c.isVisible ? "Visible" : "Hidden"}
                      </button>
                    )}
                  </td>
                  <td className={td}>
                    <div className="flex items-center gap-2">
                      <button type="button" aria-label="Edit" onClick={() => setEditModal({ category: c })} className="p-2 hover:bg-blue-100 rounded text-blue-600 transition-colors">
                        <Pencil size={16} />
                      </button>
                      {!c.isSystem && (
                        <button type="button" aria-label="Delete" onClick={() => setDeleting(c)} className="p-2 hover:bg-red-100 rounded text-red-600 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </TableCard>

      <CategoryModal
        open={!!editModal}
        category={editModal?.category ?? null}
        nextOrder={Math.max(0, ...regular.map((c) => c.sortOrder)) + 1}
        onClose={() => setEditModal(null)}
        onSubmit={(data) => (editModal?.category ? updateCategory(editModal.category.id, data) : createCategory(data))}
      />
      <DeleteModal
        category={deleting}
        categories={categories}
        productCount={deleting ? counts.get(deleting.name)?.total ?? 0 : 0}
        onClose={() => setDeleting(null)}
        onConfirm={async (targetId) => {
          const name = deleting!.name;
          const moved = await deleteCategory(deleting!.id, targetId);
          const dest = targetId ? categories.find((c) => c.id === targetId)?.name : system?.name;
          setNotice({ ok: true, text: `Deleted "${name}".${moved ? ` ${moved} product${moved === 1 ? "" : "s"} moved to ${dest}.` : ""}` });
        }}
      />
    </div>
  );
}
