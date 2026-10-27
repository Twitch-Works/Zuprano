import type { Product } from "./types";

export const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/**
 * Storefront links use several names for the same thing (e.g. "Screen Protectors",
 * "screen-protectors", admin category "Protectors"). Map every alias to one canonical slug.
 */
const CATEGORY_ALIASES: Record<string, string> = {
  protectors: "screen-protectors",
  "screen-protection": "screen-protectors",
  "screen-protector": "screen-protectors",
  "transparent-covers": "cases",
  "transparent-cases": "cases",
  "back-covers": "cases",
  case: "cases",
  covers: "cases",
  powerbank: "powerbanks",
  "power-banks": "powerbanks",
  charger: "chargers",
  cable: "cables",
  stand: "stands",
  "phone-stands": "stands",
  "laptop-sleeves": "laptop-bags",
  bags: "laptop-bags",
  "massage-devices": "wellness",
};

export const canonicalCategory = (c: string) => {
  const s = slugify(c);
  return CATEGORY_ALIASES[s] ?? s;
};

/** Store "collection" links map onto a category plus an optional keyword. */
export const COLLECTIONS: Record<string, { category?: string; keyword?: string }> = {
  "transparent-covers": { category: "cases" },
  powerbanks: { category: "powerbanks" },
  "massage-devices": { category: "wellness" },
};

export const STORE_DEVICES = ["iPhone", "Samsung", "OnePlus", "Pixel", "iPad", "AirPods"];

export interface ShopFilters {
  device?: string[];
  category?: string[];
  priceRange?: [number, number];
  query?: string;
  keyword?: string;
}

export type SortBy = "relevance" | "price-asc" | "price-desc" | "newest" | "rating";

export function filterProducts(all: Product[], f: ShopFilters, sortBy: SortBy): Product[] {
  let list = [...all];
  if (f.device?.length) {
    const devices = f.device.map((d) => d.toLowerCase());
    list = list.filter((p) =>
      p.compatibility.some((c) => devices.some((d) => c.toLowerCase().includes(d) || d.includes(c.toLowerCase()))),
    );
  }
  if (f.category?.length) {
    const cats = f.category.map(canonicalCategory);
    list = list.filter((p) => cats.includes(canonicalCategory(p.category)));
  }
  if (f.priceRange) {
    const [min, max] = f.priceRange;
    list = list.filter((p) => p.price >= min && p.price <= max);
  }
  const text = (f.query ?? f.keyword ?? "").trim().toLowerCase();
  if (text) {
    const words = text.split(/\s+/);
    list = list.filter((p) => {
      const hay = [p.name, p.description, p.brand, p.category, ...p.tags, ...p.compatibility].join(" ").toLowerCase();
      return words.every((w) => hay.includes(w));
    });
  }
  switch (sortBy) {
    case "price-asc":
      list.sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      list.sort((a, b) => b.price - a.price);
      break;
    case "rating":
      list.sort((a, b) => b.rating - a.rating);
      break;
    case "newest":
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      break;
  }
  return list;
}
