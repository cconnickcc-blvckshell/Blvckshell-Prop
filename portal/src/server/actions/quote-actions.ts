"use server";

import { requireAdmin, requireFounder } from "@/server/guards/rbac";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { computeQuoteSnapshot, persistQuoteSnapshot } from "@/server/pricing/quote-engine";

export async function listQuotes(filters?: { status?: string }) {
  await requireAdmin();
  const quotes = await prisma.quote.findMany({
    where: filters?.status ? { status: filters.status as any } : undefined,
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      siteId: true,
      status: true,
      expiresAt: true,
      visitsPerWeek: true,
      billingRateCentsPerHour: true,
      createdAt: true,
      site: { select: { name: true, address: true } },
      pricingPolicy: { select: { cityCode: true, effectiveDate: true } },
    },
  });
  return quotes;
}

export async function getPricingPolicies() {
  await requireAdmin();
  return prisma.pricingPolicy.findMany({
    orderBy: [{ cityCode: "asc" }, { effectiveDate: "desc" }],
    select: {
      id: true,
      cityCode: true,
      effectiveDate: true,
      version: true,
      anchorBillingRateCentsPerHour: true,
      minimumMonthlyRevenueCents: true,
      daysValid: true,
    },
  });
}

export async function getSitesForQuote() {
  await requireAdmin();
  return prisma.site.findMany({
    where: { lifecycleStatus: { in: ["PROSPECT", "ACTIVE"] } },
    orderBy: { name: "asc" },
    select: { id: true, name: true, address: true, clientOrganizationId: true },
  });
}

export async function createQuote(siteId: string, pricingPolicyId: string) {
  await requireAdmin();
  const policy = await prisma.pricingPolicy.findUnique({
    where: { id: pricingPolicyId },
  });
  const site = await prisma.site.findUnique({ where: { id: siteId } });
  if (!policy || !site) return { ok: false, error: "Site or policy not found" };

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + policy.daysValid);

  const quote = await prisma.quote.create({
    data: {
      siteId,
      pricingPolicyId,
      status: "DRAFT",
      expiresAt,
      visitsPerWeek: 4,
      billingRateCentsPerHour: policy.anchorBillingRateCentsPerHour,
      travelMinutesPerVisit: policy.defaultTravelMinutesPerVisit,
      monthlySupplyCostCents: policy.defaultMonthlySupplyCostCents ?? 0,
      winterMinutesPerVisitDelta: policy.defaultWinterMinutesPerVisitDelta,
    },
  });
  revalidatePath("/admin/quotes");
  return { ok: true, quoteId: quote.id };
}

export async function getQuote(quoteId: string) {
  await requireAdmin();
  return prisma.quote.findUnique({
    where: { id: quoteId },
    include: {
      site: { select: { id: true, name: true, address: true } },
      pricingPolicy: true,
      areaLines: true,
      addOnLines: true,
      snapshots: { orderBy: { snapshotVersion: "desc" }, take: 1 },
    },
  });
}

export async function computeAndPersistSnapshot(quoteId: string) {
  const user = await requireAdmin();
  const result = await computeQuoteSnapshot(quoteId);
  if (!result.ok) return result;
  const persist = await persistQuoteSnapshot(result.draft);
  if (!persist.ok) return persist;
  revalidatePath(`/admin/quotes/${quoteId}`);
  revalidatePath(`/admin/quotes/${quoteId}/pricing`);
  return { ok: true as const, snapshotId: persist.id };
}

export async function transitionQuoteToSent(quoteId: string) {
  const user = await requireAdmin();
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: { snapshots: { orderBy: { snapshotVersion: "desc" }, take: 1 } },
  });
  if (!quote) return { ok: false, error: "Quote not found" };
  if (quote.status !== "DRAFT" && quote.status !== "READY_FOR_REVIEW") {
    return { ok: false, error: "Quote must be DRAFT or READY_FOR_REVIEW to send" };
  }
  if (new Date() > quote.expiresAt) {
    return { ok: false, error: "Quote expired; regenerate snapshot with current policy before sending" };
  }
  const latest = quote.snapshots[0];
  if (!latest) return { ok: false, error: "No snapshot; compute snapshot first" };
  if (!latest.passesBaseGate || !latest.passesStressGate || !latest.passesRevenueFloor) {
    return { ok: false, error: "Gates not passed; cannot send quote" };
  }
  await prisma.quote.update({
    where: { id: quoteId },
    data: { status: "SENT" },
  });
  await prisma.auditLog.create({
    data: {
      actorUserId: user.id,
      entityType: "Quote",
      entityId: quoteId,
      fromState: quote.status,
      toState: "SENT",
      metadata: { snapshotVersion: latest.snapshotVersion },
    },
  });
  revalidatePath("/admin/quotes");
  revalidatePath(`/admin/quotes/${quoteId}`);
  return { ok: true };
}

/** Founder-only: override billing rate (requires reason + AuditLog) */
export async function overrideBillingRate(
  quoteId: string,
  billingRateCentsPerHour: number,
  reason: string
) {
  const user = await requireFounder();
  await prisma.quote.update({
    where: { id: quoteId },
    data: { billingRateCentsPerHour, billingRateOverrideReason: reason },
  });
  await prisma.auditLog.create({
    data: {
      actorUserId: user.id,
      entityType: "Quote",
      entityId: quoteId,
      metadata: { action: "billingRateOverride", reason, billingRateCentsPerHour },
    },
  });
  revalidatePath(`/admin/quotes/${quoteId}`);
  revalidatePath(`/admin/quotes/${quoteId}/pricing`);
  return { ok: true };
}

/** Founder-only: revenue floor override (reason + AuditLog) */
export async function overrideRevenueFloor(quoteId: string, reason: string) {
  const user = await requireFounder();
  await prisma.quote.update({
    where: { id: quoteId },
    data: { revenueFloorOverrideReason: reason },
  });
  await prisma.auditLog.create({
    data: {
      actorUserId: user.id,
      entityType: "Quote",
      entityId: quoteId,
      metadata: { action: "revenueFloorOverride", reason },
    },
  });
  revalidatePath(`/admin/quotes/${quoteId}`);
  return { ok: true };
}

export async function getQuoteForProposal(quoteId: string) {
  await requireAdmin();
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: {
      site: true,
      snapshots: { orderBy: { snapshotVersion: "desc" }, take: 1 },
      areaLines: true,
      addOnLines: true,
    },
  });
  return quote;
}
