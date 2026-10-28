"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { ProductCard } from "@/components/store/ProductCard";
import { ProductSkeleton } from "@/components/store/ui";
import {
  ACCESSORY_PRICE_BANDS,
  PHONE_PRICE_BANDS,
  PHONES_SLUG,
  STORE_DEVICES,
  buildTree,
  canonicalCategory,
  categoryHref,
  filterProducts,
  groupOf,
  parsePrice,
  priceLabel,
  type PriceRange,
  type SortBy,
} from "@/lib/catalog";
import { useCatalog } from "@/stores/catalog";

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 bg-white border border-gray-200 pl-3 pr-2 py-1.5 rounded-full text-[12px] font-semibold text-gray-800">
      {label}
      <button onClick={onRemove} aria-label={`Remove ${label}`} className="text-gray-400 hover:text-orange-600">
        <X size={14} />
      </button>
    </span>
  );
}

function FilterBlock({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-100 py-4 first:pt-0">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between text-[13px] font-bold text-gray-900" aria-expanded={open}>
        {title}
        <ChevronDown size={16} className={`text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="mt-3 space-y-1">{children}</div>}
    </div>
  );
}

function Check({ checked, onChange, label, count, indent = false }: { checked: boolean; onChange: () => void; label: string; count?: number; indent?: boolean }) {
  return (
    <label className={`flex items-center gap-3 py-1.5 cursor-pointer group ${indent ? "pl-6" : ""}`}>
      <input type="checkbox" checked={checked} onChange={onChange} className="w-4 h-4 accent-orange-600 cursor-pointer shrink-0" />
      <span className={`flex-1 text-[13px] ${checked ? "text-orange-600 font-semibold" : "text-gray-700 group-hover:text-black"}`}>{label}</span>
      {count !== undefined && <span className="text-[11px] text-gray-400">{count}</span>}
    </label>
  );
}

function ShopContent() {
  const params = useSearchParams();
  const { products, categories, isLoading, loaded, fetchProducts } = useCatalog();

  const [cats, setCats] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [devices, setDevices] = useState<string[]>([]);
  const [price, setPrice] = useState<PriceRange | undefined>();
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("relevance");
  const [sheet, setSheet] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Navbar / homepage links drive the filters through the URL.
  useEffect(() => {
    const category = params.get("category") ?? params.get("collection");
    setCats(category ? category.split(",").map(canonicalCategory) : []);
    setBrands(params.get("brand") ? params.get("brand")!.split(",") : []);
    setDevices(params.get("device") ? [params.get("device")!] : []);
    setPrice(parsePrice(params.get("price")));
    setQuery(params.get("query") ?? "");
    setSortBy((params.get("sort") as SortBy) || "relevance");
  }, [params]);

  useEffect(() => {
    document.body.style.overflow = sheet ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [sheet]);

  const tree = useMemo(() => buildTree(categories), [categories]);
  const bySlug = useMemo(() => new Map(categories.map((c) => [canonicalCategory(c.name), c])), [categories]);
  const nameOf = (slug: string) => bySlug.get(slug)?.name ?? slug.replace(/-/g, " ");

  // Brand options come from the products in the chosen categories, before brand and price narrow them.
  const inCategory = useMemo(() => filterProducts(products, { category: cats, query }, "relevance", categories), [products, cats, query, categories]);
  const visible = useMemo(
    () => filterProducts(products, { category: cats, brand: brands, device: devices, price, query }, sortBy, categories),
    [products, cats, brands, devices, price, query, sortBy, categories],
  );

  const brandCounts = new Map<string, number>();
  inCategory.forEach((p) => p.brand && brandCounts.set(p.brand, (brandCounts.get(p.brand) ?? 0) + 1));
  const brandOptions = Array.from(new Set([...Array.from(brandCounts.keys()), ...brands])).sort((a, b) => (brandCounts.get(b) ?? 0) - (brandCounts.get(a) ?? 0));

  const groupSlugs = cats.map((s) => {
    const c = bySlug.get(s);
    return c ? canonicalCategory(groupOf(c.name, categories)?.name ?? c.name) : s;
  });
  const phonesOnly = cats.length > 0 && groupSlugs.every((g) => g === PHONES_SLUG);
  const bands = phonesOnly ? PHONE_PRICE_BANDS : ACCESSORY_PRICE_BANDS;

  // A single selected category gives the page its title and a row of related subcategories.
  const single = cats.length === 1 ? bySlug.get(cats[0]) : undefined;
  const singleGroup = single ? tree.find((g) => g.id === (single.parentId ?? single.id)) : undefined;
  const title = query ? `Results for “${query}”` : single ? single.name : "All Products";

  const toggle = (set: React.Dispatch<React.SetStateAction<string[]>>) => (v: string) => set((cur) => (cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]));
  const toggleCat = toggle(setCats);
  const toggleBrand = toggle(setBrands);
  const toggleDevice = toggle(setDevices);
  const samePrice = (r: PriceRange) => price && price[0] === r[0] && price[1] === r[1];
  const clearAll = () => {
    setCats([]);
    setBrands([]);
    setDevices([]);
    setPrice(undefined);
    setQuery("");
  };
  const activeCount = cats.length + brands.length + devices.length + (price ? 1 : 0);

  const filterPanel = (
    <>
      <FilterBlock title="Category">
        {tree.map((g) => (
          <div key={g.id}>
            <Check checked={cats.includes(canonicalCategory(g.name))} onChange={() => toggleCat(canonicalCategory(g.name))} label={g.name} />
            {g.children.map((c) => (
              <Check key={c.id} indent checked={cats.includes(canonicalCategory(c.name))} onChange={() => toggleCat(canonicalCategory(c.name))} label={c.name} />
            ))}
          </div>
        ))}
      </FilterBlock>
      <FilterBlock title="Price">
        {bands.map((b) => (
          <label key={b.label} className="flex items-center gap-3 py-1.5 cursor-pointer">
            <input type="radio" name="price" checked={!!samePrice(b.range)} onChange={() => setPrice(b.range)} className="w-4 h-4 accent-orange-600" />
            <span className={`text-[13px] ${samePrice(b.range) ? "text-orange-600 font-semibold" : "text-gray-700"}`}>{b.label}</span>
          </label>
        ))}
        {price && (
          <button onClick={() => setPrice(undefined)} className="text-[12px] font-semibold text-gray-500 hover:text-black pt-1">
            Any price
          </button>
        )}
      </FilterBlock>
      {brandOptions.length > 0 && (
        <FilterBlock title="Brand">
          {brandOptions.map((b) => (
            <Check key={b} checked={brands.includes(b)} onChange={() => toggleBrand(b)} label={b} count={brandCounts.get(b)} />
          ))}
        </FilterBlock>
      )}
      {!phonesOnly && (
        <FilterBlock title="Compatible With" defaultOpen={devices.length > 0}>
          {Array.from(new Set([...STORE_DEVICES, ...devices])).map((d) => (
            <Check key={d} checked={devices.includes(d)} onChange={() => toggleDevice(d)} label={d} />
          ))}
        </FilterBlock>
      )}
    </>
  );

  const sortSelect = (
    <select
      onChange={(e) => setSortBy(e.target.value as SortBy)}
      value={sortBy}
      aria-label="Sort products"
      className="bg-white border border-gray-200 text-[13px] font-semibold focus:outline-none cursor-pointer px-3 py-2 rounded-lg hover:border-gray-400 transition-colors"
    >
      <option value="relevance">Relevance</option>
      <option value="newest">Newest</option>
      <option value="price-asc">Price: Low to High</option>
      <option value="price-desc">Price: High to Low</option>
      <option value="rating">Top Rated</option>
    </select>
  );

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 pt-5 md:pt-10 pb-16">
        <nav className="text-[12px] text-gray-400 mb-2 flex items-center gap-1.5 flex-wrap">
          <Link href="/" className="hover:text-black">Home</Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-black">Shop</Link>
          {singleGroup && single && singleGroup.id !== single.id && (
            <>
              <span>/</span>
              <Link href={categoryHref(singleGroup.name)} className="hover:text-black">{singleGroup.name}</Link>
            </>
          )}
        </nav>
        <div className="flex items-end justify-between gap-4 mb-4 md:mb-6">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 tracking-tight truncate">{title}</h1>
            <p className="text-[13px] text-gray-500 mt-1">{loaded ? `${visible.length} product${visible.length === 1 ? "" : "s"}` : "Loading…"}</p>
          </div>
          <div className="hidden lg:block">{sortSelect}</div>
        </div>

        {singleGroup && singleGroup.children.length > 0 && (
          <div className="-mx-4 px-4 sm:mx-0 sm:px-0 flex gap-2 overflow-x-auto no-scrollbar pb-1 mb-4 md:mb-6">
            <Link
              href={categoryHref(singleGroup.name)}
              className={`shrink-0 px-4 py-2 rounded-full text-[13px] font-semibold border transition-colors ${
                single?.id === singleGroup.id ? "bg-black text-white border-black" : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
              }`}
            >
              All
            </Link>
            {singleGroup.children.map((c) => (
              <Link
                key={c.id}
                href={categoryHref(c.name)}
                className={`shrink-0 px-4 py-2 rounded-full text-[13px] font-semibold border transition-colors ${
                  single?.id === c.id ? "bg-black text-white border-black" : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
                }`}
              >
                {c.name}
              </Link>
            ))}
          </div>
        )}

        <div className="lg:hidden sticky top-[108px] md:top-[72px] z-30 -mx-4 px-4 sm:-mx-6 sm:px-6 py-2.5 bg-white/95 backdrop-blur border-b border-gray-100 flex items-center gap-2 mb-4">
          <button
            onClick={() => setSheet(true)}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 border border-gray-200 rounded-lg px-4 py-2 text-[13px] font-semibold"
          >
            <SlidersHorizontal size={15} /> Filters{activeCount > 0 && ` (${activeCount})`}
          </button>
          <div className="flex-1 sm:flex-none [&>select]:w-full">{sortSelect}</div>
        </div>

        {(activeCount > 0 || query) && (
          <div className="flex flex-wrap items-center gap-2 mb-5">
            {query && <Chip label={`“${query}”`} onRemove={() => setQuery("")} />}
            {cats.map((c) => (
              <Chip key={c} label={nameOf(c)} onRemove={() => toggleCat(c)} />
            ))}
            {brands.map((b) => (
              <Chip key={b} label={b} onRemove={() => toggleBrand(b)} />
            ))}
            {price && <Chip label={priceLabel(price)} onRemove={() => setPrice(undefined)} />}
            {devices.map((d) => (
              <Chip key={d} label={`For ${d}`} onRemove={() => toggleDevice(d)} />
            ))}
            <button onClick={clearAll} className="text-[12px] font-semibold text-gray-500 hover:text-black px-2 py-1">
              Clear all
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8 xl:gap-12">
          <aside className="hidden lg:block sticky top-28 h-fit max-h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar pr-2">{filterPanel}</aside>
          <main className="min-w-0">
            {isLoading || !loaded ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <ProductSkeleton key={i} />
                ))}
              </div>
            ) : visible.length === 0 ? (
              <div className="text-center py-16 md:py-24 border border-dashed border-gray-200 rounded-2xl">
                <p className="text-lg font-bold text-gray-900">No products found</p>
                <p className="text-sm text-gray-500 mt-1">Try removing a filter or searching for something else.</p>
                {(activeCount > 0 || query) && (
                  <button onClick={clearAll} className="mt-5 bg-black text-white px-5 py-2.5 rounded-full text-sm font-semibold">
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-3 gap-y-6 md:gap-x-6 md:gap-y-10">
                {visible.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {sheet && (
        <div className="fixed inset-0 z-[160] lg:hidden">
          <div className="absolute inset-0 bg-black/40 animate-in" onClick={() => setSheet(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] bg-white rounded-t-3xl flex flex-col animate-slide-in-up">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold">Filters</h2>
              <button onClick={() => setSheet(false)} aria-label="Close filters" className="p-1 text-gray-500">
                <X size={22} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4">{filterPanel}</div>
            <div className="flex gap-3 px-5 py-4 border-t border-gray-100 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <button onClick={clearAll} className="flex-1 border border-gray-200 rounded-xl py-3 text-sm font-semibold">
                Clear
              </button>
              <button onClick={() => setSheet(false)} className="flex-[2] bg-black text-white rounded-xl py-3 text-sm font-bold">
                Show {visible.length} product{visible.length === 1 ? "" : "s"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense>
      <ShopContent />
    </Suspense>
  );
}
