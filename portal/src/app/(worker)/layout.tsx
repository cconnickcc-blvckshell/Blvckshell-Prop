import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/guards/rbac";
import { prisma } from "@/lib/prisma";
import WorkerNav from "@/components/worker/WorkerNav";

export default async function WorkerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (
    user.role !== "VENDOR_WORKER" &&
    user.role !== "INTERNAL_WORKER" &&
    user.role !== "VENDOR_OWNER"
  ) {
    redirect("/");
  }

  const pendingCount = user.workerId
    ? await prisma.job.count({
        where: {
          assignedWorkerId: user.workerId,
          status: "SCHEDULED",
          scheduledStart: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
      })
    : 0;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <WorkerNav userName={user.name ?? "User"} role={user.role} jobsBadge={pendingCount} />
      <main className="pb-20">{children}</main>
    </div>
  );
}
