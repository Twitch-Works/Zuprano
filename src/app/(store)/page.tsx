"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  BadgeCheck,
  BatteryCharging,
  Cable,
  Camera,
  Car,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  EyeOff,
  Headphones,
  Layers,
  PlugZap,
  RotateCcw,
  Shield,
  Smartphone,
  Truck,
  Watch,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { ProductCard } from "@/components/store/ProductCard";
import { ProductSkeleton } from "@/components/store/ui";
import { PHONE_PRICE_BANDS, PHONES_SLUG, buildTree, canonicalCategory, categoryHref, filterProducts, priceParam, type CategoryGroup } from "@/lib/catalog";
import type { Category } from "@/lib/types";
import { useCatalog } from "@/stores/catalog";

const img = (id: string, w = 1200) => `https://images.unsplash.com/${id}?auto=format&fit=crop&q=80&w=${w}`;

const HERO = [
  {
    eyebrow: "New flagships in stock",
    title: ["The latest phones.", "Genuine. Delivered fast."],
    body: "iPhone, Galaxy, Pixel, OnePlus and more, with full brand warranty.",
    cta: "Shop Mobiles",
    href: categoryHref("Mobile Phones"),
    image: img("photo-1604671368394-2240d0b1bb6c"),
    bg: "bg-[#0d0d10]",
    dark: true,
  },
  {
    eyebrow: "Samsung Galaxy",
    title: ["Galaxy AI.", "In your pocket."],
    body: "The Galaxy S series and the best of Android, in every colour and storage option.",
    cta: "Shop Samsung",
    href: categoryHref("Samsung"),
    image: img("photo-1610945265064-0e34e5519bbf"),
    bg: "bg-[#1a1626]",
    dark: true,
  },
  {
    eyebrow: "Best under ₹30,000",
    title: ["Mid-range price.", "Flagship feel."],
    body: "120Hz AMOLED displays, 5G and fast charging without the flagship price.",
    cta: "See the picks",
    href: `${categoryHref("Mobile Phones")}&price=${priceParam([20000, 30000])}`,
    image: img("photo-1598327105666-5b89351aff97"),
    bg: "bg-[#14201f]",
    dark: true,
  },
  {
    eyebrow: "Accessories",
    title: ["Charge. Listen.", "Protect."],
    body: "Fast chargers, earbuds, power banks and cases picked for your phone.",
    cta: "Shop Accessories",
    href: categoryHref("Phone Accessories"),
    image: img("photo-1590658268037-6bf12165a8df"),
    bg: "bg-[#ecebf4]",
    dark: false,
  },
];

const FALLBACK_BRANDS = ["Apple", "Samsung", "OnePlus", "Xiaomi", "Redmi", "Realme", "Vivo", "Oppo", "Motorola", "Nothing", "Google Pixel"];

const TRUST = [
  { icon: BadgeCheck, title: "100% Genuine", desc: "Brand warranty on every phone" },
  { icon: Truck, title: "Free Delivery", desc: "On orders above ₹500" },
  { icon: CreditCard, title: "Secure Payments", desc: "UPI, cards and cash on delivery" },
  { icon: RotateCcw, title: "Easy Returns", desc: "Hassle-free 7-day returns" },
];

/** Icon for a category without an image, picked from its name. */
function iconFor(name: string): LucideIcon {
  const n = name.toLowerCase();
  const table: [string, LucideIcon][] = [
    ["car", Car],
    ["wireless", Zap],
    ["cable", Cable],
    ["power bank", BatteryCharging],
    ["charger", PlugZap],
    ["earbud", Headphones],
    ["headphone", Headphones],
    ["watch", Watch],
    ["holder", Smartphone],
    ["stand", Smartphone],
    ["privacy", EyeOff],
    ["lens", Camera],
    ["camera", Camera],
    ["glass", Layers],
    ["hydrogel", Layers],
    ["protector", Layers],
  ];
  return table.find(([k]) => n.includes(k))?.[1] ?? Shield;
}

function Section({ title, subtitle, href, children, className = "" }: { title: string; subtitle?: string; href?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 py-8 md:py-14 ${className}`}>
      <div className="flex items-end justify-between gap-4 mb-5 md:mb-8">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-gray-900">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
        </div>
        {href && (
          <Link href={href} className="shrink-0 inline-flex items-center gap-1 text-sm font-bold text-orange-600 hover:text-orange-700">
            View all <ChevronRight size={16} />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

function Hero() {
  const [slide, setSlide] = useState(0);
  const touchX = useRef<number | null>(null);
  const go = (d: number) => setSlide((s) => (s + d + HERO.length) % HERO.length);

  // Restarts on every change, so a manual swipe gets a full 6s before auto-advance.
  useEffect(() => {
    const t = setTimeout(() => setSlide((s) => (s + 1) % HERO.length), 6000);
    return () => clearTimeout(t);
  }, [slide]);

  return (
    <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 pt-4 md:pt-6">
      <h1 className="sr-only">Zuprano: buy mobile phones, accessories and protection online</h1>
      <div
        className="relative overflow-hidden rounded-2xl md:rounded-3xl"
        onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
          touchX.current = null;
        }}
      >
        <div className="flex transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]" style={{ transform: `translateX(-${slide * 100}%)` }}>
          {HERO.map((s, i) => (
            <Link
              key={s.href}
              href={s.href}
              aria-hidden={i !== slide}
              tabIndex={i === slide ? 0 : -1}
              className={`w-full shrink-0 grid grid-cols-1 md:grid-cols-2 ${s.bg} ${s.dark ? "text-white" : "text-gray-900"}`}
            >
              <div className="relative aspect-[16/10] md:aspect-auto md:min-h-[420px] lg:min-h-[480px] md:order-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.image} alt="" loading={i === 0 ? "eager" : "lazy"} className="absolute inset-0 w-full h-full object-cover" />
              </div>
              <div className="flex flex-col justify-center gap-3 md:gap-5 p-5 pb-10 sm:p-8 sm:pb-12 md:p-12 lg:p-16">
                <span className="text-orange-500 text-[11px] md:text-xs font-black uppercase tracking-[0.25em]">{s.eyebrow}</span>
                <h2 className="text-[26px] leading-[1.05] sm:text-4xl lg:text-5xl xl:text-6xl font-black tracking-tight">
                  {s.title[0]}
                  <br />
                  <span className={s.dark ? "text-white/60" : "text-gray-500"}>{s.title[1]}</span>
                </h2>
                <p className={`text-sm md:text-base max-w-md ${s.dark ? "text-white/70" : "text-gray-600"}`}>{s.body}</p>
                <span
                  className={`mt-1 inline-flex w-fit items-center gap-2 rounded-full px-5 md:px-7 py-2.5 md:py-3.5 text-sm font-bold ${
                    s.dark ? "bg-white text-black" : "bg-black text-white"
                  }`}
                >
                  {s.cta} <ChevronRight size={16} />
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="absolute bottom-3 md:bottom-6 left-5 sm:left-8 md:left-12 lg:left-16 flex gap-1.5">
          {HERO.map((s, i) => (
            <button
              key={s.href}
              onClick={() => setSlide(i)}
              aria-label={`Show slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${i === slide ? "w-6 bg-orange-500" : "w-1.5 bg-gray-400/60"}`}
            />
          ))}
        </div>
        <div className="hidden md:flex absolute bottom-6 right-6 gap-2">
          <button onClick={() => go(-1)} aria-label="Previous slide" className="p-3 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur text-white">
            <ChevronLeft size={18} />
          </button>
          <button onClick={() => go(1)} aria-label="Next slide" className="p-3 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur text-white">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </section>
  );
}

function CategoryTile({ c }: { c: Category }) {
  const Icon = iconFor(c.name);
  return (
    <Link href={categoryHref(c.name)} className="group snap-start flex flex-col items-center gap-2 text-center">
      <div className="w-full aspect-square rounded-2xl bg-[#f4f4f6] overflow-hidden flex items-center justify-center group-hover:bg-orange-50 transition-colors">
        {c.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={c.image} alt="" loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <Icon size={32} className="text-gray-700 group-hover:text-orange-600 transition-colors" strokeWidth={1.5} />
        )}
      </div>
      <span className="text-[12px] md:text-[13px] font-semibold text-gray-800 leading-tight line-clamp-2">{c.name}</span>
    </Link>
  );
}

function ProductRow({ products, loading }: { products: ReturnType<typeof filterProducts>; loading: boolean }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <ProductSkeleton key={i} />
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-6 md:gap-x-6 md:gap-y-10">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}

export default function HomePage() {
  const { products, categories, loaded, fetchProducts } = useCatalog();

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const tree = buildTree(categories);
  const find = (slug: string) => tree.find((g) => canonicalCategory(g.name) === slug);
  const phones = find(PHONES_SLUG);
  const accessories = find("phone-accessories");
  const protection = find("mobile-protection");
  const brands = phones?.children.length ? phones.children.map((c) => c.name) : FALLBACK_BRANDS;
  const inGroup = (g: CategoryGroup | undefined, n: number) =>
    g ? filterProducts(products, { category: [g.name] }, "newest", categories).slice(0, n) : [];
  const latestPhones = inGroup(phones, 8);
  const accessoryPicks = inGroup(accessories, 4);
  const protectionPicks = inGroup(protection, 4);
  const loading = !loaded;

  return (
    <div className="bg-white text-gray-900 antialiased w-full">
      <Hero />

      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 pt-8 md:pt-14">
        <div className="flex items-end justify-between mb-4 md:mb-6">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight">Shop by Brand</h2>
          <Link href={categoryHref("Mobile Phones")} className="inline-flex items-center gap-1 text-sm font-bold text-orange-600">
            All phones <ChevronRight size={16} />
          </Link>
        </div>
        <div className="-mx-4 px-4 sm:mx-0 sm:px-0 flex sm:grid sm:grid-cols-6 lg:grid-cols-11 gap-2.5 md:gap-3 overflow-x-auto no-scrollbar snap-x">
          {brands.map((b) => (
            <Link
              key={b}
              href={categoryHref(b)}
              className="snap-start shrink-0 w-[92px] sm:w-auto flex flex-col items-center justify-center gap-2 rounded-2xl border border-gray-100 bg-[#fafafa] px-2 py-4 hover:border-orange-200 hover:bg-orange-50 transition-colors"
            >
              <span className="w-11 h-11 rounded-full bg-white shadow-sm flex items-center justify-center text-lg font-black text-gray-900">{b.charAt(0)}</span>
              <span className="text-[12px] font-bold text-gray-800 text-center leading-tight">{b}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 pt-8 md:pt-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 md:gap-4">
          {TRUST.map((t) => (
            <div key={t.title} className="flex items-center gap-3 rounded-2xl bg-[#f6f6f8] p-3 md:p-5">
              <span className="shrink-0 w-9 h-9 md:w-11 md:h-11 rounded-full bg-white flex items-center justify-center text-orange-600 shadow-sm">
                <t.icon size={18} />
              </span>
              <div className="min-w-0">
                <p className="text-[13px] md:text-sm font-bold text-gray-900 leading-tight">{t.title}</p>
                <p className="text-[11px] md:text-xs text-gray-500 leading-snug">{t.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {(loading || latestPhones.length > 0) && (
        <Section title="Latest Smartphones" subtitle="New launches and bestsellers, ready to ship." href={categoryHref("Mobile Phones")}>
          <ProductRow products={latestPhones} loading={loading} />
        </Section>
      )}

      <section className="bg-[#f6f6f8] mt-4 md:mt-8">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 py-8 md:py-14">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight mb-1">Phones by Budget</h2>
          <p className="text-sm text-gray-500 mb-5 md:mb-8">Find the best phone for what you want to spend.</p>
          <div className="-mx-4 px-4 sm:mx-0 sm:px-0 flex sm:grid sm:grid-cols-5 gap-2.5 md:gap-4 overflow-x-auto no-scrollbar snap-x">
            {PHONE_PRICE_BANDS.map((b, i) => (
              <Link
                key={b.label}
                href={`${categoryHref("Mobile Phones")}&price=${priceParam(b.range)}`}
                className="snap-start shrink-0 w-[150px] sm:w-auto rounded-2xl bg-white p-4 md:p-6 border border-transparent hover:border-orange-300 transition-colors"
              >
                <span className="text-[11px] font-black uppercase tracking-[0.15em] text-orange-600">{["Budget", "Value", "Mid-range", "Premium", "Flagship"][i]}</span>
                <p className="mt-2 text-[15px] md:text-lg font-black leading-tight text-gray-900">{b.label}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {(phones || accessories || protection) && (
        <Section title="Explore the Store" subtitle="Phones first. Everything else for them too.">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6">
            {[phones, accessories, protection].filter(Boolean).map((g) => (
              <Link key={g!.id} href={categoryHref(g!.name)} className="group relative block overflow-hidden rounded-2xl md:rounded-3xl bg-gray-900 aspect-[16/9] md:aspect-[4/5]">
                {g!.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={g!.image} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5 md:p-7 text-white">
                  <h3 className="text-xl md:text-2xl font-black tracking-tight">{g!.name}</h3>
                  <p className="text-xs md:text-sm text-white/70 mt-1 line-clamp-2">{g!.description}</p>
                  <div className="hidden md:flex flex-wrap gap-1.5 mt-4">
                    {g!.children.slice(0, 4).map((c) => (
                      <span key={c.id} className="text-[11px] font-semibold bg-white/15 backdrop-blur px-2.5 py-1 rounded-full">
                        {c.name}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Section>
      )}

      {accessories && (
        <Section title="Phone Accessories" subtitle="Charge faster, sound better, carry less." href={categoryHref(accessories.name)}>
          <Link href={categoryHref(accessories.name)} className="relative block overflow-hidden rounded-2xl md:rounded-3xl bg-[#0b0b0b] mb-6 md:mb-10">
            {/* The banner has its headline baked in: show it whole from md up, and crop to the products with our own text on phones. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://ik.imagekit.io/v7ookvbkn/Zuprano/coalbnner.png"
              alt="Everyday essentials. Engineered to last."
              loading="lazy"
              className="w-full aspect-[4/3] sm:aspect-[16/9] md:aspect-[5/2] object-cover object-[78%_center] md:object-center"
            />
            <div className="md:hidden absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            <div className="md:hidden absolute inset-x-0 bottom-0 p-5 text-white">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-orange-500">Built to keep up</p>
              <p className="text-2xl font-black leading-tight mt-1">
                Everyday essentials.
                <br />
                Engineered to last.
              </p>
            </div>
          </Link>
          <div className="-mx-4 px-4 sm:mx-0 sm:px-0 grid grid-flow-col auto-cols-[26%] sm:auto-cols-auto sm:grid-flow-row sm:grid-cols-4 lg:grid-cols-8 gap-3 md:gap-5 overflow-x-auto no-scrollbar snap-x">
            {accessories.children.map((c) => (
              <CategoryTile key={c.id} c={c} />
            ))}
          </div>
          {accessoryPicks.length > 0 && (
            <div className="mt-8 md:mt-12">
              <ProductRow products={accessoryPicks} loading={false} />
            </div>
          )}
        </Section>
      )}

      {protection && (
        <section className="bg-[#0d0d10] text-white">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 py-10 md:py-16">
            <div className="flex items-end justify-between gap-4 mb-6 md:mb-8">
              <div>
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-orange-500">Mobile Protection</span>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight mt-1">Protect what you paid for.</h2>
              </div>
              <Link href={categoryHref(protection.name)} className="shrink-0 inline-flex items-center gap-1 text-sm font-bold text-orange-500">
                View all <ChevronRight size={16} />
              </Link>
            </div>
            <div className="flex flex-wrap gap-2 md:gap-3">
              {protection.children.map((c) => (
                <Link
                  key={c.id}
                  href={categoryHref(c.name)}
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2.5 text-[13px] font-semibold hover:bg-white hover:text-black transition-colors"
                >
                  {(() => {
                    const Icon = iconFor(c.name);
                    return <Icon size={15} className="text-orange-500" />;
                  })()}
                  {c.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {protectionPicks.length > 0 && (
        <Section title="Cases & Screen Guards" subtitle="Precision-fit protection for every model." href={protection && categoryHref(protection.name)}>
          <ProductRow products={protectionPicks} loading={false} />
        </Section>
      )}

      {loaded && products.length > 0 && latestPhones.length === 0 && (
        <Section title="New Arrivals" subtitle="Just added to the store." href="/shop?sort=newest">
          <ProductRow products={filterProducts(products, {}, "newest").slice(0, 8)} loading={false} />
        </Section>
      )}
    </div>
  );
}
