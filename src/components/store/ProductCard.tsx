"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, Zap } from "lucide-react";
import { normalizeVariants } from "@/lib/mappers";
import type { Product } from "@/lib/types";
import { useCart } from "@/stores/cart";
import { useUI } from "@/stores/ui";
import { useAuth } from "@/stores/auth";
import { useWishlist } from "@/stores/wishlist";

export function ProductCard({ product }: { product: Product }) {
  const router = useRouter();
  const addItem = useCart((s) => s.addItem);
  const { showToast, openAuthModal } = useUI();
  const user = useAuth((s) => s.user);
  const { isInWishlist, toggle } = useWishlist();
  const saved = isInWishlist(product.id);

  const variant = normalizeVariants(product)[0];
  const inStock = variant.stock > 0;
  const lowStock = variant.stock > 0 && variant.stock < 5;
  const mrp =
    product.originalPrice && product.originalPrice > product.price
      ? product.originalPrice
      : product.price
        ? Math.round(product.price * 1.3)
        : null;

  const stop = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const onAdd = (e: React.MouseEvent) => {
    stop(e);
    if (!inStock) return showToast("error", "Out of stock");
    addItem(product, variant, 1);
    showToast("success", "Added to cart");
  };

  const onBuyNow = (e: React.MouseEvent) => {
    stop(e);
    if (!inStock) return showToast("error", "Out of stock");
    addItem(product, variant, 1);
    router.push("/checkout");
  };

  const onWishlist = async (e: React.MouseEvent) => {
    stop(e);
    if (!user) return openAuthModal();
    try {
      const added = await toggle(product, user.id);
      showToast("success", added ? "Added to wishlist!" : "Removed from wishlist");
    } catch {
      showToast("error", "Could not update wishlist");
    }
  };

  return (
    <div className="group">
      <Link href={`/product/${product.id}`} className="block">
        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-[#f8f8f8] border border-transparent group-hover:border-gray-200 transition-all duration-200 mb-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.thumbnail}
            alt={product.name}
            className="absolute inset-0 w-full h-full object-cover mix-blend-multiply transition-transform duration-300 group-hover:scale-[1.03]"
          />
          <button
            onClick={onWishlist}
            aria-label="Toggle wishlist"
            className={`absolute top-2.5 right-2.5 w-6 h-6 rounded-full flex items-center justify-center bg-white/90 border border-gray-100 transition-all duration-200 ${
              saved ? "text-red-500 opacity-100" : "text-gray-400 hover:text-gray-700 opacity-0 group-hover:opacity-100"
            }`}
          >
            <Heart size={18} className={saved ? "fill-current" : ""} />
          </button>
          <div className="absolute bottom-0 left-0 right-0 p-2.5 flex gap-1.5 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-200 ease-out">
            <button
              onClick={onAdd}
              className="flex-1 bg-black text-white text-[11px] font-medium tracking-wide py-2.5 rounded-lg hover:bg-neutral-800 transition-colors duration-150"
            >
              {inStock ? "Add to cart" : "Out of stock"}
            </button>
            <button
              onClick={onBuyNow}
              aria-label="Buy now"
              className="w-9 flex items-center justify-center bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-150"
            >
              <Zap size={12} className="text-gray-700" />
            </button>
          </div>
        </div>
      </Link>
      <div className="space-y-1 px-0.5">
        <p className="text-[10px] uppercase tracking-[0.14em] text-gray-400">{product.brand || "Zuprano"}</p>
        <Link href={`/product/${product.id}`}>
          <h3 className="text-[13px] font-medium text-gray-900 leading-snug line-clamp-1 hover:text-gray-500 transition-colors">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-baseline gap-2 pt-0.5">
          <span className="text-[14px] font-medium text-gray-900">₹{product.price.toLocaleString("en-IN")}</span>
          {mrp && <span className="text-[11px] text-gray-400 line-through">₹{mrp.toLocaleString("en-IN")}</span>}
        </div>
        {lowStock && <p className="text-[11px] text-red-500 tracking-wide">Only {variant.stock} left</p>}
        {!inStock && <p className="text-[11px] text-red-500 tracking-wide">Out of stock</p>}
      </div>
    </div>
  );
}
