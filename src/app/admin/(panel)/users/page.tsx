"use client";

import { useState } from "react";
import { Mail, Pencil, Trash2 } from "lucide-react";
import { adminApi, useCustomers, useOrders } from "@/lib/admin/data";
import { ErrorBanner, Loading, PageHeader, PrimaryButton, SearchBox, StatGrid, TableCard, td, th } from "@/components/admin/ui";
import { UserModal } from "@/components/admin/UserModal";
import { formatDate, formatINR } from "@/lib/format";
import type { Profile } from "@/lib/types";

export default function UsersPage() {
  const { users, loading, error, refresh } = useCustomers();
  const { orders } = useOrders();
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<{ user: Profile | null } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  if (loading) return <Loading label="Loading users..." />;
  if (error) return <div className="p-8 text-center bg-red-50 text-red-600 border border-red-100 rounded-lg">Error: {error}</div>;

  const q = search.toLowerCase();
  const filtered = users.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.phone.includes(q));
  const monthAgo = new Date();
  monthAgo.setMonth(monthAgo.getMonth() - 1);
  const spend = new Map<string, number>();
  orders.filter((o) => o.userId && o.paymentStatus === "paid").forEach((o) => spend.set(o.userId!, (spend.get(o.userId!) ?? 0) + o.totalAmount));

  const remove = async (u: Profile) => {
    if (!window.confirm(`Delete ${u.name || u.email}? This removes their login. Past orders are kept.`)) return;
    try {
      await adminApi(`/api/admin/users/${u.id}`, { method: "DELETE" });
      await refresh();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Failed to delete user");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Customers & Users" subtitle="Manage your customer base and user profiles" action={<PrimaryButton onClick={() => setModal({ user: null })}>Add User</PrimaryButton>} />
      <StatGrid
        items={[
          { label: "Total Users", value: users.length, color: "bg-blue-50" },
          { label: "Active Users", value: users.filter((u) => u.status === "active").length, color: "bg-green-50" },
          { label: "Inactive Users", value: users.filter((u) => u.status === "inactive").length, color: "bg-gray-50" },
          { label: "New This Month", value: users.filter((u) => new Date(u.createdAt) > monthAgo).length, color: "bg-purple-50" },
        ]}
      />
      <SearchBox value={search} onChange={setSearch} placeholder="Search users by name, email or phone..." />
      <ErrorBanner message={actionError} />
      <TableCard title={`User Directory (${filtered.length})`}>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {["Name", "Email", "Phone", "Join Date", "Lifetime Spend", "Status", "Actions"].map((h) => (
                <th key={h} className={th}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-sm text-gray-500">
                  No users found.
                </td>
              </tr>
            ) : (
              filtered.map((u) => (
                <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className={`${td} font-medium text-gray-900`}>{u.name}</td>
                  <td className={`${td} text-gray-600`}>
                    <div className="flex items-center gap-2">
                      <Mail size={14} /> {u.email}
                    </div>
                  </td>
                  <td className={`${td} text-gray-600`}>{u.phone}</td>
                  <td className={`${td} text-gray-600 whitespace-nowrap`}>{formatDate(u.createdAt)}</td>
                  <td className={`${td} text-gray-900`}>{formatINR(spend.get(u.id) ?? 0)}</td>
                  <td className={td}>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${u.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>{u.status}</span>
                  </td>
                  <td className={td}>
                    <div className="flex items-center gap-2">
                      <button type="button" aria-label="Edit" onClick={() => setModal({ user: u })} className="p-2 hover:bg-blue-100 rounded text-blue-600 transition-colors">
                        <Pencil size={16} />
                      </button>
                      <button type="button" aria-label="Delete" onClick={() => remove(u)} className="p-2 hover:bg-red-100 rounded text-red-600 transition-colors">
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
      <UserModal open={!!modal} user={modal?.user ?? null} onClose={() => setModal(null)} onSaved={refresh} />
    </div>
  );
}
