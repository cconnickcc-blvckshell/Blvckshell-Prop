"use server";

import { requireAdmin } from "@/server/guards/rbac";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updatePricingPolicy(
  policyId: string,
  data: {
    anchorBillingRateCentsPerHour?: number;
    minimumMonthlyRevenueCents?: number;
    targetMarginBps?: number;
    stressMarginBps?: number;
    minStressMarginBps?: number;
    subPayoutCeilingCentsPerHour?: number;
    addonBillingRateCentsPerHour?: number;
    addonMinMarginBps?: number;
    defaultTravelMinutesPerVisit?: number;
    defaultMonthlySupplyCostCents?: number;
    defaultWinterMinutesPerVisitDelta?: number;
    daysValid?: number;
    winterStartMonth?: number;
    winterEndMonth?: number;
  }
) {
  await requireAdmin();
  await prisma.pricingPolicy.update({ where: { id: policyId }, data });
  revalidatePath("/admin/pricing");
  return { ok: true };
}

export async function createPricingPolicy(data: {
  cityCode: string;
  effectiveDate: string;
  anchorBillingRateCentsPerHour: number;
  minimumMonthlyRevenueCents: number;
  targetMarginBps: number;
  stressMarginBps: number;
  minStressMarginBps: number;
  subPayoutCeilingCentsPerHour: number;
  addonBillingRateCentsPerHour: number;
  addonMinMarginBps: number;
  defaultTravelMinutesPerVisit: number;
  defaultWinterMinutesPerVisitDelta: number;
  daysValid: number;
  winterStartMonth: number;
  winterEndMonth: number;
}) {
  await requireAdmin();

  const existing = await prisma.pricingPolicy.findFirst({
    where: { cityCode: data.cityCode, effectiveDate: new Date(data.effectiveDate) },
    orderBy: { version: "desc" },
  });

  const version = (existing?.version ?? 0) + 1;

  const policy = await prisma.pricingPolicy.create({
    data: {
      cityCode: data.cityCode,
      effectiveDate: new Date(data.effectiveDate),
      version,
      anchorBillingRateCentsPerHour: data.anchorBillingRateCentsPerHour,
      minimumMonthlyRevenueCents: data.minimumMonthlyRevenueCents,
      targetMarginBps: data.targetMarginBps,
      stressMarginBps: data.stressMarginBps,
      minStressMarginBps: data.minStressMarginBps,
      subPayoutCeilingCentsPerHour: data.subPayoutCeilingCentsPerHour,
      addonBillingRateCentsPerHour: data.addonBillingRateCentsPerHour,
      addonMinMarginBps: data.addonMinMarginBps,
      defaultTravelMinutesPerVisit: data.defaultTravelMinutesPerVisit,
      defaultWinterMinutesPerVisitDelta: data.defaultWinterMinutesPerVisitDelta,
      daysValid: data.daysValid,
      winterStartMonth: data.winterStartMonth,
      winterEndMonth: data.winterEndMonth,
      riskRules: {},
    },
  });

  revalidatePath("/admin/pricing");
  return { ok: true, policyId: policy.id };
}
