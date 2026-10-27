"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/admin/data";
import { ErrorBanner, Field, Modal, ModalActions, SelectField } from "@/components/admin/ui";
import type { Profile } from "@/lib/types";

export function UserModal({
  open,
  user,
  role = "customer",
  onClose,
  onSaved,
}: {
  open: boolean;
  user: Profile | null;
  role?: Profile["role"];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", status: "active", role });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    setForm(user ? { name: user.name, email: user.email, phone: user.phone, password: "", status: user.status, role: user.role } : { name: "", email: "", phone: "", password: "", status: "active", role });
  }, [user, open, role]);

  const staffForm = role !== "customer";
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (user) {
        await adminApi(`/api/admin/users/${user.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            name: form.name,
            phone: form.phone,
            status: form.status,
            ...(staffForm ? { role: form.role } : {}),
            ...(form.password ? { password: form.password } : {}),
          }),
        });
      } else {
        await adminApi("/api/admin/users", { method: "POST", body: JSON.stringify(form) });
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save user");
    } finally {
      setSaving(false);
    }
  };

  const title = user ? (staffForm ? "Edit Admin" : "Edit User") : staffForm ? "Add Admin" : "Add User";
  return (
    <Modal open={open} onClose={onClose} title={title} width="max-w-lg" footer={<ModalActions onCancel={onClose} submitLabel={user ? "Save Changes" : "Create Account"} loading={saving} form="user-form" />}>
      <form id="user-form" onSubmit={submit} className="space-y-4">
        <Field label="Full Name" required value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
        <Field label="Email" type="email" required disabled={!!user} value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} />
        <Field label="Phone" value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} />
        <Field
          label={user ? "New Password (leave blank to keep)" : "Password"}
          type="password"
          required={!user}
          minLength={6}
          value={form.password}
          onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
        />
        <div className="grid grid-cols-2 gap-4">
          <SelectField label="Status" value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </SelectField>
          {staffForm && (
            <SelectField label="Role" value={form.role} onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value as Profile["role"] }))}>
              <option value="admin">Super Admin</option>
              <option value="manager">Manager</option>
              <option value="support">Support</option>
            </SelectField>
          )}
        </div>
        <ErrorBanner message={error} />
      </form>
    </Modal>
  );
}
