"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, ChevronDown, ChevronRight, ChevronUp, Heart, Info, Layers, Lock, Package, Share2, ShieldCheck, Star, Target, Truck, X, Zap } from "lucide-react";
import { ProductCard } from "@/components/store/ProductCard";
import { getSupabase } from "@/lib/supabase/client";
import { normalizeVariants, toProduct } from "@/lib/mappers";
import { canonicalCategory } from "@/lib/catalog";
import type { Product, Variant } from "@/lib/types";
import { useCart } from "@/stores/cart";
import { useUI } from "@/stores/ui";
import { useAuth } from "@/stores/auth";
import { useWishlist } from "@/stores/wishlist";
import { useCatalog } from "@/stores/catalog";

function Accordion({ title, open, onClick, children }: { title: string; open: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={onClick}
        className="w-full py-6 flex justify-between items-center text-[11px] font-bold uppercase tracking-[0.2em] text-gray-900 transition-all hover:text-orange-600"
      >
        <span>{title}</span>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {open && <div className="pb-8 text-[14px] leading-relaxed text-gray-500 font-medium animate-in">{children}</div>}
    </div>
  );
}

function SizeGuide({ onClose }: { onClose: () => void }) {
  const rows = [
    ["iPhone 16 Pro Max", "163.0 × 77.6 mm"],
    ["iPhone 16 Pro", "149.6 × 71.5 mm"],
    ["iPhone 15 Pro Max", "159.9 × 76.7 mm"],
    ["iPhone 15 / 15 Pro", "147.6 × 71.6 mm"],
    ["iPhone 14 / 13", "146.7 × 71.5 mm"],
  ];
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-md p-6 shadow-lg animate-in">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-black uppercase tracking-tight">📐 Size Guide</h3>
          <button onClick={onClose} aria-label="Close" className="p-2 rounded-full hover:bg-gray-100">
            <X size={16} />
          </button>
        </div>
        <p className="text-[11px] text-gray-500 mb-4">Pick the model printed under Settings → General → About on your phone.</p>
        <table className="w-full text-[12px]">
          <tbody>
            {rows.map(([m, d]) => (
              <tr key={m} className="border-b border-gray-100 last:border-0">
                <td className="py-2 font-bold text-gray-900">{m}</td>
                <td className="py-2 text-right text-gray-500">{d}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const addItem = useCart((s) => s.addItem);
  const { showToast, openAuthModal } = useUI();
  const user = useAuth((s) => s.user);
  const { isInWishlist, toggle } = useWishlist();
  const { products, fetchProducts } = useCatalog();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [variant, setVariant] = useState<Variant | null>(null);
  const [qty, setQty] = useState(1);
  const [image, setImage] = useState(0);
  const [section, setSection] = useState<string | null>("details");
  const [sizeGuide, setSizeGuide] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    window.scrollTo(0, 0);
    fetchProducts();
    getSupabase()
      .from("products")
      .select("*")
      .eq("id", id)
      .eq("is_public", true)
      .eq("is_active", true)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        const p = data ? toProduct(data) : null;
        setProduct(p);
        setVariant(p ? normalizeVariants(p)[0] : null);
        setImage(0);
        setQty(1);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id, fetchProducts]);

  if (loading) {
    return (
      <div className="max-w-[1400px] mx-auto px-6 py-32 flex flex-col items-center">
        <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Loading Drop...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-40 max-w-[1400px] mx-auto px-6">
        <Info size={48} className="mx-auto text-orange-600 mb-6" />
        <h2 className="text-4xl font-black tracking-tighter uppercase mb-4">Drop Not Found</h2>
        <Link href="/shop" className="inline-block bg-black text-white px-10 py-4 text-[11px] font-black uppercase tracking-widest rounded-lg">
          Return to Shop
        </Link>
      </div>
    );
  }

  const variants = normalizeVariants(product);
  const current = variant ?? variants[0];
  const stock = current.stock;
  const saved = isInWishlist(product.id);
  const images = product.images.length ? product.images : [product.thumbnail];
  const mrp = product.originalPrice && product.originalPrice > current.price ? product.originalPrice : Math.round(current.price * 1.3);
  const related = products.filter((p) => p.id !== product.id && canonicalCategory(p.category) === canonicalCategory(product.category)).slice(0, 4);
  const fill = Math.max(4, Math.min(100, (stock / Math.max(product.stock, 1)) * 100));

  const addToCart = () => {
    if (stock <= 0) return showToast("error", "Out of stock");
    if (qty > stock) return showToast("error", `Only ${stock} available`);
    addItem(product, current, qty);
    showToast("success", "Added to cart!");
  };

  const toggleWishlist = async () => {
    if (!user) return openAuthModal();
    try {
      const added = await toggle(product, user.id);
      showToast("success", added ? "Added to wishlist!" : "Removed from wishlist");
    } catch {
      showToast("error", "Could not update wishlist");
    }
  };

  const share = async () => {
    if (navigator.share) {
      await navigator.share({ title: product.name, text: `Check out ${product.name}`, url: window.location.href }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(window.location.href);
      showToast("info", "Link copied!");
    }
  };

  return (
    <div className="bg-white min-h-screen">
      <div className="w-full max-w-[1280px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        <nav className="flex items-center gap-2 text-[7px] sm:text-[8px] md:text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-6 sm:mb-8 md:mb-10">
          <Link href="/" className="hover:text-black">Home</Link>
          <span>/</span>
          <Link href={`/shop?category=${encodeURIComponent(product.category)}`} className="hover:text-black">
            {product.category}
          </Link>
          <span>/</span>
          <span className="text-black truncate">{product.name}</span>
        </nav>

        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={toggleWishlist}
              aria-label="Toggle wishlist"
              className="p-2 rounded-lg border border-gray-200 hover:border-orange-600 hover:bg-orange-50 transition-all"
            >
              <Heart size={16} className={saved ? "fill-orange-600 text-orange-600" : "text-gray-900"} />
            </button>
            <button onClick={share} aria-label="Share" className="p-2 rounded-lg border border-gray-200 hover:border-blue-600 hover:bg-blue-50 transition-all">
              <Share2 size={16} className="text-gray-900" />
            </button>
          </div>
          <div className="text-[7px] sm:text-[8px] font-bold text-gray-400 uppercase tracking-wider">SKU: {product.sku || `ZUP-${product.id.slice(0, 5)}`}</div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 md:gap-8 lg:gap-10 items-start">
          <div className="lg:col-span-7 space-y-2 sm:space-y-3">
            <div className="sticky top-16 sm:top-20 md:top-24 z-10">
              <div className="bg-gradient-to-br from-[#fafafa] to-[#f5f5f5] rounded-xl md:rounded-2xl aspect-[3/4] flex items-center justify-center p-1 md:p-2 lg:p-3 overflow-hidden border border-gray-100 shadow-xl hover:shadow-2xl transition-all duration-500">
                <div className="w-full h-full bg-white rounded-lg md:rounded-xl flex items-center justify-center shadow-inner">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={images[image] || product.thumbnail}
                    alt={product.name}
                    className="w-[90%] h-[90%] object-contain mix-blend-multiply transition-transform duration-700 hover:scale-110"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-2 sm:mt-3 overflow-x-auto pb-1 scrollbar-hide">
                {images.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setImage(i)}
                    className={`shrink-0 w-16 sm:w-20 aspect-square rounded-lg md:rounded-lg border-2 transition-all overflow-hidden ${
                      image === i ? "border-black shadow-md" : "border-gray-200 opacity-60 hover:opacity-100"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} className="w-full h-full object-cover" alt="" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col justify-start">
            {stock > 0 ? (
              <div className="mb-4 p-2.5 sm:p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[8px] sm:text-[9px] font-bold text-green-700 uppercase">✓ In Stock</span>
                  <span className="text-[8px] sm:text-[9px] text-green-600 font-semibold">{stock} available</span>
                </div>
                <div className="w-full h-1 bg-green-200 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500" style={{ width: `${fill}%` }} />
                </div>
              </div>
            ) : (
              <div className="mb-4 p-2.5 sm:p-3 bg-red-50 border border-red-200 rounded-lg">
                <span className="text-[8px] sm:text-[9px] font-bold text-red-700 uppercase">✕ Out of Stock</span>
              </div>
            )}

            <div className="space-y-1.5 mb-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[8px] sm:text-[9px] md:text-[10px] font-black uppercase tracking-[0.15em] text-orange-600">{product.brand || "Zuprano"}</span>
                <span className="w-0.5 h-0.5 bg-gray-300 rounded-full" />
                <span className="text-gray-400 text-[7px] sm:text-[8px] md:text-[9px] font-bold uppercase tracking-wider">Verified</span>
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-gray-900 tracking-tight leading-snug">{product.name}</h1>
            </div>

            <div className="flex items-start gap-3 sm:gap-4 mb-6 md:mb-8 pb-4 sm:pb-6 border-b border-gray-100">
              <div className="flex flex-col">
                <span className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900">₹{current.price.toLocaleString("en-IN")}</span>
                <span className="text-xs text-gray-400 line-through font-semibold">₹{mrp.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <div className="flex gap-0.5 text-orange-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={12} fill={i < Math.round(product.rating || 5) ? "currentColor" : "none"} />
                  ))}
                </div>
                <span className="text-[7px] sm:text-[8px] font-bold text-gray-500 uppercase">({product.reviews})</span>
              </div>
            </div>

            <div className="space-y-3 bg-gray-50 p-3 rounded-lg border border-gray-100 mb-6 md:mb-8">
              {variants.length > 0 && variants[0].id !== "default" && (
                <div className="space-y-2">
                  <label className="text-[7px] sm:text-[8px] md:text-[9px] font-bold uppercase tracking-[0.15em] text-gray-500">Size / Style</label>
                  <div className="flex flex-wrap gap-1.5">
                    {variants.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => {
                          setVariant(v);
                          setQty(1);
                        }}
                        disabled={v.stock <= 0}
                        className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-[8px] md:text-[9px] font-bold uppercase transition-all disabled:opacity-30 disabled:line-through ${
                          current.id === v.id ? "bg-black text-white shadow-md" : "bg-white text-gray-900 border border-gray-200 hover:border-black"
                        }`}
                      >
                        {v.value}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <div className="flex items-center bg-white border border-gray-200 rounded-lg px-1 h-11">
                  <button onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Decrease" className="w-7 text-lg font-bold">
                    −
                  </button>
                  <span className="flex-1 text-center font-black text-sm min-w-[24px]">{qty}</span>
                  <button onClick={() => setQty(Math.min(Math.max(stock, 1), qty + 1))} aria-label="Increase" className="w-7 text-lg font-bold">
                    +
                  </button>
                </div>
                <button
                  onClick={addToCart}
                  disabled={stock <= 0}
                  className="flex-1 bg-black text-white rounded-lg font-black text-[10px] md:text-[11px] uppercase tracking-[0.1em] transition-all hover:bg-orange-600 active:scale-95 shadow-lg hover:shadow-xl py-3 md:py-3 disabled:opacity-40"
                >
                  {stock > 0 ? "Add to Cart" : "Out of Stock"}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 mb-4">
              {[
                { icon: <ShieldCheck size={14} className="text-orange-600" />, label: "Warranty" },
                { icon: <Truck size={14} className="text-blue-600" />, label: "Free Ship" },
                { icon: <Package size={14} className="text-purple-600" />, label: "Returns" },
                { icon: <Lock size={14} className="text-green-600" />, label: "Secure" },
              ].map((b) => (
                <div key={b.label} className="p-2.5 border border-gray-100 rounded-lg flex flex-col items-center text-center gap-1">
                  {b.icon}
                  <p className="text-[6px] font-bold text-gray-600 uppercase">{b.label}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setSizeGuide(true)}
              className="w-full mb-4 p-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all flex items-center justify-between group"
            >
              <span className="text-[9px] md:text-[10px] font-bold text-gray-900">📐 Size Guide</span>
              <ChevronRight size={14} className="text-gray-400 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <div className="border-t border-gray-100 pt-4">
              <Accordion title="About This Product" open={section === "details"} onClick={() => setSection(section === "details" ? null : "details")}>
                <p className="mb-4">{product.description}</p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-gray-900 font-bold text-[12px]">
                    <Layers size={14} /> Premium Materials
                  </div>
                  <div className="flex items-center gap-3 text-gray-900 font-bold text-[12px]">
                    <Target size={14} /> Precision Fit
                  </div>
                  <div className="flex items-center gap-3 text-gray-900 font-bold text-[12px]">
                    <Zap size={14} /> Drop Tested
                  </div>
                </div>
              </Accordion>
              <Accordion title="Specifications" open={section === "specs"} onClick={() => setSection(section === "specs" ? null : "specs")}>
                <div className="space-y-2 text-[12px]">
                  {[
                    ["Material:", "Premium TPU + Polycarbonate"],
                    ["Weight:", "~45g"],
                    ["Colors:", `${variants.length}+ Options`],
                    ["Drop Protection:", "Up to 3 meters"],
                    ...(product.compatibility.length ? [["Compatible:", product.compatibility.join(", ")]] : []),
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4">
                      <span className="text-gray-500">{k}</span>
                      <span className="font-bold text-gray-900 text-right">{v}</span>
                    </div>
                  ))}
                </div>
              </Accordion>
              <Accordion title="Shipping & Returns" open={section === "shipping"} onClick={() => setSection(section === "shipping" ? null : "shipping")}>
                <div className="space-y-2 text-[12px] text-gray-700 leading-relaxed">
                  <p>✓ Free Shipping: Ships within 1-2 business days</p>
                  <p>✓ Delivery: 3-5 days across India</p>
                  <p>✓ Returns: 14-day hassle-free return policy</p>
                  <p>✓ Quality: 100% authentic, brand new product</p>
                </div>
              </Accordion>
              <Accordion title="Security & Trust" open={section === "trust"} onClick={() => setSection(section === "trust" ? null : "trust")}>
                <div className="space-y-2 text-[12px] text-gray-700 leading-relaxed">
                  <div className="flex gap-2"><span>🔒</span><span>Secure SSL encryption for all transactions</span></div>
                  <div className="flex gap-2"><span>✓</span><span>100% authentic products guaranteed</span></div>
                  <div className="flex gap-2"><span>💳</span><span>Safe payment options (UPI, Card, Wallet)</span></div>
                  <div className="flex gap-2"><span>⭐</span><span>Trusted by 50,000+ customers</span></div>
                </div>
              </Accordion>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <div className="mt-32 pt-20 border-t border-gray-100">
            <div className="flex justify-between items-end mb-12">
              <div>
                <h2 className="text-3xl font-black tracking-tighter uppercase">Gear up your setup</h2>
                <p className="text-gray-400 text-[11px] font-bold uppercase tracking-widest mt-2">Compatible accessories for your device</p>
              </div>
              <Link href="/shop" className="group flex items-center gap-2 text-[11px] font-black uppercase tracking-widest">
                Full Catalog <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
      {sizeGuide && <SizeGuide onClose={() => setSizeGuide(false)} />}
    </div>
  );
}
