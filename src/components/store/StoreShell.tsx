"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { CartDrawer } from "./CartDrawer";
import { AuthModal } from "./AuthModal";
import { Toast } from "./ui";
import { useAuth } from "@/stores/auth";
import { useUI } from "@/stores/ui";
import { useWishlist } from "@/stores/wishlist";

export function StoreShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { toast, closeToast } = useUI();
  const { init, user } = useAuth();
  const { fetchWishlist, loadedFor, clear } = useWishlist();

  useEffect(() => init(), [init]);

  useEffect(() => {
    if (user && loadedFor !== user.id) fetchWishlist(user.id);
    if (!user && loadedFor) clear();
  }, [user, loadedFor, fetchWishlist, clear]);

  const fullBleed = pathname === "/" || pathname === "/shop" || pathname.startsWith("/product/");

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />
      <main
        className={`flex-1 w-full ${
          fullBleed ? "py-0 px-0" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12"
        } pb-24 md:pb-8`}
      >
        {children}
      </main>
      <Footer />
      <CartDrawer />
      <AuthModal />
      {toast && <Toast key={toast.id} type={toast.type} message={toast.message} onClose={closeToast} />}
    </div>
  );
}
