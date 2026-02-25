import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/guards/rbac";
import { prisma } from "@/lib/prisma";
import { logError } from "@/lib/logger";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !user.workerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const jobs = await prisma.job.findMany({
      where: {
        assignedWorkerId: user.workerId,
        status: { not: "CANCELLED" },
        scheduledStart: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      select: {
        id: true,
        scheduledStart: true,
        scheduledEnd: true,
        status: true,
        site: { select: { name: true, address: true, estimatedDurationMinutes: true } },
      },
      orderBy: { scheduledStart: "asc" },
      take: 200,
    });

    const ical = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//BLVCKSHELL//Portal//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "X-WR-CALNAME:BLVCKSHELL Jobs",
    ];

    for (const job of jobs) {
      const start = formatICalDate(new Date(job.scheduledStart));
      const end = job.scheduledEnd
        ? formatICalDate(new Date(job.scheduledEnd))
        : formatICalDate(new Date(new Date(job.scheduledStart).getTime() + (job.site.estimatedDurationMinutes ?? 60) * 60000));

      ical.push(
        "BEGIN:VEVENT",
        `UID:${job.id}@blvckshell.com`,
        `DTSTART:${start}`,
        `DTEND:${end}`,
        `SUMMARY:${escapeIcal(job.site.name)}`,
        `LOCATION:${escapeIcal(job.site.address)}`,
        `DESCRIPTION:Status: ${job.status}`,
        "END:VEVENT"
      );
    }

    ical.push("END:VCALENDAR");

    return new NextResponse(ical.join("\r\n"), {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": "attachment; filename=blvckshell-jobs.ics",
      },
    });
  } catch (error) {
    logError(error, { where: "api:worker/ical" });
    return NextResponse.json({ error: "Failed to generate calendar" }, { status: 500 });
  }
}

function formatICalDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function escapeIcal(s: string): string {
  return s.replace(/[,;\\]/g, (c) => "\\" + c).replace(/\n/g, "\\n");
}
