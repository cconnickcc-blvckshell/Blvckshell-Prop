import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/guards/rbac";
import { prisma } from "@/lib/prisma";
import { formatInvoiceStatus, formatDate } from "@/lib/format";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "FOUNDER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const invoices = await prisma.invoice.findMany({
    select: {
      invoiceNumber: true, status: true, periodStart: true, periodEnd: true,
      subtotalCents: true, taxCents: true, totalCents: true,
      issuedAt: true, dueAt: true,
      client: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 5000,
  });

  const header = "Invoice #,Client,Period Start,Period End,Status,Subtotal,Tax,Total,Issued,Due\n";
  const rows = invoices.map((i) => [
    i.invoiceNumber,
    `"${i.client.name}"`,
    formatDate(i.periodStart),
    formatDate(i.periodEnd),
    formatInvoiceStatus(i.status),
    (i.subtotalCents / 100).toFixed(2),
    (i.taxCents / 100).toFixed(2),
    (i.totalCents / 100).toFixed(2),
    i.issuedAt ? formatDate(i.issuedAt) : "",
    i.dueAt ? formatDate(i.dueAt) : "",
  ].join(",")).join("\n");

  return new NextResponse(header + rows, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="invoices-export-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
