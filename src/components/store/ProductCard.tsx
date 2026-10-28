"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, Zap } from "lucide-react";
import { specSummary } from "@/lib/catalog";
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
  const mrp = product.originalPrice && product.originalPrice > product.price ? product.originalPrice : null;
  const off = mrp ? Math.round(((mrp - product.price) / mrp) * 100) : 0;
  const specs = specSummary(product);

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
    <div className="group min-w-0">
      <Link href={`/product/${product.id}`} className="block">
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl md:rounded-2xl bg-[#f5f5f7] mb-2.5 md:mb-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.thumbnail}
            alt={product.name}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover mix-blend-multiply transition-transform duration-500 group-hover:scale-[1.04]"
          />
          {off >= 5 && (
            <span className="absolute top-2 left-2 bg-orange-600 text-white text-[10px] md:text-[11px] font-bold px-1.5 py-0.5 rounded-md">{off}% off</span>
          )}
          <button
            onClick={onWishlist}
            aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
            className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center bg-white/90 shadow-sm transition-opacity ${
              saved ? "text-red-500" : "text-gray-500 hover:text-gray-900 md:opacity-0 md:group-hover:opacity-100"
            }`}
          >
            <Heart size={16} className={saved ? "fill-current" : ""} />
          </button>
          <div className="hidden md:flex absolute bottom-0 left-0 right-0 p-2.5 gap-1.5 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-200 ease-out">
            <button
              onClick={onAdd}
              className="flex-1 bg-black text-white text-[12px] font-semibold py-2.5 rounded-lg hover:bg-neutral-800 transition-colors duration-150"
            >
              {inStock ? "Add to cart" : "Out of stock"}
            </button>
            <button
              onClick={onBuyNow}
              aria-label="Buy now"
              className="w-10 flex items-center justify-center bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-150"
            >
              <Zap size={14} className="text-gray-700" />
            </button>
          </div>
        </div>
      </Link>
      <div className="space-y-1 px-0.5">
        <p className="text-[10px] md:text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-400 truncate">{product.brand || "Zuprano"}</p>
        <Link href={`/product/${product.id}`}>
          <h3 className="text-[13px] md:text-[14px] font-semibold text-gray-900 leading-snug line-clamp-2 hover:text-gray-500 transition-colors">{product.name}</h3>
        </Link>
        {specs && <p className="text-[11px] md:text-[12px] text-gray-500 truncate">{specs}</p>}
        <div className="flex items-baseline flex-wrap gap-x-2 pt-0.5">
          <span className="text-[15px] md:text-[16px] font-bold text-gray-900">₹{product.price.toLocaleString("en-IN")}</span>
          {mrp && <span className="text-[11px] md:text-[12px] text-gray-400 line-through">₹{mrp.toLocaleString("en-IN")}</span>}
        </div>
        {lowStock && <p className="text-[11px] text-red-500">Only {variant.stock} left</p>}
        {!inStock && <p className="text-[11px] text-red-500">Out of stock</p>}
      </div>
    </div>
  );
}
