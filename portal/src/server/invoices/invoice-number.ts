import type { Prisma } from "@prisma/client";
import { TORONTO_TZ, zonedParts } from "@/lib/toronto-time";

/**
 * New invoice numbers are YYMMDD plus a daily sequence, e.g. 261030001.
 * Existing numbers are never rewritten. This allocator is only for creates.
 */
export function invoiceDayKey(when: Date): string {
  const parts = zonedParts(when, TORONTO_TZ);
  const yy = String(parts.year).slice(-2);
  const mm = String(parts.month).padStart(2, "0");
  const dd = String(parts.day).padStart(2, "0");
  return `${yy}${mm}${dd}`;
}

export function formatInvoiceNumber(dayKey: string, sequence: number): string {
  const seq = Math.max(1, Math.round(sequence));
  return `${dayKey}${String(seq).padStart(3, "0")}`;
}

export async function allocateInvoiceNumber(
  tx: Prisma.TransactionClient,
  when: Date
): Promise<string> {
  const day = invoiceDayKey(when);
  const rows = await tx.$queryRaw<Array<{ next: number }>>`
    INSERT INTO "DocumentDailySequence" ("scope", "day", "next")
    VALUES ('invoice', ${day}, 1)
    ON CONFLICT ("scope", "day")
    DO UPDATE SET "next" = "DocumentDailySequence"."next" + 1
    RETURNING "next"
  `;
  const next = Number(rows[0]?.next);
  if (!Number.isFinite(next) || next < 1) {
    throw new Error("Could not allocate an invoice number");
  }
  return formatInvoiceNumber(day, next);
}
