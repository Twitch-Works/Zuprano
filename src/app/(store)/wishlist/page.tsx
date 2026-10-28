"use client";

import { useRouter } from "next/navigation";
import { ProductCard } from "@/components/store/ProductCard";
import { SignInRequired } from "@/components/store/SignInRequired";
import { useAuth } from "@/stores/auth";
import { useWishlist } from "@/stores/wishlist";

export default function WishlistPage() {
  const router = useRouter();
  const { user, initialized } = useAuth();
  const { items, isLoading, loadedFor } = useWishlist();

  if (!initialized || (user && (isLoading || loadedFor !== user.id))) {
    return <div className="text-center py-32 text-[#86868b] text-[11px] font-black uppercase tracking-widest">Loading wishlist…</div>;
  }
  if (!user) return <SignInRequired message="Access your saved items and personalized collections." />;

  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-[#f9f9f9] px-6">
        <div className="w-56 h-56 mb-8 relative rounded-full overflow-hidden bg-white shadow-sm flex items-center justify-center grayscale opacity-80 border-4 border-[#eee]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1544117518-30ed5fa75b05?auto=format&fit=crop&q=80&w=400"
            alt="Empty Wishlist"
            className="w-full h-full object-cover mix-blend-multiply opacity-50"
          />
          <span className="absolute text-5xl font-black text-[#1d1d1f] opacity-20 transform -rotate-12 whitespace-nowrap">NO SAVES</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-black tracking-tighter text-[#1d1d1f] uppercase mb-4">Your Wishlist is Empty</h2>
        <p className="text-[#86868b] mb-10 text-[13px] font-medium max-w-sm text-center">
          Tap the heart on any phone or accessory to save it here for later.
        </p>
        <button
          onClick={() => router.push("/shop")}
          className="bg-[#1d1d1f] text-white px-10 py-4 rounded-md text-[13px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-sm"
        >
          Start Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen pt-2 md:pt-8 pb-12 md:pb-24 font-sans">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex items-center justify-between gap-4 mb-6 md:mb-12 border-b border-[#eee] pb-4 md:pb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-5xl font-black text-[#1d1d1f] tracking-tighter uppercase">Wishlist</h1>
          <span className="text-[11px] font-black uppercase tracking-widest text-[#86868b]">{items.length} Items</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-6 md:gap-x-6 md:gap-y-10">
          {items.map((i) => (
            <ProductCard key={i.id} product={i.product} />
          ))}
        </div>
      </div>
    </div>
  );
}
