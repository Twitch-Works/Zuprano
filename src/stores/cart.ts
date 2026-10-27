import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product, Variant } from "@/lib/types";

export interface CartItem {
  id: string;
  productId: string;
  variantId: string;
  name: string;
  category: string;
  thumbnail: string;
  variantLabel: string;
  price: number;
  quantity: number;
  addedAt: string;
}

interface CartState {
  items: CartItem[];
  addItem: (product: Product, variant: Variant, quantity: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product, variant, quantity) => {
        const id = `${product.id}-${variant.id}`;
        const existing = get().items.find((i) => i.id === id);
        if (existing) {
          set({ items: get().items.map((i) => (i.id === id ? { ...i, quantity: i.quantity + quantity } : i)) });
          return;
        }
        set({
          items: [
            ...get().items,
            {
              id,
              productId: product.id,
              variantId: variant.id,
              name: product.name,
              category: product.category,
              thumbnail: product.thumbnail,
              variantLabel: variant.id === "default" ? "STD" : variant.value,
              price: variant.price,
              quantity,
              addedAt: new Date().toISOString(),
            },
          ],
        });
      },
      removeItem: (id) => set({ items: get().items.filter((i) => i.id !== id) }),
      updateQuantity: (id, quantity) => {
        if (quantity <= 0) return get().removeItem(id);
        set({ items: get().items.map((i) => (i.id === id ? { ...i, quantity } : i)) });
      },
      clearCart: () => set({ items: [] }),
    }),
    { name: "zuprano-cart", version: 2 },
  ),
);

export const cartSubtotal = (items: CartItem[]) => items.reduce((s, i) => s + i.price * i.quantity, 0);
