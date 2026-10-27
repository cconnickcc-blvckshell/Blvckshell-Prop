import { TORONTO_TZ, zonedParts, zonedTimeToUtc } from "@/lib/toronto-time";
import { prisma } from "@/lib/prisma";
import { buildMonthlyReportModel, type MonthlyReportModel } from "@/lib/pdf/models";

export function reportPeriod(monthParam: string | null, now = new Date()): {
  start: Date;
  end: Date;
  label: string;
} {
  const parsed = monthParam && /^\d{4}-\d{2}$/.test(monthParam) ? monthParam.split("-").map(Number) : null;
  const parts = zonedParts(now, TORONTO_TZ);
  const year = parsed && parsed[1] >= 1 && parsed[1] <= 12 ? parsed[0] : parts.year;
  const month = parsed && parsed[1] >= 1 && parsed[1] <= 12 ? parsed[1] : parts.month;
  const start = zonedTimeToUtc(year, month, 1, 0, 0, 0, TORONTO_TZ);
  const end = zonedTimeToUtc(year, month + 1, 1, 0, 0, 0, TORONTO_TZ);
  const label = new Intl.DateTimeFormat("en-CA", {
    timeZone: TORONTO_TZ,
    month: "long",
    year: "numeric",
  }).format(start);
  return { start, end, label };
}

export async function loadMonthlyReport(
  clientId: string,
  monthParam: string | null
): Promise<MonthlyReportModel | null> {
  const period = reportPeriod(monthParam);
  const client = await prisma.clientOrganization.findUnique({
    where: { id: clientId },
    select: {
      name: true,
      primaryContactName: true,
      primaryContactEmail: true,
      sites: {
        where: { isActive: true },
        select: { id: true, name: true, qualityScore: true },
        orderBy: { name: "asc" },
      },
    },
  });
  if (!client) return null;

  const siteIds = client.sites.map((site) => site.id);
  const [jobs, incidents, invoices] = await Promise.all([
    prisma.job.findMany({
      where: {
        siteId: { in: siteIds },
        scheduledStart: { gte: period.start, lt: period.end },
        status: { not: "CANCELLED" },
      },
      select: {
        siteId: true,
        status: true,
        checklistRuns: {
          select: {
            items: { select: { result: true } },
            evidence: { select: { id: true } },
          },
        },
      },
    }),
    prisma.incidentReport.findMany({
      where: {
        siteId: { in: siteIds },
        reportedAt: { gte: period.start, lt: period.end },
      },
      select: {
        type: true,
        reportedAt: true,
        resolvedAt: true,
        site: { select: { name: true } },
      },
      orderBy: { reportedAt: "asc" },
    }),
    prisma.invoice.findMany({
      where: {
        clientId,
        periodStart: { lt: period.end },
        periodEnd: { gte: period.start },
      },
      select: { invoiceNumber: true, status: true, totalCents: true },
      orderBy: { invoiceNumber: "asc" },
    }),
  ]);

  const sites = client.sites.map((site) => {
    const siteJobs = jobs.filter((job) => job.siteId === site.id);
    let passItems = 0;
    let scoredItems = 0;
    let photos = 0;
    for (const job of siteJobs) {
      for (const run of job.checklistRuns) {
        for (const item of run.items) {
          if (item.result === "PASS") {
            passItems += 1;
            scoredItems += 1;
          } else if (item.result === "FAIL") {
            scoredItems += 1;
          }
        }
        photos += run.evidence.length;
      }
    }
    return {
      name: site.name,
      jobs: siteJobs.length,
      jobsDone: siteJobs.filter((job) => job.status !== "SCHEDULED").length,
      passItems,
      scoredItems,
      photos,
      qualityScore: site.qualityScore,
    };
  });

  return buildMonthlyReportModel({
    clientName: client.name,
    contactName: client.primaryContactName,
    contactEmail: client.primaryContactEmail,
    periodLabel: period.label,
    sites,
    incidents: incidents.map((incident) => ({
      type: incident.type,
      reportedAt: incident.reportedAt,
      resolvedAt: incident.resolvedAt,
      siteName: incident.site.name,
    })),
    invoices,
  });
}
