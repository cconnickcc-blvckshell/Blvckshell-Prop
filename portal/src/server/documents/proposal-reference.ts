import type { Prisma } from "@prisma/client";
import { TORONTO_TZ, zonedParts } from "@/lib/toronto-time";

/** BS-YYYY-### using the Toronto calendar year. Existing references are never rewritten. */
export function proposalYearKey(when: Date): string {
  return String(zonedParts(when, TORONTO_TZ).year);
}

export function formatProposalReference(year: string, sequence: number): string {
  const seq = Math.max(1, Math.round(sequence));
  return `BS-${year}-${String(seq).padStart(3, "0")}`;
}

export function isProposalReference(value: string): boolean {
  return /^BS-\d{4}-\d{3,}$/.test(value);
}

export async function allocateProposalReference(
  tx: Prisma.TransactionClient,
  when: Date
): Promise<string> {
  const year = proposalYearKey(when);
  const rows = await tx.$queryRaw<Array<{ next: number }>>`
    INSERT INTO "DocumentDailySequence" ("scope", "day", "next")
    VALUES ('proposal', ${year}, 1)
    ON CONFLICT ("scope", "day")
    DO UPDATE SET "next" = "DocumentDailySequence"."next" + 1
    RETURNING "next"
  `;
  const next = Number(rows[0]?.next);
  if (!Number.isFinite(next) || next < 1) {
    throw new Error("Could not allocate a proposal reference");
  }
  return formatProposalReference(year, next);
}
