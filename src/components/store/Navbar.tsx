"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronRight, Heart, LogOut, Menu, Package, Search, ShieldCheck, ShoppingBag, Smartphone, User, X } from "lucide-react";
import { PHONE_PRICE_BANDS, PHONES_SLUG, buildTree, canonicalCategory, categoryHref, priceParam, type CategoryGroup } from "@/lib/catalog";
import { useAuth } from "@/stores/auth";
import { useCart } from "@/stores/cart";
import { useCatalog } from "@/stores/catalog";
import { useUI } from "@/stores/ui";

/** The logo file has wide margins; a 7:1 box crops it to the wordmark. */
export function Logo({ className = "h-7 md:h-8" }: { className?: string }) {
  return (
    <span className={`block aspect-[7/1] overflow-hidden ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="https://ik.imagekit.io/v7ookvbkn/Zuprano/logotext.png" alt="Zuprano" className="w-full h-full object-cover" />
    </span>
  );
}

const isPhones = (g: CategoryGroup) => canonicalCategory(g.name) === PHONES_SLUG;

function MegaMenu({ group, onClose }: { group: CategoryGroup; onClose: () => void }) {
  const phones = isPhones(group);
  return (
    <div className="absolute top-full left-0 right-0 bg-white border-b border-gray-100 shadow-[0_20px_40px_rgba(0,0,0,0.06)] animate-in z-[90]">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-10 grid grid-cols-12 gap-10">
        <div className={phones ? "col-span-5" : "col-span-8"}>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 mb-5">{phones ? "Shop by Brand" : group.name}</p>
          <ul className={`grid ${phones ? "grid-cols-2" : "grid-cols-3"} gap-x-8 gap-y-3`}>
            {group.children.map((c) => (
              <li key={c.id}>
                <Link href={categoryHref(c.name)} onClick={onClose} className="text-[14px] font-medium text-gray-700 hover:text-orange-600 transition-colors">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href={categoryHref(group.name)}
            onClick={onClose}
            className="inline-flex items-center gap-1 mt-6 text-[12px] font-bold text-gray-900 hover:text-orange-600"
          >
            View all {group.name} <ChevronRight size={14} />
          </Link>
        </div>
        {phones && (
          <div className="col-span-3">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 mb-5">Shop by Budget</p>
            <ul className="space-y-3">
              {PHONE_PRICE_BANDS.map((b) => (
                <li key={b.label}>
                  <Link
                    href={`${categoryHref(group.name)}&price=${priceParam(b.range)}`}
                    onClick={onClose}
                    className="text-[14px] font-medium text-gray-700 hover:text-orange-600 transition-colors"
                  >
                    {b.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
        <Link href={categoryHref(group.name)} onClick={onClose} className="col-span-4 group block">
          <div className="aspect-[16/10] rounded-2xl overflow-hidden bg-gray-100 relative">
            {group.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={group.image} alt={group.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <p className="text-lg font-black tracking-tight">{group.name}</p>
              {group.description && <p className="text-[12px] text-white/80 line-clamp-2">{group.description}</p>}
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}

export function Navbar() {
  const { openAuthModal, toggleCartDrawer, isMenuOpen, openMenu, closeMenu } = useUI();
  const { isAuthenticated, user, logout } = useAuth();
  const count = useCart((s) => s.items.length);
  const { categories, fetchProducts } = useCatalog();
  const router = useRouter();
  const pathname = usePathname();

  const [scrolled, setScrolled] = useState(false);
  const [search, setSearch] = useState("");
  const [active, setActive] = useState<CategoryGroup | null>(null);
  const [userMenu, setUserMenu] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tree = buildTree(categories);
  const groups = tree.filter((g) => g.children.length > 0);
  const others = tree.filter((g) => g.children.length === 0);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  // Close the drawer on navigation and lock page scroll while it is open.
  useEffect(() => closeMenu(), [pathname, closeMenu]);
  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  const openMega = (g: CategoryGroup) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setActive(g);
  };
  const scheduleClose = () => {
    closeTimer.current = setTimeout(() => setActive(null), 150);
  };

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/shop?query=${encodeURIComponent(search.trim())}`);
      setSearch("");
      closeMenu();
    }
  };

  const onLogout = async () => {
    await logout();
    setUserMenu(false);
    closeMenu();
    router.push("/");
  };

  const searchField = (cls: string) => (
    <form onSubmit={onSearch} role="search" className={`flex items-center bg-gray-100 rounded-full px-4 gap-2.5 focus-within:bg-white focus-within:ring-2 ring-orange-500/30 transition-all ${cls}`}>
      <Search size={16} className="text-gray-400 shrink-0" />
      <input
        type="search"
        placeholder="Search phones, brands, accessories…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        aria-label="Search products"
        // 16px on phones stops iOS from zooming into the field.
        className="bg-transparent outline-none text-base md:text-sm w-full text-gray-900 placeholder:text-gray-400 py-2"
      />
    </form>
  );

  return (
    <>
      <div className="bg-[#0a0a0a] text-white py-2 px-4 flex justify-center items-center gap-4 text-[11px] font-semibold tracking-wide">
        <span className="flex items-center gap-2 truncate">
          <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse shrink-0" />
          Free delivery on orders over ₹500
        </span>
        <span className="hidden md:inline text-white/30">|</span>
        <span className="hidden md:inline text-white/70">100% genuine phones with brand warranty</span>
      </div>

      <nav
        className={`sticky top-0 w-full z-[100] transition-shadow duration-300 bg-white/95 backdrop-blur-xl border-b ${
          scrolled ? "border-gray-200 shadow-[0_8px_30px_rgba(0,0,0,0.05)]" : "border-gray-100"
        }`}
        onMouseLeave={scheduleClose}
      >
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 h-14 md:h-[72px] flex items-center gap-3 lg:gap-8">
          <button onClick={openMenu} aria-label="Open menu" className="lg:hidden -ml-2 p-2 text-gray-900 active:scale-90 transition-transform">
            <Menu size={22} />
          </button>
          <Link href="/" aria-label="Zuprano home" className="shrink-0">
            <Logo />
          </Link>

          <div className="hidden lg:flex items-center gap-6 xl:gap-7 h-full">
            {groups.map((g) => (
              <div key={g.id} className="h-full flex items-center relative" onMouseEnter={() => openMega(g)}>
                <Link
                  href={categoryHref(g.name)}
                  className={`text-[13px] font-bold whitespace-nowrap transition-colors flex items-center gap-1 ${active?.id === g.id ? "text-orange-600" : "text-gray-700 hover:text-black"}`}
                >
                  {g.name}
                  <ChevronDown size={14} className={`transition-transform duration-300 ${active?.id === g.id ? "rotate-180" : ""}`} />
                </Link>
                <span className={`absolute bottom-0 left-0 h-0.5 bg-orange-600 transition-all duration-300 ${active?.id === g.id ? "w-full" : "w-0"}`} />
              </div>
            ))}
            {others.map((g) => (
              <Link
                key={g.id}
                href={categoryHref(g.name)}
                onMouseEnter={() => setActive(null)}
                className="hidden 2xl:block text-[13px] font-bold whitespace-nowrap text-gray-700 hover:text-black"
              >
                {g.name}
              </Link>
            ))}
            <Link href="/shop?sort=newest" onMouseEnter={() => setActive(null)} className="hidden xl:block text-[13px] font-bold whitespace-nowrap text-gray-700 hover:text-black">
              New Arrivals
            </Link>
          </div>

          <div className="flex-1 flex justify-end items-center gap-1 sm:gap-2">
            {searchField("hidden md:flex w-full min-w-[180px] max-w-xs xl:max-w-sm")}

            <div className="relative hidden md:block" onMouseLeave={() => setUserMenu(false)}>
              <button
                onClick={() => (isAuthenticated ? setUserMenu(!userMenu) : openAuthModal())}
                onMouseEnter={() => isAuthenticated && setUserMenu(true)}
                aria-label="Account"
                className={`relative p-2.5 rounded-full transition-colors ${isAuthenticated ? "bg-orange-50 text-orange-600" : "hover:bg-gray-100 text-gray-900"}`}
              >
                <User size={20} />
              </button>
              {isAuthenticated && userMenu && (
                <div className="absolute top-full right-0 pt-2 z-[120]">
                  <div className="w-64 bg-white rounded-2xl shadow-[0_30px_60px_rgba(0,0,0,0.12)] border border-gray-100 p-3 animate-in">
                    <div className="px-3 pt-2 pb-3 mb-1 border-b border-gray-100">
                      <p className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400">
                        <ShieldCheck size={12} className="text-orange-600" /> Signed in as
                      </p>
                      <p className="text-sm font-bold text-gray-900 truncate">{user?.name}</p>
                    </div>
                    <MenuLink href="/account" onClick={() => setUserMenu(false)} label="My Account" />
                    <MenuLink href="/account?tab=Orders" onClick={() => setUserMenu(false)} label="My Orders" />
                    <MenuLink href="/wishlist" onClick={() => setUserMenu(false)} label="Wishlist" />
                    <button onClick={onLogout} className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-red-50 text-sm font-semibold text-red-600">
                      Logout <LogOut size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <Link href="/wishlist" aria-label="Wishlist" className="hidden md:flex p-2.5 rounded-full hover:bg-gray-100 text-gray-900">
              <Heart size={20} />
            </Link>
            <button onClick={toggleCartDrawer} aria-label="Cart" className="relative p-2.5 -mr-2 md:mr-0 rounded-full hover:bg-gray-100 text-gray-900">
              <ShoppingBag size={20} />
              {count > 0 && (
                <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] px-1 bg-orange-600 text-white text-[10px] font-bold flex items-center justify-center rounded-full">
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="md:hidden px-4 pb-3">{searchField("w-full")}</div>

        {active && <MegaMenu group={active} onClose={() => setActive(null)} />}
      </nav>

      {isMenuOpen && (
        <div className="fixed inset-0 z-[150] lg:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in" onClick={closeMenu} />
          <aside className="absolute inset-y-0 left-0 w-[85%] max-w-sm bg-white flex flex-col shadow-2xl animate-slide-in-left">
            <div className="flex items-center justify-between px-4 h-14 border-b border-gray-100 shrink-0">
              <Logo />
              <button onClick={closeMenu} aria-label="Close menu" className="p-2 -mr-2 text-gray-500">
                <X size={22} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain">
              <div className="p-4 border-b border-gray-100">
                {isAuthenticated ? (
                  <Link href="/account" onClick={closeMenu} className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
                      {user?.name?.charAt(0).toUpperCase()}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[11px] text-gray-400 font-semibold">Hello,</span>
                      <span className="block text-sm font-bold text-gray-900 truncate">{user?.name}</span>
                    </span>
                  </Link>
                ) : (
                  <button
                    onClick={() => {
                      closeMenu();
                      openAuthModal();
                    }}
                    className="w-full bg-black text-white rounded-xl py-3 text-sm font-bold"
                  >
                    Sign in / Create account
                  </button>
                )}
              </div>

              <p className="px-4 pt-5 pb-2 text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">Shop by Category</p>
              {groups.map((g) => (
                <div key={g.id} className="border-b border-gray-50">
                  <button
                    onClick={() => setExpanded(expanded === g.id ? null : g.id)}
                    aria-expanded={expanded === g.id}
                    className="w-full flex items-center justify-between px-4 py-3.5 text-[15px] font-bold text-gray-900"
                  >
                    <span className="flex items-center gap-3">
                      {isPhones(g) ? <Smartphone size={18} className="text-orange-600" /> : <Package size={18} className="text-orange-600" />}
                      {g.name}
                    </span>
                    <ChevronDown size={18} className={`text-gray-400 transition-transform ${expanded === g.id ? "rotate-180" : ""}`} />
                  </button>
                  {expanded === g.id && (
                    <div className="pb-3 px-4 animate-in">
                      <div className={`grid ${isPhones(g) ? "grid-cols-2" : "grid-cols-1"} gap-1`}>
                        <Link href={categoryHref(g.name)} onClick={closeMenu} className="col-span-full px-3 py-2.5 rounded-lg bg-orange-50 text-orange-700 text-sm font-bold">
                          All {g.name}
                        </Link>
                        {g.children.map((c) => (
                          <Link key={c.id} href={categoryHref(c.name)} onClick={closeMenu} className="px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 active:bg-gray-100">
                            {c.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {others.map((g) => (
                <DrawerLink key={g.id} href={categoryHref(g.name)} label={g.name} onClick={closeMenu} />
              ))}

              <p className="px-4 pt-6 pb-2 text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">More</p>
              <DrawerLink href="/shop?sort=newest" label="New Arrivals" onClick={closeMenu} />
              <DrawerLink href="/shop" label="All Products" onClick={closeMenu} />
              <DrawerLink href="/wishlist" label="Wishlist" onClick={closeMenu} />
              <DrawerLink href="/tracking" label="Track Order" onClick={closeMenu} />
              {isAuthenticated && <DrawerLink href="/account?tab=Orders" label="My Orders" onClick={closeMenu} />}
              {isAuthenticated && (
                <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3.5 text-[15px] font-semibold text-red-600">
                  <LogOut size={18} /> Logout
                </button>
              )}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

function MenuLink({ href, onClick, label }: { href: string; onClick: () => void; label: string }) {
  return (
    <Link href={href} onClick={onClick} className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-gray-50 text-sm font-semibold text-gray-900">
      {label} <ChevronRight size={14} className="text-gray-300" />
    </Link>
  );
}

function DrawerLink({ href, label, onClick }: { href: string; label: string; onClick: () => void }) {
  return (
    <Link href={href} onClick={onClick} className="flex items-center justify-between px-4 py-3.5 text-[15px] font-semibold text-gray-800 active:bg-gray-50">
      {label} <ChevronRight size={16} className="text-gray-300" />
    </Link>
  );
}
