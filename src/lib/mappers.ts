import type {
  Campaign,
  Category,
  Dealer,
  Order,
  PricingTier,
  Product,
  Profile,
  Variant,
} from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Row = Record<string, any>;

const num = (v: unknown, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};
const optNum = (v: unknown) => (v === null || v === undefined || v === "" ? undefined : num(v));

export function toProduct(r: Row): Product {
  const images: string[] = Array.isArray(r.images) ? r.images.filter(Boolean) : [];
  return {
    id: r.id,
    name: r.name ?? "",
    description: r.description ?? "",
    sku: r.sku ?? "",
    brand: r.brand ?? "",
    category: r.category ?? "",
    price: num(r.price),
    originalPrice: optNum(r.original_price),
    discount: optNum(r.discount),
    stock: num(r.stock),
    dealerId: r.dealer_id ?? "",
    dealerName: r.dealer_name || "Unknown Dealer",
    images,
    imageUrl: r.image_url || images[0] || "",
    thumbnail: r.thumbnail || images[0] || r.image_url || "",
    isPublic: !!r.is_public,
    isActive: r.is_active ?? true,
    tags: r.tags ?? [],
    compatibility: r.compatibility ?? [],
    variants: Array.isArray(r.variants) ? r.variants : [],
    specs: Array.isArray(r.specs)
      ? r.specs.filter((s: any) => s && s.label && s.value).map((s: any) => ({ label: String(s.label), value: String(s.value) }))
      : [],
    rating: num(r.rating),
    reviews: num(r.reviews_count),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

/** Admin form payload -> DB columns. */
export function fromProductInput(p: Partial<Product>): Row {
  const row: Row = {
    name: p.name,
    description: p.description ?? "",
    sku: p.sku ?? "",
    brand: p.brand ?? "",
    category: p.category,
    price: p.price ?? 0,
    original_price: p.originalPrice ?? null,
    discount: p.discount ?? null,
    stock: p.stock ?? 0,
    dealer_id: p.dealerId || "Warehouse",
    images: p.images ?? [],
    image_url: p.images?.[0] ?? "",
    thumbnail: p.images?.[0] ?? "",
    is_public: p.isPublic ?? false,
    is_active: p.isActive ?? true,
    tags: p.tags ?? [],
    compatibility: p.compatibility ?? [],
    variants: p.variants ?? [],
    specs: p.specs ?? [],
  };
  Object.keys(row).forEach((k) => row[k] === undefined && delete row[k]);
  return row;
}

/**
 * The storefront always needs at least one purchasable variant. Admin-created products may store
 * variants as objects, as a plain list of names, or not at all; this flattens all of them.
 */
export function normalizeVariants(p: Product): Variant[] {
  const list = Array.isArray(p.variants) ? p.variants : [];
  const variants: Variant[] = list
    .map((v: any, i: number): Variant | null => {
      if (typeof v === "string" && v.trim()) {
        return { id: `opt-${i}`, name: "Option", value: v.trim(), price: p.price, stock: p.stock };
      }
      if (v && typeof v === "object") {
        const value = v.value ?? v.color ?? v.size ?? v.label ?? v.name ?? `Option ${i + 1}`;
        return {
          id: String(v.id ?? `opt-${i}`),
          name: String(v.name && v.value ? v.name : v.color ? "Color" : "Option"),
          value: String(value),
          price: num(v.price, p.price),
          stock: Math.min(num(v.stock, p.stock), p.stock),
        };
      }
      return null;
    })
    .filter((v): v is Variant => v !== null);
  if (variants.length > 0) return variants;
  return [{ id: "default", name: "Default", value: "Standard", price: p.price, stock: p.stock }];
}

export function toOrder(r: Row): Order {
  return {
    id: r.id,
    orderNumber: r.order_number,
    userId: r.user_id,
    customerName: r.customer_name ?? "",
    customerEmail: r.customer_email ?? "",
    customerPhone: r.customer_phone ?? "",
    shippingAddress: r.shipping_address ?? {},
    dealerId: r.dealer_id,
    dealerName: r.dealer_name ?? "",
    items: Array.isArray(r.items) ? r.items.map((i: Row) => ({ ...i, price: num(i.price), quantity: num(i.quantity) }) as Order["items"][number]) : [],
    subtotal: num(r.subtotal),
    discount: num(r.discount),
    tax: num(r.tax),
    shipping: num(r.shipping),
    totalAmount: num(r.total_amount),
    status: r.status,
    paymentStatus: r.payment_status,
    paymentMethod: r.payment_method,
    razorpayOrderId: r.razorpay_order_id,
    razorpayPaymentId: r.razorpay_payment_id,
    trackingId: r.tracking_id,
    carrier: r.carrier ?? "Delhivery",
    statusHistory: r.status_history ?? [],
    source: r.source,
    notes: r.notes,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export function toDealer(r: Row): Dealer {
  return {
    id: r.id,
    name: r.name ?? "",
    contact: r.contact ?? "",
    location: r.location ?? "",
    gstNumber: r.gst_number ?? "",
    panNumber: r.pan_number ?? "",
    status: r.status,
    verificationStatus: r.verification_status,
    address: { street: "", city: "", state: "", zip: "", ...(r.address ?? {}) },
    rating: num(r.rating),
    totalOrders: num(r.total_orders),
    totalRevenue: num(r.total_revenue),
    verifiedAt: r.verified_at,
    createdAt: r.created_at,
  };
}

export function fromDealerInput(d: Partial<Dealer>): Row {
  const row: Row = {
    name: d.name,
    contact: d.contact,
    location: d.location,
    gst_number: d.gstNumber,
    pan_number: d.panNumber,
    status: d.status,
    verification_status: d.verificationStatus,
    address: d.address,
    rating: d.rating,
  };
  Object.keys(row).forEach((k) => row[k] === undefined && delete row[k]);
  return row;
}

export function toProfile(r: Row): Profile {
  return {
    id: r.id,
    name: r.name ?? "",
    email: r.email ?? "",
    phone: r.phone ?? "",
    role: r.role,
    status: r.status,
    addresses: Array.isArray(r.addresses) ? r.addresses : [],
    preferences: r.preferences ?? {},
    lastLoginAt: r.last_login_at,
    createdAt: r.created_at,
  };
}

export function toPricingTier(r: Row): PricingTier {
  return {
    id: r.id,
    name: r.name,
    minQty: num(r.min_qty),
    maxQty: r.max_qty === null ? null : num(r.max_qty),
    discountPercent: num(r.discount_percent),
    applicableProducts: r.applicable_products ?? [],
    startDate: r.start_date,
    endDate: r.end_date,
    status: r.status,
    createdAt: r.created_at,
  };
}

export function toCampaign(r: Row): Campaign {
  return {
    id: r.id,
    name: r.name,
    type: r.type,
    discountPercent: num(r.discount_percent),
    budget: num(r.budget),
    spent: num(r.spent),
    reach: num(r.reach),
    status: r.status,
    conversionRate: r.conversion_rate === null ? null : num(r.conversion_rate),
    startDate: r.start_date,
    endDate: r.end_date,
    createdAt: r.created_at,
  };
}

export function toCategory(r: Row): Category {
  return {
    id: r.id,
    name: r.name,
    slug: r.slug,
    description: r.description ?? "",
    image: r.image ?? "",
    isVisible: !!r.is_visible,
    isSystem: !!r.is_system,
    parentId: r.parent_id ?? null,
    sortOrder: num(r.sort_order),
    createdAt: r.created_at,
  };
}
