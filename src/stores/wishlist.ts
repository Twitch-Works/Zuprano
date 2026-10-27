import { create } from "zustand";
import { getSupabase } from "@/lib/supabase/client";
import { toProduct } from "@/lib/mappers";
import type { Product } from "@/lib/types";

interface WishlistItem {
  id: string;
  productId: string;
  product: Product;
}

interface WishlistState {
  items: WishlistItem[];
  isLoading: boolean;
  loadedFor: string | null;
  fetchWishlist: (userId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  toggle: (product: Product, userId: string) => Promise<boolean>;
  clear: () => void;
}

export const useWishlist = create<WishlistState>((set, get) => ({
  items: [],
  isLoading: false,
  loadedFor: null,

  fetchWishlist: async (userId) => {
    set({ isLoading: true });
    const { data } = await getSupabase()
      .from("wishlist")
      .select("id, product_id, products(*)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    const items = (data ?? [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((r: any) => r.products)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((r: any) => ({ id: r.id, productId: r.product_id, product: toProduct(r.products) }));
    set({ items, isLoading: false, loadedFor: userId });
  },

  isInWishlist: (productId) => get().items.some((i) => i.productId === productId),

  /** Returns true if the product is now in the wishlist. */
  toggle: async (product, userId) => {
    const supabase = getSupabase();
    if (get().isInWishlist(product.id)) {
      set({ items: get().items.filter((i) => i.productId !== product.id) });
      await supabase.from("wishlist").delete().eq("user_id", userId).eq("product_id", product.id);
      return false;
    }
    const { data, error } = await supabase
      .from("wishlist")
      .insert({ user_id: userId, product_id: product.id })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    set({ items: [{ id: data.id, productId: product.id, product }, ...get().items] });
    return true;
  },

  clear: () => set({ items: [], loadedFor: null }),
}));
