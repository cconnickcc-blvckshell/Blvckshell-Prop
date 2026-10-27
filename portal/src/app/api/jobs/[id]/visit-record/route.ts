import { NextRequest, NextResponse } from "next/server";
import { canAccessJob, getCurrentUser } from "@/server/guards/rbac";
import { logError } from "@/lib/logger";
import { renderVisitRecordPdf } from "@/lib/pdf/documents/visit-record";
import { pdfResponse } from "@/lib/pdf/response";
import { loadVisitRecord } from "@/server/documents/visit-record";

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
    const allowed =
      user.role === "ADMIN" || user.role === "FOUNDER" || (await canAccessJob(user, id));
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const loaded = await loadVisitRecord(id);
    if (!loaded) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }
    const buffer = await renderVisitRecordPdf(loaded.model, loaded.photos);
    const filename = `visit-record-${loaded.model.siteName}.pdf`;
    return pdfResponse(buffer, filename);
  } catch (error) {
    logError(error, { where: "api/jobs/visit-record" });
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
