export const EXPENSE_CATEGORIES = [
  "Food", "Drinks", "Transport", "Shopping", "Bills", "Health",
  "Entertainment", "Subscriptions", "Education", "Work", "Other",
] as const;

export const PAYMENT_METHODS = ["Cash", "UPI", "Card", "Other"] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const CATEGORY_ICONS: Record<ExpenseCategory, string> = {
  Food: "🍛", Drinks: "☕", Transport: "🚗", Shopping: "🛍️", Bills: "🧾",
  Health: "💊", Entertainment: "🎬", Subscriptions: "🔁", Education: "📚",
  Work: "💼", Other: "•",
};

export function formatRupees(value: string | number) {
  const amount = typeof value === "string" ? Number(value) : value;
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function isValidDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function isValidTime(value: unknown): value is string {
  return typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}
