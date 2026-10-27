"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Heart, House, LogOut, Menu, Search, ShieldCheck, ShoppingBag, User, X } from "lucide-react";
import { useAuth } from "@/stores/auth";
import { useCart } from "@/stores/cart";
import { useUI } from "@/stores/ui";

interface NavItem {
  label: string;
  link: string;
  subItems?: { name: string; link: string; items: string[] }[];
  featured?: { title: string; description: string; image: string; link: string };
}

const NAV: NavItem[] = [
  { label: "New Arrivals", link: "/shop?sort=newest" },
  {
    label: "Cases",
    link: "/shop?category=cases",
    subItems: [
      {
        name: "iPhone Cases",
        link: "/shop?category=cases&device=iPhone",
        items: ["iPhone 15 Pro Max", "iPhone 15 Pro", "iPhone 15", "iPhone 14 Pro", "iPhone 13 Series"],
      },
      {
        name: "Samsung Cases",
        link: "/shop?category=cases&device=Samsung",
        items: ["Galaxy S24 Ultra", "Galaxy S24+", "Galaxy S23 Ultra", "Galaxy Z Fold 5", "Galaxy Z Flip 5"],
      },
      {
        name: "Google & More",
        link: "/shop?category=cases",
        items: ["Pixel 8 Pro", "Pixel 8", "OnePlus 12", "OnePlus 11", "View All Devices"],
      },
    ],
    featured: {
      title: "Carbon Fusion",
      description: "Aerospace-grade aramid fiber protection.",
      image: "https://images.unsplash.com/photo-1603313011101-31c72ee781d3?auto=format&fit=crop&q=80&w=600",
      link: "/shop?query=Carbon+Fusion",
    },
  },
  {
    label: "Bags",
    link: "/shop?category=laptop-bags",
    subItems: [
      { name: "Laptop Gear", link: "/shop?category=laptop-bags", items: ["MacBook Sleeves", "Laptop Backpacks", "Messenger Bags", "Briefcases"] },
      { name: "Daily Carry", link: "/shop?category=laptop-bags", items: ["Tote Bags", "Crossbody Bags", "Wallets", "Card Holders"] },
      { name: "Travel", link: "/shop?category=laptop-bags", items: ["Duffle Bags", "Tech Organizers", "Passport Holders", "Luggage Tags"] },
    ],
    featured: {
      title: "Urban Packs",
      description: "Water-resistant Cordura for the daily commute.",
      image: "https://images.unsplash.com/photo-1553062407-98eeb94c6a62?auto=format&fit=crop&q=80&w=600",
      link: "/shop?category=laptop-bags",
    },
  },
  {
    label: "Power",
    link: "/shop?category=chargers",
    subItems: [
      { name: "Wireless", link: "/shop?category=chargers", items: ["MagSafe Chargers", "Orbit Wireless", "3-in-1 Stations", "Car Mounts"] },
      { name: "Wired", link: "/shop?category=cables", items: ["USB-C Cables", "Lightning Cables", "Fast Adapters", "Power Banks"] },
      { name: "Mac & iPad", link: "/shop?category=chargers", items: ["USB-C Hubs", "Docking Stations", "MagSafe Adapters"] },
    ],
    featured: {
      title: "Orbit MagSafe",
      description: "N52 Neodymium magnets for 2x stronger hold.",
      image: "https://images.unsplash.com/photo-1616348436168-de43ad0db179?auto=format&fit=crop&q=80&w=600",
      link: "/shop?category=chargers",
    },
  },
  { label: "Collections", link: "/shop" },
];

function MegaMenu({ item, onClose }: { item: NavItem; onClose: () => void }) {
  if (!item.subItems) return null;
  return (
    <div
      className="absolute top-full left-0 w-screen bg-white border-b border-[#eee] shadow-lg animate-in z-[90] overflow-hidden"
      onMouseLeave={onClose}
    >
      <div className="max-w-[1400px] mx-auto px-6 py-12 md:py-20 grid grid-cols-12 gap-12">
        <div className="col-span-8 grid grid-cols-3 gap-12">
          {item.subItems.map((sub) => (
            <div key={sub.name} className="space-y-6">
              <Link
                href={sub.link}
                onClick={onClose}
                className="text-[11px] font-black uppercase tracking-[0.2em] text-[#1d1d1f] hover:text-orange-600 transition-colors"
              >
                {sub.name}
              </Link>
              <ul className="space-y-4">
                {sub.items.map((it) => (
                  <li key={it}>
                    <Link
                      href={it === "View All Devices" ? "/shop" : `/shop?query=${encodeURIComponent(it)}`}
                      onClick={onClose}
                      className="text-[13px] font-medium text-[#86868b] hover:text-[#1d1d1f] transition-colors"
                    >
                      {it}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        {item.featured && (
          <div className="col-span-4 pl-12 border-l border-[#eee]">
            <Link href={item.featured.link} onClick={onClose} className="group block space-y-6">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-sm relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.featured.image}
                  alt={item.featured.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90"
                />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/5 transition-colors" />
              </div>
              <div className="space-y-2">
                <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-orange-600">{item.featured.title}</h4>
                <p className="text-[13px] font-medium text-[#86868b] leading-relaxed line-clamp-2 italic">&quot;{item.featured.description}&quot;</p>
                <div className="inline-flex items-center gap-2 pt-2 text-[10px] font-black uppercase tracking-widest text-[#1d1d1f] group-hover:text-orange-600 transition-colors">
                  Shop Collection <span className="text-lg">→</span>
                </div>
              </div>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export function Navbar() {
  const { openAuthModal, toggleCartDrawer } = useUI();
  const { isAuthenticated, user, logout } = useAuth();
  const items = useCart((s) => s.items);
  const router = useRouter();
  const pathname = usePathname();
  const count = items.length;

  const [scrolled, setScrolled] = useState(false);
  const [search, setSearch] = useState("");
  const [active, setActive] = useState<NavItem | null>(null);
  const [userMenu, setUserMenu] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  const openMenu = (item: NavItem) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setActive(item);
  };
  const scheduleClose = () => {
    closeTimer.current = setTimeout(() => setActive(null), 150);
  };

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/shop?query=${encodeURIComponent(search)}`);
      setSearch("");
    }
  };

  const onLogout = async () => {
    await logout();
    setUserMenu(false);
    setMobileOpen(false);
    router.push("/");
  };

  return (
    <>
      <div className="bg-[#0a0a0a] text-white py-1.5 sm:py-2 md:py-2.5 px-4 sm:px-6 md:px-8 flex justify-center items-center gap-3 sm:gap-6 overflow-hidden z-[101] relative border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
          <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] opacity-90">Spring Drop &apos;26 Live</span>
        </div>
        <span className="hidden md:block text-white/20 text-[9px] sm:text-[10px]">|</span>
        <span className="hidden md:block text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-white/70 text-center">
          Express Shipping on Orders Over ₹999
        </span>
      </div>

      <nav
        className={`sticky top-0 w-full z-[100] transition-all duration-500 ${
          scrolled
            ? "bg-white/90 backdrop-blur-xl border-b border-gray-200/50 py-0 shadow-[0_10px_40px_rgba(0,0,0,0.04)]"
            : "bg-white border-b border-transparent py-2"
        }`}
        onMouseLeave={scheduleClose}
      >
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 md:px-8 lg:px-10 h-14 sm:h-16 md:h-20 flex justify-between items-center relative">
          <div className="flex items-center gap-14 h-full">
            <Link href="/" className="group flex items-center gap-0.5 sm:gap-1 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://ik.imagekit.io/v7ookvbkn/Zuprano/logotext.png" alt="Zuprano" className="h-20 sm:h-16 md:h-20 w-auto object-contain" />
            </Link>
            <div className="hidden lg:flex items-center gap-6 md:gap-8 lg:gap-10 h-full">
              {NAV.map((item) => (
                <div key={item.label} className="h-full flex items-center group relative cursor-pointer" onMouseEnter={() => openMenu(item)}>
                  <Link
                    href={item.link}
                    className={`text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.25em] transition-all flex items-center gap-1.5 ${
                      pathname === item.link || active?.label === item.label ? "text-orange-600" : "text-gray-500 hover:text-black"
                    }`}
                  >
                    {item.label}
                    {item.subItems && (
                      <ChevronDown
                        size={10}
                        strokeWidth={3}
                        className={`transition-transform duration-500 ${active?.label === item.label ? "rotate-180" : ""}`}
                      />
                    )}
                  </Link>
                  <div
                    className={`absolute bottom-0 left-0 h-0.5 bg-orange-600 transition-all duration-500 ease-out ${
                      active?.label === item.label ? "w-full opacity-100" : "w-0 opacity-0"
                    }`}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-5 h-full">
            <form
              onSubmit={onSearch}
              className="hidden md:flex items-center bg-gray-100/80 rounded-full px-3 lg:px-5 py-2 lg:py-2.5 gap-2 lg:gap-3 text-gray-400 group focus-within:bg-white focus-within:ring-1 ring-gray-200 transition-all w-40 lg:w-48 focus-within:w-56 lg:focus-within:w-72"
            >
              <Search size={12} className="group-focus-within:text-orange-600 transition-colors" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent outline-none text-[9px] lg:text-[10px] w-full text-black placeholder:text-gray-400 font-black uppercase tracking-tight lg:tracking-widest"
              />
            </form>

            <div className="flex items-center gap-2 sm:gap-3">
              <div className="relative h-full flex items-center" onMouseLeave={() => setUserMenu(false)}>
                <button
                  onClick={() => (isAuthenticated ? setUserMenu(!userMenu) : openAuthModal())}
                  onMouseEnter={() => isAuthenticated && setUserMenu(true)}
                  aria-label="Account"
                  className={`p-2 sm:p-2.5 rounded-full transition-all border ${
                    isAuthenticated ? "border-orange-600/20 bg-orange-50/50" : "border-transparent hover:bg-gray-100"
                  }`}
                >
                  <User size={16} className={`${isAuthenticated ? "text-orange-600" : "text-black"} sm:w-3 sm:h-3`} />
                  {isAuthenticated && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-600 border-2 border-white rounded-full shadow-sm" />
                  )}
                </button>
                {isAuthenticated && userMenu && (
                  <div className="absolute top-[calc(100%-5px)] right-0 w-72 bg-white rounded-3xl shadow-[0_30px_60px_rgba(0,0,0,0.12)] border border-gray-100 p-5 animate-in z-[120]">
                    <div className="mb-4 pb-4 border-b border-gray-100">
                      <div className="flex items-center gap-2 mb-2">
                        <ShieldCheck size={12} className="text-orange-600" />
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em]">Logged In</span>
                      </div>
                      <h4 className="text-sm font-black text-black uppercase tracking-tight truncate">{user?.name}</h4>
                    </div>
                    <div className="space-y-1">
                      <Link
                        href="/account?tab=Orders"
                        onClick={() => setUserMenu(false)}
                        className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 rounded-2xl transition-all group"
                      >
                        <span className="text-[10px] font-black uppercase tracking-widest text-black">My Orders</span>
                        <ChevronDown size={12} className="-rotate-90 text-gray-300 group-hover:text-black transition-colors" />
                      </Link>
                      <Link
                        href="/wishlist"
                        onClick={() => setUserMenu(false)}
                        className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 rounded-2xl transition-all group"
                      >
                        <span className="text-[10px] font-black uppercase tracking-widest text-black">Wishlist</span>
                        <ChevronDown size={12} className="-rotate-90 text-gray-300 group-hover:text-black transition-colors" />
                      </Link>
                      <button
                        onClick={onLogout}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-red-50 rounded-2xl transition-all group"
                      >
                        <span className="text-[10px] font-black uppercase tracking-widest text-red-600">Logout</span>
                        <LogOut size={12} className="text-red-300 group-hover:text-red-600" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <button onClick={toggleCartDrawer} aria-label="Cart" className="p-2.5 hover:bg-gray-100 rounded-full transition-all relative border border-transparent group">
                <ShoppingBag size={18} className="text-black transition-transform group-active:scale-90" />
                {count > 0 && (
                  <span className="absolute top-0 right-0 w-[22px] h-[22px] p-1 bg-black text-white text-[9px] font-black flex items-center justify-center rounded-full shadow-lg translate-x-1 -translate-y-1 animate-in">
                    {count}
                  </span>
                )}
              </button>
              <button onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menu" className="lg:hidden p-2 text-black active:scale-90 transition-transform">
                {mobileOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
          {active?.subItems && <MegaMenu item={active} onClose={() => setActive(null)} />}
        </div>
      </nav>

      {mobileOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[95] lg:hidden" onClick={() => setMobileOpen(false)} />
          <div className="fixed top-[calc(56px+36px)] left-0 right-0 z-[99] bg-white border-b border-gray-100 lg:hidden animate-in">
            <div className="p-4 space-y-2 max-h-[calc(100vh-140px)] overflow-y-auto">
              <form onSubmit={(e) => { onSearch(e); setMobileOpen(false); }} className="flex items-center bg-gray-100 rounded-full px-4 py-2.5 gap-3 mb-2">
                <Search size={14} className="text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-transparent outline-none text-xs w-full font-bold uppercase tracking-widest"
                />
              </form>
              <MobileLink href="/" onClick={() => setMobileOpen(false)} icon={<House size={16} className="text-orange-600" />} label="Home" />
              <MobileLink href="/shop" onClick={() => setMobileOpen(false)} icon={<ShoppingBag size={16} className="text-orange-600" />} label="Shop" />
              {NAV.map((item) => (
                <MobileLink key={item.label} href={item.link} onClick={() => setMobileOpen(false)} label={item.label} />
              ))}
              <div className="my-2 border-t border-gray-100" />
              <Link
                href="/checkout"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-between px-4 py-3 rounded-lg hover:bg-gray-50 transition-all"
              >
                <div className="flex items-center gap-3">
                  <ShoppingBag size={16} className="text-black" />
                  <span className="text-sm font-black uppercase tracking-widest">Cart</span>
                </div>
                {count > 0 && <span className="bg-black text-white text-xs font-black px-2 py-1 rounded-full">{count}</span>}
              </Link>
              <MobileLink href="/wishlist" onClick={() => setMobileOpen(false)} icon={<Heart size={16} className="text-black" />} label="Wishlist" />
              <div className="my-2 border-t border-gray-100" />
              {isAuthenticated ? (
                <>
                  <Link
                    href="/account"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-all"
                  >
                    <User size={16} className="text-orange-600" />
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Logged In</span>
                      <span className="text-xs font-black uppercase tracking-widest">{user?.name}</span>
                    </div>
                  </Link>
                  <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-50 transition-all text-red-600">
                    <LogOut size={16} />
                    <span className="text-sm font-black uppercase tracking-widest">Logout</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    openAuthModal();
                    setMobileOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-all"
                >
                  <User size={16} className="text-orange-600" />
                  <span className="text-sm font-black uppercase tracking-widest">Sign In</span>
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}

function MobileLink({ href, onClick, icon, label }: { href: string; onClick: () => void; icon?: React.ReactNode; label: string }) {
  return (
    <Link href={href} onClick={onClick} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-all">
      {icon}
      <span className="text-sm font-black uppercase tracking-widest">{label}</span>
    </Link>
  );
}
