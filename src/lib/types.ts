export interface Variant {
  id: string;
  name: string;
  value: string;
  price: number;
  stock: number;
}

export interface Spec {
  label: string;
  value: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  sku: string;
  brand: string;
  category: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  stock: number;
  dealerId: string;
  dealerName: string;
  images: string[];
  imageUrl: string;
  thumbnail: string;
  isPublic: boolean;
  isActive: boolean;
  tags: string[];
  compatibility: string[];
  /** Raw variants as stored (admin edits this as JSON). Use `normalizeVariants` for the storefront. */
  variants: unknown[];
  /** Ordered spec sheet, e.g. Display, Processor, RAM. Mostly used for phones. */
  specs: Spec[];
  rating: number;
  reviews: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  productId: string;
  variantId: string;
  name: string;
  variant: string;
  image: string;
  price: number;
  quantity: number;
}

export interface Address {
  id: string;
  name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  isDefault?: boolean;
}

export type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export interface StatusEvent {
  status: OrderStatus;
  at: string;
  note: string | null;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: Partial<Address>;
  dealerId: string | null;
  dealerName: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  totalAmount: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: "razorpay" | "cod" | "manual";
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  trackingId: string | null;
  carrier: string;
  statusHistory: StatusEvent[];
  source: "store" | "admin";
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DealerAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
}

export interface Dealer {
  id: string;
  name: string;
  contact: string;
  location: string;
  gstNumber: string;
  panNumber: string;
  status: "active" | "inactive";
  verificationStatus: "pending" | "verified" | "rejected";
  address: DealerAddress;
  rating: number;
  totalOrders: number;
  totalRevenue: number;
  verifiedAt: string | null;
  createdAt: string;
}

export interface Profile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "customer" | "admin" | "manager" | "support";
  status: "active" | "inactive";
  addresses: Address[];
  preferences: Record<string, boolean>;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface PricingTier {
  id: string;
  name: string;
  minQty: number;
  maxQty: number | null;
  discountPercent: number;
  applicableProducts: string[];
  startDate: string;
  endDate: string | null;
  status: "active" | "inactive" | "scheduled";
  createdAt: string;
}

export interface Campaign {
  id: string;
  name: string;
  type: string;
  discountPercent: number;
  budget: number;
  spent: number;
  reach: number;
  status: "Active" | "Completed" | "Scheduled";
  conversionRate: number | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
}

export interface BusinessSettings {
  businessName?: string;
  businessEmail?: string;
  currency?: string;
  timezone?: string;
  address?: string;
  preferences?: Record<string, boolean>;
  notifications?: Record<string, boolean>;
  sessionTimeout?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  isVisible: boolean;
  isSystem: boolean;
  /** Set for subcategories; top-level groups have none. */
  parentId: string | null;
  sortOrder: number;
  createdAt: string;
}
