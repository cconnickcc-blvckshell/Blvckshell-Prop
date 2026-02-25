import { requireAdmin } from "@/server/guards/rbac";
import { prisma } from "@/lib/prisma";
import ScheduleManager from "./ScheduleManager";

export default async function AdminSchedulesPage() {
  await requireAdmin();

  const [rawSchedules, sites, workers] = await Promise.all([
    prisma.recurringSchedule.findMany({
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
      include: {
        site: { select: { name: true } },
        assignedWorker: {
          select: { user: { select: { name: true } } },
        },
      },
    }),
    prisma.site.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.worker.findMany({
      where: { isActive: true },
      select: {
        id: true,
        user: { select: { name: true } },
        workforceAccount: { select: { displayName: true } },
      },
    }),
  ]);

  const schedules = rawSchedules.map((s) => ({
    id: s.id,
    siteId: s.siteId,
    siteName: s.site.name,
    assignedWorkerId: s.assignedWorkerId,
    workerName: s.assignedWorker?.user.name ?? null,
    dayOfWeek: s.dayOfWeek,
    startTime: s.startTime,
    estimatedDurationMinutes: s.estimatedDurationMinutes,
    payoutAmountCents: s.payoutAmountCents,
    isActive: s.isActive,
    lastGeneratedDate: s.lastGeneratedDate?.toISOString() ?? null,
  }));

  const siteOptions = sites.map((s) => ({ id: s.id, name: s.name }));
  const workerOptions = workers.map((w) => ({
    id: w.id,
    userName: w.user.name,
    accountName: w.workforceAccount.displayName,
  }));

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Schedules</h1>
        <p className="mt-1 text-zinc-400">Recurring schedules and automatic job generation</p>
      </div>
      <ScheduleManager schedules={schedules} sites={siteOptions} workers={workerOptions} />
    </div>
  );
}
