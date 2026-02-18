import { requireVendorOwner } from "@/server/guards/rbac";
import { prisma } from "@/lib/prisma";

export default async function VendorTeamPage() {
  const user = await requireVendorOwner();
  if (!user.workforceAccountId) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <p className="text-gray-600">No workforce account linked.</p>
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
        <p className="text-gray-600">Account not found.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Team</h1>
        <p className="text-gray-600">{account.displayName}</p>
      </div>

      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Users</h2>
        <ul className="space-y-3">
          {account.users.map((u) => (
            <li
              key={u.id}
              className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0"
            >
              <div>
                <p className="font-medium text-gray-900">{u.name}</p>
                <p className="text-sm text-gray-500">{u.email}</p>
              </div>
              <span className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                {u.role.replace(/_/g, " ")}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Workers (job assignment)</h2>
        <ul className="space-y-3">
          {account.workers.map((w) => (
            <li
              key={w.id}
              className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0"
            >
              <div>
                <p className="font-medium text-gray-900">{w.user.name}</p>
                <p className="text-sm text-gray-500">{w.user.email}</p>
              </div>
              <span className="text-sm text-gray-500">
                {w.hasPhotoIdOnFile ? "Photo ID on file" : "No photo ID"}
              </span>
            </li>
          ))}
        </ul>
        {account.workers.length === 0 && (
          <p className="text-sm text-gray-500">No workers in this account yet.</p>
        )}
      </div>
    </div>
  );
}
