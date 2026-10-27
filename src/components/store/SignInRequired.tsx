"use client";

import { useUI } from "@/stores/ui";

export function SignInRequired({ message }: { message: string }) {
  const openAuthModal = useUI((s) => s.openAuthModal);
  return (
    <div className="bg-[#f9f9f9] min-h-[60vh] flex items-center justify-center">
      <div className="text-center p-12 bg-white rounded-2xl shadow-sm border border-[#eee] max-w-md w-full mx-6">
        <h2 className="text-2xl font-black text-[#1d1d1f] uppercase tracking-tighter mb-4">Sign In Required</h2>
        <p className="text-[#86868b] text-[13px] font-medium mb-8">{message}</p>
        <button
          onClick={openAuthModal}
          className="w-full bg-[#1d1d1f] text-white px-8 py-4 rounded-md text-[13px] font-black uppercase tracking-widest hover:bg-black transition-all"
        >
          Sign In
        </button>
      </div>
    </div>
  );
}
