import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/server/guards/rbac";
import { logError } from "@/lib/logger";
import { renderMonthlyReportPdf } from "@/lib/pdf/documents/monthly-report";
import { pdfResponse } from "@/lib/pdf/response";
import { loadMonthlyReport } from "@/server/documents/monthly-report";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ clientId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "FOUNDER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { clientId } = await context.params;
    const month = new URL(request.url).searchParams.get("month");
    const model = await loadMonthlyReport(clientId, month);
    if (!model) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }
    const buffer = await renderMonthlyReportPdf(model);
    const filename = `service-report-${model.clientName}-${model.periodLabel}.pdf`;
    return pdfResponse(buffer, filename, true);
  } catch (error) {
    logError(error, { where: "api/reports/client" });
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
