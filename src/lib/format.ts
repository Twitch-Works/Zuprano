export const formatINR = (value: number | string) => {
  const n = typeof value === "string" ? parseFloat(value.replace(/[^0-9.-]+/g, "")) : value;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(n) ? n : 0);
};

export const formatDate = (value: string | Date | null | undefined) => {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(
    new Date(value),
  );
};

export const formatDateTime = (value: string | Date | null | undefined) => {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
};

/** ₹1.3L style used across the reports screens. */
export const formatLakh = (value: number) => `₹${(value / 1e5).toFixed(1)}L`;
