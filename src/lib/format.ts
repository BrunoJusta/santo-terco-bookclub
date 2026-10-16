import type { Review } from "./types";

export function formatRating(value: number | null | undefined, digits = 2): string {
  if (value == null || Number.isNaN(value)) return "";
  const fixed = Number(value.toFixed(digits));
  return fixed.toLocaleString("pt-PT", { minimumFractionDigits: 1, maximumFractionDigits: digits });
}

export function average(reviews: Pick<Review, "rating">[]): number | null {
  if (reviews.length === 0) return null;
  return reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
}

export function isValidRating(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n) && n >= 0.25 && n <= 5 && Number.isInteger(n * 4);
}

export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

export function plural(n: number, one: string, many: string): string {
  return `${n.toLocaleString("pt-PT")} ${n === 1 ? one : many}`;
}

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}
