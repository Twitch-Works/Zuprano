"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, BatteryFull, Camera, ChevronDown, ChevronRight, ChevronUp, Cpu, HardDrive, Heart, Info, Layers, Lock, MemoryStick, Package, Share2, ShieldCheck, Smartphone, Star, Target, Truck, X, Zap } from "lucide-react";
import { ProductCard } from "@/components/store/ProductCard";
import { getSupabase } from "@/lib/supabase/client";
import { normalizeVariants, toProduct } from "@/lib/mappers";
import { canonicalCategory, categoryHref, filterProducts, groupOf, isPhone } from "@/lib/catalog";
import type { Product, Variant } from "@/lib/types";
import { useCart } from "@/stores/cart";
import { useUI } from "@/stores/ui";
import { useAuth } from "@/stores/auth";
import { useWishlist } from "@/stores/wishlist";
import { useCatalog } from "@/stores/catalog";

const KEY_SPECS = [
  { label: "Display", match: /display|screen/i, icon: Smartphone },
  { label: "Processor", match: /processor|chip|cpu/i, icon: Cpu },
  { label: "RAM", match: /^ram$/i, icon: MemoryStick },
  { label: "Storage", match: /storage|rom/i, icon: HardDrive },
  { label: "Camera", match: /^(rear |main )?camera$/i, icon: Camera },
  { label: "Battery", match: /battery/i, icon: BatteryFull },
];

/** Brand name -> the device name accessories list under "compatible with". */
const DEVICE_ALIAS: Record<string, string> = { apple: "iPhone", google: "Pixel" };

function Accordion({ title, open, onClick, children }: { title: string; open: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={onClick}
        className="w-full py-4 md:py-5 flex justify-between items-center text-[13px] font-bold text-gray-900 transition-all hover:text-orange-600"
      >
        <span>{title}</span>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {open && <div className="pb-6 text-[14px] leading-relaxed text-gray-600 animate-in">{children}</div>}
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
  const router = useRouter();
  const addItem = useCart((s) => s.addItem);
  const { showToast, openAuthModal } = useUI();
  const user = useAuth((s) => s.user);
  const { isInWishlist, toggle } = useWishlist();
  const { products, categories, fetchProducts } = useCatalog();

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
      <div className="max-w-[1400px] mx-auto px-4 py-24 md:py-32 flex flex-col items-center">
        <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm text-gray-400">Loading product…</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-24 md:py-40 max-w-[1400px] mx-auto px-4">
        <Info size={48} className="mx-auto text-orange-600 mb-6" />
        <h2 className="text-2xl md:text-4xl font-black tracking-tight mb-4">Product not found</h2>
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
  const mrp = product.originalPrice && product.originalPrice > current.price ? product.originalPrice : null;
  const off = mrp ? Math.round(((mrp - current.price) / mrp) * 100) : 0;
  const phone = isPhone(product, categories);
  const group = groupOf(product.category, categories);
  const protection = group ? canonicalCategory(group.name) === "mobile-protection" : false;
  const highlights = KEY_SPECS.map((k) => ({ ...k, value: product.specs.find((s) => k.match.test(s.label))?.value })).filter((k) => k.value);
  const specRows: [string, string][] = product.specs.length
    ? product.specs.map((s) => [s.label, s.value])
    : [
        ["Brand", product.brand || "Zuprano"],
        ["Category", product.category],
        ...(variants[0].id !== "default" ? [[variants[0].name, variants.map((v) => v.value).join(", ")] as [string, string]] : []),
      ];
  if (product.compatibility.length) specRows.push(["Compatible with", product.compatibility.join(", ")]);

  const same = filterProducts(products, { category: [product.category] }, "newest", categories).filter((p) => p.id !== product.id);
  const related = same.length ? same.slice(0, 4) : group ? filterProducts(products, { category: [group.name] }, "newest", categories).filter((p) => p.id !== product.id).slice(0, 4) : [];
  // For a phone, suggest accessories that list it (or its brand) as compatible.
  const deviceKey = DEVICE_ALIAS[product.brand.toLowerCase()] ?? product.brand;
  const forThisPhone = phone && deviceKey
    ? filterProducts(products, { device: [product.name.replace(new RegExp(`^${product.brand}\\s+`, "i"), ""), deviceKey] }, "relevance", categories)
        .filter((p) => !isPhone(p, categories))
        .slice(0, 4)
    : [];
  const fill = Math.max(4, Math.min(100, (stock / Math.max(product.stock, 1)) * 100));

  const addToCart = () => {
    if (stock <= 0) return showToast("error", "Out of stock");
    if (qty > stock) return showToast("error", `Only ${stock} available`);
    addItem(product, current, qty);
    showToast("success", "Added to cart!");
  };

  const buyNow = () => {
    if (stock <= 0) return showToast("error", "Out of stock");
    if (qty > stock) return showToast("error", `Only ${stock} available`);
    addItem(product, current, qty);
    router.push("/checkout");
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
      <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        <nav className="flex items-center gap-1.5 text-[12px] text-gray-400 mb-4 md:mb-8 min-w-0">
          <Link href="/" className="hover:text-black shrink-0">Home</Link>
          {group && group.name !== product.category && (
            <>
              <span>/</span>
              <Link href={categoryHref(group.name)} className="hover:text-black shrink-0">{group.name}</Link>
            </>
          )}
          <span>/</span>
          <Link href={categoryHref(product.category)} className="hover:text-black shrink-0">{product.category}</Link>
          <span className="hidden sm:inline">/</span>
          <span className="hidden sm:inline text-gray-900 truncate">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 lg:gap-12 items-start">
          <div className="lg:col-span-7 lg:sticky lg:top-28">
            <div className="relative bg-[#f5f5f7] rounded-2xl aspect-square lg:aspect-[4/5] overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={images[image] || product.thumbnail} alt={product.name} className="absolute inset-0 w-full h-full object-cover mix-blend-multiply" />
              <div className="absolute top-3 right-3 flex flex-col gap-2">
                <button onClick={toggleWishlist} aria-label="Toggle wishlist" className="w-10 h-10 rounded-full bg-white/90 shadow-sm flex items-center justify-center">
                  <Heart size={18} className={saved ? "fill-red-500 text-red-500" : "text-gray-900"} />
                </button>
                <button onClick={share} aria-label="Share" className="w-10 h-10 rounded-full bg-white/90 shadow-sm flex items-center justify-center">
                  <Share2 size={18} className="text-gray-900" />
                </button>
              </div>
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto pb-1 no-scrollbar">
                {images.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setImage(i)}
                    aria-label={`Show image ${i + 1}`}
                    className={`shrink-0 w-16 sm:w-20 aspect-square rounded-lg border-2 transition-all overflow-hidden bg-[#f5f5f7] ${
                      image === i ? "border-black" : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} className="w-full h-full object-cover mix-blend-multiply" alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="text-[12px] font-black uppercase tracking-[0.15em] text-orange-600">{product.brand || "Zuprano"}</span>
              <span className="w-1 h-1 bg-gray-300 rounded-full" />
              <span className="text-[12px] text-gray-400">SKU {product.sku || `ZUP-${product.id.slice(0, 5)}`}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 tracking-tight leading-tight">{product.name}</h1>
            {product.reviews > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center gap-1 bg-green-600 text-white text-[12px] font-bold px-2 py-0.5 rounded">
                  {product.rating.toFixed(1)} <Star size={11} fill="currentColor" />
                </span>
                <span className="text-[12px] text-gray-500">{product.reviews.toLocaleString("en-IN")} ratings</span>
              </div>
            )}

            <div className="flex items-baseline flex-wrap gap-x-3 gap-y-1 mt-4 pb-5 border-b border-gray-100">
              <span className="text-3xl font-black text-gray-900">₹{current.price.toLocaleString("en-IN")}</span>
              {mrp && <span className="text-base text-gray-400 line-through">₹{mrp.toLocaleString("en-IN")}</span>}
              {off >= 1 && <span className="text-base font-bold text-green-600">{off}% off</span>}
              <span className="basis-full text-[12px] text-gray-500">Inclusive of all taxes</span>
            </div>

            {phone && highlights.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 py-5 border-b border-gray-100">
                {highlights.map((h) => (
                  <div key={h.label} className="flex items-start gap-2.5 rounded-xl bg-[#f6f6f8] p-3 min-w-0">
                    <h.icon size={18} className="text-orange-600 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-[11px] text-gray-500">{h.label}</p>
                      <p className="text-[13px] font-semibold text-gray-900 leading-snug break-words">{h.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="py-5 space-y-4">
              {variants[0].id !== "default" && (
                <div>
                  <p className="text-[13px] font-semibold text-gray-900 mb-2">
                    {current.name === "Option" ? "Choose an option" : current.name}: <span className="text-gray-500 font-normal">{current.value}</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {variants.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => {
                          setVariant(v);
                          setQty(1);
                        }}
                        disabled={v.stock <= 0}
                        className={`px-4 py-2.5 rounded-xl text-[13px] font-semibold border-2 transition-all disabled:opacity-30 disabled:line-through ${
                          current.id === v.id ? "border-black bg-black text-white" : "border-gray-200 bg-white text-gray-900 hover:border-gray-400"
                        }`}
                      >
                        {v.value}
                        {v.price !== variants[0].price && <span className={`block text-[11px] font-normal ${current.id === v.id ? "text-white/70" : "text-gray-500"}`}>₹{v.price.toLocaleString("en-IN")}</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {stock > 0 ? (
                <div>
                  <div className="flex items-center justify-between text-[12px] mb-1.5">
                    <span className="font-semibold text-green-700">In stock</span>
                    <span className="text-gray-500">{stock < 10 ? `Only ${stock} left` : `${stock} available`}</span>
                  </div>
                  <div className="w-full h-1 bg-green-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500" style={{ width: `${fill}%` }} />
                  </div>
                </div>
              ) : (
                <p className="text-[13px] font-semibold text-red-600">Currently out of stock</p>
              )}

              <div className="flex gap-2">
                <div className="flex items-center border border-gray-200 rounded-xl h-12 shrink-0">
                  <button onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Decrease quantity" className="w-10 h-full text-lg font-bold">
                    −
                  </button>
                  <span className="w-6 text-center font-bold text-sm">{qty}</span>
                  <button onClick={() => setQty(Math.min(Math.max(stock, 1), qty + 1))} aria-label="Increase quantity" className="w-10 h-full text-lg font-bold">
                    +
                  </button>
                </div>
                <button
                  onClick={addToCart}
                  disabled={stock <= 0}
                  className="flex-1 h-12 border-2 border-black text-black rounded-xl font-bold text-sm transition-all hover:bg-gray-50 active:scale-[0.98] disabled:opacity-40"
                >
                  Add to Cart
                </button>
              </div>
              <button
                onClick={buyNow}
                disabled={stock <= 0}
                className="w-full h-12 bg-orange-600 text-white rounded-xl font-bold text-sm transition-all hover:bg-orange-700 active:scale-[0.98] disabled:opacity-40"
              >
                {stock > 0 ? "Buy Now" : "Out of Stock"}
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2 pb-5">
              {[
                { icon: <ShieldCheck size={18} className="text-orange-600" />, label: phone ? "Brand warranty" : "Warranty" },
                { icon: <Truck size={18} className="text-blue-600" />, label: "Fast delivery" },
                { icon: <Package size={18} className="text-purple-600" />, label: "Easy returns" },
                { icon: <Lock size={18} className="text-green-600" />, label: "Secure pay" },
              ].map((b) => (
                <div key={b.label} className="p-2.5 border border-gray-100 rounded-xl flex flex-col items-center text-center gap-1.5">
                  {b.icon}
                  <p className="text-[11px] font-semibold text-gray-600 leading-tight">{b.label}</p>
                </div>
              ))}
            </div>

            {protection && (
              <button
                onClick={() => setSizeGuide(true)}
                className="w-full mb-2 p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all flex items-center justify-between group"
              >
                <span className="text-[13px] font-semibold text-gray-900">📐 Size Guide</span>
                <ChevronRight size={16} className="text-gray-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}

            <div className="border-t border-gray-100">
              <Accordion title="About This Product" open={section === "details"} onClick={() => setSection(section === "details" ? null : "details")}>
                <p className={protection ? "mb-4" : ""}>{product.description || "No description yet."}</p>
                {protection && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-gray-900 font-semibold text-[13px]">
                      <Layers size={15} /> Premium materials
                    </div>
                    <div className="flex items-center gap-3 text-gray-900 font-semibold text-[13px]">
                      <Target size={15} /> Precision fit
                    </div>
                    <div className="flex items-center gap-3 text-gray-900 font-semibold text-[13px]">
                      <Zap size={15} /> Drop tested
                    </div>
                  </div>
                )}
              </Accordion>
              <Accordion title="Specifications" open={section === "specs"} onClick={() => setSection(section === "specs" ? null : "specs")}>
                <dl className="divide-y divide-gray-100 text-[13px]">
                  {specRows.map(([k, v]) => (
                    <div key={k} className="grid grid-cols-[40%_1fr] gap-4 py-2.5">
                      <dt className="text-gray-500">{k}</dt>
                      <dd className="font-semibold text-gray-900 break-words">{v}</dd>
                    </div>
                  ))}
                </dl>
              </Accordion>
              <Accordion title="Delivery & Returns" open={section === "shipping"} onClick={() => setSection(section === "shipping" ? null : "shipping")}>
                <div className="space-y-2 text-[13px] text-gray-700 leading-relaxed">
                  <p>✓ Ships within 1-2 business days</p>
                  <p>✓ Delivery in 3-5 days across India</p>
                  <p>✓ Free delivery on orders above ₹500</p>
                  <p>✓ {phone ? "Returns accepted for sealed units and manufacturing defects" : "Hassle-free returns"}</p>
                  <p>✓ 100% authentic, brand new product</p>
                </div>
              </Accordion>
              <Accordion title="Payments & Security" open={section === "trust"} onClick={() => setSection(section === "trust" ? null : "trust")}>
                <div className="space-y-2 text-[13px] text-gray-700 leading-relaxed">
                  <div className="flex gap-2"><span>🔒</span><span>Secure SSL encryption for all transactions</span></div>
                  <div className="flex gap-2"><span>💳</span><span>UPI, cards and cash on delivery</span></div>
                  <div className="flex gap-2"><span>✓</span><span>100% authentic products guaranteed</span></div>
                </div>
              </Accordion>
            </div>
          </div>
        </div>

        {forThisPhone.length > 0 && (
          <RelatedRow title={`Accessories for ${product.name}`} subtitle="Cases, chargers and more that fit this phone" href={`/shop?device=${encodeURIComponent(deviceKey)}`} items={forThisPhone} />
        )}
        {related.length > 0 && (
          <RelatedRow
            title={phone ? "Similar phones" : "You may also like"}
            subtitle={`More from ${same.length ? product.category : group?.name}`}
            href={categoryHref(same.length ? product.category : group?.name ?? product.category)}
            items={related}
          />
        )}
      </div>
      {sizeGuide && <SizeGuide onClose={() => setSizeGuide(false)} />}
    </div>
  );
}

function RelatedRow({ title, subtitle, href, items }: { title: string; subtitle: string; href: string; items: Product[] }) {
  return (
    <section className="mt-12 md:mt-20 pt-8 md:pt-12 border-t border-gray-100">
      <div className="flex justify-between items-end gap-4 mb-5 md:mb-8">
        <div className="min-w-0">
          <h2 className="text-xl md:text-3xl font-black tracking-tight">{title}</h2>
          <p className="text-gray-500 text-sm mt-1">{subtitle}</p>
        </div>
        <Link href={href} className="group shrink-0 flex items-center gap-1 text-sm font-bold text-orange-600">
          View all <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-3 gap-y-6 md:gap-6">
        {items.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
