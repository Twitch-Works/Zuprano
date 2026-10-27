"use client";

import { Plus, Search, X } from "lucide-react";
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

export function PageHeader({ title, subtitle, action }: { title: string; subtitle: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        <p className="text-gray-600 mt-2">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

export function PrimaryButton({ children, onClick, icon = true, type = "button", disabled }: { children: ReactNode; onClick?: () => void; icon?: boolean; type?: "button" | "submit"; disabled?: boolean }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors duration-150 disabled:opacity-50 shrink-0 w-fit"
    >
      {icon && <Plus size={18} />} {children}
    </button>
  );
}

export function StatGrid({ items, cols = 4 }: { items: { label: string; value: ReactNode; color: string; icon?: ReactNode }[]; cols?: 3 | 4 }) {
  return (
    <div className={`grid grid-cols-1 ${cols === 4 ? "md:grid-cols-4" : "md:grid-cols-3"} gap-6`}>
      {items.map((s) => (
        <div key={s.label} className={`${s.color} rounded-lg p-4 border border-gray-100 ${s.icon ? "flex items-center justify-between" : ""}`}>
          <div>
            <h3 className="text-sm font-medium text-gray-600">{s.label}</h3>
            <p className="text-2xl font-bold text-gray-900 mt-2">{s.value}</p>
          </div>
          {s.icon}
        </div>
      ))}
    </div>
  );
}

export function SearchBox({ value, onChange, placeholder, children }: { value: string; onChange: (v: string) => void; placeholder: string; children?: ReactNode }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
        {children}
      </div>
    </div>
  );
}

export function TableCard({ title, children, action }: { title: ReactNode; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-300">
      <div className="bg-gray-50 border-b border-gray-200 p-6 flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        {action}
      </div>
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

export const th = "text-left py-3 px-6 text-sm font-semibold text-gray-700 whitespace-nowrap";
export const td = "py-3 px-6 text-sm";

export function EmptyRow({ colSpan, title, hint, onClear }: { colSpan: number; title: string; hint: string; onClear?: () => void }) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-12">
        <div className="text-center">
          <Search size={48} className="mx-auto text-gray-200 mb-4" />
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <p className="text-gray-500">{hint}</p>
          {onClear && (
            <button onClick={onClear} className="mt-4 text-orange-600 font-medium hover:underline">
              Clear all filters
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

export function Modal({ open, onClose, title, children, footer, width = "max-w-2xl" }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; width?: string }) {
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className={`bg-white rounded-xl ${width} w-full max-h-[90vh] overflow-y-auto pointer-events-auto animate-in`}>
          <div className="sticky top-0 bg-white p-6 border-b border-gray-200 flex items-center justify-between z-10">
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
            <button onClick={onClose} aria-label="Close" className="p-2 hover:bg-gray-100 rounded-lg">
              <X size={24} />
            </button>
          </div>
          <div className="p-6 space-y-6">{children}</div>
          {footer && <div className="px-6 pb-6 flex items-center justify-end gap-3 pt-6 border-t border-gray-200 mx-6">{footer}</div>}
        </div>
      </div>
    </>
  );
}

export function ModalActions({ onCancel, submitLabel, loading, form }: { onCancel: () => void; submitLabel: string; loading?: boolean; form?: string }) {
  return (
    <>
      <button type="button" onClick={onCancel} className="px-6 py-2 border border-gray-200 rounded-lg">
        Cancel
      </button>
      <button type="submit" form={form} disabled={loading} className="px-6 py-2 bg-orange-600 text-white rounded-lg font-medium disabled:opacity-50">
        {loading ? "Saving..." : submitLabel}
      </button>
    </>
  );
}

const fieldCls = "w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900";

export function Field({ label, className = "", ...rest }: InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <div className={className}>
      {label && <label className="block text-sm font-semibold text-gray-900 mb-2">{label}</label>}
      <input className={fieldCls} {...rest} />
    </div>
  );
}

export function SelectField({ label, className = "", children, ...rest }: SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  return (
    <div className={className}>
      {label && <label className="block text-sm font-semibold text-gray-900 mb-2">{label}</label>}
      <select className={fieldCls + " bg-white"} {...rest}>
        {children}
      </select>
    </div>
  );
}

export function TextField({ label, className = "", ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  return (
    <div className={className}>
      {label && <label className="block text-sm font-semibold text-gray-900 mb-2">{label}</label>}
      <textarea className={fieldCls} {...rest} />
    </div>
  );
}

export function ErrorBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{message}</div>;
}

export function Loading({ label }: { label: string }) {
  return <div className="p-8 text-center italic text-gray-500">{label}</div>;
}

export const ORDER_STATUS_STYLE: Record<string, string> = {
  delivered: "bg-green-100 text-green-700",
  shipped: "bg-blue-100 text-blue-700",
  processing: "bg-amber-100 text-amber-700",
  pending: "bg-amber-100 text-amber-700",
  cancelled: "bg-red-100 text-red-700",
};

export const PAYMENT_STATUS_STYLE: Record<string, string> = {
  paid: "bg-green-100 text-green-700",
  pending: "bg-gray-100 text-gray-700",
  failed: "bg-red-100 text-red-700",
  refunded: "bg-purple-100 text-purple-700",
};

export function Pill({ className, children }: { className: string; children: ReactNode }) {
  return <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium capitalize ${className}`}>{children}</span>;
}

/** Fires a browser download of a CSV built from rows. */
export function downloadCsv(filename: string, rows: (string | number | null | undefined)[][]) {
  const csv = rows
    .map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
