/**
 * Quote engine: server-side only. All pricing math is authoritative here.
 * No manual final monthly price; quotes are derived → validated → snapshot → frozen.
 */
import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

const WEEKS_PER_MONTH = 4.33;
const STRESS_REVENUE_FACTOR = 0.9;
const STRESS_HOURS_FACTOR = 1.1;

export type QuoteSnapshotDraft = {
  quoteId: string;
  snapshotVersion: number;
  pricingPolicyCityCode: string;
  pricingPolicyEffectiveDate: Date;
  pricingPolicyVersion: number;
  billingRateCentsPerHour: number;
  riskMultiplierBps: number;
  minutesPerVisitBase: number;
  minutesPerVisitTravel: number;
  minutesPerVisitWinterDelta: number;
  minutesPerVisitTotal: number;
  hoursPerVisit: Decimal;
  monthlyHours: Decimal;
  baseRevenueCents: number;
  riskAdjustedRevenueCents: number;
  monthlySupplyCostCents: number;
  grossProfitCents: number;
  grossMarginBps: number;
  stressGrossMarginBps: number;
  allowedPayoutCentsPerHourAtTarget: number;
  allowedPayoutCentsPerHourAtStress: number;
  passesBaseGate: boolean;
  passesStressGate: boolean;
  passesRevenueFloor: boolean;
  confidenceScore: number;
  confidenceBand: string;
};

export type ComputeQuoteSnapshotResult =
  | { ok: true; draft: QuoteSnapshotDraft }
  | { ok: false; error: string };

/**
 * Compute a quote snapshot (draft) from current quote + policy.
 * Risk multipliers applied before margin math; supplies as COGS.
 * Caller persists the snapshot and enforces gates before SENT.
 */
export async function computeQuoteSnapshot(quoteId: string): Promise<ComputeQuoteSnapshotResult> {
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: {
      areaLines: true,
      addOnLines: true,
      pricingPolicy: true,
    },
  });
  if (!quote) return { ok: false, error: "Quote not found" };

  const policy = quote.pricingPolicy;

  // 1) Base minutes = sum(finalMinutes) for area lines
  const baseMinutes = quote.areaLines.reduce((sum, line) => {
    const finalMinutes = line.overrideMinutes ?? line.computedMinutes;
    return sum + finalMinutes;
  }, 0);

  const travelMinutes = quote.travelMinutesPerVisit;
  const winterDelta = quote.winterMinutesPerVisitDelta;
  const totalMinutesPerVisit = baseMinutes + travelMinutes + winterDelta;
  const hoursPerVisit = totalMinutesPerVisit / 60;
  const monthlyHours = hoursPerVisit * quote.visitsPerWeek * WEEKS_PER_MONTH;

  if (monthlyHours <= 0) {
    return { ok: false, error: "Total monthly hours must be positive" };
  }

  // 2) Base revenue and risk-adjusted revenue (risk before margin)
  const billingRateCentsPerHour = quote.billingRateCentsPerHour;
  const baseRevenueCents = Math.round(monthlyHours * billingRateCentsPerHour);
  const riskMultiplierBps = getRiskMultiplierBps(quote, policy);
  const riskAdjustedRevenueCents = Math.round(
    baseRevenueCents * (1 + riskMultiplierBps / 10_000)
  );

  const monthlySupplyCostCents = quote.monthlySupplyCostCents;

  // 3) COGS ceiling from target margin; labor ceiling = cogsCeiling - supplies
  const targetMarginBps = policy.targetMarginBps;
  const cogsCeilingCents = Math.round(
    riskAdjustedRevenueCents * (1 - targetMarginBps / 10_000)
  );
  let laborCogsCeilingCents = cogsCeilingCents - monthlySupplyCostCents;
  if (laborCogsCeilingCents < 0) {
    return { ok: false, error: "Supply cost exceeds COGS ceiling at target margin" };
  }
  const allowedPayoutCentsPerHourAtTarget = Math.round(
    laborCogsCeilingCents / monthlyHours
  );

  // 4) Stress scenario: revenue * 0.9, hours * 1.1
  const stressRevenueCents = Math.round(riskAdjustedRevenueCents * STRESS_REVENUE_FACTOR);
  const stressMonthlyHours = monthlyHours * STRESS_HOURS_FACTOR;
  const stressLaborCogsCeilingCents =
    Math.round(stressRevenueCents * (1 - policy.minStressMarginBps / 10_000)) -
    monthlySupplyCostCents;
  const allowedPayoutCentsPerHourAtStress =
    stressLaborCogsCeilingCents > 0 && stressMonthlyHours > 0
      ? Math.round(stressLaborCogsCeilingCents / stressMonthlyHours)
      : 0;

  const totalCogsCents = monthlySupplyCostCents + Math.round(allowedPayoutCentsPerHourAtTarget * monthlyHours);
  const grossProfitCents = riskAdjustedRevenueCents - totalCogsCents;
  const grossMarginBps =
    riskAdjustedRevenueCents > 0
      ? Math.round((grossProfitCents / riskAdjustedRevenueCents) * 10_000)
      : 0;

  const stressTotalCogsCents =
    monthlySupplyCostCents +
    (stressMonthlyHours > 0 ? Math.round(allowedPayoutCentsPerHourAtStress * stressMonthlyHours) : 0);
  const stressGrossProfitCents = stressRevenueCents - stressTotalCogsCents;
  const stressGrossMarginBps =
    stressRevenueCents > 0
      ? Math.round((stressGrossProfitCents / stressRevenueCents) * 10_000)
      : 0;

  const passesBaseGate = grossMarginBps >= policy.targetMarginBps;
  const passesStressGate = stressGrossMarginBps >= policy.minStressMarginBps;
  const passesRevenueFloor =
    riskAdjustedRevenueCents >= policy.minimumMonthlyRevenueCents;

  const { confidenceScore, confidenceBand } = computeConfidence(quote);

  const nextVersion =
    (await prisma.quoteSnapshot.findFirst({
      where: { quoteId },
      orderBy: { snapshotVersion: "desc" },
      select: { snapshotVersion: true },
    }))?.snapshotVersion ?? 0;

  const draft: QuoteSnapshotDraft = {
    quoteId,
    snapshotVersion: nextVersion + 1,
    pricingPolicyCityCode: policy.cityCode,
    pricingPolicyEffectiveDate: policy.effectiveDate,
    pricingPolicyVersion: policy.version,
    billingRateCentsPerHour,
    riskMultiplierBps,
    minutesPerVisitBase: baseMinutes,
    minutesPerVisitTravel: travelMinutes,
    minutesPerVisitWinterDelta: winterDelta,
    minutesPerVisitTotal: totalMinutesPerVisit,
    hoursPerVisit: new Decimal(hoursPerVisit.toFixed(4)),
    monthlyHours: new Decimal(monthlyHours.toFixed(4)),
    baseRevenueCents,
    riskAdjustedRevenueCents,
    monthlySupplyCostCents,
    grossProfitCents,
    grossMarginBps,
    stressGrossMarginBps,
    allowedPayoutCentsPerHourAtTarget,
    allowedPayoutCentsPerHourAtStress,
    passesBaseGate,
    passesStressGate,
    passesRevenueFloor,
    confidenceScore,
    confidenceBand,
  };

  return { ok: true, draft };
}

function getRiskMultiplierBps(
  quote: { id: string },
  policy: { riskRules: unknown }
): number {
  const rules = policy.riskRules as Record<string, number> | null;
  if (!rules || typeof rules !== "object") return 0;
  // Default factor key if not specified on quote; could be extended
  const factor = "default";
  return typeof rules[factor] === "number" ? rules[factor] : 0;
}

function computeConfidence(quote: {
  areaLines: { overrideMinutes: number | null; overrideReason: string | null }[];
  billingRateOverrideReason: string | null;
  revenueFloorOverrideReason: string | null;
  expectedSubcontractorRateCentsPerHour: number | null;
  payoutOverrideReason: string | null;
}): { confidenceScore: number; confidenceBand: string } {
  let score = 100;
  const overrides: string[] = [];
  if (quote.billingRateOverrideReason) {
    score -= 15;
    overrides.push("billing rate");
  }
  if (quote.revenueFloorOverrideReason) {
    score -= 15;
    overrides.push("revenue floor");
  }
  if (quote.expectedSubcontractorRateCentsPerHour != null && quote.payoutOverrideReason) {
    score -= 15;
    overrides.push("payout");
  }
  const areaOverrides = quote.areaLines.filter((l) => l.overrideMinutes != null && l.overrideReason);
  if (areaOverrides.length > 0) {
    score -= Math.min(20, areaOverrides.length * 5);
    overrides.push("area minutes");
  }
  score = Math.max(0, score);

  let band = "high";
  if (score < 60) band = "low";
  else if (score < 80) band = "medium";

  return { confidenceScore: score, confidenceBand: band };
}

/**
 * Persist a computed snapshot (call after computeQuoteSnapshot).
 * Caller must enforce: SENT only if gates pass and not expired.
 */
export async function persistQuoteSnapshot(
  draft: QuoteSnapshotDraft
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  try {
    const row = await prisma.quoteSnapshot.create({
      data: {
        quoteId: draft.quoteId,
        snapshotVersion: draft.snapshotVersion,
        pricingPolicyCityCode: draft.pricingPolicyCityCode,
        pricingPolicyEffectiveDate: draft.pricingPolicyEffectiveDate,
        pricingPolicyVersion: draft.pricingPolicyVersion,
        billingRateCentsPerHour: draft.billingRateCentsPerHour,
        riskMultiplierBps: draft.riskMultiplierBps,
        minutesPerVisitBase: draft.minutesPerVisitBase,
        minutesPerVisitTravel: draft.minutesPerVisitTravel,
        minutesPerVisitWinterDelta: draft.minutesPerVisitWinterDelta,
        minutesPerVisitTotal: draft.minutesPerVisitTotal,
        hoursPerVisit: draft.hoursPerVisit,
        monthlyHours: draft.monthlyHours,
        baseRevenueCents: draft.baseRevenueCents,
        riskAdjustedRevenueCents: draft.riskAdjustedRevenueCents,
        monthlySupplyCostCents: draft.monthlySupplyCostCents,
        grossProfitCents: draft.grossProfitCents,
        grossMarginBps: draft.grossMarginBps,
        stressGrossMarginBps: draft.stressGrossMarginBps,
        allowedPayoutCentsPerHourAtTarget: draft.allowedPayoutCentsPerHourAtTarget,
        allowedPayoutCentsPerHourAtStress: draft.allowedPayoutCentsPerHourAtStress,
        passesBaseGate: draft.passesBaseGate,
        passesStressGate: draft.passesStressGate,
        passesRevenueFloor: draft.passesRevenueFloor,
        confidenceScore: draft.confidenceScore,
        confidenceBand: draft.confidenceBand,
      },
      select: { id: true },
    });
    return { ok: true, id: row.id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to persist snapshot";
    return { ok: false, error: msg };
  }
}
