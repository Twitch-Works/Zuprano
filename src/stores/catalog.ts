import { create } from "zustand";
import { getSupabase } from "@/lib/supabase/client";
import { toCategory, toPricingTier, toProduct } from "@/lib/mappers";
import type { Category, PricingTier, Product } from "@/lib/types";

interface CatalogState {
  products: Product[];
  /** Visible categories only (RLS hides the rest from shoppers). */
  categories: Category[];
  tiers: PricingTier[];
  loaded: boolean;
  isLoading: boolean;
  error: string | null;
  fetchProducts: (force?: boolean) => Promise<void>;
  fetchTiers: () => Promise<void>;
}

export const useCatalog = create<CatalogState>((set, get) => ({
  products: [],
  categories: [],
  tiers: [],
  loaded: false,
  isLoading: false,
  error: null,
  fetchProducts: async (force = false) => {
    if ((get().loaded && !force) || get().isLoading) return;
    set({ isLoading: true, error: null });
    // RLS only returns public + active products to shoppers.
    const supabase = getSupabase();
    const [{ data, error }, { data: cats }] = await Promise.all([
      supabase.from("products").select("*").eq("is_public", true).eq("is_active", true).order("created_at", { ascending: false }),
      supabase.from("categories").select("*").eq("is_visible", true).order("sort_order"),
    ]);
    if (error) {
      set({ isLoading: false, error: error.message });
      return;
    }
    set({ products: (data ?? []).map(toProduct), categories: (cats ?? []).map(toCategory), loaded: true, isLoading: false });
  },
  fetchTiers: async () => {
    const { data } = await getSupabase().from("pricing").select("*").eq("status", "active");
    set({ tiers: (data ?? []).map(toPricingTier) });
  },
}));
