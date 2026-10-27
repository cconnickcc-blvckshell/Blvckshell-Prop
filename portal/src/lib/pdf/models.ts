import { formatCad, formatCalendar, formatInstant } from "@/lib/pdf/format";
import {
  proposalSection,
  resolveProposalSections,
  type ProposalSectionContent,
} from "@/lib/pdf/proposal-sections";

const AREA_LABELS: Record<string, string> = {
  LOBBY: "Lobby",
  HALLWAYS: "Hallways",
  STAIRWELLS: "Stairwells",
  ELEVATORS: "Elevators",
  GARBAGE: "Garbage room",
  WASHROOMS: "Washrooms",
  GLASS: "Glass",
  OTHER: "Other area",
};

const INCIDENT_LABELS: Record<string, string> = {
  SAFETY: "Safety",
  PROPERTY_DAMAGE: "Property damage",
  BIOHAZARD: "Biohazard",
  LOST_KEY: "Lost key",
  OTHER: "Other",
};

function titleCase(value: string): string {
  return value
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function areaScope(type: string, measurements: unknown): { area: string; detail: string } {
  const record =
    measurements && typeof measurements === "object"
      ? (measurements as Record<string, unknown>)
      : {};
  const area = AREA_LABELS[type] ?? titleCase(type);
  const size =
    typeof record.sizeLabel === "string" && record.sizeLabel.trim()
      ? record.sizeLabel.trim()
      : typeof record.preset === "string"
        ? record.preset
        : "";
  const named = Array.isArray(record.finishLabels)
    ? record.finishLabels.filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    : [];
  const finishes =
    named.length > 0
      ? named
      : Array.isArray(record.finishes)
        ? record.finishes
            .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
            .map(titleCase)
        : typeof record.finish === "string" && record.finish.trim()
          ? [titleCase(record.finish)]
          : [];
  const count = typeof record.count === "number" && record.count > 1 ? `× ${record.count}` : "";
  const detail = [size, finishes.join(", "), count].filter(Boolean).join(" · ");
  return { area, detail: detail || "As scoped" };
}

export type ProposalModel = {
  reference: string;
  clientName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  siteName: string;
  siteAddress: string;
  visitsPerWeek: number;
  serviceWindow: string;
  suppliesLabel: string;
  unitsLabel: string;
  monthlyAmountCents: number;
  addOnTotalCents: number;
  taxRateBps: number;
  taxCents: number;
  totalCents: number;
  termsLabel: string;
  validityDays: number;
  dateLabel: string;
  validUntilLabel: string;
  expired: boolean;
  draft: boolean;
  areas: { area: string; detail: string }[];
  addOns: { name: string; priceCents: number }[];
  sections: ProposalSectionContent[];
  issued: Date;
};

export function proposalSectionBody(model: ProposalModel, key: ProposalSectionContent["key"]): ProposalSectionContent {
  return proposalSection(model.sections, key);
}

export type ProposalBuildInput = {
  status: string;
  visitsPerWeek: number;
  expiresAt: Date;
  clientName: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string | null;
  siteName: string;
  siteAddress: string;
  serviceWindow?: string | null;
  suppliesProvidedBy?: string | null;
  doNotEnterUnits?: boolean | null;
  /** Present on some records. Never copied onto the client proposal. */
  accessInstructions?: string | null;
  accessCode?: string | null;
  monthlyAmountCents: number | null;
  reference?: string | null;
  termsLabel?: string | null;
  taxRateBps?: number | null;
  areas: Array<{ type: string; measurements: unknown; computedMinutes?: number; overrideMinutes?: number | null }>;
  addOns: Array<{
    name: string;
    priceCents: number;
    includedInProposal: boolean;
    estimatedLaborMinutes?: number;
    marginBps?: number;
    billingRateCentsPerHour?: number;
  }>;
  grossMarginBps?: number;
  snapshotVersion?: number;
  billingRateCentsPerHour?: number;
  sections?: { key: string; title: string; body: string }[];
  sectionOverrides?: { key: string; body: string }[];
  now?: Date;
};

function suppliesLabel(value: string | null | undefined): string {
  if (value === "CLIENT") return "Client-supplied";
  if (value === "COMPANY") return "Included with service";
  if (value === "MIXED") return "Shared";
  return "";
}

const DEFAULT_PROPOSAL_TAX_BPS = 1300;

/** Client proposal fields. Labour minutes, margin, rates, and snapshot version are dropped. */
export function buildProposalModel(input: ProposalBuildInput): ProposalModel | null {
  if (input.monthlyAmountCents == null) return null;
  const now = input.now ?? new Date();
  const draft = input.status === "DRAFT" || input.status === "READY_FOR_REVIEW";
  const addOns = input.addOns
    .filter((line) => line.includedInProposal)
    .map((line) => ({ name: line.name, priceCents: line.priceCents }));
  const addOnTotalCents = addOns.reduce((sum, line) => sum + line.priceCents, 0);
  const taxRateBps = input.taxRateBps && input.taxRateBps > 0 ? Math.round(input.taxRateBps) : DEFAULT_PROPOSAL_TAX_BPS;
  const taxCents = Math.round((input.monthlyAmountCents + addOnTotalCents) * (taxRateBps / 10000));
  return {
    reference: input.reference?.trim() || "",
    clientName: input.clientName,
    contactName: input.contactName,
    contactEmail: input.contactEmail,
    contactPhone: input.contactPhone?.trim() || "",
    siteName: input.siteName,
    siteAddress: input.siteAddress,
    visitsPerWeek: input.visitsPerWeek,
    serviceWindow: input.serviceWindow?.trim() || "",
    suppliesLabel: suppliesLabel(input.suppliesProvidedBy),
    unitsLabel: input.doNotEnterUnits ? "Not entered" : "",
    monthlyAmountCents: input.monthlyAmountCents,
    addOnTotalCents,
    taxRateBps,
    taxCents,
    totalCents: input.monthlyAmountCents + addOnTotalCents + taxCents,
    termsLabel: input.termsLabel?.trim() || "Net 30",
    validityDays: 30,
    dateLabel: formatInstant(now),
    validUntilLabel: formatCalendar(input.expiresAt),
    expired: input.expiresAt.getTime() < now.getTime(),
    draft,
    areas: input.areas.map((line) => areaScope(line.type, line.measurements)),
    addOns,
    sections: resolveProposalSections(input.sections, input.sectionOverrides),
    issued: now,
  };
}

export type InvoiceLineSource = {
  description: string;
  qty: number;
  unitPriceCents: number;
  amountCents: number;
};

export type InvoiceAdjustmentSource = {
  type: string;
  amountCents: number;
  notes: string | null;
  reasonCode: string | null;
};

export type InvoicePdfModel = {
  invoiceNumber: string;
  draft: boolean;
  clientName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  sites: { name: string; address: string }[];
  periodLabel: string;
  invoiceDateLabel: string;
  dueLabel: string;
  termsLabel: string;
  hstNumber: string;
  lines: string[][];
  subtotalCents: number;
  taxCents: number;
  taxRateBps: number;
  totalCents: number;
  paymentsCents: number;
  balanceCents: number;
  issued: Date;
};

function adjustmentAmount(type: string, amountCents: number): number {
  if (type === "Charge") return amountCents;
  return -Math.abs(amountCents);
}

function adjustmentLabel(adjustment: InvoiceAdjustmentSource): string {
  const detail = adjustment.notes?.trim() || adjustment.reasonCode?.trim() || "";
  return detail ? `${adjustment.type}: ${detail}` : adjustment.type;
}

export function settledPaymentCents(
  payments: { status: string; amountCents: number }[]
): number {
  let sum = 0;
  for (const payment of payments) {
    if (payment.status === "SETTLED") sum += payment.amountCents;
    else if (payment.status === "REFUNDED") sum -= payment.amountCents;
  }
  return sum;
}

export function buildInvoicePdfModel(input: {
  invoiceNumber: string;
  status: string;
  issuedAt: Date | null;
  dueAt: Date | null;
  periodStart: Date;
  periodEnd: Date;
  termsLabel: string;
  hstNumber: string;
  clientName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  sites: { name: string; address: string }[];
  lineItems: InvoiceLineSource[];
  adjustments: InvoiceAdjustmentSource[];
  payments: { status: string; amountCents: number }[];
  subtotalCents: number;
  taxCents: number;
  taxRateBps: number;
  totalCents: number;
  now?: Date;
}): InvoicePdfModel {
  const draft = input.status === "Draft";
  const lines = input.lineItems.map((line) => [
    line.description,
    String(line.qty),
    formatCad(line.unitPriceCents),
    formatCad(line.amountCents),
  ]);
  for (const adjustment of input.adjustments) {
    lines.push([
      adjustmentLabel(adjustment),
      "",
      "",
      formatCad(adjustmentAmount(adjustment.type, adjustment.amountCents)),
    ]);
  }
  const paymentsCents = settledPaymentCents(input.payments);
  const seen = new Set<string>();
  const sites = input.sites.filter((site) => {
    const key = `${site.name}|${site.address}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return {
    invoiceNumber: input.invoiceNumber,
    draft,
    clientName: input.clientName,
    contactName: input.contactName,
    contactEmail: input.contactEmail,
    contactPhone: input.contactPhone,
    sites,
    periodLabel: `${formatCalendar(input.periodStart)} – ${formatCalendar(input.periodEnd)}`,
    invoiceDateLabel: input.issuedAt ? formatInstant(input.issuedAt) : "Pending",
    dueLabel: !draft && input.dueAt ? formatCalendar(input.dueAt) : "Pending",
    termsLabel: input.termsLabel,
    hstNumber: input.hstNumber,
    lines,
    subtotalCents: input.subtotalCents,
    taxCents: input.taxCents,
    taxRateBps: input.taxRateBps,
    totalCents: input.totalCents,
    paymentsCents,
    balanceCents: input.totalCents - paymentsCents,
    issued: input.issuedAt ?? input.now ?? new Date(),
  };
}

export type IncidentSummary = {
  date: string;
  site: string;
  category: string;
  status: string;
};

/** Category, date, site, and open/closed. Free-text incident notes are omitted. */
export function clientIncidentSummary(input: {
  type: string;
  reportedAt: Date;
  resolvedAt: Date | null;
  siteName: string;
  description?: string;
  resolutionNotes?: string;
  workerName?: string;
}): IncidentSummary {
  return {
    date: formatInstant(input.reportedAt),
    site: input.siteName,
    category: INCIDENT_LABELS[input.type] ?? "Other",
    status: input.resolvedAt ? "Closed" : "Open",
  };
}

export type MonthlyReportModel = {
  clientName: string;
  contactName: string;
  contactEmail: string;
  periodLabel: string;
  draft: false;
  sites: string[][];
  incidents: IncidentSummary[];
  invoices: string[][];
  issued: Date;
};

export function buildMonthlyReportModel(input: {
  clientName: string;
  contactName: string;
  contactEmail: string;
  periodLabel: string;
  sites: Array<{
    name: string;
    jobs: number;
    jobsDone: number;
    passItems: number;
    scoredItems: number;
    photos: number;
    qualityScore: number | null;
  }>;
  incidents: Array<{
    type: string;
    reportedAt: Date;
    resolvedAt: Date | null;
    siteName: string;
    description?: string;
    resolutionNotes?: string;
    workerName?: string;
  }>;
  invoices: Array<{ invoiceNumber: string; status: string; totalCents: number }>;
  issued?: Date;
}): MonthlyReportModel {
  return {
    clientName: input.clientName,
    contactName: input.contactName,
    contactEmail: input.contactEmail,
    periodLabel: input.periodLabel,
    draft: false,
    sites: input.sites.map((site) => {
      const pass =
        site.scoredItems > 0 ? `${Math.round((site.passItems / site.scoredItems) * 100)}%` : "—";
      const quality = site.qualityScore == null ? "—" : `${site.qualityScore}%`;
      return [site.name, `${site.jobsDone} / ${site.jobs}`, pass, String(site.photos), quality];
    }),
    incidents: input.incidents.map((incident) => clientIncidentSummary(incident)),
    invoices: input.invoices.map((invoice) => [
      invoice.invoiceNumber,
      invoice.status,
      formatCad(invoice.totalCents),
    ]),
    issued: input.issued ?? new Date(),
  };
}

const RESULT_LABELS: Record<string, string> = {
  PASS: "Pass",
  FAIL: "Fail",
  NA: "N/A",
  N_A: "N/A",
};

export type VisitPhotoRef = { storagePath: string; caption: string };

export type VisitRecordModel = {
  siteName: string;
  siteAddress: string;
  clientName: string;
  whenLabel: string;
  statusLabel: string;
  checkInLabel: string;
  checkOutLabel: string;
  workerName: string;
  submittedLabel: string;
  approverName: string;
  approvedLabel: string;
  notes: string | null;
  complete: boolean;
  partial: boolean;
  reclean: boolean;
  issueRaised: boolean;
  draft: boolean;
  items: string[][];
  issues: { label: string; detail: string }[];
  photoNote: string | null;
  issued: Date;
};

export type VisitBuildResult = {
  model: VisitRecordModel;
  photoRefs: VisitPhotoRef[];
};

type SnapshotItem = { itemId?: string; label?: string };

function snapshotLabels(snapshot: unknown): Map<string, string> {
  const labels = new Map<string, string>();
  if (!Array.isArray(snapshot)) return labels;
  for (const entry of snapshot) {
    if (!entry || typeof entry !== "object") continue;
    const item = entry as SnapshotItem;
    if (typeof item.itemId === "string" && typeof item.label === "string") {
      labels.set(item.itemId, item.label);
    }
  }
  return labels;
}

function resultLabel(result: string): string {
  return RESULT_LABELS[result] ?? titleCase(result);
}

/**
 * Visit record from job and checklist fields.
 * Access instructions, pay, and incident narratives are not read.
 */
export function buildVisitRecord(input: {
  siteName: string;
  siteAddress: string;
  clientName: string;
  scheduledStart: Date;
  status: string;
  isReclean: boolean;
  checkedInAt: Date | null;
  checkedOutAt: Date | null;
  workerName: string | null;
  approverName: string | null;
  notes: string | null;
  runs: Array<{
    status: string;
    submittedAt: Date | null;
    approvedAt: Date | null;
    templateSnapshot: unknown;
    items: Array<{ itemId: string; result: string; failReason: string | null; note: string | null }>;
    evidence: Array<{
      storagePath: string;
      itemId: string | null;
      uploadedAt: Date;
      redactionApplied: boolean;
      redactionAttestedAt: Date | null;
    }>;
  }>;
  accessInstructions?: string | null;
  payoutAmountCents?: number | null;
  incidentDescriptions?: string[];
  now?: Date;
}): VisitBuildResult {
  const now = input.now ?? new Date();
  const runs = input.runs;
  const approved = runs.some((run) => run.status === "Approved");
  const submitted = runs.some((run) => run.status === "Submitted" || run.status === "Approved");
  const items: string[][] = [];
  const issues: { label: string; detail: string }[] = [];
  const photoRefs: VisitPhotoRef[] = [];
  let pass = 0;
  let fail = 0;
  let photoOverflow = 0;

  for (const run of runs) {
    const labels = snapshotLabels(run.templateSnapshot);
    const photosByItem = new Map<string, number>();
    for (const photo of run.evidence) {
      if (photo.itemId) photosByItem.set(photo.itemId, (photosByItem.get(photo.itemId) ?? 0) + 1);
    }
    for (const item of run.items) {
      const label = labels.get(item.itemId) ?? item.itemId;
      const note = item.note?.trim() || item.failReason?.trim() || "";
      items.push([
        label,
        resultLabel(item.result),
        note,
        String(photosByItem.get(item.itemId) ?? 0),
      ]);
      if (item.result === "PASS") pass += 1;
      if (item.result === "FAIL") {
        fail += 1;
        issues.push({ label, detail: item.failReason?.trim() || item.note?.trim() || "Noted" });
      }
    }
    for (const photo of run.evidence) {
      const cleared = photo.redactionApplied || photo.redactionAttestedAt != null;
      if (!cleared) continue;
      const label = photo.itemId ? labels.get(photo.itemId) ?? photo.itemId : "Visit photo";
      if (photoRefs.length >= 12) {
        photoOverflow += 1;
        continue;
      }
      photoRefs.push({
        storagePath: photo.storagePath,
        caption: `${label} · ${formatInstant(photo.uploadedAt)}`,
      });
    }
  }

  const latestSubmitted = runs.find((run) => run.submittedAt) ?? null;
  const latestApproved = runs.find((run) => run.approvedAt) ?? null;
  const doneStatus = input.status === "APPROVED_PAYABLE" || input.status === "PAID";
  const draft = !approved;
  return {
    model: {
      siteName: input.siteName,
      siteAddress: input.siteAddress,
      clientName: input.clientName,
      whenLabel: formatInstant(input.scheduledStart),
      statusLabel: doneStatus ? "Approved" : submitted ? "Submitted" : "In progress",
      checkInLabel: input.checkedInAt ? formatInstant(input.checkedInAt) : "—",
      checkOutLabel: input.checkedOutAt ? formatInstant(input.checkedOutAt) : "—",
      workerName: input.workerName?.trim() || "—",
      submittedLabel: latestSubmitted?.submittedAt ? formatInstant(latestSubmitted.submittedAt) : "—",
      approverName: input.approverName?.trim() || "—",
      approvedLabel: latestApproved?.approvedAt ? formatInstant(latestApproved.approvedAt) : "—",
      notes: input.notes?.trim() || null,
      complete: doneStatus && fail === 0 && pass > 0,
      partial: fail > 0 && pass > 0,
      reclean: input.isReclean,
      issueRaised: fail > 0,
      draft,
      items,
      issues,
      photoNote: photoOverflow > 0 ? "Additional photos are on the job record." : null,
      issued: now,
    },
    photoRefs,
  };
}
