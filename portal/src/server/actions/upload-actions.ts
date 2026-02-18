"use server";

import { requireWorker } from "@/server/guards/rbac";
import { prisma } from "@/lib/prisma";
import {
  storage,
  generateEvidencePath,
  isValidFileType,
  isValidFileSize,
  MAX_PHOTOS_PER_JOB,
} from "@/lib/storage";
import { canAccessJob } from "@/server/guards/rbac";

/**
 * Upload evidence photo. Optional itemId/checklistRunId link photo to a checklist item.
 * Phase 3: Only redacted images accepted. Capture must be in-app (camera + redaction).
 */
export async function uploadEvidence(input: {
  jobId: string;
  completionId: string;
  file: File;
  itemId?: string;
  checklistRunId?: string;
  redactionApplied?: boolean;
  redactionType?: string;
}) {
  const user = await requireWorker();

  // Phase 3 acceptance: server rejects uploads without redaction
  if (input.redactionApplied !== true) {
    return {
      success: false,
      error: "Evidence must be captured and redacted in-app. Use Take photo.",
    };
  }

  try {
    // Check job access
    const hasAccess = await canAccessJob(user, input.jobId);
    if (!hasAccess) {
      return { success: false, error: "Unauthorized" };
    }

    // Validate file type
    if (!isValidFileType(input.file.type)) {
      return {
        success: false,
        error: "Invalid file type. Only jpg, jpeg, png, webp allowed.",
      };
    }

    // Validate file size
    if (!isValidFileSize(input.file.size)) {
      return {
        success: false,
        error: "File too large. Maximum 10MB allowed.",
      };
    }

    // Check current photo count
    const currentCount = await prisma.evidence.count({
      where: {
        jobCompletion: {
          jobId: input.jobId,
        },
      },
    });

    if (currentCount >= MAX_PHOTOS_PER_JOB) {
      return {
        success: false,
        error: `Maximum ${MAX_PHOTOS_PER_JOB} photos per job reached.`,
      };
    }

    // Generate storage path
    const storagePath = generateEvidencePath(
      input.jobId,
      input.completionId,
      input.file.name
    );

    // Convert File to ArrayBuffer for Supabase
    const arrayBuffer = await input.file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { error: uploadError } = await storage
      .from("evidence")
      .upload(storagePath, buffer, {
        contentType: input.file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      return { success: false, error: "Failed to upload file" };
    }

    // Get or create completion (for draft)
    let completion = await prisma.jobCompletion.findUnique({
      where: { jobId: input.jobId },
    });

    if (!completion) {
      // Create draft completion if it doesn't exist
      completion = await prisma.jobCompletion.create({
        data: {
          jobId: input.jobId,
          completedByWorkerId: user.workerId!,
          checklistResults: {},
          isDraft: true,
        },
      });
    }

    // Create Evidence record (optional item/run link + redaction metadata)
    const evidence = await prisma.evidence.create({
      data: {
        jobCompletionId: completion.id,
        storagePath,
        fileType: input.file.type,
        checklistRunId: input.checklistRunId ?? null,
        itemId: input.itemId ?? null,
        redactionApplied: input.redactionApplied ?? false,
        redactionType: input.redactionType ?? null,
        capturedByUserId: user.id,
      },
    });

    return { success: true, data: { evidenceId: evidence.id } };
  } catch (error) {
    console.error("Error uploading evidence:", error);
    return { success: false, error: "Failed to upload evidence" };
  }
}
