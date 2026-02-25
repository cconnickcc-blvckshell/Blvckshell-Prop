"use server";

import { prisma } from "@/lib/prisma";
import { logError } from "@/lib/logger";

/**
 * Recompute quality score for a site based on recent checklist runs.
 * Score = percentage of items that passed in the last 30 days.
 */
export async function computeSiteQualityScore(siteId: string): Promise<{ score: number; trend: string }> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

  const recentRuns = await prisma.checklistRunItem.findMany({
    where: {
      checklistRun: {
        job: { siteId },
        status: { in: ["Submitted", "Approved"] },
        submittedAt: { gte: thirtyDaysAgo },
      },
    },
    select: { result: true },
  });

  const previousRuns = await prisma.checklistRunItem.findMany({
    where: {
      checklistRun: {
        job: { siteId },
        status: { in: ["Submitted", "Approved"] },
        submittedAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
      },
    },
    select: { result: true },
  });

  const currentScore = recentRuns.length > 0
    ? Math.round((recentRuns.filter(r => r.result === "PASS").length / recentRuns.length) * 100)
    : 0;

  const previousScore = previousRuns.length > 0
    ? Math.round((previousRuns.filter(r => r.result === "PASS").length / previousRuns.length) * 100)
    : 0;

  const trend = recentRuns.length === 0 ? "stable"
    : currentScore > previousScore + 3 ? "up"
    : currentScore < previousScore - 3 ? "down"
    : "stable";

  await prisma.site.update({
    where: { id: siteId },
    data: { qualityScore: currentScore, qualityTrend: trend },
  });

  return { score: currentScore, trend };
}

/**
 * Batch recompute all active site quality scores.
 */
export async function recomputeAllSiteQualityScores() {
  const sites = await prisma.site.findMany({
    where: { isActive: true },
    select: { id: true },
  });

  for (const site of sites) {
    try {
      await computeSiteQualityScore(site.id);
    } catch (e) {
      logError(e, { where: "quality:recomputeAll", entityId: site.id });
    }
  }

  return { ok: true, sitesProcessed: sites.length };
}
