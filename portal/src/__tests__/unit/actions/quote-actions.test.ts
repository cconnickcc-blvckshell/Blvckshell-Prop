/**
 * Quote line CRUD: override reason required, SENT quote immutable, add-on margin gate.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { testDb } from "../../setup";
import {
  createQuoteAreaLine,
  updateQuoteAreaLine,
  deleteQuoteAreaLine,
  createQuoteAddOnLine,
  updateQuoteAddOnLine,
  deleteQuoteAddOnLine,
  updateQuoteHeaderAndRisk,
} from "@/server/actions/quote-actions";
import * as rbac from "@/server/guards/rbac";

const mockAdmin = {
  id: "admin-1",
  name: "Admin User",
  role: "ADMIN" as const,
};

describe("Quote area line actions", () => {
  beforeEach(() => {
    vi.spyOn(rbac, "requireAdmin").mockResolvedValue(mockAdmin as never);
  });

  it("rejects createQuoteAreaLine when overrideMinutes set but overrideReason missing", async () => {
    const client = await testDb.clientOrganization.create({
      data: {
        name: "Quote Actions Client",
        primaryContactName: "C",
        primaryContactEmail: "q@test.com",
        primaryContactPhone: "1",
      },
    });
    const site = await testDb.site.create({
      data: {
        clientOrganizationId: client.id,
        name: "Quote Actions Site",
        address: "Addr",
        requiredPhotoCount: 4,
        suppliesProvidedBy: "COMPANY",
        lifecycleStatus: "PROSPECT",
      },
    });
    const policy = await testDb.pricingPolicy.create({
      data: {
        cityCode: "TST",
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
        travelMinutesPerVisit: 15,
        monthlySupplyCostCents: 0,
        winterMinutesPerVisitDelta: 5,
      },
    });

    const result = await createQuoteAreaLine(quote.id, {
      type: "LOBBY",
      measurements: { preset: "M" },
      overrideMinutes: 40,
      overrideReason: "",
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/override reason/i);
  });

  it("rejects updateQuoteAreaLine when overrideMinutes set but overrideReason missing", async () => {
    const client = await testDb.clientOrganization.create({
      data: {
        name: "Quote Actions Client 2",
        primaryContactName: "C",
        primaryContactEmail: "q2@test.com",
        primaryContactPhone: "1",
      },
    });
    const site = await testDb.site.create({
      data: {
        clientOrganizationId: client.id,
        name: "Quote Actions Site 2",
        address: "Addr 2",
        requiredPhotoCount: 4,
        suppliesProvidedBy: "COMPANY",
        lifecycleStatus: "PROSPECT",
      },
    });
    const policy = await testDb.pricingPolicy.create({
      data: {
        cityCode: "TST2",
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
        travelMinutesPerVisit: 15,
        monthlySupplyCostCents: 0,
        winterMinutesPerVisitDelta: 5,
      },
    });
    const line = await testDb.quoteAreaLine.create({
      data: {
        quoteId: quote.id,
        type: "LOBBY",
        measurements: { preset: "S" },
        computedMinutes: 15,
      },
    });

    const result = await updateQuoteAreaLine(line.id, {
      overrideMinutes: 20,
      overrideReason: "",
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/override reason/i);
  });

  it("rejects deleteQuoteAreaLine when quote status is SENT", async () => {
    const client = await testDb.clientOrganization.create({
      data: {
        name: "Quote SENT Client",
        primaryContactName: "C",
        primaryContactEmail: "sent@test.com",
        primaryContactPhone: "1",
      },
    });
    const site = await testDb.site.create({
      data: {
        clientOrganizationId: client.id,
        name: "Quote SENT Site",
        address: "Sent",
        requiredPhotoCount: 4,
        suppliesProvidedBy: "COMPANY",
        lifecycleStatus: "PROSPECT",
      },
    });
    const policy = await testDb.pricingPolicy.create({
      data: {
        cityCode: "SENT",
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
        status: "SENT",
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        visitsPerWeek: 4,
        billingRateCentsPerHour: policy.anchorBillingRateCentsPerHour,
        travelMinutesPerVisit: 15,
        monthlySupplyCostCents: 0,
        winterMinutesPerVisitDelta: 5,
      },
    });
    const line = await testDb.quoteAreaLine.create({
      data: {
        quoteId: quote.id,
        type: "LOBBY",
        measurements: {},
        computedMinutes: 30,
      },
    });

    const result = await deleteQuoteAreaLine(line.id);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/cannot be edited|DRAFT|READY_FOR_REVIEW/i);
  });

  it("creates area line with preset and stores computed minutes", async () => {
    const client = await testDb.clientOrganization.create({
      data: {
        name: "Quote Create Client",
        primaryContactName: "C",
        primaryContactEmail: "create@test.com",
        primaryContactPhone: "1",
      },
    });
    const site = await testDb.site.create({
      data: {
        clientOrganizationId: client.id,
        name: "Quote Create Site",
        address: "Create",
        requiredPhotoCount: 4,
        suppliesProvidedBy: "COMPANY",
        lifecycleStatus: "PROSPECT",
      },
    });
    const policy = await testDb.pricingPolicy.create({
      data: {
        cityCode: "CR",
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
        travelMinutesPerVisit: 15,
        monthlySupplyCostCents: 0,
        winterMinutesPerVisitDelta: 5,
      },
    });

    const result = await createQuoteAreaLine(quote.id, {
      type: "LOBBY",
      measurements: { preset: "M" },
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const line = await testDb.quoteAreaLine.findUnique({
      where: { id: result.lineId },
    });
    expect(line).not.toBeNull();
    expect(line?.type).toBe("LOBBY");
    expect(line?.computedMinutes).toBeGreaterThan(0);
    expect((line?.measurements as { preset?: string })?.preset).toBe("M");
  });

  it("multiplies base minutes by count when provided", async () => {
    const client = await testDb.clientOrganization.create({
      data: {
        name: "Quote Count Client",
        primaryContactName: "C",
        primaryContactEmail: "count@test.com",
        primaryContactPhone: "1",
      },
    });
    const site = await testDb.site.create({
      data: {
        clientOrganizationId: client.id,
        name: "Quote Count Site",
        address: "Count",
        requiredPhotoCount: 4,
        suppliesProvidedBy: "COMPANY",
        lifecycleStatus: "PROSPECT",
      },
    });
    const policy = await testDb.pricingPolicy.create({
      data: {
        cityCode: "CNT",
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
        travelMinutesPerVisit: 15,
        monthlySupplyCostCents: 0,
        winterMinutesPerVisitDelta: 5,
      },
    });

    const result = await createQuoteAreaLine(quote.id, {
      type: "LOBBY",
      measurements: { preset: "M", count: 3 },
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const line = await testDb.quoteAreaLine.findUnique({
      where: { id: result.lineId },
    });
    expect(line).not.toBeNull();
    expect(line?.computedMinutes).toBe(75);
    expect((line?.measurements as { preset?: string; count?: number })?.count).toBe(3);
  });
});

describe("Quote add-on line actions", () => {
  beforeEach(() => {
    vi.spyOn(rbac, "requireAdmin").mockResolvedValue(mockAdmin as never);
  });

  it("rejects createQuoteAddOnLine with includedInProposal when margin below addonMinMarginBps", async () => {
    const client = await testDb.clientOrganization.create({
      data: {
        name: "Quote Addon Client",
        primaryContactName: "C",
        primaryContactEmail: "addon@test.com",
        primaryContactPhone: "1",
      },
    });
    const site = await testDb.site.create({
      data: {
        clientOrganizationId: client.id,
        name: "Quote Addon Site",
        address: "Addon",
        requiredPhotoCount: 4,
        suppliesProvidedBy: "COMPANY",
        lifecycleStatus: "PROSPECT",
      },
    });
    const policy = await testDb.pricingPolicy.create({
      data: {
        cityCode: "ADD",
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
        subPayoutCeilingCentsPerHour: 5000,
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
        travelMinutesPerVisit: 15,
        monthlySupplyCostCents: 0,
        winterMinutesPerVisitDelta: 5,
        expectedSubcontractorRateCentsPerHour: 4500,
      },
    });
    const result = await createQuoteAddOnLine(quote.id, {
      name: "Low margin add-on",
      estimatedLaborMinutes: 60,
      includedInProposal: true,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/margin|below minimum/i);
  });

  it("creates add-on with includedInProposal false when margin would be below threshold", async () => {
    const client = await testDb.clientOrganization.create({
      data: {
        name: "Quote Addon Client 2",
        primaryContactName: "C",
        primaryContactEmail: "addon2@test.com",
        primaryContactPhone: "1",
      },
    });
    const site = await testDb.site.create({
      data: {
        clientOrganizationId: client.id,
        name: "Quote Addon Site 2",
        address: "Addon2",
        requiredPhotoCount: 4,
        suppliesProvidedBy: "COMPANY",
        lifecycleStatus: "PROSPECT",
      },
    });
    const policy = await testDb.pricingPolicy.create({
      data: {
        cityCode: "ADD2",
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
        subPayoutCeilingCentsPerHour: 5000,
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
        travelMinutesPerVisit: 15,
        monthlySupplyCostCents: 0,
        winterMinutesPerVisitDelta: 5,
        expectedSubcontractorRateCentsPerHour: 4500,
      },
    });

    const result = await createQuoteAddOnLine(quote.id, {
      name: "Excluded add-on",
      estimatedLaborMinutes: 60,
      includedInProposal: false,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const line = await testDb.quoteAddOnLine.findUnique({
      where: { id: result.lineId },
    });
    expect(line).not.toBeNull();
    expect(line?.includedInProposal).toBe(false);
    expect(line?.priceCents).toBe(5000);
  });

  it("rejects deleteQuoteAddOnLine when quote status is SENT", async () => {
    const client = await testDb.clientOrganization.create({
      data: {
        name: "Quote SENT Addon Client",
        primaryContactName: "C",
        primaryContactEmail: "senta@test.com",
        primaryContactPhone: "1",
      },
    });
    const site = await testDb.site.create({
      data: {
        clientOrganizationId: client.id,
        name: "Quote SENT Addon Site",
        address: "SentA",
        requiredPhotoCount: 4,
        suppliesProvidedBy: "COMPANY",
        lifecycleStatus: "PROSPECT",
      },
    });
    const policy = await testDb.pricingPolicy.create({
      data: {
        cityCode: "SENTA",
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
        status: "SENT",
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        visitsPerWeek: 4,
        billingRateCentsPerHour: policy.anchorBillingRateCentsPerHour,
        travelMinutesPerVisit: 15,
        monthlySupplyCostCents: 0,
        winterMinutesPerVisitDelta: 5,
      },
    });
    const line = await testDb.quoteAddOnLine.create({
      data: {
        quoteId: quote.id,
        name: "Addon",
        estimatedLaborMinutes: 30,
        billingRateCentsPerHour: 5000,
        priceCents: 2500,
        marginBps: 3000,
        includedInProposal: false,
      },
    });

    const result = await deleteQuoteAddOnLine(line.id);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/cannot be edited|DRAFT|READY_FOR_REVIEW/i);
  });
});
