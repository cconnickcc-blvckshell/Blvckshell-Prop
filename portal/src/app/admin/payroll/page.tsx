import { requireAdmin } from "@/server/guards/rbac";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import PayrollActions from "./PayrollActions";

export default async function PayrollPage() {
  await requireAdmin();

  const [entries, employees] = await Promise.all([
    prisma.timeEntry.findMany({
      orderBy: { date: "desc" },
      take: 100,
      include: {
        worker: { select: { user: { select: { name: true, email: true } } } },
        workforceAccount: { select: { displayName: true } },
      },
    }),
    prisma.workforceAccount.findMany({
      where: { classification: "EMPLOYEE", isActive: true },
      select: {
        id: true,
        displayName: true,
        workers: {
          where: { isActive: true },
          select: { id: true, user: { select: { name: true } } },
        },
      },
    }),
  ]);

  const statusClass: Record<string, string> = {
    DRAFT: "bg-zinc-600/30 text-zinc-300 border-zinc-500/40",
    SUBMITTED: "bg-blue-500/20 text-blue-300 border-blue-500/40",
    APPROVED: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    EXPORTED: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    PAID: "bg-zinc-600/30 text-zinc-300 border-zinc-500/40",
  };

  const totalsByStatus = entries.reduce(
    (acc, e) => {
      acc[e.status] = (acc[e.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Payroll</h1>
          <p className="mt-1 text-zinc-400">Time entries and payroll export for employees</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        {(["DRAFT", "SUBMITTED", "APPROVED", "EXPORTED", "PAID"] as const).map((status) => (
          <div
            key={status}
            className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 text-center shadow-xl"
          >
            <p className="text-2xl font-bold text-white">{totalsByStatus[status] || 0}</p>
            <p className="text-xs text-zinc-400">{status}</p>
          </div>
        ))}
      </div>

      {/* Actions */}
      <PayrollActions employees={employees} />

      {/* Employee accounts info */}
      {employees.length === 0 && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-300">
          No employee workforce accounts found. Time entries require workforce accounts with
          classification = EMPLOYEE. Update account classification in{" "}
          <Link href="/admin/workforce" className="underline hover:text-amber-200">
            Workforce
          </Link>
          .
        </div>
      )}

      {/* Time entries table */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 shadow-xl">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-800">
            <thead className="bg-zinc-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Worker
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Regular
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-400">
                  OT
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Batch
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-white">
                    {entry.worker.user.name}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-300">
                    {new Date(entry.date).toLocaleDateString()}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-zinc-300">
                    {Math.floor(entry.regularMinutes / 60)}h {entry.regularMinutes % 60}m
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-zinc-300">
                    {entry.overtimeMinutes > 0
                      ? `${Math.floor(entry.overtimeMinutes / 60)}h ${entry.overtimeMinutes % 60}m`
                      : "—"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-zinc-300">
                    ${(entry.rateCentsPerHour / 100).toFixed(2)}/hr
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
                        statusClass[entry.status] ?? ""
                      }`}
                    >
                      {entry.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-400">
                    {entry.payrollBatchRef || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {entries.length === 0 && (
          <div className="p-8 text-center text-sm text-zinc-500">
            No time entries yet. Create entries for employee workers.
          </div>
        )}
      </div>
    </div>
  );
}
