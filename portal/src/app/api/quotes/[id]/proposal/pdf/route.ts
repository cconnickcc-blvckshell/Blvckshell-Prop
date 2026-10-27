import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/server/guards/rbac";
import { logError } from "@/lib/logger";
import { renderProposalPdf } from "@/lib/pdf/documents/proposal";
import { pdfResponse } from "@/lib/pdf/response";
import { loadProposal } from "@/server/documents/proposal-pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "FOUNDER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await context.params;
    const loaded = await loadProposal(id);
    if (!loaded) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }
    if (!loaded.model) {
      return NextResponse.json({ error: "No snapshot yet" }, { status: 409 });
    }
    const buffer = await renderProposalPdf(loaded.model);
    const filename = `${loaded.model.reference || "proposal"}.pdf`;
    return pdfResponse(buffer, filename);
  } catch (error) {
    logError(error, { where: "api/quotes/proposal/pdf" });
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
