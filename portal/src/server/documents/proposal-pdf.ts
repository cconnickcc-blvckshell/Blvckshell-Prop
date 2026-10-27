import { prisma } from "@/lib/prisma";
import { buildProposalModel, type ProposalBuildInput, type ProposalModel } from "@/lib/pdf/models";
import { resolveProposalSections, type ProposalSectionKey } from "@/lib/pdf/proposal-sections";
import { isQuoteAreaType, PROPOSAL_AREA_TASK_CATALOG, QUOTE_AREA_LABELS, type AreaTaskSource } from "@/lib/pdf/proposal-tasks";
import { isPaymentTerms, paymentTermsLabel, type PaymentTermsCode } from "@/server/invoices/payment-terms";
import { allocateProposalReference } from "@/server/documents/proposal-reference";

export type ProposalEditorSection = {
  key: ProposalSectionKey;
  title: string;
  templateBody: string;
  body: string;
};

export type ProposalTaskEditorGroup = {
  areaType: string;
  label: string;
  tasks: { description: string; frequency: string }[];
};

export type LoadedProposal = {
  status: string;
  paymentTerms: PaymentTermsCode;
  model: ProposalModel | null;
  sections: ProposalEditorSection[];
  taskGroups: ProposalTaskEditorGroup[];
};

function checklistTasks(items: unknown): AreaTaskSource[] {
  if (!Array.isArray(items)) return [];
  const rows: AreaTaskSource[] = [];
  items.forEach((item, index) => {
    if (!item || typeof item !== "object") return;
    const record = item as { areaType?: unknown; area?: unknown; label?: unknown; description?: unknown; frequency?: unknown };
    const areaType = typeof record.areaType === "string" ? record.areaType : typeof record.area === "string" ? record.area : "";
    const description = typeof record.label === "string" ? record.label : typeof record.description === "string" ? record.description : "";
    if (!isQuoteAreaType(areaType) || !description.trim()) return;
    rows.push({
      areaType,
      description: description.trim(),
      frequency: typeof record.frequency === "string" && record.frequency.trim() ? record.frequency.trim() : "Each visit",
      sortOrder: (index + 1) * 10,
    });
  });
  return rows;
}

async function ensureProposalReference(quoteId: string, existing: string | null): Promise<string> {
  if (existing) return existing;
  return prisma.$transaction(async (tx) => {
    const current = await tx.quote.findUnique({
      where: { id: quoteId },
      select: { proposalReference: true },
    });
    if (current?.proposalReference) return current.proposalReference;
    const reference = await allocateProposalReference(tx, new Date());
    await tx.quote.update({
      where: { id: quoteId },
      data: { proposalReference: reference },
    });
    return reference;
  });
}

export async function loadProposalSource(quoteId: string): Promise<ProposalBuildInput | null> {
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    select: {
      status: true,
      visitsPerWeek: true,
      expiresAt: true,
      proposalReference: true,
      paymentTerms: true,
      paymentTermsDays: true,
      site: {
        select: {
          name: true,
          address: true,
          serviceWindow: true,
          suppliesProvidedBy: true,
          doNotEnterUnits: true,
          checklistTemplates: {
            where: { isActive: true },
            orderBy: { version: "desc" },
            take: 1,
            select: { items: true },
          },
          clientOrganization: {
            select: {
              name: true,
              primaryContactName: true,
              primaryContactEmail: true,
              primaryContactPhone: true,
            },
          },
        },
      },
      areaLines: {
        select: { type: true, measurements: true },
      },
      addOnLines: {
        select: { name: true, priceCents: true, includedInProposal: true },
      },
      snapshots: {
        orderBy: { snapshotVersion: "desc" },
        take: 1,
        select: { riskAdjustedRevenueCents: true },
      },
      sectionOverrides: {
        select: { sectionKey: true, body: true },
      },
      areaTaskOverrides: {
        select: { areaType: true, description: true, frequency: true, sortOrder: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });
  if (!quote) return null;

  const [reference, storedSections, areaTasks] = await Promise.all([
    ensureProposalReference(quoteId, quote.proposalReference),
    prisma.proposalSection.findMany({
      select: { key: true, title: true, body: true },
    }),
    prisma.proposalAreaTask.findMany({
      select: { areaType: true, description: true, frequency: true, sortOrder: true },
      orderBy: [{ areaType: "asc" }, { sortOrder: "asc" }],
    }),
  ]);

  const client = quote.site.clientOrganization;
  const terms = isPaymentTerms(quote.paymentTerms) ? quote.paymentTerms : "NET_30";
  return {
    status: quote.status,
    visitsPerWeek: quote.visitsPerWeek,
    expiresAt: quote.expiresAt,
    clientName: client.name,
    contactName: client.primaryContactName,
    contactEmail: client.primaryContactEmail,
    contactPhone: client.primaryContactPhone,
    siteName: quote.site.name,
    siteAddress: quote.site.address,
    serviceWindow: quote.site.serviceWindow,
    suppliesProvidedBy: quote.site.suppliesProvidedBy,
    doNotEnterUnits: quote.site.doNotEnterUnits,
    monthlyAmountCents: quote.snapshots[0]?.riskAdjustedRevenueCents ?? null,
    reference,
    termsLabel: paymentTermsLabel(terms, quote.paymentTermsDays),
    areas: quote.areaLines.map((line) => ({
      type: line.type,
      measurements: line.measurements,
    })),
    addOns: quote.addOnLines,
    sections: storedSections,
    sectionOverrides: quote.sectionOverrides.map((row) => ({
      key: row.sectionKey,
      body: row.body,
    })),
    areaTasks,
    areaTaskOverrides: quote.areaTaskOverrides,
    checklistTasks: quote.site.checklistTemplates.flatMap((template) => checklistTasks(template.items)),
  };
}

export async function loadProposal(quoteId: string): Promise<LoadedProposal | null> {
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    select: { id: true, paymentTerms: true },
  });
  if (!quote) return null;
  const source = await loadProposalSource(quoteId);
  if (!source) return null;
  const terms = isPaymentTerms(quote.paymentTerms) ? quote.paymentTerms : "NET_30";
  const template = resolveProposalSections(source.sections);
  const effective = resolveProposalSections(source.sections, source.sectionOverrides);
  const areaTypes = [...new Set((source.areas ?? []).map((area) => area.type))];
  const taskGroups = areaTypes.map((areaType) => {
    const overrides = (source.areaTaskOverrides ?? []).filter((row) => row.areaType === areaType);
    const defaults = (source.areaTasks ?? []).filter((row) => row.areaType === areaType);
    const catalog = PROPOSAL_AREA_TASK_CATALOG.filter((row) => row.areaType === areaType);
    const chosen = overrides.length > 0 ? overrides : defaults.length > 0 ? defaults : catalog;
    return {
      areaType,
      label: QUOTE_AREA_LABELS[areaType] ?? areaType,
      tasks: chosen.map((row) => ({ description: row.description, frequency: row.frequency })),
    };
  });
  return {
    status: source.status,
    paymentTerms: terms,
    model: buildProposalModel(source),
    sections: effective.map((section) => ({
      key: section.key,
      title: section.title,
      templateBody: template.find((row) => row.key === section.key)?.body ?? section.body,
      body: section.body,
    })),
    taskGroups,
  };
}
