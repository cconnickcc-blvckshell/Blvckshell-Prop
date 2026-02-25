import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/guards/rbac";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "FOUNDER")) {
    return NextResponse.json({ count: 0 });
  }

  const [pendingApproval, overdueInvoices] = await Promise.all([
    prisma.job.count({ where: { status: "COMPLETED_PENDING_APPROVAL" } }),
    prisma.invoice.count({ where: { status: "Sent", dueAt: { lt: new Date() } } }),
  ]);

  return NextResponse.json({ count: pendingApproval + overdueInvoices });
}
