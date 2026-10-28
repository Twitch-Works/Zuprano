import type { Category, Product } from "./types";

/** Same rule as the generated `categories.slug` column, so store URLs match what admins see. */
export const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

/**
 * Old storefront links and loose wording ("cases", "screen-protectors", "mobiles") map onto the
 * current category slugs, so bookmarks and search-engine links keep working.
 */
const CATEGORY_ALIASES: Record<string, string> = {
  mobiles: "mobile-phones",
  phones: "mobile-phones",
  smartphones: "mobile-phones",
  accessories: "phone-accessories",
  protection: "mobile-protection",
  iphone: "apple",
  pixel: "google-pixel",
  cases: "phone-cases-covers",
  case: "phone-cases-covers",
  covers: "phone-cases-covers",
  "back-covers": "phone-cases-covers",
  "transparent-covers": "transparent-cases",
  protectors: "tempered-glass",
  "screen-protectors": "tempered-glass",
  "screen-protection": "tempered-glass",
  "screen-protector": "tempered-glass",
  powerbanks: "power-banks",
  powerbank: "power-banks",
  chargers: "chargers-adapters",
  charger: "chargers-adapters",
  cables: "charging-cables",
  cable: "charging-cables",
  stands: "phone-holders-stands",
  stand: "phone-holders-stands",
  "phone-stands": "phone-holders-stands",
  audio: "earbuds-headphones",
  earbuds: "earbuds-headphones",
  "laptop-sleeves": "laptop-bags",
  bags: "laptop-bags",
  "massage-devices": "wellness",
};

export const canonicalCategory = (c: string) => {
  const s = slugify(c);
  return CATEGORY_ALIASES[s] ?? s;
};

export const PHONES_SLUG = "mobile-phones";

export const categoryHref = (name: string) => `/shop?category=${slugify(name)}`;

export interface CategoryGroup extends Category {
  children: Category[];
}

/** Visible top-level categories with their subcategories, in display order. */
export function buildTree(categories: Category[]): CategoryGroup[] {
  const byOrder = (a: Category, b: Category) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name);
  return categories
    .filter((c) => !c.parentId && !c.isSystem)
    .sort(byOrder)
    .map((g) => ({ ...g, children: categories.filter((c) => c.parentId === g.id).sort(byOrder) }));
}

/** The top-level group a category belongs to (itself when it is top-level). */
export function groupOf(name: string, categories: Category[]): Category | undefined {
  const c = categories.find((x) => x.name === name);
  if (!c) return undefined;
  return c.parentId ? categories.find((x) => x.id === c.parentId) : c;
}

export const isPhone = (p: Product, categories: Category[]) => {
  const g = groupOf(p.category, categories);
  return g ? canonicalCategory(g.name) === PHONES_SLUG : p.specs.length > 0;
};

/** Selected slugs plus the subcategories of any selected group. */
function expandCategories(slugs: string[], categories: Category[]) {
  const out = new Set(slugs.map(canonicalCategory));
  for (const g of categories) {
    if (out.has(canonicalCategory(g.name))) {
      categories.filter((c) => c.parentId === g.id).forEach((c) => out.add(canonicalCategory(c.name)));
    }
  }
  return out;
}

/** Brands and models accessories are filtered by ("Compatible with"). */
export const STORE_DEVICES = ["iPhone", "Samsung", "OnePlus", "Pixel", "Xiaomi", "Redmi", "Realme", "Vivo", "Oppo", "Motorola", "Nothing"];

export type PriceRange = [number, number | null];

export const PHONE_PRICE_BANDS: { label: string; range: PriceRange }[] = [
  { label: "Under ₹10,000", range: [0, 10000] },
  { label: "₹10,000 – ₹20,000", range: [10000, 20000] },
  { label: "₹20,000 – ₹30,000", range: [20000, 30000] },
  { label: "₹30,000 – ₹50,000", range: [30000, 50000] },
  { label: "Above ₹50,000", range: [50000, null] },
];

export const ACCESSORY_PRICE_BANDS: { label: string; range: PriceRange }[] = [
  { label: "Under ₹500", range: [0, 500] },
  { label: "₹500 – ₹1,000", range: [500, 1000] },
  { label: "₹1,000 – ₹2,000", range: [1000, 2000] },
  { label: "₹2,000 – ₹5,000", range: [2000, 5000] },
  { label: "Above ₹5,000", range: [5000, null] },
];

export const priceParam = ([min, max]: PriceRange) => `${min}-${max ?? ""}`;

export function parsePrice(v: string | null): PriceRange | undefined {
  const m = v?.match(/^(\d+)-(\d*)$/);
  return m ? [Number(m[1]), m[2] ? Number(m[2]) : null] : undefined;
}

export function priceLabel(r: PriceRange) {
  const band = [...PHONE_PRICE_BANDS, ...ACCESSORY_PRICE_BANDS].find((b) => b.range[0] === r[0] && b.range[1] === r[1]);
  if (band) return band.label;
  const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
  return r[1] === null ? `Above ${inr(r[0])}` : `${inr(r[0])} – ${inr(r[1])}`;
}

export interface ShopFilters {
  device?: string[];
  category?: string[];
  brand?: string[];
  price?: PriceRange;
  query?: string;
}

export type SortBy = "relevance" | "price-asc" | "price-desc" | "newest" | "rating";

export function filterProducts(all: Product[], f: ShopFilters, sortBy: SortBy, categories: Category[] = []): Product[] {
  let list = [...all];
  if (f.device?.length) {
    const devices = f.device.map((d) => d.toLowerCase());
    list = list.filter((p) =>
      p.compatibility.some((c) => devices.some((d) => c.toLowerCase().includes(d) || d.includes(c.toLowerCase()))),
    );
  }
  if (f.category?.length) {
    const cats = expandCategories(f.category, categories);
    list = list.filter((p) => cats.has(canonicalCategory(p.category)));
  }
  if (f.brand?.length) {
    const brands = f.brand.map((b) => b.toLowerCase());
    list = list.filter((p) => brands.includes(p.brand.toLowerCase()));
  }
  if (f.price) {
    const [min, max] = f.price;
    list = list.filter((p) => p.price >= min && (max === null || p.price <= max));
  }
  const text = (f.query ?? "").trim().toLowerCase();
  if (text) {
    const words = text.split(/\s+/);
    list = list.filter((p) => {
      const hay = [p.name, p.description, p.brand, p.category, ...p.tags, ...p.compatibility, ...p.specs.map((s) => s.value)].join(" ").toLowerCase();
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

/** Short spec line for phone cards, e.g. "8GB RAM · 128GB · 6.7″". */
export function specSummary(p: Product) {
  const get = (label: string) => p.specs.find((s) => s.label.toLowerCase() === label)?.value;
  const ram = get("ram")?.split("/")[0].trim();
  const storage = get("storage")?.split("/")[0].trim();
  const display = get("display")?.match(/^[\d.]+["″]/)?.[0].replace('"', "″");
  return [ram && `${ram} RAM`, storage, display].filter(Boolean).join(" · ");
}
