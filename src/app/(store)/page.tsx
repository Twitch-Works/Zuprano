"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Award, ChevronLeft, ChevronRight, CircleCheck, Clock, CreditCard, Layers, ShieldCheck, Smartphone, Truck, Zap } from "lucide-react";
import { ProductCard } from "@/components/store/ProductCard";
import { SectionHeader } from "@/components/store/ui";
import { useCatalog } from "@/stores/catalog";

const SLIDES = [
  { title: "CLEAR & STRONG.", image: "https://ik.imagekit.io/v7ookvbkn/Zuprano/coalbnner.png" },
  { title: "POWER UP.", image: "https://ik.imagekit.io/v7ookvbkn/Zuprano/bannerblack.png" },
  { title: "SLIM & SLEEK.", image: "https://ik.imagekit.io/v7ookvbkn/Zuprano/bannerlight.png" },
];

const ESSENTIALS = [
  { name: "Transparent Covers", icon: "https://media.tatacroma.com/Croma%20Assets/Communication/Mobile%20Accessories/Images/239847_15_qvwl9g.png" },
  {
    name: "Back Covers",
    icon: "https://media-ik.croma.com/prod/https://media.tatacroma.com/Croma%20Assets/Communication/Cases%20and%20Covers/Images/239888_0_yfszpc.png",
  },
  { name: "Powerbanks", icon: "https://spigen.in/cdn/shop/files/71jmlm3jb-L._SL1500_1200x1200.jpg?v=1772618437" },
  {
    name: "Laptop Sleeves",
    icon: "https://www.spigen.com/cdn/shop/files/title_web_basic_laptop_pouch_1226fbc1-56e3-4ac5-a68e-dd562b232018.jpg?v=1728588503",
  },
  { name: "Screen Protectors", icon: "https://incredideals.co/cdn/shop/files/S500946272_1_eac5eeb3-b5bd-40df-b46e-172085c91871.webp?v=1766600404" },
  { name: "Phone Stands", icon: "https://m.media-amazon.com/images/I/51PZOJa6yFL.jpg" },
];

const DEVICES = ["iPhone 16", "iPhone 15", "iPhone 14", "iPhone 13", "iPhone 12"];

const FEATURE_ROWS = [
  {
    tag: "Crystal Clear",
    title: ["See Your", "iPhone Shine."],
    body: "Clear covers that show off your phone's beautiful design. Super strong protection without losing the look.",
    href: "/shop?collection=transparent-covers",
    image: "https://m.media-amazon.com/images/S/aplus-media-library-service-media/b101b060-1209-4c7c-8633-22246d97cba8.__CR0,0,970,600_PT0_SX970_V1___.png",
    alt: "Transparent Covers Collection",
    bg: "bg-[#f5f5f7]",
    imageFirst: false,
  },
  {
    tag: "Stay Charged",
    title: ["Never Run", "Out of Power."],
    body: "Fast charging powerbanks for your iPhone. Stay connected all day long.",
    href: "/shop?collection=powerbanks",
    image: "https://www.flashify.in/cdn/shop/products/61F0LLZcz4L.jpg?v=1710335546&width=1200",
    alt: "Powerbanks",
    bg: "bg-white",
    imageFirst: true,
  },
  {
    tag: "Wellness Tech",
    title: ["Relax &", "Recharge."],
    body: "Portable massage devices designed for iPhone users. Relieve stress anywhere, anytime.",
    href: "/shop?collection=massage-devices",
    image: "https://m.media-amazon.com/images/I/61+yiRIi7ZL.jpg",
    alt: "Massage Devices",
    bg: "bg-[#f9f9f9]",
    imageFirst: false,
  },
];

export default function HomePage() {
  const { products, fetchProducts } = useCatalog();
  const [slide, setSlide] = useState(0);
  const newArrivals = products.slice(0, 4);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    const t = setInterval(() => setSlide((s) => (s === SLIDES.length - 1 ? 0 : s + 1)), 6000);
    return () => clearInterval(t);
  }, []);

  const next = () => setSlide((s) => (s === SLIDES.length - 1 ? 0 : s + 1));
  const prev = () => setSlide((s) => (s === 0 ? SLIDES.length - 1 : s - 1));

  return (
    <div className="bg-white text-[#1d1d1f] antialiased selection:bg-[#000] selection:text-white font-sans w-full overflow-x-hidden">
      <section className="relative w-full h-[50vh] sm:h-[60vh] md:h-[70vh] min-h-[400px] sm:min-h-[500px] md:min-h-[600px] bg-[#eee] overflow-hidden">
        {SLIDES.map((s, i) => (
          <div
            key={s.title}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${i === slide ? "opacity-100 z-10" : "opacity-0 z-0"}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.image} className="absolute inset-0 w-full h-full object-cover transform scale-105" alt={s.title} />
          </div>
        ))}
        <div className="absolute bottom-10 right-10 z-20 flex gap-2">
          <button onClick={prev} aria-label="Previous slide" className="p-4 bg-white/10 backdrop-blur-md hover:bg-white/20 transition-all text-white rounded-full">
            <ChevronLeft size={20} />
          </button>
          <button onClick={next} aria-label="Next slide" className="p-4 bg-white/10 backdrop-blur-md hover:bg-white/20 transition-all text-white rounded-full">
            <ChevronRight size={20} />
          </button>
        </div>
      </section>

      <div className="bg-black py-6 overflow-hidden whitespace-nowrap border-b border-white/10">
        <div className="flex animate-marquee items-center gap-12">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-8 text-[10px] font-black uppercase tracking-[0.4em] text-white/40">
              <span className="flex items-center gap-2 text-orange-500">
                <Zap size={14} /> Drop Protection
              </span>
              <span className="flex items-center gap-2">
                <Layers size={14} /> Premium Material
              </span>
              <span className="flex items-center gap-2">
                <Award size={14} /> 1-Year Guarantee
              </span>
            </div>
          ))}
        </div>
      </div>

      <section className="py-4 sm:py-6 md:py-8 border-b border-[#eee] bg-white sticky top-[64px] z-30 shadow-sm overflow-hidden whitespace-nowrap overflow-x-auto no-scrollbar">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 flex items-center justify-between lg:justify-center gap-3 sm:gap-6 md:gap-12">
          {DEVICES.map((d) => (
            <Link key={d} href={`/shop?device=${encodeURIComponent(d)}`} className="flex items-center gap-2 sm:gap-3 shrink-0 group">
              <div className="p-1.5 sm:p-2.5 rounded-full bg-[#f5f5f7] group-hover:bg-black group-hover:text-white transition-all transform group-hover:scale-110">
                <span className="text-xs sm:text-base">
                  <Smartphone size={18} />
                </span>
              </div>
              <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em]">{d}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="py-0">
        {FEATURE_ROWS.map((row) => (
          <div key={row.tag} className={`w-full grid grid-cols-1 lg:grid-cols-2 min-h-[350px] sm:min-h-[400px] md:min-h-[500px] ${row.bg}`}>
            <div className={`flex flex-col justify-center p-6 sm:p-10 md:p-16 lg:p-20 space-y-6 sm:space-y-8 ${row.imageFirst ? "order-1 lg:order-2" : ""}`}>
              <span className="text-orange-600 text-[9px] sm:text-[10px] md:text-[11px] font-black uppercase tracking-[0.3em] sm:tracking-[0.4em]">{row.tag}</span>
              <h2 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-black tracking-tighter uppercase leading-[0.95]">
                {row.title[0]} <br /> {row.title[1]}
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-[#86868b] font-medium leading-relaxed max-w-md">{row.body}</p>
              <Link
                href={row.href}
                className="inline-block bg-black text-white px-6 sm:px-10 py-3 sm:py-4 font-black text-[9px] sm:text-[11px] uppercase tracking-widest hover:bg-orange-600 transition-all w-fit"
              >
                Shop Now
              </Link>
            </div>
            <div className={`relative overflow-hidden ${row.imageFirst ? "order-2 lg:order-1" : ""}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={row.image} className="w-full h-full object-cover" alt={row.alt} />
            </div>
          </div>
        ))}
      </section>

      <section className="py-12 sm:py-16 md:py-20 border-t border-[#eee] overflow-hidden bg-[#f9f9f9]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 mb-8 sm:mb-12 md:mb-16">
          <SectionHeader title="iPhone Essentials." subtitle="Everything for your iPhone in one place." linkText="View All" />
        </div>
        <div className="px-4 sm:px-6 overflow-x-auto no-scrollbar scroll-smooth">
          <div className="flex gap-4 sm:gap-6 md:gap-8 w-max mx-auto pb-4">
            {ESSENTIALS.map((e) => (
              <Link
                key={e.name}
                href={`/shop?category=${encodeURIComponent(e.name)}`}
                className="group relative aspect-[3/4] overflow-hidden rounded-xl sm:rounded-2xl md:rounded-3xl bg-white flex-shrink-0 w-40 sm:w-48 md:w-64 lg:w-72 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={e.icon} className="absolute inset-0 w-full h-full object-cover group-hover:scale-125 transition-all duration-700" alt={e.name} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent group-hover:from-black/40 transition-all duration-500" />
                <div className="absolute bottom-3 sm:bottom-6 left-3 sm:left-6 text-white">
                  <span className="text-[10px] sm:text-[12px] font-black uppercase tracking-widest group-hover:text-orange-300 transition-colors">{e.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16 md:py-24 bg-white overflow-hidden border-t border-[#eee]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 md:gap-16 items-center">
            <div className="relative">
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-orange-100 rounded-full blur-3xl opacity-60" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://dealcliq.com/cdn/shop/files/61lOyf66e1L._SL1200.jpg?v=1766316692&width=1946"
                className="relative z-10 rounded-2xl sm:rounded-3xl grayscale hover:grayscale-0 transition-all duration-1000 shadow-2xl"
                alt="Tech exploded view"
              />
            </div>
            <div className="space-y-6 sm:space-y-8 md:space-y-10">
              <div className="space-y-3 sm:space-y-4">
                <span className="text-orange-600 text-[9px] sm:text-[10px] md:text-[11px] font-black uppercase tracking-[0.3em] sm:tracking-[0.4em]">Smart Technology</span>
                <h2 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-black tracking-tighter uppercase leading-[1.05]">
                  Built to last. <br /> Built strong.
                </h2>
                <p className="text-sm sm:text-base md:text-lg text-[#86868b] leading-relaxed font-medium max-w-lg">
                  We don&apos;t just make cases. We build protection systems. Our special technology absorbs 95% of impact energy. Your phone stays safe
                  from all kinds of drops and bumps.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                {[
                  { t: "Maximum Protection", d: "Drop tested and proven. Protects your iPhone from all angles." },
                  { t: "Premium Quality", d: "Looks good for years. No wear, no fading, no damage." },
                ].map((f) => (
                  <div key={f.t} className="space-y-2 sm:space-y-3">
                    <CircleCheck className="text-orange-600" size={16} />
                    <h4 className="font-black text-[9px] sm:text-xs uppercase tracking-widest">{f.t}</h4>
                    <p className="text-[10px] sm:text-[11px] text-[#86868b] font-bold leading-normal">{f.d}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative w-full h-[300px] sm:h-[400px] md:h-[600px] bg-black">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://www.flashify.in/cdn/shop/products/61F0LLZcz4L.jpg?v=1710335546&width=1200"
          className="w-full h-full object-cover opacity-60 grayscale"
          alt="iPhone accessories"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white px-4 sm:px-6">
          <span className="text-orange-500 text-[9px] sm:text-[10px] md:text-[11px] font-black uppercase tracking-[0.3em] sm:tracking-[0.4em] mb-3 sm:mb-6">
            Limited Time
          </span>
          <h2 className="text-3xl sm:text-5xl md:text-6xl lg:text-[7rem] font-black tracking-tighter uppercase mb-6 sm:mb-8 md:mb-10 leading-none">Big Savings.</h2>
          <Link
            href="/shop"
            className="px-8 sm:px-12 py-3 sm:py-5 bg-white text-black font-black text-[9px] sm:text-[11px] uppercase tracking-[0.2em] sm:tracking-[0.3em] hover:bg-orange-600 hover:text-white transition-all shadow-xl"
          >
            Shop Sale
          </Link>
        </div>
      </section>

      {newArrivals.length > 0 && (
        <section className="py-12 sm:py-16 md:py-20 max-w-[1400px] mx-auto px-4 sm:px-6">
          <SectionHeader title="New Arrivals" subtitle="Latest iPhone accessories just added." linkText="Shop All Products" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-2 sm:gap-x-4 md:gap-x-6 lg:gap-x-8 gap-y-6 sm:gap-y-8 md:gap-y-10 lg:gap-y-12">
            {newArrivals.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      <section className="py-12 sm:py-16 md:py-20 bg-[#f5f5f7] border-t border-[#eee]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 md:gap-12">
          {[
            { icon: <Truck size={28} />, title: "Free Shipping", desc: "All over India" },
            { icon: <ShieldCheck size={28} />, title: "Quality Checked", desc: "Drop tested" },
            { icon: <CreditCard size={28} />, title: "Safe Payment", desc: "100% secure" },
            { icon: <Clock size={28} />, title: "Easy Return", desc: "7 days free" },
          ].map((f) => (
            <div key={f.title} className="flex flex-col items-center text-center space-y-3 sm:space-y-4 group">
              <div className="w-16 sm:w-20 h-16 sm:h-20 rounded-full bg-white flex items-center justify-center text-orange-600 group-hover:bg-orange-50 group-hover:scale-110 group-hover:-translate-y-2 transition-all duration-300 shadow-md">
                {f.icon}
              </div>
              <div>
                <h5 className="font-black text-[9px] sm:text-[11px] uppercase tracking-[0.2em] mb-1">{f.title}</h5>
                <p className="text-[8px] sm:text-[10px] text-[#86868b] font-bold uppercase tracking-widest">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-12 sm:py-16 md:py-24 bg-white">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          <div className="mb-6 sm:mb-8">
            <div className="mb-4">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tighter uppercase">Explore Collections</h2>
            </div>
          </div>
          <div className="bg-[#f9f9f9] rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 h-auto md:h-[600px]">
              <div className="md:col-span-8 relative rounded-2xl sm:rounded-3xl overflow-hidden group h-[300px] sm:h-[400px] md:h-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://photos5.appleinsider.com/gallery/50093-98764-spigen-magfit-acc-collection-xl.jpg"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                  alt=""
                />
                <div className="absolute inset-0 bg-black/40 p-6 sm:p-10 md:p-12 flex flex-col justify-end text-white">
                  <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-black uppercase tracking-tighter leading-none mb-4 sm:mb-6">
                    Power <br /> Plus
                  </h3>
                  <p className="max-w-md text-sm sm:text-base text-white/80 font-medium mb-6 sm:mb-8">
                    Fast charging powerbanks for all-day battery. Stay connected wherever you go.
                  </p>
                  <Link
                    href="/shop?collection=powerbanks"
                    className="bg-white text-black px-6 sm:px-8 py-3 sm:py-4 w-fit text-[9px] sm:text-[11px] font-black uppercase tracking-widest hover:bg-orange-600 hover:text-white transition-all"
                  >
                    Shop Now
                  </Link>
                </div>
              </div>
              <div className="md:col-span-4 grid grid-rows-2 gap-4 sm:gap-6">
                <div
                  className="bg-black rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 flex flex-col justify-between text-white relative overflow-hidden group bg-cover bg-center"
                  style={{ backgroundImage: "url(https://spigen.in/cdn/shop/files/4800_1500_1.webp?v=1741086479)" }}
                >
                  <div className="absolute inset-0 bg-black/60" />
                  <Zap className="text-orange-500 absolute -right-4 -top-4 w-32 h-32 opacity-10 group-hover:rotate-12 transition-transform" />
                  <h4 className="text-lg sm:text-xl md:text-2xl font-black uppercase tracking-tight relative z-10">
                    Crystal <br /> Clear.
                  </h4>
                  <p className="text-[10px] sm:text-xs text-white/60 relative z-10 leading-relaxed font-medium">See your iPhone beauty. Premium clear cases that last.</p>
                  <Link
                    href="/shop?category=cases"
                    className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest border-b border-white w-fit pt-3 sm:pt-4 relative z-10"
                  >
                    Shop Cases
                  </Link>
                </div>
                <div className="bg-orange-600 rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 flex flex-col justify-between text-white group overflow-hidden">
                  <h4 className="text-lg sm:text-xl md:text-2xl font-black uppercase tracking-tight">
                    Fast <br /> Delivery.
                  </h4>
                  <p className="text-[10px] sm:text-xs text-white/80 font-medium">All across India. Most orders reach within 2 days.</p>
                  <Truck size={32} className="self-end opacity-20 group-hover:translate-x-4 transition-transform" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
