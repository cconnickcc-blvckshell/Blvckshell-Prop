"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  isProposalSectionKey,
  PROPOSAL_SECTION_CATALOG,
  type ProposalSectionKey,
} from "@/lib/pdf/proposal-sections";
import { isQuoteAreaType, PROPOSAL_AREA_TASK_CATALOG, QUOTE_AREA_TYPES } from "@/lib/pdf/proposal-tasks";
import { requireAdmin } from "@/server/guards/rbac";
import {
  isPaymentTerms,
  paymentTermsLabel,
  termsDays,
  type PaymentTermsCode,
} from "@/server/invoices/payment-terms";

const TITLE_MAX = 80;
const BODY_MAX = 8000;

export type ProposalSectionDraft = {
  key: string;
  title: string;
  body: string;
};

function cleanTitle(value: string, fallback: string): string {
  const title = value.trim().slice(0, TITLE_MAX);
  return title || fallback;
}

function cleanBody(value: string, fallback: string): string {
  const body = value.trim().slice(0, BODY_MAX);
  return body || fallback;
}

export async function listProposalSections(): Promise<ProposalSectionDraft[]> {
  await requireAdmin();
  const rows = await prisma.proposalSection.findMany();
  const byKey = new Map(rows.map((row) => [row.key, row]));
  return PROPOSAL_SECTION_CATALOG.map((item) => {
    const row = byKey.get(item.key);
    return {
      key: item.key,
      title: row?.title ?? item.title,
      body: row?.body ?? item.body,
    };
  });
}

export async function saveProposalSections(rows: ProposalSectionDraft[]) {
  await requireAdmin();
  const catalog = new Map(PROPOSAL_SECTION_CATALOG.map((item) => [item.key, item]));
  for (const row of rows) {
    if (!isProposalSectionKey(row.key)) continue;
    const item = catalog.get(row.key);
    if (!item) continue;
    await prisma.proposalSection.upsert({
      where: { key: row.key },
      create: {
        key: row.key,
        title: cleanTitle(row.title, item.title),
        body: cleanBody(row.body, item.body),
        sortOrder: item.sortOrder,
      },
      update: {
        title: cleanTitle(row.title, item.title),
        body: cleanBody(row.body, item.body),
        sortOrder: item.sortOrder,
      },
    });
  }
  revalidatePath("/admin/settings/proposal");
  return { success: true as const, error: null };
}

export async function saveQuoteSectionOverrides(
  quoteId: string,
  rows: { key: string; body: string }[]
) {
  await requireAdmin();
  const quote = await prisma.quote.findUnique({ where: { id: quoteId }, select: { id: true } });
  if (!quote) return { success: false as const, error: "Quote not found" };

  const stored = await prisma.proposalSection.findMany({ select: { key: true, body: true } });
  const defaults = new Map<ProposalSectionKey, string>(
    PROPOSAL_SECTION_CATALOG.map((item) => [item.key, item.body])
  );
  for (const row of stored) {
    if (isProposalSectionKey(row.key) && row.body.trim()) defaults.set(row.key, row.body.trim());
  }

  for (const row of rows) {
    if (!isProposalSectionKey(row.key)) continue;
    const body = row.body.trim().slice(0, BODY_MAX);
    const fallback = defaults.get(row.key) ?? "";
    if (!body || body === fallback) {
      await prisma.quoteSectionOverride.deleteMany({
        where: { quoteId, sectionKey: row.key },
      });
      continue;
    }
    await prisma.quoteSectionOverride.upsert({
      where: { quoteId_sectionKey: { quoteId, sectionKey: row.key } },
      create: { quoteId, sectionKey: row.key, body },
      update: { body },
    });
  }

  revalidatePath(`/admin/quotes/${quoteId}/proposal`);
  return { success: true as const, error: null };
}

export async function updateQuotePaymentTerms(quoteId: string, terms: PaymentTermsCode) {
  await requireAdmin();
  if (!isPaymentTerms(terms)) return { success: false as const, error: "Unknown payment terms" };
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    select: { id: true, status: true, paymentTermsDays: true },
  });
  if (!quote) return { success: false as const, error: "Quote not found" };
  if (quote.status === "WON") return { success: false as const, error: "This quote is already finalized" };

  const days = termsDays(terms, terms === "NET_30" ? quote.paymentTermsDays || 30 : 0);
  await prisma.quote.update({
    where: { id: quoteId },
    data: { paymentTerms: terms, paymentTermsDays: days },
  });
  revalidatePath(`/admin/quotes/${quoteId}/proposal`);
  return { success: true as const, error: null, label: paymentTermsLabel(terms, days) };
}

export type ProposalTaskDraft = {
  areaType: string;
  description: string;
  frequency: string;
};

export async function listProposalAreaTasks(): Promise<ProposalTaskDraft[]> {
  await requireAdmin();
  const rows = await prisma.proposalAreaTask.findMany({ orderBy: [{ areaType: "asc" }, { sortOrder: "asc" }] });
  if (rows.length === 0) {
    return PROPOSAL_AREA_TASK_CATALOG.map((row) => ({
      areaType: row.areaType,
      description: row.description,
      frequency: row.frequency,
    }));
  }
  return rows.map((row) => ({
    areaType: row.areaType,
    description: row.description,
    frequency: row.frequency,
  }));
}

function cleanTasks(rows: ProposalTaskDraft[]): ProposalTaskDraft[] {
  return rows
    .filter((row) => isQuoteAreaType(row.areaType) && row.description.trim())
    .map((row) => ({
      areaType: row.areaType,
      description: row.description.trim().slice(0, 240),
      frequency: (row.frequency.trim() || "Each visit").slice(0, 80),
    }));
}

export async function saveProposalAreaTasks(rows: ProposalTaskDraft[]) {
  await requireAdmin();
  const cleaned = cleanTasks(rows);
  const fallback = PROPOSAL_AREA_TASK_CATALOG.map((row) => ({
    areaType: row.areaType,
    description: row.description,
    frequency: row.frequency,
  }));
  const next = cleaned.length > 0 ? cleaned : fallback;
  await prisma.$transaction(async (tx) => {
    await tx.proposalAreaTask.deleteMany();
    await tx.proposalAreaTask.createMany({
      data: next.map((row, index) => ({
        areaType: row.areaType as (typeof QUOTE_AREA_TYPES)[number],
        description: row.description,
        frequency: row.frequency,
        sortOrder: (index + 1) * 10,
      })),
    });
  });
  revalidatePath("/admin/settings/proposal");
  return { success: true as const, error: null };
}

function sameTasks(left: ProposalTaskDraft[], right: ProposalTaskDraft[]): boolean {
  if (left.length !== right.length) return false;
  return left.every((row, index) => row.description === right[index]?.description && row.frequency === right[index]?.frequency);
}

export async function saveQuoteAreaTasks(
  quoteId: string,
  groups: { areaType: string; tasks: { description: string; frequency: string }[] }[]
) {
  await requireAdmin();
  const quote = await prisma.quote.findUnique({ where: { id: quoteId }, select: { id: true, status: true } });
  if (!quote) return { success: false as const, error: "Quote not found" };
  if (quote.status === "WON") return { success: false as const, error: "This quote is already finalized" };

  const defaults = await prisma.proposalAreaTask.findMany({ orderBy: [{ areaType: "asc" }, { sortOrder: "asc" }] });
  const defaultRows: ProposalTaskDraft[] =
    defaults.length > 0
      ? defaults.map((row) => ({ areaType: row.areaType, description: row.description, frequency: row.frequency }))
      : PROPOSAL_AREA_TASK_CATALOG.map((row) => ({
          areaType: row.areaType,
          description: row.description,
          frequency: row.frequency,
        }));

  await prisma.$transaction(async (tx) => {
    for (const group of groups) {
      const areaType = group.areaType;
      if (!isQuoteAreaType(areaType)) continue;
      const next = cleanTasks(group.tasks.map((task) => ({ ...task, areaType })));
      const base = defaultRows.filter((row) => row.areaType === areaType);
      await tx.quoteAreaTaskOverride.deleteMany({ where: { quoteId, areaType } });
      if (sameTasks(next, base)) continue;
      if (next.length === 0) continue;
      await tx.quoteAreaTaskOverride.createMany({
        data: next.map((row, index) => ({
          quoteId,
          areaType,
          description: row.description,
          frequency: row.frequency,
          sortOrder: (index + 1) * 10,
        })),
      });
    }
  });
  revalidatePath(`/admin/quotes/${quoteId}/proposal`);
  return { success: true as const, error: null };
}
