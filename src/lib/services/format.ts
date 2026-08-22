import type { ServiceDuration, ServicePricing } from "./types";

const pesoFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

export function formatPeso(amount: number): string {
  return pesoFormatter.format(amount);
}

export function formatPriceRange(pricing: ServicePricing): string {
  const base =
    pricing.to === undefined
      ? formatPeso(pricing.from)
      : `${formatPeso(pricing.from)} – ${formatPeso(pricing.to)}`;

  return pricing.unit ? `${base} ${pricing.unit}` : base;
}

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} mins`;

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  const hourLabel = `${hours} hr${hours > 1 ? "s" : ""}`;

  return remainder === 0 ? hourLabel : `${hourLabel} ${remainder} mins`;
}

export function formatDuration(duration: ServiceDuration): string {
  if (duration.minMinutes === duration.maxMinutes) {
    return formatMinutes(duration.minMinutes);
  }

  return `${duration.minMinutes}–${formatMinutes(duration.maxMinutes)}`;
}

export function formatVisits(visits: number): string {
  return visits === 1 ? "Single visit" : `${visits} visits`;
}
