import { TORONTO_TZ } from "@/lib/toronto-time";

const cad = new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" });

export function formatCad(cents: number): string {
  return cad.format(cents / 100);
}

/** A real timestamp, shown on the Toronto calendar. */
export function formatInstant(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TORONTO_TZ,
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

/** A date-only value stored as UTC midnight or UTC noon. */
export function formatCalendar(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "UTC",
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function formatIssueMonth(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TORONTO_TZ,
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatMonthYear(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    month: "long",
    year: "numeric",
  }).format(date);
}

export function hstLabel(taxRateBps: number): string {
  const pct = taxRateBps / 100;
  const text = Number.isInteger(pct) ? String(pct) : pct.toFixed(2);
  return `HST (${text}%)`;
}
