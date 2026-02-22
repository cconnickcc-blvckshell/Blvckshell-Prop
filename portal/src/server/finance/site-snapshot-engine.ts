/**
 * Site performance snapshot engine: per-site finance visibility.
 * Aggregates revenue (ISSUED/PAID invoices), credits, payouts, supplies, recleans, AR aging.
 * CLOSED snapshots are immutable; founder recompute creates new version + AuditLog.
 */
import { prisma } from "@/lib/prisma";
const MONTH_END_DAY = 1; // first day of month

export type SitePerformanceSnapshotDraft = {
  siteId: string;
  month: Date;
  version: number;
  status: "OPEN";
  baseRevenueCents: number;
  addOnRevenueCents: number;
  creditsCents: number;
  netRevenueCents: number;
  payoutCogsCents: number;
  supplyCogsCents: number;
  totalCogsCents: number;
  grossProfitCents: number;
  grossMarginBps: number;
  payoutRatioBps: number;
  addOnPayoutCogsCents: number;
  addOnGrossMarginBps: number;
  recleanCount: number;
  rejectedChecklistCount: number;
  arOutstandingCents: number;
  ar_0_30_cents: number;
  ar_31_60_cents: number;
  ar_61_90_cents: number;
  ar_90_plus_cents: number;
};

export type ComputeSiteSnapshotResult =
  | { ok: true; draft: SitePerformanceSnapshotDraft }
  | { ok: false; error: string };

/**
 * Compute a site performance snapshot for a given month.
 * Revenue from InvoiceLineItems (invoice status Sent/Paid), credits from BillingAdjustment,
 * COGS from PayoutLine + SiteSupplyAllocation, quality from Job fields, AR from outstanding invoices.
 */
export async function computeSiteSnapshot(params: {
  siteId: string;
  month: Date;
}): Promise<ComputeSiteSnapshotResult> {
  const { siteId, month } = params;
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);

  const site = await prisma.site.findUnique({
    where: { id: siteId },
    select: { id: true },
  });
  if (!site) return { ok: false, error: "Site not found" };

  // Revenue: line items for invoices in Sent/Paid, period overlaps month, for this site
  const lineItems = await prisma.invoiceLineItem.findMany({
    where: {
      siteId,
      invoice: {
        status: { in: ["Sent", "Paid"] },
        periodStart: { lte: monthEnd },
        periodEnd: { gte: monthStart },
      },
    },
    select: {
      amountCents: true,
      revenueCategory: true,
    },
  });

  let baseRevenueCents = 0;
  let addOnRevenueCents = 0;
  let otherRevenueCents = 0;
  for (const line of lineItems) {
    if (line.revenueCategory === "BASE_RECURRING") baseRevenueCents += line.amountCents;
    else if (line.revenueCategory === "ADD_ON") addOnRevenueCents += line.amountCents;
    else otherRevenueCents += line.amountCents;
  }

  // Credits/charges: BillingAdjustment for this site in month (by invoice period or createdAt)
  const adjustments = await prisma.billingAdjustment.findMany({
    where: {
      siteId,
      status: { in: ["Approved", "Applied"] },
      createdAt: { gte: monthStart, lte: monthEnd },
    },
    select: { amountCents: true, adjustmentCategory: true },
  });
  let creditsCents = 0;
  for (const a of adjustments) {
    if (a.adjustmentCategory === "CREDIT") creditsCents += a.amountCents;
    else creditsCents -= a.amountCents;
  }
  const netRevenueCents =
    baseRevenueCents + addOnRevenueCents + otherRevenueCents - creditsCents;

  // Payout COGS: PayoutLine for jobs at this site in month
  const payoutLines = await prisma.payoutLine.findMany({
    where: {
      job: {
        siteId,
        scheduledStart: { gte: monthStart, lte: monthEnd },
      },
    },
    select: { amountCents: true },
  });
  const payoutCogsCents = payoutLines.reduce((s, p) => s + p.amountCents, 0);

  // Add-on payout: could be from line items tagged ADD_ON and associated payout; simplified as 0 here unless we track add-on jobs
  const addOnPayoutCogsCents = 0;
  const addOnGrossMarginBps =
    addOnRevenueCents > 0 && addOnPayoutCogsCents < addOnRevenueCents
      ? Math.round(
          ((addOnRevenueCents - addOnPayoutCogsCents) / addOnRevenueCents) * 10_000
        )
      : 0;

  // Supply COGS: SiteSupplyAllocation for site + month
  const supplyAlloc = await prisma.siteSupplyAllocation.findFirst({
    where: { siteId, month: monthStart },
    select: { amountCents: true },
  });
  const supplyCogsCents = supplyAlloc?.amountCents ?? 0;

  const totalCogsCents = payoutCogsCents + supplyCogsCents;
  const grossProfitCents = netRevenueCents - totalCogsCents;
  const grossMarginBps =
    netRevenueCents > 0
      ? Math.round((grossProfitCents / netRevenueCents) * 10_000)
      : 0;
  const payoutRatioBps =
    netRevenueCents > 0
      ? Math.round((payoutCogsCents / netRevenueCents) * 10_000)
      : 0;

  // Quality: recleans and rejected checklists in month
  const recleanCount = await prisma.job.count({
    where: {
      siteId,
      isReclean: true,
      scheduledStart: { gte: monthStart, lte: monthEnd },
    },
  });
  const rejectedChecklistCount = await prisma.job.count({
    where: {
      siteId,
      qualityRejectedAt: { not: null },
      scheduledStart: { gte: monthStart, lte: monthEnd },
    },
  });

  // AR aging: outstanding invoices (Sent, not Paid) with line items for this site
  const outstandingInvoices = await prisma.invoice.findMany({
    where: {
      status: "Sent",
      lineItems: { some: { siteId } },
    },
    select: {
      issuedAt: true,
      lineItems: {
        where: { siteId },
        select: { amountCents: true },
      },
    },
  });
  const now = new Date();
  let arOutstandingCents = 0;
  let ar_0_30_cents = 0;
  let ar_31_60_cents = 0;
  let ar_61_90_cents = 0;
  let ar_90_plus_cents = 0;
  for (const inv of outstandingInvoices) {
    const amount = inv.lineItems.reduce((s, l) => s + l.amountCents, 0);
    if (amount <= 0) continue;
    const issuedAt = inv.issuedAt ?? null;
    if (!issuedAt) continue;
    arOutstandingCents += amount;
    const days = Math.floor((now.getTime() - issuedAt.getTime()) / (24 * 60 * 60 * 1000));
    if (days <= 30) ar_0_30_cents += amount;
    else if (days <= 60) ar_31_60_cents += amount;
    else if (days <= 90) ar_61_90_cents += amount;
    else ar_90_plus_cents += amount;
  }

  const existing = await prisma.sitePerformanceSnapshot.findFirst({
    where: { siteId, month: monthStart },
    orderBy: { version: "desc" },
    select: { version: true, status: true },
  });
  if (existing?.status === "CLOSED") {
    return { ok: false, error: "Snapshot is CLOSED; cannot mutate. Create new version with founder recompute." };
  }
  const version = (existing?.version ?? 0) + 1;

  const draft: SitePerformanceSnapshotDraft = {
    siteId,
    month: monthStart,
    version,
    status: "OPEN",
    baseRevenueCents,
    addOnRevenueCents,
    creditsCents,
    netRevenueCents,
    payoutCogsCents,
    supplyCogsCents,
    totalCogsCents,
    grossProfitCents,
    grossMarginBps,
    payoutRatioBps,
    addOnPayoutCogsCents,
    addOnGrossMarginBps,
    recleanCount,
    rejectedChecklistCount,
    arOutstandingCents,
    ar_0_30_cents,
    ar_31_60_cents,
    ar_61_90_cents,
    ar_90_plus_cents,
  };

  return { ok: true, draft };
}

function startOfMonth(d: Date): Date {
  const y = d.getFullYear();
  const m = d.getMonth();
  return new Date(y, m, MONTH_END_DAY, 0, 0, 0, 0);
}

function endOfMonth(d: Date): Date {
  const y = d.getFullYear();
  const m = d.getMonth();
  const lastDay = new Date(y, m + 1, 0).getDate();
  return new Date(y, m, lastDay, 23, 59, 59, 999);
}

/**
 * Persist a computed site snapshot. If a CLOSED snapshot exists for site+month, do not overwrite.
 */
export async function persistSiteSnapshot(
  draft: SitePerformanceSnapshotDraft,
  computedByUserId: string
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const existingClosed = await prisma.sitePerformanceSnapshot.findFirst({
    where: { siteId: draft.siteId, month: draft.month, status: "CLOSED" },
    select: { id: true },
  });
  if (existingClosed) {
    return { ok: false, error: "A CLOSED snapshot exists for this site+month; immutable." };
  }
  try {
    const row = await prisma.sitePerformanceSnapshot.create({
      data: {
        siteId: draft.siteId,
        month: draft.month,
        version: draft.version,
        status: draft.status,
        baseRevenueCents: draft.baseRevenueCents,
        addOnRevenueCents: draft.addOnRevenueCents,
        creditsCents: draft.creditsCents,
        netRevenueCents: draft.netRevenueCents,
        payoutCogsCents: draft.payoutCogsCents,
        supplyCogsCents: draft.supplyCogsCents,
        totalCogsCents: draft.totalCogsCents,
        grossProfitCents: draft.grossProfitCents,
        grossMarginBps: draft.grossMarginBps,
        payoutRatioBps: draft.payoutRatioBps,
        addOnPayoutCogsCents: draft.addOnPayoutCogsCents,
        addOnGrossMarginBps: draft.addOnGrossMarginBps,
        recleanCount: draft.recleanCount,
        rejectedChecklistCount: draft.rejectedChecklistCount,
        arOutstandingCents: draft.arOutstandingCents,
        ar_0_30_cents: draft.ar_0_30_cents,
        ar_31_60_cents: draft.ar_31_60_cents,
        ar_61_90_cents: draft.ar_61_90_cents,
        ar_90_plus_cents: draft.ar_90_plus_cents,
        computedByUserId,
      },
      select: { id: true },
    });
    return { ok: true, id: row.id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to persist site snapshot";
    return { ok: false, error: msg };
  }
}
