"use client";

import { useEffect, useState } from "react";
import { Pencil, Tag, Trash2 } from "lucide-react";
import { useCampaigns, useCategories, useOrders, usePricing, useProducts } from "@/lib/admin/data";
import { buildTree } from "@/lib/catalog";
import { ErrorBanner, Field, Loading, Modal, ModalActions, PageHeader, PrimaryButton, SearchBox, SelectField, StatGrid, TableCard, td, th } from "@/components/admin/ui";
import { formatDate, formatINR, formatLakh } from "@/lib/format";
import type { Campaign, PricingTier } from "@/lib/types";

const today = () => new Date().toISOString().slice(0, 10);

function TierModal({ open, tier, onClose, onSubmit }: { open: boolean; tier: PricingTier | null; onClose: () => void; onSubmit: (t: Partial<PricingTier>) => Promise<void> }) {
  const { products } = useProducts();
  const { categories: allCategories } = useCategories();
  const [form, setForm] = useState({ name: "", minQty: "10", maxQty: "", discountPercent: "5", applicable: [] as string[], startDate: today(), endDate: "", status: "active" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    setForm(
      tier
        ? {
            name: tier.name,
            minQty: String(tier.minQty),
            maxQty: tier.maxQty ? String(tier.maxQty) : "",
            discountPercent: String(tier.discountPercent),
            applicable: tier.applicableProducts,
            startDate: tier.startDate,
            endDate: tier.endDate ?? "",
            status: tier.status,
          }
        : { name: "", minQty: "10", maxQty: "", discountPercent: "5", applicable: [], startDate: today(), endDate: "", status: "active" },
    );
  }, [tier, open]);

  // Groups first (a tier on a group covers all of its subcategories), then each subcategory.
  const tree = buildTree(allCategories);
  const categories = Array.from(new Set([...tree.map((g) => g.name), ...tree.flatMap((g) => g.children.map((c) => c.name)), ...products.map((p) => p.category)]));
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const min = parseInt(form.minQty);
    const max = form.maxQty ? parseInt(form.maxQty) : null;
    const pct = parseFloat(form.discountPercent);
    if (!form.name.trim()) return setError("Tier name is required");
    if (!(min >= 1)) return setError("Minimum quantity must be at least 1");
    if (max !== null && max < min) return setError("Maximum quantity must be greater than the minimum");
    if (!(pct > 0 && pct <= 90)) return setError("Discount must be between 0 and 90%");
    if (form.endDate && form.endDate < form.startDate) return setError("End date must be after the start date");
    setSaving(true);
    try {
      await onSubmit({
        name: form.name.trim(),
        minQty: min,
        maxQty: max,
        discountPercent: pct,
        applicableProducts: form.applicable,
        startDate: form.startDate,
        endDate: form.endDate || null,
        status: form.status as PricingTier["status"],
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save tier");
    } finally {
      setSaving(false);
    }
  };
  const toggle = (v: string) => setForm((f) => ({ ...f, applicable: f.applicable.includes(v) ? f.applicable.filter((x) => x !== v) : [...f.applicable, v] }));

  return (
    <Modal open={open} onClose={onClose} title={tier ? "Edit Pricing Tier" : "New Pricing Tier"} footer={<ModalActions onCancel={onClose} submitLabel={tier ? "Update Tier" : "Create Tier"} loading={saving} form="tier-form" />}>
      <form id="tier-form" onSubmit={submit} className="space-y-4">
        <Field label="Tier Name" required value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="e.g., Bulk Buyer 10+" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Min Qty" type="number" min={1} value={form.minQty} onChange={(e) => setForm((prev) => ({ ...prev, minQty: e.target.value }))} />
          <Field label="Max Qty" type="number" min={1} value={form.maxQty} onChange={(e) => setForm((prev) => ({ ...prev, maxQty: e.target.value }))} placeholder="No limit" />
          <Field label="Discount %" type="number" min={1} max={90} step="0.5" value={form.discountPercent} onChange={(e) => setForm((prev) => ({ ...prev, discountPercent: e.target.value }))} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Start Date" type="date" value={form.startDate} onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))} />
          <Field label="End Date" type="date" value={form.endDate} onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))} />
          <SelectField label="Status" value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}>
            <option value="active">Active</option>
            <option value="scheduled">Scheduled</option>
            <option value="inactive">Inactive</option>
          </SelectField>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">Applicable To</label>
          <p className="text-xs text-gray-500 mb-3">Leave everything unselected to apply to all products. Applied automatically at checkout when a line reaches the minimum quantity.</p>
          <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
            {categories.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => toggle(c)}
                className={`px-3 py-1 rounded-full text-xs font-medium border ${form.applicable.includes(c) ? "bg-orange-600 text-white border-orange-600" : "border-gray-200 text-gray-700"}`}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 mt-2 max-h-32 overflow-y-auto">
            {products.map((p) => (
              <button
                type="button"
                key={p.id}
                onClick={() => toggle(p.name)}
                className={`px-3 py-1 rounded-full text-xs border ${form.applicable.includes(p.name) ? "bg-gray-900 text-white border-gray-900" : "border-gray-200 text-gray-600"}`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
        <ErrorBanner message={error} />
      </form>
    </Modal>
  );
}

function CampaignModal({ open, campaign, onClose, onSubmit }: { open: boolean; campaign: Campaign | null; onClose: () => void; onSubmit: (c: Partial<Campaign>) => Promise<void> }) {
  const blank = { name: "", type: "Seasonal", discountPercent: "10", budget: "", spent: "0", reach: "0", status: "Scheduled", conversionRate: "", startDate: today(), endDate: "" };
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    setForm(
      campaign
        ? {
            name: campaign.name,
            type: campaign.type,
            discountPercent: String(campaign.discountPercent),
            budget: String(campaign.budget),
            spent: String(campaign.spent),
            reach: String(campaign.reach),
            status: campaign.status,
            conversionRate: campaign.conversionRate === null ? "" : String(campaign.conversionRate),
            startDate: campaign.startDate ?? "",
            endDate: campaign.endDate ?? "",
          }
        : blank,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaign, open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return setError("Campaign name is required");
    if (!(parseFloat(form.budget) > 0)) return setError("Budget must be greater than zero");
    setSaving(true);
    try {
      await onSubmit({
        name: form.name.trim(),
        type: form.type,
        discountPercent: parseFloat(form.discountPercent) || 0,
        budget: parseFloat(form.budget) || 0,
        spent: parseFloat(form.spent) || 0,
        reach: parseInt(form.reach) || 0,
        status: form.status as Campaign["status"],
        conversionRate: form.conversionRate === "" ? null : parseFloat(form.conversionRate),
        startDate: form.startDate || null,
        endDate: form.endDate || null,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save campaign");
    } finally {
      setSaving(false);
    }
  };
  const set = (k: keyof typeof blank) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((prev) => ({ ...prev, [k]: e.target.value }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={campaign ? "Edit Campaign" : "New Campaign"}
      footer={<ModalActions onCancel={onClose} submitLabel={campaign ? "Update Campaign" : "Create Campaign"} loading={saving} form="campaign-form" />}
    >
      <form id="campaign-form" onSubmit={submit} className="space-y-4">
        <Field label="Campaign Name" required value={form.name} onChange={set("name")} />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SelectField label="Type" value={form.type} onChange={set("type")}>
            {["Seasonal", "Limited Time", "Monthly", "Festive", "Clearance"].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </SelectField>
          <Field label="Discount %" type="number" min={0} max={90} value={form.discountPercent} onChange={set("discountPercent")} />
          <SelectField label="Status" value={form.status} onChange={set("status")}>
            <option>Scheduled</option>
            <option>Active</option>
            <option>Completed</option>
          </SelectField>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Budget (₹)" type="number" min={0} value={form.budget} onChange={set("budget")} />
          <Field label="Spent (₹)" type="number" min={0} value={form.spent} onChange={set("spent")} />
          <Field label="Reach (dealers)" type="number" min={0} value={form.reach} onChange={set("reach")} />
          <Field label="Conversion Rate %" type="number" min={0} max={100} step="0.1" value={form.conversionRate} onChange={set("conversionRate")} placeholder="—" />
          <Field label="Start Date" type="date" value={form.startDate} onChange={set("startDate")} />
          <Field label="End Date" type="date" value={form.endDate} onChange={set("endDate")} />
        </div>
        <ErrorBanner message={error} />
      </form>
    </Modal>
  );
}

export default function PricingPage() {
  const { rules, loading, createRule, updateRule, deleteRule } = usePricing();
  const { campaigns, createCampaign, updateCampaign, deleteCampaign } = useCampaigns();
  const { orders } = useOrders();
  const [tab, setTab] = useState<"tiers" | "campaigns">("tiers");
  const [search, setSearch] = useState("");
  const [tierModal, setTierModal] = useState<{ tier: PricingTier | null } | null>(null);
  const [campaignModal, setCampaignModal] = useState<{ campaign: Campaign | null } | null>(null);

  if (loading) return <Loading label="Loading pricing..." />;

  const q = search.toLowerCase();
  const tiers = rules.filter((r) => r.name.toLowerCase().includes(q));
  const shownCampaigns = campaigns.filter((c) => c.name.toLowerCase().includes(q));
  const active = rules.filter((r) => r.status === "active");
  const avgDiscount = active.length ? active.reduce((s, r) => s + r.discountPercent, 0) / active.length : 0;
  const discounted = orders.filter((o) => o.discount > 0 && o.status !== "cancelled");
  const withConv = campaigns.filter((c) => c.conversionRate !== null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pricing & Discounts"
        subtitle="Manage pricing tiers, bulk discounts, and campaigns"
        action={
          <PrimaryButton onClick={() => (tab === "tiers" ? setTierModal({ tier: null }) : setCampaignModal({ campaign: null }))}>
            New {tab === "tiers" ? "Tier" : "Campaign"}
          </PrimaryButton>
        }
      />
      <div className="flex gap-2 border-b border-gray-200">
        {(["tiers", "campaigns"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-6 py-3 font-medium border-b-2 transition-colors ${tab === t ? "border-orange-600 text-orange-600" : "border-transparent text-gray-600 hover:text-gray-900"}`}
          >
            {t === "tiers" ? "Pricing Tiers" : "Campaigns"}
          </button>
        ))}
      </div>

      {tab === "tiers" && (
        <div className="space-y-6">
          <StatGrid
            cols={3}
            items={[
              { label: "Active Tiers", value: active.length, color: "bg-green-50" },
              { label: "Avg Discount", value: `${avgDiscount.toFixed(avgDiscount % 1 ? 1 : 0)}%`, color: "bg-blue-50" },
              { label: "Total Revenue Impact", value: `+${formatLakh(discounted.reduce((s, o) => s + o.totalAmount, 0))}`, color: "bg-purple-50" },
            ]}
          />
          <SearchBox value={search} onChange={setSearch} placeholder="Search pricing tiers..." />
          <TableCard title="Tier Details">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  {["Tier Name", "Criteria", "Discount", "Applicable To", "Duration", "Status", "Actions"].map((h) => (
                    <th key={h} className={th}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tiers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-sm text-gray-500">
                      No pricing tiers yet. Create one to offer automatic bulk discounts at checkout.
                    </td>
                  </tr>
                ) : (
                  tiers.map((r) => (
                    <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className={td}>
                        <div className="font-medium text-gray-900">{r.name}</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          Min Qty: {r.minQty} - Max Qty: {r.maxQty ?? "∞"}
                        </div>
                      </td>
                      <td className={td}>
                        <div className="text-sm text-gray-700 font-medium flex items-center gap-1 whitespace-nowrap">
                          <Tag size={14} />
                          Min {r.minQty} units
                        </div>
                      </td>
                      <td className={td}>
                        <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">{r.discountPercent}%</span>
                      </td>
                      <td className={`${td} text-gray-700`}>{r.applicableProducts.length ? r.applicableProducts.join(", ") : "All Products"}</td>
                      <td className={`${td} text-gray-600 whitespace-nowrap`}>
                        {formatDate(r.startDate)} to {r.endDate ? formatDate(r.endDate) : "Ongoing"}
                      </td>
                      <td className={td}>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${r.status === "active" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>{r.status}</span>
                      </td>
                      <td className={td}>
                        <div className="flex items-center gap-2">
                          <button type="button" aria-label="Edit" onClick={() => setTierModal({ tier: r })} className="p-2 hover:bg-blue-100 rounded text-blue-600 transition-colors">
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            aria-label="Delete"
                            onClick={() => window.confirm(`Delete tier "${r.name}"?`) && deleteRule(r.id)}
                            className="p-2 hover:bg-red-100 rounded text-red-600 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </TableCard>
        </div>
      )}

      {tab === "campaigns" && (
        <div className="space-y-6">
          <StatGrid
            cols={3}
            items={[
              { label: "Active Campaigns", value: campaigns.filter((c) => c.status === "Active").length, color: "bg-blue-50" },
              { label: "Total Budget", value: formatLakh(campaigns.reduce((s, c) => s + c.budget, 0)).replace(/\.0L$/, "L"), color: "bg-purple-50" },
              {
                label: "Avg Conversion",
                value: `${(withConv.reduce((s, c) => s + (c.conversionRate ?? 0), 0) / (withConv.length || 1)).toFixed(1)}%`,
                color: "bg-green-50",
              },
            ]}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {shownCampaigns.map((c) => {
              const pct = c.budget ? Math.round((c.spent / c.budget) * 100) : 0;
              return (
                <div key={c.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow duration-300">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{c.name}</h3>
                      <span className="inline-block mt-2 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">{c.type}</span>
                    </div>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        c.status === "Active" ? "bg-green-100 text-green-700" : c.status === "Completed" ? "bg-gray-100 text-gray-700" : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Discount</span>
                      <span className="text-lg font-bold text-green-600">{c.discountPercent}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Budget</span>
                      <span className="text-sm font-medium text-gray-900">{formatINR(c.budget)}</span>
                    </div>
                    <div className="pt-2 border-t border-gray-100">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-gray-600">Spent: {formatINR(c.spent)}</span>
                        <span className="text-xs text-gray-600">{c.status === "Active" && `${pct}%`}</span>
                      </div>
                      {c.status !== "Scheduled" && (
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-orange-500" style={{ width: `${c.status === "Active" ? Math.min(pct, 100) : 100}%` }} />
                        </div>
                      )}
                    </div>
                    <div className="pt-2 border-t border-gray-100">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">
                          Reach: <span className="font-medium text-gray-900">{c.reach} dealers</span>
                        </span>
                        <span className="text-gray-600">
                          Conversion: <span className="font-medium text-green-600">{c.conversionRate === null ? "-" : `${c.conversionRate}%`}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button type="button" onClick={() => setCampaignModal({ campaign: c })} className="flex-1 p-2 hover:bg-blue-100 rounded text-blue-600 font-medium text-sm transition-colors">
                      <Pencil size={16} className="inline mr-1" /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => window.confirm(`Delete campaign "${c.name}"?`) && deleteCampaign(c.id)}
                      className="flex-1 p-2 hover:bg-red-100 rounded text-red-600 font-medium text-sm transition-colors"
                    >
                      <Trash2 size={16} className="inline mr-1" /> Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <TierModal
        open={!!tierModal}
        tier={tierModal?.tier ?? null}
        onClose={() => setTierModal(null)}
        onSubmit={(t) => (tierModal?.tier ? updateRule(tierModal.tier.id, t) : createRule(t))}
      />
      <CampaignModal
        open={!!campaignModal}
        campaign={campaignModal?.campaign ?? null}
        onClose={() => setCampaignModal(null)}
        onSubmit={(c) => (campaignModal?.campaign ? updateCampaign(campaignModal.campaign.id, c) : createCampaign(c))}
      />
    </div>
  );
}
