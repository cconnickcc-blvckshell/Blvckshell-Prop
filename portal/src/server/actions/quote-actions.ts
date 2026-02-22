"use server";

import type { QuoteAreaType, BuildingClass } from "@prisma/client";
import { requireAdmin, requireFounder } from "@/server/guards/rbac";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { computeQuoteSnapshot, persistQuoteSnapshot } from "@/server/pricing/quote-engine";
import {
  computeAreaMinutesFromPreset,
  clampMinutes,
  type AreaMeasurements,
} from "@/server/pricing/area-presets";

const MUTABLE_QUOTE_STATUSES = ["DRAFT", "READY_FOR_REVIEW"] as const;
const MAX_MINUTES = 999;

function isMutableStatus(status: string): boolean {
  return MUTABLE_QUOTE_STATUSES.includes(status as (typeof MUTABLE_QUOTE_STATUSES)[number]);
}

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

/** Update quote header fields (admin; quote must be DRAFT or READY_FOR_REVIEW). Billing rate is founder-only via overrideBillingRate. */
export type UpdateQuoteHeaderPayload = {
  visitsPerWeek?: number;
  travelMinutesPerVisit?: number;
  winterMinutesPerVisitDelta?: number;
  monthlySupplyCostCents?: number;
  expectedSubcontractorRateCentsPerHour?: number | null;
};

export async function updateQuoteHeader(
  quoteId: string,
  payload: UpdateQuoteHeaderPayload
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    select: { id: true, status: true },
  });
  if (!quote) return { ok: false, error: "Quote not found" };
  if (!isMutableStatus(quote.status)) {
    return { ok: false, error: "Quote cannot be edited; status is not DRAFT or READY_FOR_REVIEW" };
  }
  const data: Record<string, unknown> = {};
  if (payload.visitsPerWeek !== undefined) {
    const v = Number(payload.visitsPerWeek);
    if (!Number.isFinite(v) || v < 1 || v > 14) return { ok: false, error: "Visits per week must be 1–14" };
    data.visitsPerWeek = Math.round(v);
  }
  if (payload.travelMinutesPerVisit !== undefined) {
    const v = Number(payload.travelMinutesPerVisit);
    if (!Number.isFinite(v) || v < 0 || v > 999) return { ok: false, error: "Travel minutes must be 0–999" };
    data.travelMinutesPerVisit = Math.round(v);
  }
  if (payload.winterMinutesPerVisitDelta !== undefined) {
    const v = Number(payload.winterMinutesPerVisitDelta);
    if (!Number.isFinite(v) || v < -999 || v > 999) return { ok: false, error: "Winter delta must be -999–999" };
    data.winterMinutesPerVisitDelta = Math.round(v);
  }
  if (payload.monthlySupplyCostCents !== undefined) {
    const v = Number(payload.monthlySupplyCostCents);
    if (!Number.isFinite(v) || v < 0) return { ok: false, error: "Monthly supply cost must be non-negative" };
    data.monthlySupplyCostCents = Math.round(v);
  }
  if (payload.expectedSubcontractorRateCentsPerHour !== undefined) {
    const v = payload.expectedSubcontractorRateCentsPerHour;
    if (v != null && (!Number.isFinite(v) || v < 0)) {
      return { ok: false, error: "Expected subcontractor rate must be non-negative or null" };
    }
    data.expectedSubcontractorRateCentsPerHour = v == null ? null : Math.round(Number(v));
  }
  if (Object.keys(data).length === 0) return { ok: true };
  await prisma.quote.update({
    where: { id: quoteId },
    data: data as Parameters<typeof prisma.quote.update>[0]["data"],
  });
  revalidatePath(`/admin/quotes/${quoteId}`);
  revalidatePath(`/admin/quotes/${quoteId}/walkthrough`);
  revalidatePath(`/admin/quotes/${quoteId}/pricing`);
  return { ok: true };
}

/** Update quote risk factors and building class (admin; quote must be DRAFT or READY_FOR_REVIEW). */
export async function updateQuoteRiskFactors(
  quoteId: string,
  riskFactors: string[],
  buildingClass: BuildingClass | null
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    select: { id: true, status: true },
  });
  if (!quote) return { ok: false, error: "Quote not found" };
  if (!isMutableStatus(quote.status)) {
    return { ok: false, error: "Quote cannot be edited; status is not DRAFT or READY_FOR_REVIEW" };
  }
  const sanitized = riskFactors.filter((k) => typeof k === "string").slice(0, 50);
  await prisma.quote.update({
    where: { id: quoteId },
    data: { riskFactors: sanitized, buildingClass },
  });
  revalidatePath(`/admin/quotes/${quoteId}`);
  revalidatePath(`/admin/quotes/${quoteId}/walkthrough`);
  revalidatePath(`/admin/quotes/${quoteId}/pricing`);
  return { ok: true };
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

// --- QuoteAreaLine CRUD (scope mutability: DRAFT or READY_FOR_REVIEW only) ---

export type CreateQuoteAreaLinePayload = {
  type: QuoteAreaType;
  measurements: AreaMeasurements;
  computedMinutes?: number;
  overrideMinutes?: number | null;
  overrideReason?: string | null;
};

export async function createQuoteAreaLine(
  quoteId: string,
  payload: CreateQuoteAreaLinePayload
): Promise<{ ok: true; lineId: string } | { ok: false; error: string }> {
  await requireAdmin();
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    select: { id: true, status: true },
  });
  if (!quote) return { ok: false, error: "Quote not found" };
  if (!isMutableStatus(quote.status)) {
    return { ok: false, error: "Quote cannot be edited; status is not DRAFT or READY_FOR_REVIEW" };
  }

  let computedMinutes: number;
  const fromPreset = computeAreaMinutesFromPreset(payload.type, payload.measurements ?? {});
  if (fromPreset !== null) {
    computedMinutes = fromPreset;
  } else {
    const raw = payload.computedMinutes;
    if (typeof raw !== "number" || !Number.isFinite(raw)) {
      return { ok: false, error: "computedMinutes required when not using preset" };
    }
    computedMinutes = clampMinutes(raw);
  }

  if (payload.overrideMinutes != null) {
    const reason = payload.overrideReason?.trim();
    if (!reason) return { ok: false, error: "Override reason required when override minutes are set" };
    const ov = Number(payload.overrideMinutes);
    if (!Number.isFinite(ov) || ov < 0 || ov > MAX_MINUTES) {
      return { ok: false, error: "Override minutes must be between 0 and 999" };
    }
  }

  const line = await prisma.quoteAreaLine.create({
    data: {
      quoteId,
      type: payload.type,
      measurements: (payload.measurements ?? {}) as object,
      computedMinutes,
      overrideMinutes: payload.overrideMinutes ?? undefined,
      overrideReason: payload.overrideReason?.trim() || undefined,
    },
    select: { id: true },
  });
  revalidatePath(`/admin/quotes/${quoteId}`);
  revalidatePath(`/admin/quotes/${quoteId}/walkthrough`);
  return { ok: true, lineId: line.id };
}

export type UpdateQuoteAreaLinePayload = {
  type?: QuoteAreaType;
  measurements?: AreaMeasurements;
  computedMinutes?: number;
  overrideMinutes?: number | null;
  overrideReason?: string | null;
};

export async function updateQuoteAreaLine(
  lineId: string,
  payload: UpdateQuoteAreaLinePayload
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();
  const line = await prisma.quoteAreaLine.findUnique({
    where: { id: lineId },
    include: { quote: { select: { id: true, status: true } } },
  });
  if (!line) return { ok: false, error: "Area line not found" };
  if (!isMutableStatus(line.quote.status)) {
    return { ok: false, error: "Quote cannot be edited; status is not DRAFT or READY_FOR_REVIEW" };
  }

  const measurements = payload.measurements ?? (line.measurements as AreaMeasurements);
  let computedMinutes: number | undefined;
  const fromPreset = payload.type
    ? computeAreaMinutesFromPreset(payload.type, measurements)
    : computeAreaMinutesFromPreset(line.type, measurements);
  if (fromPreset !== null) {
    computedMinutes = fromPreset;
  } else if (payload.computedMinutes !== undefined) {
    computedMinutes = clampMinutes(payload.computedMinutes);
  }

  const overrideMinutes = payload.overrideMinutes !== undefined ? payload.overrideMinutes : line.overrideMinutes;
  if (overrideMinutes != null) {
    const reason = (payload.overrideReason !== undefined ? payload.overrideReason : line.overrideReason)?.trim();
    if (!reason) return { ok: false, error: "Override reason required when override minutes are set" };
    const ov = Number(overrideMinutes);
    if (!Number.isFinite(ov) || ov < 0 || ov > MAX_MINUTES) {
      return { ok: false, error: "Override minutes must be between 0 and 999" };
    }
  }

  await prisma.quoteAreaLine.update({
    where: { id: lineId },
    data: {
      ...(payload.type !== undefined && { type: payload.type }),
      ...(payload.measurements !== undefined && { measurements: payload.measurements as object }),
      ...(computedMinutes !== undefined && { computedMinutes }),
      ...(payload.overrideMinutes !== undefined && { overrideMinutes: payload.overrideMinutes ?? null }),
      ...(payload.overrideReason !== undefined && { overrideReason: payload.overrideReason?.trim() || null }),
    },
  });
  revalidatePath(`/admin/quotes/${line.quote.id}`);
  revalidatePath(`/admin/quotes/${line.quote.id}/walkthrough`);
  return { ok: true };
}

export async function deleteQuoteAreaLine(
  lineId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();
  const line = await prisma.quoteAreaLine.findUnique({
    where: { id: lineId },
    include: { quote: { select: { id: true, status: true } } },
  });
  if (!line) return { ok: false, error: "Area line not found" };
  if (!isMutableStatus(line.quote.status)) {
    return { ok: false, error: "Quote cannot be edited; status is not DRAFT or READY_FOR_REVIEW" };
  }
  await prisma.quoteAreaLine.delete({ where: { id: lineId } });
  revalidatePath(`/admin/quotes/${line.quote.id}`);
  revalidatePath(`/admin/quotes/${line.quote.id}/walkthrough`);
  return { ok: true };
}

// --- QuoteAddOnLine CRUD (price/margin computed server-side) ---

export type CreateQuoteAddOnLinePayload = {
  name: string;
  estimatedLaborMinutes: number;
  expectedPayoutCentsPerHour?: number | null;
  includedInProposal: boolean;
};

export async function createQuoteAddOnLine(
  quoteId: string,
  payload: CreateQuoteAddOnLinePayload
): Promise<{ ok: true; lineId: string } | { ok: false; error: string }> {
  await requireAdmin();
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: { pricingPolicy: true },
  });
  if (!quote) return { ok: false, error: "Quote not found" };
  if (!isMutableStatus(quote.status)) {
    return { ok: false, error: "Quote cannot be edited; status is not DRAFT or READY_FOR_REVIEW" };
  }

  const minutes = Math.max(0, Math.min(MAX_MINUTES, Math.round(payload.estimatedLaborMinutes)));
  if (minutes === 0) return { ok: false, error: "Estimated labor minutes must be positive" };

  const policy = quote.pricingPolicy;
  const billingRateCentsPerHour = policy.addonBillingRateCentsPerHour;
  const hours = minutes / 60;
  const priceCents = Math.round(hours * billingRateCentsPerHour);
  const expectedPayout = payload.expectedPayoutCentsPerHour ?? quote.expectedSubcontractorRateCentsPerHour ?? 0;
  const payoutCentsPerHour = Number.isFinite(expectedPayout) ? Math.max(0, expectedPayout) : 0;
  const laborCostCents = Math.round(hours * Math.min(payoutCentsPerHour, policy.subPayoutCeilingCentsPerHour));
  const grossCents = priceCents - laborCostCents;
  const marginBps = priceCents > 0 ? Math.round((grossCents / priceCents) * 10_000) : 0;

  if (payload.includedInProposal && marginBps < policy.addonMinMarginBps) {
    return {
      ok: false,
      error: `Add-on margin ${(marginBps / 100).toFixed(1)}% is below minimum ${(policy.addonMinMarginBps / 100).toFixed(1)}%; cannot include in proposal`,
    };
  }

  const line = await prisma.quoteAddOnLine.create({
    data: {
      quoteId,
      name: payload.name.trim().slice(0, 255) || "Add-on",
      estimatedLaborMinutes: minutes,
      billingRateCentsPerHour,
      expectedPayoutCentsPerHour: payoutCentsPerHour > 0 ? payoutCentsPerHour : null,
      priceCents,
      marginBps,
      includedInProposal: !!payload.includedInProposal,
    },
    select: { id: true },
  });
  revalidatePath(`/admin/quotes/${quoteId}`);
  revalidatePath(`/admin/quotes/${quoteId}/walkthrough`);
  return { ok: true, lineId: line.id };
}

export type UpdateQuoteAddOnLinePayload = {
  name?: string;
  estimatedLaborMinutes?: number;
  expectedPayoutCentsPerHour?: number | null;
  includedInProposal?: boolean;
};

export async function updateQuoteAddOnLine(
  lineId: string,
  payload: UpdateQuoteAddOnLinePayload
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();
  const line = await prisma.quoteAddOnLine.findUnique({
    where: { id: lineId },
    include: { quote: { include: { pricingPolicy: true } } },
  });
  if (!line) return { ok: false, error: "Add-on line not found" };
  if (!isMutableStatus(line.quote.status)) {
    return { ok: false, error: "Quote cannot be edited; status is not DRAFT or READY_FOR_REVIEW" };
  }

  const minutes =
    payload.estimatedLaborMinutes !== undefined
      ? Math.max(0, Math.min(MAX_MINUTES, Math.round(payload.estimatedLaborMinutes)))
      : line.estimatedLaborMinutes;
  if (minutes === 0) return { ok: false, error: "Estimated labor minutes must be positive" };

  const policy = line.quote.pricingPolicy;
  const billingRateCentsPerHour = policy.addonBillingRateCentsPerHour;
  const hours = minutes / 60;
  const priceCents = Math.round(hours * billingRateCentsPerHour);
  const expectedPayout =
    payload.expectedPayoutCentsPerHour !== undefined
      ? payload.expectedPayoutCentsPerHour
      : line.expectedPayoutCentsPerHour;
  const payoutCentsPerHour =
    expectedPayout != null && Number.isFinite(expectedPayout) ? Math.max(0, expectedPayout) : 0;
  const laborCostCents = Math.round(hours * Math.min(payoutCentsPerHour, policy.subPayoutCeilingCentsPerHour));
  const grossCents = priceCents - laborCostCents;
  const marginBps = priceCents > 0 ? Math.round((grossCents / priceCents) * 10_000) : 0;

  const includedInProposal = payload.includedInProposal !== undefined ? payload.includedInProposal : line.includedInProposal;
  if (includedInProposal && marginBps < policy.addonMinMarginBps) {
    return {
      ok: false,
      error: `Add-on margin ${(marginBps / 100).toFixed(1)}% is below minimum ${(policy.addonMinMarginBps / 100).toFixed(1)}%; cannot include in proposal`,
    };
  }

  await prisma.quoteAddOnLine.update({
    where: { id: lineId },
    data: {
      ...(payload.name !== undefined && { name: payload.name.trim().slice(0, 255) || line.name }),
      estimatedLaborMinutes: minutes,
      ...(payload.expectedPayoutCentsPerHour !== undefined && {
        expectedPayoutCentsPerHour: payload.expectedPayoutCentsPerHour ?? null,
      }),
      priceCents,
      marginBps,
      includedInProposal,
    },
  });
  revalidatePath(`/admin/quotes/${line.quote.id}`);
  revalidatePath(`/admin/quotes/${line.quote.id}/walkthrough`);
  return { ok: true };
}

export async function deleteQuoteAddOnLine(
  lineId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();
  const line = await prisma.quoteAddOnLine.findUnique({
    where: { id: lineId },
    include: { quote: { select: { id: true, status: true } } },
  });
  if (!line) return { ok: false, error: "Add-on line not found" };
  if (!isMutableStatus(line.quote.status)) {
    return { ok: false, error: "Quote cannot be edited; status is not DRAFT or READY_FOR_REVIEW" };
  }
  await prisma.quoteAddOnLine.delete({ where: { id: lineId } });
  revalidatePath(`/admin/quotes/${line.quote.id}`);
  revalidatePath(`/admin/quotes/${line.quote.id}/walkthrough`);
  return { ok: true };
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
