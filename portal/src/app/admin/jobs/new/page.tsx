import { requireAdmin } from "@/server/guards/rbac";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { createJob } from "../actions";
import CreateJobForm from "./CreateJobForm";

export default async function NewJobPage() {
  await requireAdmin();

  const [sites, workers] = await Promise.all([
    prisma.site.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        address: true,
        clientOrganizationId: true,
        serviceWindow: true,
        estimatedDurationMinutes: true,
        requiredPhotoCount: true,
        suppliesProvidedBy: true,
        doNotEnterUnits: true,
        isActive: true,
        clientOrganization: { select: { name: true } },
      },
      orderBy: [{ clientOrganization: { name: "asc" } }, { name: "asc" }],
    }),
    prisma.worker.findMany({
      where: { isActive: true },
      include: {
        user: { select: { name: true, email: true } },
        workforceAccount: { select: { displayName: true, type: true } },
      },
      orderBy: { user: { name: "asc" } },
    }),
  ]);

  return (
    <div className="w-full max-w-2xl">
      <div className="mb-6">
        <Link href="/admin/jobs" className="text-sm text-zinc-400 hover:text-white">
          ← Jobs
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-white">Create job</h1>
        <p className="mt-1 text-zinc-400">Schedule a job at a site and assign a worker.</p>
      </div>
      <CreateJobForm action={createJob} sites={sites} workers={workers} />
    </div>
  );
}
