import { requireAdmin } from "@/server/guards/rbac";
import { prisma } from "@/lib/prisma";

export default async function AdminLeadsPage() {
  await requireAdmin();

  const leads = await prisma.lead.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Contact Form Submissions</h1>
        <p className="mt-1 text-zinc-400">View and manage leads from the contact form</p>
      </div>

      {leads.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center">
          <p className="text-zinc-400">No submissions yet.</p>
        </div>
      ) : (
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 shadow-xl">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-800">
              <thead className="bg-zinc-800/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">Message</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-300">
                      {new Date(lead.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-white">{lead.name}</td>
                    <td className="px-4 py-3 text-sm text-zinc-300">
                      <a href={`mailto:${lead.email}`} className="text-emerald-400 hover:text-emerald-300 underline">
                        {lead.email}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-300">
                      {lead.phone ? (
                        <a href={`tel:${lead.phone}`} className="text-emerald-400 hover:text-emerald-300">
                          {lead.phone}
                        </a>
                      ) : (
                        <span className="text-zinc-500">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-300 max-w-md">
                      <div className="line-clamp-2">{lead.message || <span className="text-zinc-500">—</span>}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-400">
                      {lead.sourcePage ? (
                        <span className="truncate max-w-[150px] block" title={lead.sourcePage}>
                          {lead.sourcePage.replace("/contact", "").replace("?", "") || "/contact"}
                        </span>
                      ) : (
                        <span className="text-zinc-500">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
