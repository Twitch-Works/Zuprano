"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { ProductCard } from "@/components/store/ProductCard";
import { ProductSkeleton } from "@/components/store/ui";
import { COLLECTIONS, STORE_DEVICES, canonicalCategory, filterProducts, type SortBy } from "@/lib/catalog";
import { useCatalog } from "@/stores/catalog";

const MAX_BUDGET = 5000;

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-2 bg-[#f9f9f9] border border-[#ddd] px-3 py-1.5 rounded-full transition-all hover:border-black group text-[9px]">
      <span className="font-bold text-[#1d1d1f] uppercase tracking-widest">{label}</span>
      <button onClick={onRemove} aria-label={`Remove ${label}`} className="text-[#86868b] hover:text-orange-600 transition-colors">
        <X size={12} />
      </button>
    </div>
  );
}

function ShopContent() {
  const params = useSearchParams();
  const { products, categories, isLoading, loaded, fetchProducts } = useCatalog();

  const [devices, setDevices] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [budget, setBudget] = useState(MAX_BUDGET);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("relevance");
  const [mobileFilters, setMobileFilters] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Navbar / homepage links drive the filters through the URL.
  useEffect(() => {
    const collection = params.get("collection");
    const fromCollection = collection ? COLLECTIONS[collection] : undefined;
    const category = params.get("category") ?? fromCollection?.category;
    setDevices(params.get("device") ? [params.get("device")!] : []);
    setTypes(category ? [canonicalCategory(category)] : []);
    setQuery(params.get("query") ?? "");
    setSortBy((params.get("sort") as SortBy) || "relevance");
    setBudget(MAX_BUDGET);
  }, [params]);

  const visible = useMemo(
    () =>
      filterProducts(
        products,
        {
          device: devices,
          category: types,
          priceRange: budget < MAX_BUDGET ? [0, budget] : undefined,
          query,
        },
        sortBy,
      ),
    [products, devices, types, budget, query, sortBy],
  );

  const deviceOptions = Array.from(new Set([...STORE_DEVICES, ...devices]));
  const typeLabel = new Map(categories.map((c) => [canonicalCategory(c.name), c.name]));
  const typeOptions = Array.from(new Set([...categories.map((c) => canonicalCategory(c.name)), ...types]));
  const toggleDevice = (d: string) => setDevices((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d]));
  const toggleType = (t: string) => setTypes((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));
  const clearAll = () => {
    setDevices([]);
    setTypes([]);
    setBudget(MAX_BUDGET);
    setQuery("");
  };
  const activeCount = devices.length + types.length;

  const filterPanel = (
    <>
      <div className="space-y-5">
        <h4 className="text-[9px] font-black text-[#1d1d1f] uppercase tracking-[0.3em] flex items-center gap-2">
          <SlidersHorizontal size={11} />
          Device
        </h4>
        <div className="flex flex-col gap-3">
          {deviceOptions.map((d) => (
            <label key={d} className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" checked={devices.includes(d)} onChange={() => toggleDevice(d)} className="w-4 h-4 accent-orange-600 cursor-pointer rounded" />
              <span
                className={`text-xs font-bold uppercase tracking-tighter transition-colors ${
                  devices.includes(d) ? "text-orange-600" : "text-gray-600 group-hover:text-black"
                }`}
              >
                {d}
              </span>
            </label>
          ))}
        </div>
      </div>
      <div className="space-y-5 pt-8 border-t border-[#eee]">
        <h4 className="text-[9px] font-black text-[#1d1d1f] uppercase tracking-[0.3em]">Type</h4>
        <div className="flex flex-col gap-3">
          {typeOptions.map((t) => (
            <label key={t} className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" checked={types.includes(t)} onChange={() => toggleType(t)} className="w-4 h-4 accent-orange-600 cursor-pointer rounded" />
              <span
                className={`text-xs font-bold uppercase tracking-tighter transition-colors capitalize ${
                  types.includes(t) ? "text-orange-600" : "text-gray-600 group-hover:text-black"
                }`}
              >
                {typeLabel.get(t) ?? t.replace(/-/g, " ")}
              </span>
            </label>
          ))}
        </div>
      </div>
      <div className="space-y-5 pt-8 border-t border-[#eee]">
        <div className="flex justify-between items-center">
          <h4 className="text-[9px] font-black text-[#1d1d1f] uppercase tracking-[0.3em]">Budget</h4>
          <span className="text-[11px] font-black text-orange-600">₹{budget}</span>
        </div>
        <input
          type="range"
          min="0"
          max={MAX_BUDGET}
          step="50"
          value={budget}
          onChange={(e) => setBudget(parseInt(e.target.value))}
          className="w-full h-1 bg-[#eee] appearance-none cursor-pointer accent-orange-600 rounded-lg"
        />
      </div>
    </>
  );

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-full mx-auto px-8 md:px-12 lg:px-16 xl:px-24 pt-20 pb-32">
        <div className="flex flex-col mb-8 space-y-4">
          <div className="flex flex-col gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-[2px] bg-orange-600" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-600">Shop</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-black text-[#1d1d1f] tracking-tighter uppercase leading-[0.9]">
                Browse<span className="text-orange-600">.</span>
              </h1>
            </div>
            <div className="flex items-center justify-between gap-4 border-b border-[#eee] pb-4">
              <p className="text-[9px] font-black uppercase tracking-widest text-[#86868b]">{visible.length} items</p>
              <div className="flex items-center gap-3">
                <select
                  onChange={(e) => setSortBy(e.target.value as SortBy)}
                  value={sortBy}
                  className="bg-white border border-[#eee] text-[10px] font-black uppercase tracking-widest focus:outline-none cursor-pointer px-3 py-2 rounded-lg hover:border-black transition-colors"
                >
                  <option value="relevance">Relevance</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="newest">Newest</option>
                </select>
              </div>
            </div>
          </div>
          {(activeCount > 0 || query) && (
            <div className="flex flex-wrap items-center gap-2 pt-3">
              {query && <Chip label={`"${query}"`} onRemove={() => setQuery("")} />}
              {devices.map((d) => (
                <Chip key={d} label={d} onRemove={() => toggleDevice(d)} />
              ))}
              {types.map((t) => (
                <Chip key={t} label={typeLabel.get(t) ?? t} onRemove={() => toggleType(t)} />
              ))}
              <button
                onClick={clearAll}
                className="text-[8px] font-black uppercase tracking-[0.15em] text-gray-500 hover:text-black px-2 py-1 transition-colors"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          <aside className="hidden lg:block lg:col-span-2 space-y-10 sticky top-32 h-fit">{filterPanel}</aside>
          <main className="lg:col-span-10">
            <div className="lg:hidden mb-10">
              <button
                onClick={() => setMobileFilters(!mobileFilters)}
                className="w-full bg-black text-white py-4 rounded-lg font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-orange-600 transition-colors active:scale-95"
              >
                <SlidersHorizontal size={14} />
                Filters {activeCount > 0 && `(${activeCount})`}
              </button>
              {mobileFilters && <div className="mt-6 p-6 border border-[#eee] rounded-xl space-y-8 animate-in">{filterPanel}</div>}
            </div>
            <div className="w-full">
              {isLoading || !loaded ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <ProductSkeleton key={i} />
                  ))}
                </div>
              ) : visible.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-primary-600">No products found.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-x-2 sm:gap-x-3 md:gap-x-4 lg:gap-x-6 gap-y-4 sm:gap-y-5 md:gap-y-6 lg:gap-y-8">
                  {visible.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
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
