import { requireVendorOwner } from "@/server/guards/rbac";
import { prisma } from "@/lib/prisma";
import { formatRole } from "@/lib/format";

export default async function VendorTeamPage() {
  const user = await requireVendorOwner();
  if (!user.workforceAccountId) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <p className="text-zinc-400">No workforce account linked.</p>
      </div>
    );
  }

  const account = await prisma.workforceAccount.findUnique({
    where: { id: user.workforceAccountId },
    include: {
      users: {
        where: { isActive: true },
        select: { id: true, name: true, email: true, role: true },
      },
      workers: {
        where: { isActive: true },
        include: {
          user: { select: { name: true, email: true } },
        },
      },
    },
  });

  if (!account) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <p className="text-zinc-400">Account not found.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Team</h1>
        <p className="text-zinc-400">{account.displayName}</p>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-white">Users</h2>
        <ul className="space-y-3">
          {account.users.map((u) => (
            <li
              key={u.id}
              className="flex items-center justify-between border-b border-zinc-800 pb-3 last:border-0"
            >
              <div>
                <p className="font-medium text-white">{u.name}</p>
                <p className="text-sm text-zinc-500">{u.email}</p>
              </div>
              <span className="rounded bg-zinc-800 px-2 py-1 text-xs font-medium text-zinc-400">
                {formatRole(u.role)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-white">Workers (job assignment)</h2>
        <ul className="space-y-3">
          {account.workers.map((w) => (
            <li
              key={w.id}
              className="flex items-center justify-between border-b border-zinc-800 pb-3 last:border-0"
            >
              <div>
                <p className="font-medium text-white">{w.user.name}</p>
                <p className="text-sm text-zinc-500">{w.user.email}</p>
              </div>
              <span className="text-sm text-zinc-500">
                {w.hasPhotoIdOnFile ? "Photo ID on file" : "No photo ID"}
              </span>
            </li>
          ))}
        </ul>
        {account.workers.length === 0 && (
          <p className="text-sm text-zinc-500">No workers in this account yet.</p>
        )}
      </div>
    </div>
  );
}
