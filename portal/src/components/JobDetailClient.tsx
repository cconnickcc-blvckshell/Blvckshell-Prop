"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveDraft, submitCompletion } from "@/server/actions/job-actions";

interface Evidence {
  id: string;
  storagePath: string;
  fileType: string;
  uploadedAt: Date;
}

interface JobCompletion {
  id: string;
  checklistResults: Record<string, { result: string; note?: string }> | unknown;
  evidence: Evidence[];
  isDraft: boolean;
}

interface AccessCredential {
  id: string;
  type: string;
  identifier: string | null;
  identifierHint: string | null;
}

interface Site {
  name: string;
  address: string;
  accessInstructions: string | null;
  accessCredentials: AccessCredential[];
}

interface Job {
  id: string;
  status: string;
  scheduledStart: Date;
  site: Site;
  completion: JobCompletion | null;
}

interface ChecklistTemplate {
  id: string;
  items: Array<{
    itemId: string;
    label: string;
    required?: boolean;
  }> | unknown;
}

interface JobDetailClientProps {
  job: Job;
  checklistTemplate: ChecklistTemplate;
  currentWorkerId: string;
  requiredPhotoCount: number;
}

export default function JobDetailClient({
  job,
  checklistTemplate,
  currentWorkerId,
  requiredPhotoCount,
}: JobDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Parse checklist items
  const checklistItems = Array.isArray(checklistTemplate.items)
    ? checklistTemplate.items
    : [];

  // Get existing completion data
  const existingCompletion = job.completion;
  const existingEvidence = existingCompletion?.evidence || [];
  const existingResults = existingCompletion?.checklistResults
    ? (existingCompletion.checklistResults as Record<string, { result: string; note?: string }>)
    : {};

  // State for checklist answers (cast stored values to PASS|FAIL|NA)
  const [checklistResults, setChecklistResults] = useState<
    Record<string, { result: "PASS" | "FAIL" | "NA"; note?: string }>
  >(existingResults as Record<string, { result: "PASS" | "FAIL" | "NA"; note?: string }>);

  // State for photos
  const [photos, setPhotos] = useState<File[]>([]);
  const [uploadedPhotos, setUploadedPhotos] = useState<Evidence[]>(existingEvidence);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<number, boolean>>({});

  const totalPhotoCount = uploadedPhotos.length + photos.length;
  const canAddMorePhotos = totalPhotoCount < 20; // MAX_PHOTOS_PER_JOB
  const hasMinimumPhotos = totalPhotoCount >= requiredPhotoCount;

  // Calculate checklist progress
  const completedItems = Object.keys(checklistResults).length;
  const requiredItems = checklistItems.filter((item: any) => item.required);
  const completedRequired = requiredItems.filter(
    (item: any) => checklistResults[item.itemId]
  ).length;
  const checklistProgress = requiredItems.length > 0
    ? Math.round((completedRequired / requiredItems.length) * 100)
    : completedItems > 0
    ? Math.round((completedItems / checklistItems.length) * 100)
    : 0;

  const handleChecklistChange = (
    itemId: string,
    result: "PASS" | "FAIL" | "NA",
    note?: string
  ) => {
    setChecklistResults((prev) => ({
      ...prev,
      [itemId]: { result, note },
    }));
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + totalPhotoCount > 20) {
      setError(`Maximum 20 photos per job. You can add ${20 - totalPhotoCount} more.`);
      return;
    }
    setPhotos((prev) => [...prev, ...files]);
    setError(null);
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveUploadedPhoto = async (evidenceId: string) => {
    // TODO: Implement delete evidence action
    setUploadedPhotos((prev) => prev.filter((e) => e.id !== evidenceId));
  };

  const handleSaveDraft = async () => {
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const result = await saveDraft({
        jobId: job.id,
        checklistResults,
        notes: "",
      });

      if (result.success) {
        setSuccess("Draft saved successfully");
        router.refresh();
      } else {
        setError(result.error || "Failed to save draft");
      }
    });
  };

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);

    // Validate checklist
    const requiredItems = checklistItems.filter((item: any) => item.required);
    const missingItems = requiredItems.filter(
      (item: any) => !checklistResults[item.itemId]
    );

    if (missingItems.length > 0) {
      setError(`Please complete all required checklist items`);
      return;
    }

    // Validate photos
    if (!hasMinimumPhotos) {
      setError(
        `Minimum ${requiredPhotoCount} photos required. You have ${totalPhotoCount}.`
      );
      return;
    }

    if (totalPhotoCount > 20) {
      setError("Maximum 20 photos per job");
      return;
    }

    // Upload any new photos first
    if (photos.length > 0) {
      setUploading(true);
      try {
        // Get or create completion ID
        let completionId = existingCompletion?.id;
        if (!completionId) {
          // Create draft completion first
          const draftResult = await saveDraft({
            jobId: job.id,
            checklistResults,
            notes: "",
          });
          if (!draftResult.success) {
            setError("Failed to create draft");
            setUploading(false);
            return;
          }
          // Fetch the completion ID
          const response = await fetch(`/api/jobs/${job.id}/completion`);
          const data = await response.json();
          completionId = data.completionId;
        }

        if (!completionId) {
          setError("Could not get completion for upload");
          setUploading(false);
          return;
        }

        // Upload photos
        for (let i = 0; i < photos.length; i++) {
          const photo = photos[i];
          setUploadProgress((prev) => ({ ...prev, [i]: true }));

          const formData = new FormData();
          formData.append("file", photo);
          formData.append("jobId", job.id);
          formData.append("completionId", completionId);

          const uploadResponse = await fetch("/api/evidence/upload", {
            method: "POST",
            body: formData,
          });

          if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json();
            setError(errorData.error || "Failed to upload photos");
            setUploading(false);
            return;
          }
        }

        setPhotos([]);
        setUploadProgress({});
        // Refresh to get updated evidence
        router.refresh();
      } catch (err) {
        setError("Failed to upload photos");
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    // Submit completion
    startTransition(async () => {
      const result = await submitCompletion({
        jobId: job.id,
        checklistResults,
        notes: "",
      });

      if (result.success) {
        setSuccess("Completion submitted successfully");
        router.push("/jobs");
        router.refresh();
      } else {
        setError(result.error || "Failed to submit completion");
      }
    });
  };

  return (
    <div className="min-h-screen bg-zinc-950 p-4 text-zinc-100 sm:p-6">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{job.site.name}</h1>
          <p className="mt-1 text-zinc-400">{job.site.address}</p>
          <p className="mt-2 text-sm text-zinc-500">
            Scheduled: {new Date(job.scheduledStart).toLocaleString()}
          </p>
        </div>

        {/* Access Instructions */}
        {job.site.accessInstructions && (
          <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 shadow-lg sm:p-6">
            <h2 className="text-base font-semibold text-white sm:text-lg">Access Instructions</h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-300 sm:text-base">{job.site.accessInstructions}</p>
            {job.site.accessCredentials.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium text-zinc-300">Credentials:</p>
                <ul className="space-y-1.5">
                  {job.site.accessCredentials.map((cred) => (
                    <li key={cred.id} className="rounded-md bg-zinc-800/50 px-3 py-2 text-sm text-zinc-300">
                      <span className="font-medium">{cred.type}:</span>{" "}
                      {cred.type === "CODE" ? (cred.identifierHint ?? "****") : (cred.identifier ?? "—")}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Error / Success Messages */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-500/40 bg-red-500/10 p-4">
            <p className="text-sm font-medium text-red-300">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4">
            <p className="text-sm font-medium text-emerald-300">{success}</p>
          </div>
        )}

        {/* Checklist Section */}
        <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 shadow-xl sm:p-6">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white sm:text-xl">Checklist</h2>
              <p className="mt-1 text-sm text-zinc-400">
                {completedRequired} of {requiredItems.length} required items completed
              </p>
            </div>
            {/* Progress bar */}
            <div className="w-full sm:w-48">
              <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${checklistProgress}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-zinc-500">{checklistProgress}% complete</p>
            </div>
          </div>

          <div className="space-y-4">
            {checklistItems.map((item: any, index: number) => {
              const currentResult = checklistResults[item.itemId]?.result;
              return (
                <div
                  key={item.itemId}
                  className="rounded-lg border border-zinc-800 bg-zinc-800/30 p-4 transition-colors hover:border-zinc-700 hover:bg-zinc-800/50"
                >
                  <div className="mb-3 flex items-start gap-2">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-xs font-semibold text-zinc-300">
                      {index + 1}
                    </span>
                    <label className="flex-1 text-sm font-medium leading-relaxed text-white sm:text-base">
                      {item.label}
                      {item.required && <span className="ml-1 text-red-400">*</span>}
                    </label>
                  </div>

                  {/* Mobile-first: Stack buttons vertically on small screens, horizontal on larger */}
                  <div className="ml-8 grid grid-cols-3 gap-2 sm:ml-0 sm:flex sm:gap-3">
                    {(["PASS", "FAIL", "NA"] as const).map((result) => {
                      const isSelected = currentResult === result;
                      const colors =
                        result === "PASS"
                          ? isSelected
                            ? "bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-500/20"
                            : "bg-zinc-800/50 text-zinc-300 border-zinc-700 hover:bg-zinc-700"
                          : result === "FAIL"
                          ? isSelected
                            ? "bg-red-600 text-white border-red-500 shadow-lg shadow-red-500/20"
                            : "bg-zinc-800/50 text-zinc-300 border-zinc-700 hover:bg-zinc-700"
                          : isSelected
                          ? "bg-zinc-600 text-white border-zinc-500"
                          : "bg-zinc-800/50 text-zinc-300 border-zinc-700 hover:bg-zinc-700";

                      return (
                        <button
                          key={result}
                          type="button"
                          onClick={() => handleChecklistChange(item.itemId, result)}
                          className={`min-h-[48px] rounded-lg border px-4 py-3 text-sm font-semibold transition-all duration-200 active:scale-[0.97] sm:min-h-[52px] sm:px-5 sm:py-3 ${colors}`}
                        >
                          {result}
                        </button>
                      );
                    })}
                  </div>

                  {/* Failure note */}
                  {currentResult === "FAIL" && (
                    <div className="mt-4 ml-8 sm:ml-0">
                      <textarea
                        placeholder="Reason for failure (required)..."
                        value={checklistResults[item.itemId]?.note || ""}
                        onChange={(e) =>
                          handleChecklistChange(item.itemId, "FAIL", e.target.value)
                        }
                        className="w-full rounded-lg border border-zinc-700 bg-zinc-900/50 px-4 py-3 text-sm text-white placeholder-zinc-500 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
                        rows={3}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Photo Evidence Section */}
        <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 shadow-xl sm:p-6">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white sm:text-xl">Photo Evidence</h2>
              <p className="mt-1 text-sm text-zinc-400">
                Required: <span className="font-medium text-white">{requiredPhotoCount}</span> • Maximum: 20 • Current:{" "}
                <span className={`font-medium ${hasMinimumPhotos ? "text-emerald-400" : "text-red-400"}`}>
                  {totalPhotoCount}
                </span>
              </p>
            </div>
            {!hasMinimumPhotos && (
              <span className="text-xs font-medium text-red-400">
                Need {requiredPhotoCount - totalPhotoCount} more
              </span>
            )}
          </div>

          {/* Photo Grid */}
          {(uploadedPhotos.length > 0 || photos.length > 0) && (
            <div className="mb-4 grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4">
              {uploadedPhotos.map((evidence) => (
                <div key={evidence.id} className="group relative aspect-square overflow-hidden rounded-lg border border-zinc-800">
                  <img
                    src={`/api/evidence/${evidence.id}`}
                    alt="Evidence"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/placeholder-image.png";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveUploadedPhoto(evidence.id)}
                    className="absolute right-2 top-2 rounded-md bg-red-600 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity hover:bg-red-500 group-hover:opacity-100"
                  >
                    Remove
                  </button>
                </div>
              ))}
              {photos.map((photo, index) => (
                <div key={index} className="group relative aspect-square overflow-hidden rounded-lg border border-zinc-800">
                  <img
                    src={URL.createObjectURL(photo)}
                    alt={`Photo ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                  {uploadProgress[index] && (
                    <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/80">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-600 border-t-white" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(index)}
                    disabled={uploadProgress[index]}
                    className="absolute right-2 top-2 rounded-md bg-red-600 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity hover:bg-red-500 group-hover:opacity-100 disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload Button */}
          {canAddMorePhotos && (
            <label className="block">
              <div className="flex min-h-[52px] cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-zinc-700 bg-zinc-800/30 px-4 py-3 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:bg-zinc-800/50">
                <span className="mr-2">📷</span>
                Add {20 - totalPhotoCount} more photo{20 - totalPhotoCount !== 1 ? "s" : ""}
              </div>
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                multiple
                onChange={handlePhotoSelect}
                disabled={uploading || isPending}
                className="hidden"
              />
            </label>
          )}
          {!canAddMorePhotos && (
            <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm font-medium text-amber-300">
              Maximum 20 photos reached. Remove photos to add more.
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="sticky bottom-0 flex gap-3 bg-zinc-950 pb-4 pt-4 sm:pb-0 sm:pt-6">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isPending || uploading}
            className="min-h-[52px] flex-1 rounded-lg border border-zinc-700 bg-zinc-800/80 px-5 py-3 text-sm font-semibold text-zinc-300 transition-all hover:border-zinc-600 hover:bg-zinc-800 hover:text-white disabled:opacity-50 active:scale-[0.98]"
          >
            {isPending ? "Saving..." : "Save Draft"}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending || uploading || !hasMinimumPhotos}
            className="min-h-[52px] flex-[2] rounded-lg bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-500 hover:shadow-xl hover:shadow-emerald-500/30 disabled:opacity-50 disabled:shadow-none active:scale-[0.98]"
          >
            {uploading
              ? "Uploading..."
              : isPending
              ? "Submitting..."
              : "Submit Completion"}
          </button>
        </div>
      </div>
    </div>
  );
}
