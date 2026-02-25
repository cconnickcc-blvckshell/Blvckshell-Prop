import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/guards/rbac";
import { prisma } from "@/lib/prisma";
import { formatDate, formatTimeEntryStatus } from "@/lib/format";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "FOUNDER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const entries = await prisma.timeEntry.findMany({
    include: {
      worker: { select: { user: { select: { name: true, email: true } } } },
      workforceAccount: { select: { displayName: true } },
    },
    orderBy: { date: "desc" },
    take: 5000,
  });

  const header = "Worker,Email,Account,Date,Regular Hours,OT Hours,Rate ($/hr),Regular Pay,OT Pay,Total Pay,Status,Batch Ref\n";
  const rows = entries.map((e) => {
    const regHrs = e.regularMinutes / 60;
    const otHrs = e.overtimeMinutes / 60;
    const regPay = regHrs * (e.rateCentsPerHour / 100);
    const otPay = otHrs * (e.rateCentsPerHour / 100) * 1.5;
    return [
      `"${e.worker.user.name}"`,
      e.worker.user.email,
      `"${e.workforceAccount.displayName}"`,
      formatDate(e.date),
      regHrs.toFixed(2),
      otHrs.toFixed(2),
      (e.rateCentsPerHour / 100).toFixed(2),
      regPay.toFixed(2),
      otPay.toFixed(2),
      (regPay + otPay).toFixed(2),
      formatTimeEntryStatus(e.status),
      e.payrollBatchRef ?? "",
    ].join(",");
  }).join("\n");

  return new NextResponse(header + rows, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="payroll-export-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
