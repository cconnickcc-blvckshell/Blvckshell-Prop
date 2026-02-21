import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/server/guards/rbac";
import { transitionJob } from "@/lib/state-machine";
import { createMakeGoodJobIfNeeded } from "@/server/automation/createMakeGoodJobIfNeeded";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAdmin();
    const body = await request.json().catch(() => ({}));
    const isMissed = Boolean(body?.isMissed);
    const missedReason = typeof body?.missedReason === "string" ? body.missedReason : null;

    const result = await transitionJob(user, params.id, "CANCELLED", {
      cancelledBy: user.id,
      isMissed,
      missedReason,
    });
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    if (isMissed) {
      await prisma.job.update({
        where: { id: params.id },
        data: { isMissed: true, missedReason },
      });
      await createMakeGoodJobIfNeeded(user, params.id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error cancelling job:", error);
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }
}
