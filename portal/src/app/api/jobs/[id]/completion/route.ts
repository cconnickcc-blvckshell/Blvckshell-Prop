import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/server/guards/rbac";
import { prisma } from "@/lib/prisma";
import { canAccessJob } from "@/server/guards/rbac";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const hasAccess = await canAccessJob(user, params.id);
    if (!hasAccess && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const completion = await prisma.jobCompletion.findUnique({
      where: { jobId: params.id },
      select: { id: true },
    });

    return NextResponse.json({
      completionId: completion?.id || null,
    });
  } catch (error) {
    console.error("Error fetching completion:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
