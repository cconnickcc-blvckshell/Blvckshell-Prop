import { NextRequest, NextResponse } from "next/server";
import { uploadEvidence } from "@/server/actions/upload-actions";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const jobId = formData.get("jobId") as string;
    const completionId = formData.get("completionId") as string;
    const itemId = (formData.get("itemId") as string) || undefined;
    const checklistRunId = (formData.get("checklistRunId") as string) || undefined;
    const redactionApplied = formData.get("redactionApplied") === "true";
    const redactionType = (formData.get("redactionType") as string) || undefined;

    if (!file || !jobId || !completionId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    if (redactionApplied !== true) {
      return NextResponse.json(
        { error: "Evidence must be captured and redacted in-app. Use Take photo." },
        { status: 400 }
      );
    }

    const result = await uploadEvidence({
      jobId,
      completionId,
      file,
      itemId,
      checklistRunId,
      redactionApplied,
      redactionType,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error("Error in upload route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
