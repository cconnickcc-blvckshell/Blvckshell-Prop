import { NextRequest, NextResponse } from "next/server";
import { canAccessJob, getCurrentUser } from "@/server/guards/rbac";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: jobId } = await context.params;
  const hasAccess = await canAccessJob(user, jobId);
  if (!hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const completion = await prisma.jobCompletion.findUnique({
    where: { jobId },
    select: {
      evidence: {
        orderBy: { uploadedAt: "asc" },
        select: {
          id: true,
          storagePath: true,
          fileType: true,
          uploadedAt: true,
          itemId: true,
          checklistRunId: true,
          redactionApplied: true,
          redactionType: true,
        },
      },
    },
  });

  return NextResponse.json({ evidence: completion?.evidence ?? [] });
}
