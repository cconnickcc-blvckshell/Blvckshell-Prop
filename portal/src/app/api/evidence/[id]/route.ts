import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/server/guards/rbac";
import { prisma } from "@/lib/prisma";
import { storage } from "@/lib/storage";
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

    // Get evidence record
    const evidence = await prisma.evidence.findUnique({
      where: { id: params.id },
      include: {
        jobCompletion: {
          include: {
            job: true,
          },
        },
      },
    });

    if (!evidence) {
      return NextResponse.json({ error: "Evidence not found" }, { status: 404 });
    }

    // Check access to job
    const hasAccess = await canAccessJob(user, evidence.jobCompletion.jobId);
    if (!hasAccess && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Download from Supabase Storage
    const { data, error } = await storage
      .from("evidence")
      .download(evidence.storagePath);

    if (error || !data) {
      console.error("Error downloading evidence:", error);
      return NextResponse.json(
        { error: "Failed to download evidence" },
        { status: 500 }
      );
    }

    // Convert blob to buffer
    const buffer = Buffer.from(await data.arrayBuffer());

    // Return image with proper content type
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": evidence.fileType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Error serving evidence:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const evidence = await prisma.evidence.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        jobCompletion: {
          select: {
            job: {
              select: { assignedWorkerId: true, status: true },
            },
          },
        },
      },
    });

    if (!evidence) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (
      evidence.jobCompletion.job.status !== "SCHEDULED" ||
      evidence.jobCompletion.job.assignedWorkerId !== user.workerId
    ) {
      return NextResponse.json(
        { error: "Cannot delete evidence for this job" },
        { status: 403 }
      );
    }

    await prisma.evidence.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting evidence:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
