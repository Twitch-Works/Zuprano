"use client";

import Link from "next/link";
import { useEffect } from "react";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";
import type { ToastType } from "@/stores/ui";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
};

export function Button({ variant = "primary", size = "md", isLoading = false, disabled, className = "", children, ...rest }: ButtonProps) {
  const base =
    "transition-all duration-300 rounded-md flex items-center justify-center font-black uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-[#1d1d1f] text-white hover:bg-black shadow-sm border border-transparent",
    secondary: "bg-white text-[#1d1d1f] hover:bg-[#f5f5f7] border-2 border-[#eee] hover:border-black shadow-sm",
    ghost: "bg-transparent text-[#1d1d1f] hover:bg-[#f5f5f7]",
    danger: "bg-red-600 text-white hover:bg-red-700 shadow-sm border border-transparent",
  };
  const sizes = { sm: "px-6 py-3 text-[11px]", md: "px-8 py-4 text-[13px]", lg: "px-10 py-5 text-[13px]" };
  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} disabled={disabled || isLoading} {...rest}>
      {isLoading ? (
        <span className="inline-flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          PROCESSING...
        </span>
      ) : (
        children
      )}
    </button>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string; helperText?: string };

export function Input({ label, error, helperText, className = "", ...rest }: InputProps) {
  return (
    <div className="w-full">
      {label && <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#86868b] mb-2">{label}</label>}
      <input
        className={`w-full px-4 py-3 bg-[#f9f9f9] border border-[#d2d2d7] rounded-md focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors text-[13px] font-medium text-[#1d1d1f] disabled:bg-[#eee] disabled:cursor-not-allowed disabled:border-[#d2d2d7] ${
          error ? "border-red-500 focus:ring-red-500 focus:border-red-500 bg-red-50" : ""
        } ${className}`}
        {...rest}
      />
      {error && <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-red-600">{error}</p>}
      {helperText && !error && <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-[#86868b]">{helperText}</p>}
    </div>
  );
}

function SkeletonBar({ height = "h-4", width = "w-full", className = "" }) {
  return <div className={`bg-primary-100 rounded animate-skeleton ${height} ${width} ${className}`} />;
}

export function ProductSkeleton() {
  return (
    <div className="bg-white rounded-lg p-4 md:p-6 space-y-4 border border-primary-100">
      <SkeletonBar height="h-48 md:h-64" />
      <SkeletonBar height="h-4" width="w-1/2" />
      <SkeletonBar height="h-4" />
      <div className="space-y-2 pt-2">
        <SkeletonBar height="h-3" width="w-1/3" />
        <SkeletonBar height="h-10" />
      </div>
    </div>
  );
}

export function Toast({ type, message, onClose }: { type: ToastType; message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose, message]);
  const styles = {
    success: "bg-green-50 text-green-900 border-green-200",
    error: "bg-red-50 text-red-900 border-red-200",
    info: "bg-blue-50 text-blue-900 border-blue-200",
  };
  const icons = { success: "✓", error: "✕", info: "ℹ" };
  return (
    <div className={`fixed bottom-4 right-4 max-w-sm p-4 rounded-lg border shadow-lg flex items-start gap-3 animate-slideInUp z-[300] ${styles[type]}`}>
      <span className="text-xl font-bold flex-shrink-0">{icons[type]}</span>
      <p className="flex-1 text-sm">{message}</p>
      <button onClick={onClose} className="text-xl font-bold opacity-50 hover:opacity-100 transition-opacity">
        ×
      </button>
    </div>
  );
}

export function SectionHeader({ title, subtitle, linkText, centered = false }: { title: string; subtitle?: string; linkText?: string; centered?: boolean }): ReactNode {
  return (
    <div className={`flex flex-col ${centered ? "items-center text-center" : "sm:flex-row sm:items-end justify-between"} gap-4 sm:gap-6 mb-8 sm:mb-12`}>
      <div className="max-w-2xl">
        <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black tracking-tight text-[#1d1d1f] uppercase">{title}</h2>
        {subtitle && <p className="mt-2 sm:mt-3 text-xs sm:text-sm md:text-base text-[#86868b] font-bold tracking-widest uppercase">{subtitle}</p>}
      </div>
      {linkText && (
        <Link
          href="/shop"
          className="text-[10px] sm:text-xs font-black tracking-widest uppercase text-[#1d1d1f] border-b-2 border-black pb-1 hover:text-orange-600 hover:border-orange-600 transition-all whitespace-nowrap"
        >
          {linkText}
        </Link>
      )}
    </div>
  );
}
