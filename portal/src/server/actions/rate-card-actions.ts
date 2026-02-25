"use server";

import { requireAdmin } from "@/server/guards/rbac";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getActiveRateCard() {
  return prisma.rateCard.findFirst({
    where: { isActive: true },
    include: {
      entries: {
        orderBy: [{ areaType: "asc" }, { size: "asc" }, { sortOrder: "asc" }],
      },
    },
  });
}

export async function updateRateCardEntry(
  entryId: string,
  minutes: number
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();
  if (!Number.isFinite(minutes) || minutes < 0 || minutes > 999) {
    return { ok: false, error: "Minutes must be between 0 and 999" };
  }
  await prisma.rateCardEntry.update({
    where: { id: entryId },
    data: { minutes: Math.round(minutes) },
  });
  revalidatePath("/admin/pricing");
  return { ok: true };
}

export async function createRateCardEntry(data: {
  rateCardId: string;
  areaType: string;
  size: string;
  sizeLabel: string;
  finish: string;
  finishLabel: string;
  minutes: number;
  description?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();
  if (!Number.isFinite(data.minutes) || data.minutes < 0 || data.minutes > 999) {
    return { ok: false, error: "Minutes must be between 0 and 999" };
  }
  const maxSort = await prisma.rateCardEntry.aggregate({
    where: { rateCardId: data.rateCardId },
    _max: { sortOrder: true },
  });
  await prisma.rateCardEntry.create({
    data: {
      rateCardId: data.rateCardId,
      areaType: data.areaType as any,
      size: data.size,
      sizeLabel: data.sizeLabel,
      finish: data.finish,
      finishLabel: data.finishLabel,
      minutes: Math.round(data.minutes),
      description: data.description || null,
      sortOrder: (maxSort._max.sortOrder ?? 0) + 1,
    },
  });
  revalidatePath("/admin/pricing");
  return { ok: true };
}

export async function deleteRateCardEntry(
  entryId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();
  await prisma.rateCardEntry.delete({ where: { id: entryId } });
  revalidatePath("/admin/pricing");
  return { ok: true };
}
