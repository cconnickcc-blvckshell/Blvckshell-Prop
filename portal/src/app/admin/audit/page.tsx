import { requireAdmin } from "@/server/guards/rbac";
import { prisma } from "@/lib/prisma";

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ entityType?: string; entityId?: string; actor?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const entityType = params.entityType?.trim();
  const entityId = params.entityId?.trim();
  const actorUserId = params.actor?.trim();

  const logs = await prisma.auditLog.findMany({
    where: {
      ...(entityType ? { entityType } : {}),
      ...(entityId ? { entityId } : {}),
      ...(actorUserId ? { actorUserId } : {}),
    },
    include: {
      actorUser: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Audit log</h1>
        <p className="mt-1 text-zinc-400">All critical actions are logged. Use filters to trace entity or user.</p>
      </div>

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 shadow-xl">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-800">
            <thead className="bg-zinc-800/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">Time</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">Actor</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">Entity</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">From → To</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-400">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-300">
                    {log.actorUser.name}
                    <br />
                    <span className="text-zinc-500">{log.actorUser.email}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-300">
                    <span className="font-medium text-white">{log.entityType}</span>
                    <br />
                    <span className="text-zinc-500 font-mono text-xs">{log.entityId.slice(0, 12)}…</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-300">
                    {log.fromState ? (
                      <>
                        <span className="text-zinc-500">{log.fromState}</span>
                        <span className="mx-1">→</span>
                        <span className="text-white">{log.toState ?? "—"}</span>
                      </>
                    ) : (
                      <span className="text-zinc-400">{log.toState ?? "—"}</span>
                    )}
                  </td>
                  <td className="max-w-xs truncate px-4 py-3 text-xs text-zinc-500">
                    {log.metadata && typeof log.metadata === "object"
                      ? JSON.stringify(log.metadata).slice(0, 80) + (JSON.stringify(log.metadata).length > 80 ? "…" : "")
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {logs.length === 0 && (
          <div className="p-8 text-center text-sm text-zinc-500">
            No audit entries match.
            {!entityType && !entityId && !actorUserId && " Logs appear as actions are performed."}
          </div>
        )}
      </section>
    </div>
  );
}
