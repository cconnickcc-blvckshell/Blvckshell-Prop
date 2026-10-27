import { TORONTO_TZ, zonedParts } from "@/lib/toronto-time";

/** Per-invoice and per-contract terms. No late fee is modelled. */
export const PAYMENT_TERMS = ["NET_30", "DUE_ON_COMPLETION"] as const;
export type PaymentTermsCode = (typeof PAYMENT_TERMS)[number];

export function isPaymentTerms(value: string): value is PaymentTermsCode {
  return (PAYMENT_TERMS as readonly string[]).includes(value);
}

export function termsDays(terms: PaymentTermsCode, contractNetDays?: number | null): number {
  if (terms === "DUE_ON_COMPLETION") return 0;
  const days = contractNetDays ?? 30;
  if (!Number.isFinite(days) || days <= 0) return 30;
  return Math.round(days);
}

/**
 * Contracts and add-on invoices default to Net 30.
 * A client with no active contract is billed as a one-off: due on completion.
 */
export function chooseContractTerms(
  contracts: { paymentTerms: string; netTermsDays: number }[]
): { terms: PaymentTermsCode; days: number } {
  const net = contracts.filter((contract) => contract.paymentTerms !== "DUE_ON_COMPLETION");
  if (contracts.length === 0 || net.length === 0) {
    return { terms: "DUE_ON_COMPLETION", days: 0 };
  }
  const days = Math.max(...net.map((contract) => termsDays("NET_30", contract.netTermsDays)));
  return { terms: "NET_30", days };
}

export function paymentTermsLabel(terms: PaymentTermsCode, days: number): string {
  if (terms === "DUE_ON_COMPLETION") return "Due on completion";
  return `Net ${days}`;
}

/**
 * Due date is the invoice date plus the term length, on the Toronto calendar.
 * Stored at 12:00 UTC so a UTC date format shows that same calendar day.
 * The billing period end is not an input.
 */
export function dueAtFromInvoiceDate(invoiceDate: Date, days: number): Date {
  const parts = zonedParts(invoiceDate, TORONTO_TZ);
  const add = Number.isFinite(days) ? Math.max(0, Math.round(days)) : 0;
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day + add, 12, 0, 0));
}
