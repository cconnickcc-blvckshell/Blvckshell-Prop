import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, canAccessInvoice } from "@/server/guards/rbac";
import { renderInvoicePdf } from "@/lib/pdf/documents/invoice";
import { pdfResponse } from "@/lib/pdf/response";
import { logError } from "@/lib/logger";
import { loadInvoicePdfModel } from "@/server/documents/invoice-pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await context.params;
    const allowed = await canAccessInvoice(user, id);
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const model = await loadInvoicePdfModel(id);
    if (!model) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const buffer = await renderInvoicePdf(model);
    return pdfResponse(buffer, `invoice-${model.invoiceNumber}.pdf`);
  } catch (error) {
    logError(error, { where: "api/invoices/pdf" });
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
