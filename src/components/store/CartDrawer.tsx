"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, Lock, Minus, Plus, ShoppingBag, X } from "lucide-react";
import { cartSubtotal, useCart } from "@/stores/cart";
import { useUI } from "@/stores/ui";
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE } from "@/lib/pricing";

export function CartDrawer() {
  const router = useRouter();
  const { isCartDrawerOpen, closeCartDrawer } = useUI();
  const { items, removeItem, updateQuantity } = useCart();
  if (!isCartDrawerOpen) return null;
  const subtotal = cartSubtotal(items);
  const freeShipping = subtotal > FREE_SHIPPING_THRESHOLD;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-[200] animate-in" onClick={closeCartDrawer} />
      <div className="fixed right-0 top-0 bottom-0 w-full sm:w-[450px] bg-white shadow-2xl z-[210] flex flex-col animate-slide-in-right">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <h2 className="text-[13px] font-black uppercase tracking-[0.2em] text-black">Arsenal</h2>
            <div className="w-1 h-1 bg-gray-300 rounded-full" />
            <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest">{items.length} Units</span>
          </div>
          <button onClick={closeCartDrawer} aria-label="Close cart" className="p-1.5 hover:bg-gray-100 rounded-full transition-all text-gray-400">
            <X size={18} />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-6">
            <ShoppingBag size={32} className="text-gray-100" />
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">System Empty</p>
            <button
              onClick={() => {
                closeCartDrawer();
                router.push("/shop");
              }}
              className="text-[10px] font-black uppercase tracking-widest border-b-2 border-black pb-1"
            >
              Shop Drops
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 custom-scrollbar bg-[#fafafa]">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-2 bg-white border border-gray-100 rounded-xl transition-all hover:border-gray-300">
                  <div className="w-12 h-12 bg-gray-50 rounded-lg flex-shrink-0 flex items-center justify-center p-1.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.thumbnail} alt="" className="w-full h-full object-contain mix-blend-multiply" />
                  </div>
                  <div className="flex-1 flex items-center justify-between min-w-0">
                    <div className="flex flex-col min-w-0 pr-2">
                      <h3 className="font-black text-black text-[10px] uppercase tracking-tighter truncate">{item.name}</h3>
                      <span className="text-[8px] font-bold text-gray-400 uppercase truncate">{item.variantLabel || "STD"}</span>
                    </div>
                    <div className="flex items-center bg-gray-50 rounded-md border border-gray-100 scale-90">
                      <button
                        onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                        aria-label="Decrease"
                        className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-black transition-colors"
                      >
                        <Minus size={10} />
                      </button>
                      <span className="w-4 text-center font-black text-[9px] text-black">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        aria-label="Increase"
                        className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-black transition-colors"
                      >
                        <Plus size={10} />
                      </button>
                    </div>
                    <div className="flex items-center gap-3 pl-2">
                      <p className="font-black text-black text-[11px] tracking-tighter tabular-nums">
                        ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                      </p>
                      <button onClick={() => removeItem(item.id)} aria-label="Remove" className="text-gray-300 hover:text-red-500 transition-colors">
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-5 space-y-4 border-t border-gray-100 bg-white shadow-[0_-20px_40px_rgba(0,0,0,0.02)]">
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <span className="block text-[8px] font-black text-gray-400 uppercase tracking-[0.3em]">Total Terminal Value</span>
                  <span className="text-2xl font-black text-black tracking-tighter italic">₹{subtotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="text-right">
                  <span className="text-[8px] font-black text-orange-600 uppercase tracking-widest">
                    Fulfillment: {freeShipping ? "FREE" : `₹${SHIPPING_FEE}`}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  closeCartDrawer();
                  router.push("/checkout");
                }}
                className="group relative w-full bg-black text-white h-[56px] rounded-xl text-[10px] font-black uppercase tracking-[0.4em] overflow-hidden transition-all hover:bg-orange-600 active:scale-95 shadow-xl shadow-black/5"
              >
                <div className="relative z-10 flex items-center justify-center gap-3">
                  <Lock size={12} />
                  Checkout
                  <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
