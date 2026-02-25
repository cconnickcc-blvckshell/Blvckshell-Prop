"use server";

import { requireAdmin } from "@/server/guards/rbac";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { logError } from "@/lib/logger";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export { DAY_NAMES };

export async function createRecurringSchedule(input: {
  siteId: string;
  assignedWorkerId?: string;
  dayOfWeek: number;
  startTime: string;
  estimatedDurationMinutes: number;
  payoutAmountCents: number;
}) {
  await requireAdmin();

  const schedule = await prisma.recurringSchedule.create({
    data: {
      siteId: input.siteId,
      assignedWorkerId: input.assignedWorkerId || null,
      dayOfWeek: input.dayOfWeek,
      startTime: input.startTime,
      estimatedDurationMinutes: input.estimatedDurationMinutes,
      payoutAmountCents: input.payoutAmountCents,
    },
  });

  revalidatePath("/admin/schedules");
  return { ok: true, scheduleId: schedule.id };
}

export async function updateRecurringSchedule(id: string, data: {
  assignedWorkerId?: string | null;
  startTime?: string;
  estimatedDurationMinutes?: number;
  payoutAmountCents?: number;
  isActive?: boolean;
}) {
  await requireAdmin();
  await prisma.recurringSchedule.update({ where: { id }, data });
  revalidatePath("/admin/schedules");
  return { ok: true };
}

export async function deleteRecurringSchedule(id: string) {
  await requireAdmin();
  await prisma.recurringSchedule.delete({ where: { id } });
  revalidatePath("/admin/schedules");
  return { ok: true };
}

/**
 * Generate jobs from recurring schedules for a date range.
 * Idempotent — won't create duplicates for the same schedule+date.
 */
export async function generateJobsFromSchedules(input: {
  fromDate: string;
  toDate: string;
}): Promise<{ ok: true; created: number; skipped: number } | { ok: false; error: string }> {
  const user = await requireAdmin();

  const from = new Date(input.fromDate);
  const to = new Date(input.toDate);
  if (isNaN(from.getTime()) || isNaN(to.getTime()) || from > to) {
    return { ok: false, error: "Invalid date range" };
  }

  const schedules = await prisma.recurringSchedule.findMany({
    where: { isActive: true },
    include: { site: { select: { name: true } } },
  });

  let created = 0;
  let skipped = 0;

  for (const schedule of schedules) {
    const current = new Date(from);
    while (current <= to) {
      if (current.getDay() === schedule.dayOfWeek) {
        const [hours, minutes] = schedule.startTime.split(":").map(Number);
        const scheduledStart = new Date(current);
        scheduledStart.setHours(hours, minutes, 0, 0);
        const scheduledEnd = new Date(scheduledStart.getTime() + schedule.estimatedDurationMinutes * 60000);

        const existing = await prisma.job.findFirst({
          where: {
            siteId: schedule.siteId,
            scheduledStart: {
              gte: new Date(current.getFullYear(), current.getMonth(), current.getDate()),
              lt: new Date(current.getFullYear(), current.getMonth(), current.getDate() + 1),
            },
            ...(schedule.assignedWorkerId ? { assignedWorkerId: schedule.assignedWorkerId } : {}),
            status: { not: "CANCELLED" },
          },
        });

        if (existing) {
          skipped++;
        } else {
          try {
            await prisma.job.create({
              data: {
                siteId: schedule.siteId,
                assignedWorkerId: schedule.assignedWorkerId,
                assignedWorkforceAccountId: schedule.assignedWorkforceAccountId,
                scheduledStart,
                scheduledEnd,
                payoutAmountCents: schedule.payoutAmountCents,
                status: "SCHEDULED",
              },
            });
            created++;
          } catch (e) {
            logError(e, { where: "schedule:generateJobs", entityId: schedule.id });
          }
        }

        await prisma.recurringSchedule.update({
          where: { id: schedule.id },
          data: { lastGeneratedDate: current },
        });
      }
      current.setDate(current.getDate() + 1);
    }
  }

  await prisma.auditLog.create({
    data: {
      actorUserId: user.id,
      entityType: "RecurringSchedule",
      entityId: "batch",
      fromState: null,
      toState: "GENERATED",
      metadata: JSON.parse(JSON.stringify({ fromDate: input.fromDate, toDate: input.toDate, created, skipped })),
    },
  });

  revalidatePath("/admin/jobs");
  revalidatePath("/admin/schedules");
  return { ok: true, created, skipped };
}
