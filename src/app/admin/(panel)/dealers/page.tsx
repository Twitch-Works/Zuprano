"use client";

import { useEffect, useState } from "react";
import { CircleCheck, CircleX, Clock, MapPin, Pencil, Store, Trash2, TrendingUp } from "lucide-react";
import { useDealers } from "@/lib/admin/data";
import { EmptyRow, ErrorBanner, Field, Loading, Modal, ModalActions, PageHeader, PrimaryButton, SearchBox, SelectField, StatGrid, TableCard, th, td } from "@/components/admin/ui";
import { formatINR } from "@/lib/format";
import type { Dealer } from "@/lib/types";

const blank = {
  name: "",
  contact: "",
  location: "",
  gstNumber: "",
  panNumber: "",
  status: "active" as Dealer["status"],
  verificationStatus: "pending" as Dealer["verificationStatus"],
  address: { street: "", city: "", state: "", zip: "" },
};

function DealerModal({ open, dealer, onClose, onSubmit }: { open: boolean; dealer: Dealer | null; onClose: () => void; onSubmit: (d: typeof blank) => Promise<void> }) {
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    setForm(
      dealer
        ? {
            name: dealer.name,
            contact: dealer.contact,
            location: dealer.location,
            gstNumber: dealer.gstNumber,
            panNumber: dealer.panNumber,
            status: dealer.status,
            verificationStatus: dealer.verificationStatus,
            address: { ...dealer.address },
          }
        : blank,
    );
  }, [dealer, open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.gstNumber && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(form.gstNumber.toUpperCase())) {
      if (!window.confirm("The GST number doesn't match the standard 15-character format. Save anyway?")) return;
    }
    setSaving(true);
    try {
      await onSubmit({ ...form, gstNumber: form.gstNumber.toUpperCase(), panNumber: form.panNumber.toUpperCase() });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save dealer");
    } finally {
      setSaving(false);
    }
  };
  const addr = (k: keyof typeof blank.address) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, address: { ...f.address, [k]: e.target.value } }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={dealer ? "Edit Dealer" : "Register New Dealer"}
      footer={<ModalActions onCancel={onClose} submitLabel={dealer ? "Update Dealer" : "Add Dealer"} loading={saving} form="dealer-form" />}
    >
      <form id="dealer-form" onSubmit={submit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Business Name" className="col-span-2" required value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
          <Field label="Contact Number" required value={form.contact} onChange={(e) => setForm((prev) => ({ ...prev, contact: e.target.value }))} />
          <Field label="Location/Region" required value={form.location} onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="GST Number" required className="font-mono" value={form.gstNumber} onChange={(e) => setForm((prev) => ({ ...prev, gstNumber: e.target.value }))} />
          <Field label="PAN Number" className="font-mono" value={form.panNumber} onChange={(e) => setForm((prev) => ({ ...prev, panNumber: e.target.value }))} />
        </div>
        {dealer && (
          <div className="grid grid-cols-2 gap-4">
            <SelectField label="Status" value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as Dealer["status"] }))}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </SelectField>
            <SelectField
              label="Verification"
              value={form.verificationStatus}
              onChange={(e) => setForm((prev) => ({ ...prev, verificationStatus: e.target.value as Dealer["verificationStatus"] }))}
            >
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
            </SelectField>
          </div>
        )}
        <div className="space-y-4">
          <label className="block text-sm font-semibold text-gray-900">Business Address</label>
          <input type="text" placeholder="Street Address" value={form.address.street} onChange={addr("street")} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" />
          <div className="grid grid-cols-3 gap-3">
            {(["city", "state", "zip"] as const).map((k) => (
              <input key={k} type="text" placeholder={k === "zip" ? "Zip" : k[0].toUpperCase() + k.slice(1)} value={form.address[k]} onChange={addr(k)} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" />
            ))}
          </div>
        </div>
        <ErrorBanner message={error} />
      </form>
    </Modal>
  );
}

export default function DealersPage() {
  const { dealers, loading, error, addDealer, updateDealer, deleteDealer } = useDealers();
  const [search, setSearch] = useState("");
  const [verification, setVerification] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Dealer | null>(null);

  if (loading) return <Loading label="Loading dealers..." />;
  if (error) return <div className="p-8 text-center bg-red-50 text-red-600 border border-red-100 rounded-lg">Error: {error}</div>;

  const q = search.toLowerCase();
  const filtered = dealers.filter(
    (d) => (d.name.toLowerCase().includes(q) || d.contact.toLowerCase().includes(q) || d.location.toLowerCase().includes(q)) && (!verification || d.verificationStatus === verification),
  );
  const totalRevenue = dealers.reduce((s, d) => s + d.totalRevenue, 0);

  const save = async (form: typeof blank) => {
    if (editing) await updateDealer(editing.id, form);
    else await addDealer({ ...form, verificationStatus: "pending" });
  };
  const remove = async (d: Dealer) => {
    if (window.confirm(`Delete dealer "${d.name}"? Their past orders are kept.`)) await deleteDealer(d.id);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dealers & Partners"
        subtitle="Manage your dealer network and partnerships"
        action={
          <PrimaryButton
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
          >
            Register Dealer
          </PrimaryButton>
        }
      />
      <StatGrid
        items={[
          { label: "Total Dealers", value: dealers.length, color: "bg-blue-50", icon: <Store size={24} className="text-gray-400" /> },
          { label: "Active Dealers", value: dealers.filter((d) => d.status === "active").length, color: "bg-green-50", icon: <TrendingUp size={24} className="text-gray-400" /> },
          { label: "Total Revenue", value: formatINR(totalRevenue), color: "bg-purple-50", icon: <TrendingUp size={24} className="text-gray-400" /> },
          {
            label: "Avg Rating",
            value: `${(dealers.reduce((s, d) => s + d.rating, 0) / (dealers.length || 1)).toFixed(1)}★`,
            color: "bg-amber-50",
            icon: <Store size={24} className="text-gray-400" />,
          },
        ]}
      />
      <SearchBox value={search} onChange={setSearch} placeholder="Search dealers by name, contact, or location...">
        <select
          value={verification}
          onChange={(e) => setVerification(e.target.value)}
          className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="">All Verification Status</option>
          <option value="verified">Verified</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
        </select>
      </SearchBox>
      <TableCard title={`Dealer Directory (${filtered.length})`}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {["Dealer Name", "Contact", "Location", "Orders", "Revenue", "Verification", "Status", "Actions"].map((h) => (
                <th key={h} className={th}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <EmptyRow
                colSpan={8}
                title="No dealers found"
                hint="Try adjusting your search or verification filters."
                onClear={() => {
                  setSearch("");
                  setVerification("");
                }}
              />
            ) : (
              filtered.map((d) => (
                <tr key={d.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className={td}>
                    <div className="font-medium text-gray-900">{d.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">ID: {d.id.slice(-6)}</div>
                  </td>
                  <td className={`${td} text-gray-900 font-medium`}>{d.contact}</td>
                  <td className={td}>
                    <div className="flex items-center gap-1 text-gray-700">
                      <MapPin size={14} /> {d.location}
                    </div>
                  </td>
                  <td className={`${td} text-gray-900 font-medium`}>{d.totalOrders}</td>
                  <td className={`${td} text-gray-900`}>{formatINR(d.totalRevenue)}</td>
                  <td className={td}>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        d.verificationStatus === "verified"
                          ? "bg-green-50 text-green-700 border border-green-100"
                          : d.verificationStatus === "rejected"
                            ? "bg-red-50 text-red-700 border border-red-100"
                            : "bg-amber-50 text-amber-700 border border-amber-100"
                      }`}
                    >
                      {d.verificationStatus === "verified" ? <CircleCheck size={12} /> : d.verificationStatus === "rejected" ? <CircleX size={12} /> : <Clock size={12} />}
                      {d.verificationStatus.toUpperCase()}
                    </span>
                  </td>
                  <td className={td}>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${d.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>{d.status}</span>
                  </td>
                  <td className={td}>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditing(d);
                          setModalOpen(true);
                        }}
                        aria-label="Edit"
                        className="p-2 hover:bg-blue-100 rounded text-blue-600 transition-colors"
                      >
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => remove(d)} aria-label="Delete" className="p-2 hover:bg-red-100 rounded text-red-600 transition-colors">
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
      <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow duration-300">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Commission Structure</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { tier: "Tier 1", orders: "0-100", commission: "5%" },
            { tier: "Tier 2", orders: "101-500", commission: "8%" },
            { tier: "Tier 3", orders: "500+", commission: "12%" },
          ].map((t) => (
            <div key={t.tier} className="p-4 border border-gray-100 rounded-lg">
              <div className="text-sm font-medium text-gray-600">{t.tier}</div>
              <div className="text-lg font-bold text-gray-900 mt-2">{t.commission}</div>
              <div className="text-xs text-gray-600 mt-1">Orders/Month: {t.orders}</div>
            </div>
          ))}
        </div>
      </div>
      <DealerModal open={modalOpen} dealer={editing} onClose={() => setModalOpen(false)} onSubmit={save} />
    </div>
  );
}
