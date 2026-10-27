/**
 * Ordered proposal sections. Bodies shipped here are short placeholders.
 * The owner replaces them in Settings. Do not paste proposal, legal, or pricing prose into this file.
 */
export const PROPOSAL_SECTION_CATALOG = [
  { key: "cover_letter", title: "Cover letter", body: "[Cover letter — edit in Settings]", sortOrder: 10 },
  { key: "our_team", title: "Our team", body: "[Our team text — edit in Settings]", sortOrder: 20 },
  { key: "pricing", title: "Pricing", body: "[Pricing note — edit in Settings]", sortOrder: 30 },
  { key: "included", title: "Included at no additional cost", body: "[Included text — edit in Settings]", sortOrder: 40 },
  { key: "special_services", title: "Special services", body: "[Special services text — edit in Settings]", sortOrder: 50 },
  { key: "quality", title: "Quality assurance", body: "[Quality assurance text — edit in Settings]", sortOrder: 60 },
  { key: "safety", title: "Safety", body: "[Safety text — edit in Settings]", sortOrder: 70 },
  { key: "equipment", title: "Equipment and supplies", body: "[Equipment and supplies text — edit in Settings]", sortOrder: 80 },
  { key: "invoicing", title: "Invoicing and payment terms", body: "[Invoicing text — edit in Settings]", sortOrder: 90 },
  { key: "term", title: "Term and termination", body: "[Term and termination text — edit in Settings]", sortOrder: 100 },
  { key: "acceptance", title: "Agreement", body: "[Acceptance text — edit in Settings]", sortOrder: 110 },
] as const;

export type ProposalSectionKey = (typeof PROPOSAL_SECTION_CATALOG)[number]["key"];

export type ProposalSectionContent = {
  key: ProposalSectionKey;
  title: string;
  body: string;
};

const KEYS = new Set<string>(PROPOSAL_SECTION_CATALOG.map((item) => item.key));

export function isProposalSectionKey(value: string): value is ProposalSectionKey {
  return KEYS.has(value);
}

export function resolveProposalSections(
  stored: { key: string; title: string; body: string }[] = [],
  overrides: { key: string; body: string }[] = []
): ProposalSectionContent[] {
  const storedByKey = new Map(stored.map((row) => [row.key, row]));
  const overrideByKey = new Map(overrides.map((row) => [row.key, row.body.trim()]));
  return PROPOSAL_SECTION_CATALOG.map((item) => {
    const row = storedByKey.get(item.key);
    const override = overrideByKey.get(item.key);
    const title = row?.title?.trim() || item.title;
    const storedBody = row?.body?.trim() || item.body;
    return {
      key: item.key,
      title,
      body: override || storedBody,
    };
  });
}

export function proposalSection(sections: ProposalSectionContent[], key: ProposalSectionKey): ProposalSectionContent {
  return (
    sections.find((section) => section.key === key) ?? {
      key,
      title: key,
      body: "",
    }
  );
}
