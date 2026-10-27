import { prisma } from "@/lib/prisma";
import { buildProposalModel, type ProposalBuildInput, type ProposalModel } from "@/lib/pdf/models";

export type LoadedProposal = {
  status: string;
  model: ProposalModel | null;
};

export async function loadProposalSource(quoteId: string): Promise<ProposalBuildInput | null> {
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    select: {
      status: true,
      visitsPerWeek: true,
      expiresAt: true,
      site: {
        select: {
          name: true,
          address: true,
          clientOrganization: {
            select: {
              name: true,
              primaryContactName: true,
              primaryContactEmail: true,
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
    },
  });
  if (!quote) return null;
  const client = quote.site.clientOrganization;
  return {
    status: quote.status,
    visitsPerWeek: quote.visitsPerWeek,
    expiresAt: quote.expiresAt,
    clientName: client.name,
    contactName: client.primaryContactName,
    contactEmail: client.primaryContactEmail,
    siteName: quote.site.name,
    siteAddress: quote.site.address,
    monthlyAmountCents: quote.snapshots[0]?.riskAdjustedRevenueCents ?? null,
    areas: quote.areaLines.map((line) => ({
      type: line.type,
      measurements: line.measurements,
    })),
    addOns: quote.addOnLines,
  };
}

export async function loadProposal(quoteId: string): Promise<LoadedProposal | null> {
  const source = await loadProposalSource(quoteId);
  if (!source) return null;
  return { status: source.status, model: buildProposalModel(source) };
}
