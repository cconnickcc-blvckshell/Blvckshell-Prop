import { execFileSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { toPrintJpeg } from "@/lib/pdf/images";
import { renderInvoicePdf } from "@/lib/pdf/documents/invoice";
import { renderProposalPdf } from "@/lib/pdf/documents/proposal";
import {
  buildInvoicePdfModel,
  buildProposalModel,
  buildVisitRecord,
  clientIncidentSummary,
} from "@/lib/pdf/models";
import { formatInvoiceNumber, invoiceDayKey } from "@/server/invoices/invoice-number";
import { formatProposalReference, proposalYearKey } from "@/server/documents/proposal-reference";
import {
  chooseContractTerms,
  dueAtFromInvoiceDate,
  paymentTermsLabel,
} from "@/server/invoices/payment-terms";

describe("invoice numbers and terms", () => {
  it("formats a Toronto daily sequence as YYMMDD plus three digits", () => {
    expect(invoiceDayKey(new Date("2026-10-30T15:00:00Z"))).toBe("261030");
    expect(invoiceDayKey(new Date("2026-10-31T03:30:00Z"))).toBe("261030");
    expect(formatInvoiceNumber("261030", 1)).toBe("261030001");
    expect(formatInvoiceNumber("261030", 12)).toBe("261030012");
    expect(proposalYearKey(new Date("2026-10-30T15:00:00Z"))).toBe("2026");
    expect(formatProposalReference("2026", 1)).toBe("BS-2026-001");
    expect(formatProposalReference("2026", 14)).toBe("BS-2026-014");
  });

  it("counts the due date from the invoice date", () => {
    const issued = new Date("2026-02-15T15:00:00Z");
    expect(dueAtFromInvoiceDate(issued, 30).toISOString().slice(0, 10)).toBe("2026-03-17");
    expect(dueAtFromInvoiceDate(issued, 0).toISOString().slice(0, 10)).toBe("2026-02-15");
    const lateUtc = new Date("2026-03-15T03:30:00Z");
    expect(dueAtFromInvoiceDate(lateUtc, 0).toISOString().slice(0, 10)).toBe("2026-03-14");
  });

  it("defaults contracts to Net 30 and one-off work to due on completion", () => {
    expect(chooseContractTerms([])).toEqual({ terms: "DUE_ON_COMPLETION", days: 0 });
    expect(chooseContractTerms([{ paymentTerms: "NET_30", netTermsDays: 30 }])).toEqual({
      terms: "NET_30",
      days: 30,
    });
    expect(chooseContractTerms([{ paymentTerms: "DUE_ON_COMPLETION", netTermsDays: 0 }])).toEqual({
      terms: "DUE_ON_COMPLETION",
      days: 0,
    });
    expect(paymentTermsLabel("NET_30", 30)).toBe("Net 30");
    expect(paymentTermsLabel("DUE_ON_COMPLETION", 0)).toBe("Due on completion");
  });
});

describe("client-safe document models", () => {
  it("drops margin, minutes, and snapshot version from a proposal", () => {
    const model = buildProposalModel({
      status: "SENT",
      visitsPerWeek: 3,
      expiresAt: new Date("2026-12-01T00:00:00Z"),
      clientName: "Harbour Court",
      contactName: "A. Client",
      contactEmail: "client@example.com",
      siteName: "North Tower",
      siteAddress: "1 Example Road",
      monthlyAmountCents: 150000,
      reference: "BS-2026-001",
      grossMarginBps: 4321,
      snapshotVersion: 9,
      billingRateCentsPerHour: 4500,
      accessInstructions: "Alarm code DOOR-9981",
      accessCode: "DOOR-9981",
      areas: [
        {
          type: "LOBBY",
          measurements: { sizeLabel: "500-1500 sqft", finishes: ["tile"], minutes: 417 },
          computedMinutes: 417,
          overrideMinutes: 417,
        },
      ],
      addOns: [
        {
          name: "Glass detail",
          priceCents: 2500,
          includedInProposal: true,
          estimatedLaborMinutes: 417,
          marginBps: 4321,
        },
        {
          name: "Hidden add-on",
          priceCents: 9999,
          includedInProposal: false,
          marginBps: 4321,
        },
      ],
      now: new Date("2026-10-27T15:00:00Z"),
    });
    expect(model).not.toBeNull();
    const json = JSON.stringify(model);
    expect(json).not.toContain("4321");
    expect(json).not.toContain("417");
    expect(json).not.toContain("Hidden add-on");
    expect(json.toLowerCase()).not.toContain("margin");
    expect(json.toLowerCase()).not.toContain("minute");
    expect(json.toLowerCase()).not.toContain("snapshot");
    expect(json.toLowerCase()).not.toContain("wsib");
    expect(json.toLowerCase()).not.toContain("insurance");
    expect(json).not.toContain("DOOR-9981");
    expect(json).not.toContain("4500");
    expect(model?.reference).toBe("BS-2026-001");
    expect(model?.termsLabel).toBe("Net 30");
    expect(model?.validityDays).toBe(30);
    expect(model?.sections.find((section) => section.key === "our_team")?.body).toContain("edit in Settings");
    expect(model?.areas[0]).toMatchObject({ area: "Lobby", detail: "500-1500 sqft · Tile" });
    expect(model?.areas[0].tasks[0]?.frequency).toBe("3 days per week");
    expect(model?.areas[0].tasks[1]?.frequency).toBe("Weekly");
    expect(JSON.stringify(model?.areas[0].tasks)).not.toContain("417");
    expect(model?.addOns).toEqual([{ name: "Glass detail", priceCents: 2500 }]);
  });

  it("keeps full invoice descriptions and omits a late fee", () => {
    const description = "Recurring common-area cleaning for the full agreed lobby and corridor scope";
    const model = buildInvoicePdfModel({
      invoiceNumber: "261030001",
      status: "Sent",
      issuedAt: new Date("2026-10-30T15:00:00Z"),
      dueAt: dueAtFromInvoiceDate(new Date("2026-10-30T15:00:00Z"), 30),
      periodStart: new Date("2026-10-01T00:00:00Z"),
      periodEnd: new Date("2026-10-31T00:00:00Z"),
      termsLabel: "Net 30",
      hstNumber: "729655308RT0001",
      clientName: "Harbour Court",
      contactName: "A. Client",
      contactEmail: "client@example.com",
      contactPhone: "519-555-0100",
      sites: [{ name: "North Tower", address: "1 Example Road" }],
      lineItems: [{ description, qty: 1, unitPriceCents: 100000, amountCents: 100000 }],
      adjustments: [],
      payments: [{ status: "SETTLED", amountCents: 20000 }],
      subtotalCents: 100000,
      taxCents: 13000,
      taxRateBps: 1300,
      totalCents: 113000,
    });
    expect(model.lines[0][0]).toBe(description);
    expect(model.lines[0][0].length).toBeGreaterThan(50);
    expect(model.balanceCents).toBe(93000);
    expect(JSON.stringify(model).toLowerCase()).not.toContain("late fee");
  });

  it("summarises incidents without the internal narrative", () => {
    const summary = clientIncidentSummary({
      type: "PROPERTY_DAMAGE",
      reportedAt: new Date("2026-10-12T15:00:00Z"),
      resolvedAt: null,
      siteName: "North Tower",
      description: "INTERNAL worker Alex left alarm code 4412 in the stairwell",
      resolutionNotes: "Do not tell the client about the code",
      workerName: "Alex",
    });
    const json = JSON.stringify(summary);
    expect(summary).toEqual({
      date: expect.any(String),
      site: "North Tower",
      category: "Property damage",
      status: "Open",
    });
    expect(json).not.toContain("4412");
    expect(json).not.toContain("Alex");
    expect(json).not.toContain("INTERNAL");
  });

  it("builds a visit record without access codes, pay, or incident text", () => {
    const { model, photoRefs } = buildVisitRecord({
      siteName: "North Tower",
      siteAddress: "1 Example Road",
      clientName: "Harbour Court",
      scheduledStart: new Date("2026-10-20T14:00:00Z"),
      status: "APPROVED_PAYABLE",
      isReclean: false,
      checkedInAt: new Date("2026-10-20T14:05:00Z"),
      checkedOutAt: new Date("2026-10-20T16:00:00Z"),
      workerName: "Jordan Lee",
      approverName: "Casey Admin",
      notes: "Lobby complete",
      accessInstructions: "alarm code DOOR-9981",
      payoutAmountCents: 54321,
      incidentDescriptions: ["near miss in the stairwell with Ashley"],
      runs: [
        {
          status: "Approved",
          submittedAt: new Date("2026-10-20T16:05:00Z"),
          approvedAt: new Date("2026-10-20T18:00:00Z"),
          templateSnapshot: [{ itemId: "lobby", label: "Lobby floors" }],
          items: [
            { itemId: "lobby", result: "PASS", failReason: null, note: null },
            { itemId: "glass", result: "FAIL", failReason: "Streaks on the entry glass", note: null },
          ],
          evidence: [
            {
              storagePath: "jobs/photo.webp",
              itemId: "lobby",
              uploadedAt: new Date("2026-10-20T15:00:00Z"),
              redactionApplied: true,
              redactionAttestedAt: null,
            },
            {
              storagePath: "jobs/raw.webp",
              itemId: "glass",
              uploadedAt: new Date("2026-10-20T15:10:00Z"),
              redactionApplied: false,
              redactionAttestedAt: null,
            },
          ],
        },
      ],
    });
    const json = JSON.stringify({ model, photoRefs });
    expect(json).not.toContain("DOOR-9981");
    expect(json).not.toContain("54321");
    expect(json).not.toContain("Ashley");
    expect(json).not.toContain("raw.webp");
    expect(photoRefs).toEqual([
      expect.objectContaining({ storagePath: "jobs/photo.webp" }),
    ]);
    expect(model.issueRaised).toBe(true);
    expect(model.draft).toBe(false);
    expect(model.items[0][0]).toBe("Lobby floors");
  });
});

describe("branded pdf output", () => {
  it("renders a letter-size invoice that paginates long tables", async () => {
    const description = "Recurring common-area cleaning — lobbies, corridors, stairwells, and entrances";
    const model = buildInvoicePdfModel({
      invoiceNumber: "261030001",
      status: "Sent",
      issuedAt: new Date("2026-10-30T15:00:00Z"),
      dueAt: dueAtFromInvoiceDate(new Date("2026-10-30T15:00:00Z"), 30),
      periodStart: new Date("2026-10-01T00:00:00Z"),
      periodEnd: new Date("2026-10-31T00:00:00Z"),
      termsLabel: "Net 30",
      hstNumber: "729655308RT0001",
      clientName: "Harbour Court",
      contactName: "A. Client",
      contactEmail: "client@example.com",
      contactPhone: "519-555-0100",
      sites: [{ name: "North Tower", address: "1 Example Road" }],
      lineItems: Array.from({ length: 40 }, (_, index) => ({
        description: `${description} (line ${index + 1})`,
        qty: 1,
        unitPriceCents: 100000,
        amountCents: 100000,
      })),
      adjustments: [],
      payments: [],
      subtotalCents: 4000000,
      taxCents: 520000,
      taxRateBps: 1300,
      totalCents: 4520000,
    });
    const pdf = await renderInvoicePdf(model, { compress: false });
    const text = pdf.toString("latin1");
    expect(text.startsWith("%PDF-")).toBe(true);
    expect(text).toContain("612 792");
    const pages = text.match(/\/Type \/Page\b/g);
    expect(pages && pages.length).toBeGreaterThanOrEqual(2);
  });

  it("renders a proposal pdf", async () => {
    const model = buildProposalModel({
      status: "SENT",
      visitsPerWeek: 5,
      expiresAt: new Date("2026-11-29T00:00:00Z"),
      clientName: "Harbour Court",
      contactName: "A. Client",
      contactEmail: "client@example.com",
      siteName: "North Tower",
      siteAddress: "1 Example Road",
      monthlyAmountCents: 150000,
      reference: "BS-2026-001",
      areas: ["LOBBY", "HALLWAYS", "ELEVATORS", "STAIRWELLS", "WASHROOMS", "GARBAGE"].map((type) => ({
        type,
        measurements: { sizeLabel: "Standard", finish: "standard" },
      })),
      addOns: [{ name: "Entry glass", priceCents: 18000, includedInProposal: true }],
      now: new Date("2026-10-30T15:00:00Z"),
    });
    expect(model).not.toBeNull();
    const pdf = await renderProposalPdf(model!, { compress: false });
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    const raw = pdf.toString("latin1");
    expect(raw).toContain("612 792");
    expect(raw).toContain("0.984313725490196 0.9647058823529412 0.9372549019607843");
    expect(raw).not.toContain("0.9647058823529412 0.9215686274509803");
    const pages = raw.match(/\/Type \/Page\b/g);
    expect(pages && pages.length).toBeGreaterThanOrEqual(6);
    expect(pages && pages.length).toBeLessThanOrEqual(8);
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "proposal-pdf-"));
    const file = path.join(dir, "proposal.pdf");
    fs.writeFileSync(file, pdf);
    const text = execFileSync("pdftotext", ["-layout", file, "-"], { encoding: "utf8" });
    expect(text).toContain("BS-2026-001");
    expect(text).toContain("Dear A. Client");
    expect(text).toContain("Chris Connick");
    expect(text).toContain("5 days per week");
    expect(text).toContain("edit in Settings");
    expect(text).toContain("Net 30");
    expect(text).toContain("Priced on request");
    expect(text.toLowerCase()).not.toContain("late fee");
    expect(text.toLowerCase()).not.toContain("insurance");
    expect(text.toLowerCase()).not.toContain("wsib");
    expect(text.toLowerCase()).not.toContain("renewal");
    expect(text.toLowerCase()).not.toContain("escalat");
    expect(text.toLowerCase()).not.toContain("minute");
    expect(text.toLowerCase()).not.toContain("margin");
  });

  it("converts webp photos to jpeg for embedding", async () => {
    const webp = await sharp({
      create: { width: 12, height: 8, channels: 3, background: { r: 26, g: 34, b: 43 } },
    })
      .webp()
      .toBuffer();
    const jpeg = await toPrintJpeg(webp, 20);
    expect(jpeg[0]).toBe(0xff);
    expect(jpeg[1]).toBe(0xd8);
  });
});
