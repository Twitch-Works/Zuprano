"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase/client";
import {
  fromDealerInput,
  fromProductInput,
  toCampaign,
  toCategory,
  toDealer,
  toOrder,
  toPricingTier,
  toProduct,
  toProfile,
} from "@/lib/mappers";
import type { BusinessSettings, Campaign, Category, Dealer, Order, PricingTier, Product } from "@/lib/types";
import { useTable } from "./useTable";

const db = () => getSupabase();

async function must<T>(p: PromiseLike<{ data: T; error: { message: string } | null }>) {
  const { data, error } = await p;
  if (error) throw new Error(error.message);
  return data;
}

/** Calls one of our authenticated admin API routes. */
export async function adminApi<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(path, { ...init, headers: { "Content-Type": "application/json", ...(init.headers ?? {}) } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data as T;
}

// ---------------------------------------------------------------- products
export function useProducts() {
  const t = useTable("products", toProduct, { orderBy: "created_at" });
  return {
    products: t.rows,
    loading: t.loading,
    error: t.error,
    addProduct: async (p: Partial<Product>) => {
      await must(db().from("products").insert(fromProductInput(p)));
      await t.refresh();
    },
    updateProduct: async (id: string, p: Partial<Product>) => {
      await must(db().from("products").update(fromProductInput(p)).eq("id", id));
      await t.refresh();
    },
    deleteProduct: async (id: string) => {
      await must(db().from("products").delete().eq("id", id));
      await t.refresh();
    },
    moveStock: async (productId: string, type: "restock" | "transfer" | "adjustment", quantity: number, dealerId: string | null, note: string) => {
      await must(db().rpc("move_stock", { p_product_id: productId, p_type: type, p_quantity: quantity, p_dealer_id: dealerId, p_note: note }));
      await t.refresh();
    },
  };
}

export async function uploadProductImage(file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${new Date().getFullYear()}/${crypto.randomUUID()}.${ext}`;
  const { error } = await db().storage.from("product-images").upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error(error.message);
  return db().storage.from("product-images").getPublicUrl(path).data.publicUrl;
}

// ---------------------------------------------------------------- categories
const categoryRow = (c: Partial<Category>) => {
  const row: Record<string, unknown> = {
    name: c.name?.trim(),
    description: c.description,
    image: c.image,
    is_visible: c.isVisible,
    sort_order: c.sortOrder,
  };
  Object.keys(row).forEach((k) => row[k] === undefined && delete row[k]);
  return row;
};

export function useCategories() {
  const t = useTable("categories", toCategory, { orderBy: "sort_order", ascending: true });
  return {
    categories: t.rows,
    loading: t.loading,
    error: t.error,
    createCategory: async (c: Partial<Category>) => {
      await must(db().from("categories").insert(categoryRow(c)));
      await t.refresh();
    },
    updateCategory: async (id: string, c: Partial<Category>) => {
      await must(db().from("categories").update(categoryRow(c)).eq("id", id));
      await t.refresh();
    },
    /** Moves the category's products to targetId (or the default category), then deletes it. */
    deleteCategory: async (id: string, targetId: string | null) => {
      const moved = await must(db().rpc("delete_category", { p_category_id: id, p_target_id: targetId }));
      await t.refresh();
      return moved as number;
    },
  };
}

// ---------------------------------------------------------------- orders
export function useOrders(limit = 1000) {
  const t = useTable("orders", toOrder, { orderBy: "created_at", limit });
  return {
    orders: t.rows,
    loading: t.loading,
    error: t.error,
    refresh: t.refresh,
    updateOrder: async (id: string, patch: Partial<Pick<Order, "status" | "paymentStatus" | "trackingId" | "carrier" | "notes">>) => {
      const row: Record<string, unknown> = {};
      if (patch.status) row.status = patch.status;
      if (patch.paymentStatus) row.payment_status = patch.paymentStatus;
      if (patch.trackingId !== undefined) row.tracking_id = patch.trackingId || null;
      if (patch.carrier !== undefined) row.carrier = patch.carrier;
      if (patch.notes !== undefined) row.notes = patch.notes;
      await must(db().from("orders").update(row).eq("id", id));
      await t.refresh();
    },
    createOrder: async (input: unknown) => {
      const res = await adminApi<{ orderNumber: string }>("/api/admin/orders", { method: "POST", body: JSON.stringify(input) });
      await t.refresh();
      return res;
    },
  };
}

export function useDashboardStats() {
  const { orders, loading: lo } = useOrders();
  const { dealers, loading: ld } = useDealers();
  const paid = orders.filter((o) => o.paymentStatus === "paid");
  return {
    loading: lo || ld,
    stats: {
      totalRevenue: paid.reduce((s, o) => s + o.totalAmount, 0),
      totalOrders: orders.length,
      activeDealers: dealers.filter((d) => d.status === "active").length,
      conversionRate: 3.2,
      recentOrders: orders.slice(0, 5),
    },
    orders,
    dealers,
  };
}

// ---------------------------------------------------------------- dealers
export function useDealers() {
  const t = useTable("dealers", toDealer, { orderBy: "name", ascending: true });
  const update = async (id: string, patch: Record<string, unknown>) => {
    await must(db().from("dealers").update(patch).eq("id", id));
    await t.refresh();
  };
  return {
    dealers: t.rows,
    loading: t.loading,
    error: t.error,
    addDealer: async (d: Partial<Dealer>) => {
      await must(db().from("dealers").insert(fromDealerInput(d)));
      await t.refresh();
    },
    updateDealer: (id: string, d: Partial<Dealer>) => update(id, fromDealerInput(d)),
    deleteDealer: async (id: string) => {
      await must(db().from("dealers").delete().eq("id", id));
      await t.refresh();
    },
    verifyDealer: (id: string) => update(id, { verification_status: "verified", status: "active", verified_at: new Date().toISOString() }),
    rejectDealer: (id: string) => update(id, { verification_status: "rejected", status: "inactive" }),
  };
}

// ---------------------------------------------------------------- users
export function useCustomers() {
  const t = useTable("profiles", toProfile, { orderBy: "created_at", filter: (q) => q.eq("role", "customer") });
  return { users: t.rows, loading: t.loading, error: t.error, refresh: t.refresh };
}

export function useStaff() {
  const t = useTable("profiles", toProfile, { orderBy: "created_at", ascending: true, filter: (q) => q.neq("role", "customer") });
  return { staff: t.rows, loading: t.loading, error: t.error, refresh: t.refresh };
}

// ---------------------------------------------------------------- pricing & campaigns
const tierRow = (t: Partial<PricingTier>) => ({
  name: t.name,
  min_qty: t.minQty,
  max_qty: t.maxQty || null,
  discount_percent: t.discountPercent,
  applicable_products: t.applicableProducts ?? [],
  start_date: t.startDate,
  end_date: t.endDate || null,
  status: t.status,
});

export function usePricing() {
  const t = useTable("pricing", toPricingTier, { orderBy: "start_date" });
  return {
    rules: t.rows,
    loading: t.loading,
    error: t.error,
    createRule: async (r: Partial<PricingTier>) => {
      await must(db().from("pricing").insert(tierRow(r)));
      await t.refresh();
    },
    updateRule: async (id: string, r: Partial<PricingTier>) => {
      await must(db().from("pricing").update(tierRow(r)).eq("id", id));
      await t.refresh();
    },
    deleteRule: async (id: string) => {
      await must(db().from("pricing").delete().eq("id", id));
      await t.refresh();
    },
  };
}

const campaignRow = (c: Partial<Campaign>) => ({
  name: c.name,
  type: c.type,
  discount_percent: c.discountPercent,
  budget: c.budget,
  spent: c.spent,
  reach: c.reach,
  status: c.status,
  conversion_rate: c.conversionRate ?? null,
  start_date: c.startDate || null,
  end_date: c.endDate || null,
});

export function useCampaigns() {
  const t = useTable("campaigns", toCampaign, { orderBy: "created_at", ascending: true });
  return {
    campaigns: t.rows,
    loading: t.loading,
    createCampaign: async (c: Partial<Campaign>) => {
      await must(db().from("campaigns").insert(campaignRow(c)));
      await t.refresh();
    },
    updateCampaign: async (id: string, c: Partial<Campaign>) => {
      await must(db().from("campaigns").update(campaignRow(c)).eq("id", id));
      await t.refresh();
    },
    deleteCampaign: async (id: string) => {
      await must(db().from("campaigns").delete().eq("id", id));
      await t.refresh();
    },
  };
}

// ---------------------------------------------------------------- settings
export const DEFAULT_SETTINGS: BusinessSettings = {
  businessName: "Zuprano",
  businessEmail: "admin@zuprano.com",
  currency: "INR",
  timezone: "IST",
  address: "",
  preferences: { bulkOrders: true, autoship: false, returns: true, loyaltyProgram: true },
};

export function useSettings() {
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    db()
      .from("settings")
      .select("data")
      .eq("id", "business_config")
      .maybeSingle()
      .then(({ data }: { data: { data: BusinessSettings } | null }) => {
        setSettings(data?.data ?? DEFAULT_SETTINGS);
        setLoading(false);
      });
  }, []);
  return {
    settings,
    loading,
    updateSettings: async (s: BusinessSettings) => {
      await must(db().from("settings").upsert({ id: "business_config", data: s }));
      setSettings(s);
    },
  };
}
