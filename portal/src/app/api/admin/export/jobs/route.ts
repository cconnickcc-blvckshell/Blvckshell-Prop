import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/guards/rbac";
import { prisma } from "@/lib/prisma";
import { formatJobStatus, formatDate } from "@/lib/format";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "FOUNDER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const jobs = await prisma.job.findMany({
    select: {
      id: true, scheduledStart: true, status: true, payoutAmountCents: true,
      billableAmountCents: true,
      site: { select: { name: true, address: true, clientOrganization: { select: { name: true } } } },
      assignedWorker: { select: { user: { select: { name: true } } } },
      assignedWorkforceAccount: { select: { displayName: true } },
    },
    orderBy: { scheduledStart: "desc" },
    take: 5000,
  });

  const header = "Job ID,Site,Address,Client,Scheduled,Status,Assigned To,Payout,Billable\n";
  const rows = jobs.map((j) => {
    const assigned = j.assignedWorker?.user.name ?? j.assignedWorkforceAccount?.displayName ?? "";
    return [
      j.id,
      `"${j.site.name}"`,
      `"${j.site.address}"`,
      `"${j.site.clientOrganization.name}"`,
      formatDate(j.scheduledStart),
      formatJobStatus(j.status),
      `"${assigned}"`,
      (j.payoutAmountCents / 100).toFixed(2),
      ((j.billableAmountCents ?? j.payoutAmountCents) / 100).toFixed(2),
    ].join(",");
  }).join("\n");

  return new NextResponse(header + rows, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="jobs-export-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
