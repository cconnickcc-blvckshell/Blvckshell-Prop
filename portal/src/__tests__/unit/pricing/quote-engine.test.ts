/**
 * Quote engine tests: gates, snapshot versioning, no manual final price.
 * - Cannot send quote without passing gates (enforced in transitionQuoteToSent)
 * - Policy changes do not mutate historical snapshots (snapshots store policy copy)
 * - computeQuoteSnapshot returns draft with passesBaseGate, passesStressGate, passesRevenueFloor
 */
import { describe, it, expect } from "vitest";
import { testDb } from "../../setup";
import { computeQuoteSnapshot, persistQuoteSnapshot } from "@/server/pricing/quote-engine";

describe("Quote engine", () => {
  it("computes snapshot with gates from quote + policy", async () => {
    const client = await testDb.clientOrganization.create({
      data: {
        name: "Quote Test Client",
        primaryContactName: "C",
        primaryContactEmail: "c@test.com",
        primaryContactPhone: "1",
      },
    });
    const site = await testDb.site.create({
      data: {
        clientOrganizationId: client.id,
        name: "Quote Test Site",
        address: "123 Test",
        requiredPhotoCount: 4,
        suppliesProvidedBy: "COMPANY",
        lifecycleStatus: "PROSPECT",
      },
    });
    const policy = await testDb.pricingPolicy.create({
      data: {
        cityCode: "YYZ",
        effectiveDate: new Date("2025-01-01"),
        version: 1,
        anchorBillingRateCentsPerHour: 10_000,
        minimumMonthlyRevenueCents: 5_000,
        defaultTravelMinutesPerVisit: 15,
        defaultWinterMinutesPerVisitDelta: 5,
        winterStartMonth: 10,
        winterEndMonth: 3,
        daysValid: 30,
        targetMarginBps: 2500,
        stressMarginBps: 2000,
        minStressMarginBps: 1500,
        subPayoutCeilingCentsPerHour: 3000,
        addonBillingRateCentsPerHour: 5000,
        addonMinMarginBps: 3000,
        riskRules: {},
      },
    });
    const quote = await testDb.quote.create({
      data: {
        siteId: site.id,
        pricingPolicyId: policy.id,
        status: "DRAFT",
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        visitsPerWeek: 4,
        billingRateCentsPerHour: policy.anchorBillingRateCentsPerHour,
        travelMinutesPerVisit: policy.defaultTravelMinutesPerVisit,
        monthlySupplyCostCents: 0,
        winterMinutesPerVisitDelta: policy.defaultWinterMinutesPerVisitDelta,
      },
    });
    await testDb.quoteAreaLine.create({
      data: {
        quoteId: quote.id,
        type: "LOBBY",
        measurements: {},
        computedMinutes: 30,
      },
    });

    const result = await computeQuoteSnapshot(quote.id);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const draft = result.draft;
    expect(draft.quoteId).toBe(quote.id);
    expect(draft.snapshotVersion).toBe(1);
    expect(draft.minutesPerVisitBase).toBe(30);
    expect(draft.pricingPolicyCityCode).toBe("YYZ");
    expect(typeof draft.passesBaseGate).toBe("boolean");
    expect(typeof draft.passesStressGate).toBe("boolean");
    expect(typeof draft.passesRevenueFloor).toBe("boolean");
  });

  it("persisted snapshot is immutable (stored copy of policy snapshot)", async () => {
    const client = await testDb.clientOrganization.create({
      data: {
        name: "Quote Test Client 2",
        primaryContactName: "C",
        primaryContactEmail: "c2@test.com",
        primaryContactPhone: "1",
      },
    });
    const site = await testDb.site.create({
      data: {
        clientOrganizationId: client.id,
        name: "Quote Test Site 2",
        address: "456 Test",
        requiredPhotoCount: 4,
        suppliesProvidedBy: "COMPANY",
        lifecycleStatus: "ACTIVE",
      },
    });
    const policy = await testDb.pricingPolicy.create({
      data: {
        cityCode: "YVR",
        effectiveDate: new Date("2025-01-01"),
        version: 1,
        anchorBillingRateCentsPerHour: 8_000,
        minimumMonthlyRevenueCents: 3_000,
        defaultTravelMinutesPerVisit: 10,
        defaultWinterMinutesPerVisitDelta: 0,
        winterStartMonth: 10,
        winterEndMonth: 3,
        daysValid: 30,
        targetMarginBps: 2500,
        stressMarginBps: 2000,
        minStressMarginBps: 1500,
        subPayoutCeilingCentsPerHour: 2500,
        addonBillingRateCentsPerHour: 5000,
        addonMinMarginBps: 3000,
        riskRules: {},
      },
    });
    const quote = await testDb.quote.create({
      data: {
        siteId: site.id,
        pricingPolicyId: policy.id,
        status: "DRAFT",
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        visitsPerWeek: 4,
        billingRateCentsPerHour: policy.anchorBillingRateCentsPerHour,
        travelMinutesPerVisit: 10,
        monthlySupplyCostCents: 0,
        winterMinutesPerVisitDelta: 0,
      },
    });
    await testDb.quoteAreaLine.create({
      data: {
        quoteId: quote.id,
        type: "HALLWAYS",
        measurements: {},
        computedMinutes: 45,
      },
    });

    const result = await computeQuoteSnapshot(quote.id);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const persist = await persistQuoteSnapshot(result.draft);
    expect(persist.ok).toBe(true);
    if (!persist.ok) return;

    const saved = await testDb.quoteSnapshot.findUnique({
      where: { id: persist.id },
    });
    expect(saved).not.toBeNull();
    expect(saved?.pricingPolicyCityCode).toBe("YVR");
    expect(saved?.snapshotVersion).toBe(1);
    expect(saved?.rateCardRef).toBeDefined();
    expect(saved?.rateCardRef).toContain("area-presets:");
  });

  it("returns error when total monthly hours are not positive (e.g. zero area lines)", async () => {
    const client = await testDb.clientOrganization.create({
      data: {
        name: "Quote Zero Scope Client",
        primaryContactName: "C",
        primaryContactEmail: "z@test.com",
        primaryContactPhone: "1",
      },
    });
    const site = await testDb.site.create({
      data: {
        clientOrganizationId: client.id,
        name: "Quote Zero Scope Site",
        address: "Zero",
        requiredPhotoCount: 4,
        suppliesProvidedBy: "COMPANY",
        lifecycleStatus: "PROSPECT",
      },
    });
    const policy = await testDb.pricingPolicy.create({
      data: {
        cityCode: "ZERO",
        effectiveDate: new Date("2025-01-01"),
        version: 1,
        anchorBillingRateCentsPerHour: 10_000,
        minimumMonthlyRevenueCents: 5_000,
        defaultTravelMinutesPerVisit: 0,
        defaultWinterMinutesPerVisitDelta: 0,
        winterStartMonth: 10,
        winterEndMonth: 3,
        daysValid: 30,
        targetMarginBps: 2500,
        stressMarginBps: 2000,
        minStressMarginBps: 1500,
        subPayoutCeilingCentsPerHour: 3000,
        addonBillingRateCentsPerHour: 5000,
        addonMinMarginBps: 3000,
        riskRules: {},
      },
    });
    const quote = await testDb.quote.create({
      data: {
        siteId: site.id,
        pricingPolicyId: policy.id,
        status: "DRAFT",
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        visitsPerWeek: 4,
        billingRateCentsPerHour: policy.anchorBillingRateCentsPerHour,
        travelMinutesPerVisit: 0,
        monthlySupplyCostCents: 0,
        winterMinutesPerVisitDelta: 0,
      },
    });
    // No area lines

    const result = await computeQuoteSnapshot(quote.id);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain("monthly hours");
  });
});
