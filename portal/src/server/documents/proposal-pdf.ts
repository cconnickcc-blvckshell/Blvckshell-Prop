import { prisma } from "@/lib/prisma";
import { buildProposalModel, type ProposalBuildInput, type ProposalModel } from "@/lib/pdf/models";
import { resolveProposalSections, type ProposalSectionKey } from "@/lib/pdf/proposal-sections";
import { isPaymentTerms, paymentTermsLabel, type PaymentTermsCode } from "@/server/invoices/payment-terms";
import { allocateProposalReference } from "@/server/documents/proposal-reference";

export type ProposalEditorSection = {
  key: ProposalSectionKey;
  title: string;
  templateBody: string;
  body: string;
};

export type LoadedProposal = {
  status: string;
  paymentTerms: PaymentTermsCode;
  model: ProposalModel | null;
  sections: ProposalEditorSection[];
};

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
    },
  });
  if (!quote) return null;

  const [reference, storedSections] = await Promise.all([
    ensureProposalReference(quoteId, quote.proposalReference),
    prisma.proposalSection.findMany({
      select: { key: true, title: true, body: true },
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
  };
}
