"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, House, LayoutGrid, ShoppingBag, User } from "lucide-react";
import { useAuth } from "@/stores/auth";
import { useCart } from "@/stores/cart";
import { useUI } from "@/stores/ui";

const item = "flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-semibold";

/** App-style bottom navigation for phones; hidden from md up, where the header has everything. */
export function MobileTabBar() {
  const pathname = usePathname();
  const count = useCart((s) => s.items.length);
  const isAuthenticated = useAuth((s) => s.isAuthenticated);
  const { openMenu, isMenuOpen, toggleCartDrawer, isCartDrawerOpen, openAuthModal } = useUI();
  const tone = (on: boolean) => (on ? "text-orange-600" : "text-gray-500");

  if (pathname.startsWith("/checkout")) return null;

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-[140] bg-white/95 backdrop-blur-xl border-t border-gray-200 pb-[env(safe-area-inset-bottom)]">
      <div className="flex">
        <Link href="/" className={`${item} ${tone(pathname === "/" && !isMenuOpen && !isCartDrawerOpen)}`}>
          <House size={20} /> Home
        </Link>
        <button onClick={openMenu} className={`${item} ${tone(isMenuOpen)}`}>
          <LayoutGrid size={20} /> Categories
        </button>
        <Link href="/wishlist" className={`${item} ${tone(pathname === "/wishlist")}`}>
          <Heart size={20} /> Wishlist
        </Link>
        <button onClick={toggleCartDrawer} className={`${item} ${tone(isCartDrawerOpen)} relative`}>
          <span className="relative">
            <ShoppingBag size={20} />
            {count > 0 && (
              <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 bg-orange-600 text-white text-[9px] font-bold flex items-center justify-center rounded-full">
                {count}
              </span>
            )}
          </span>
          Cart
        </button>
        {isAuthenticated ? (
          <Link href="/account" className={`${item} ${tone(pathname === "/account")}`}>
            <User size={20} /> Account
          </Link>
        ) : (
          <button onClick={openAuthModal} className={`${item} ${tone(false)}`}>
            <User size={20} /> Sign in
          </button>
        )}
      </div>
    </nav>
  );
}
