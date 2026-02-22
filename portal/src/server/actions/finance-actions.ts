"use server";

import { requireAdmin, requireFounder } from "@/server/guards/rbac";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { computeSiteSnapshot, persistSiteSnapshot } from "@/server/finance/site-snapshot-engine";

export async function getSitesForFinance() {
  await requireAdmin();
  return prisma.site.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}

export async function computeSiteSnapshotAction(siteId: string, month: Date) {
  const user = await requireAdmin();
  const result = await computeSiteSnapshot({ siteId, month });
  if (!result.ok) return result;
  const persist = await persistSiteSnapshot(result.draft, user.id);
  if (!persist.ok) return persist;
  revalidatePath("/admin/finance");
  return { ok: true as const, snapshotId: persist.id };
}

export async function closeSiteSnapshot(snapshotId: string) {
  const user = await requireAdmin();
  const snap = await prisma.sitePerformanceSnapshot.findUnique({
    where: { id: snapshotId },
    select: { id: true, siteId: true, month: true, status: true },
  });
  if (!snap) return { ok: false, error: "Snapshot not found" };
  if (snap.status === "CLOSED") return { ok: false, error: "Already CLOSED" };
  await prisma.sitePerformanceSnapshot.update({
    where: { id: snapshotId },
    data: { status: "CLOSED", lockedAt: new Date() },
  });
  await prisma.auditLog.create({
    data: {
      actorUserId: user.id,
      entityType: "SitePerformanceSnapshot",
      entityId: snapshotId,
      fromState: "OPEN",
      toState: "CLOSED",
      metadata: { siteId: snap.siteId, month: snap.month.toISOString() },
    },
  });
  revalidatePath("/admin/finance");
  return { ok: true };
}

/** Founder-only: recompute creates new version + AuditLog; only if no CLOSED snapshot for site+month */
export async function recomputeSiteSnapshot(siteId: string, month: Date) {
  const user = await requireFounder();
  const result = await computeSiteSnapshot({ siteId, month });
  if (!result.ok) return result;
  const persist = await persistSiteSnapshot(result.draft, user.id);
  if (!persist.ok) return persist;
  await prisma.auditLog.create({
    data: {
      actorUserId: user.id,
      entityType: "SitePerformanceSnapshot",
      entityId: persist.id,
      metadata: { action: "recompute", siteId, month: month.toISOString() },
    },
  });
  revalidatePath("/admin/finance");
  return { ok: true as const, snapshotId: persist.id };
}

export async function listSiteSnapshots(siteId?: string, month?: Date) {
  await requireAdmin();
  const monthStart = month
    ? new Date(month.getFullYear(), month.getMonth(), 1)
    : undefined;
  const snapshots = await prisma.sitePerformanceSnapshot.findMany({
    where: {
      ...(siteId ? { siteId } : {}),
      ...(monthStart ? { month: monthStart } : {}),
    },
    orderBy: [{ siteId: "asc" }, { month: "desc" }, { version: "desc" }],
    take: 200,
    include: {
      site: { select: { name: true } },
    },
  });
  return snapshots;
}
