"use client";

import { useState, useTransition, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { saveDraft, submitCompletion } from "@/server/actions/job-actions";
import { saveChecklistRunItem, submitChecklistRun } from "@/server/actions/checklist-run-actions";
import EvidenceCameraCapture from "@/components/EvidenceCameraCapture";
import type { RedactionType } from "@/components/EvidenceCameraCapture";

interface Evidence {
  id: string;
  storagePath: string;
  fileType: string;
  uploadedAt: Date;
  itemId?: string | null;
  checklistRunId?: string | null;
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
    photoRequired?: boolean;
    photoPointLabel?: string;
  }> | unknown;
}

interface JobDetailClientProps {
  job: Job;
  checklistTemplate: ChecklistTemplate;
  checklistRunId?: string;
  initialRunItems?: Record<string, { result: "PASS" | "FAIL" | "NA"; failReason?: string; note?: string }>;
  currentWorkerId: string;
  requiredPhotoCount: number;
}

export default function JobDetailClient({
  job,
  checklistTemplate,
  checklistRunId,
  initialRunItems,
  currentWorkerId,
  requiredPhotoCount,
}: JobDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [lastFailedAction, setLastFailedAction] = useState<"submit" | "upload" | null>(null);
  const autosaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Parse checklist items
  const checklistItems = Array.isArray(checklistTemplate.items)
    ? checklistTemplate.items
    : [];

  // Get existing completion data (evidence) and merge run items with legacy completion for initial state
  const existingCompletion = job.completion;
  const existingEvidence = existingCompletion?.evidence || [];
  const legacyResults = existingCompletion?.checklistResults
    ? (existingCompletion.checklistResults as Record<string, { result: string; note?: string }>)
    : {};
  const runItemsMerged = initialRunItems
    ? { ...legacyResults, ...Object.fromEntries(Object.entries(initialRunItems).map(([k, v]) => [k, { result: v.result, note: v.note }])) }
    : legacyResults;

  // State for checklist answers; prefer run-backed initial state when available
  const [checklistResults, setChecklistResults] = useState<
    Record<string, { result: "PASS" | "FAIL" | "NA"; note?: string }>
  >(runItemsMerged as Record<string, { result: "PASS" | "FAIL" | "NA"; note?: string }>);

  // State for photos (Phase 3: evidence only via in-app camera + redaction; no file picker)
  const [uploadedPhotos, setUploadedPhotos] = useState<Evidence[]>(existingEvidence);
  const [uploading, setUploading] = useState(false);
  const [cameraOpen, setCameraOpen] = useState<null | "run" | { itemId: string }>(null);

  const totalPhotoCount = uploadedPhotos.length;
  const canAddMorePhotos = totalPhotoCount < 20; // MAX_PHOTOS_PER_JOB
  const hasMinimumPhotos = totalPhotoCount >= requiredPhotoCount;

  // Photo-required items: need at least one evidence with that itemId
  const photoRequiredItems = checklistItems.filter((item: any) => item.photoRequired);
  const evidenceByItemId = new Map<string, Evidence[]>();
  for (const e of uploadedPhotos) {
    if (e.itemId) {
      if (!evidenceByItemId.has(e.itemId)) evidenceByItemId.set(e.itemId, []);
      evidenceByItemId.get(e.itemId)!.push(e);
    }
  }
  const photoRequiredSatisfied = photoRequiredItems.every(
    (item: any) => (evidenceByItemId.get(item.itemId)?.length ?? 0) >= 1
  );

  // Blocking reasons for submit
  const requiredItems = checklistItems.filter((item: any) => item.required);
  const missingRequired = requiredItems.filter((item: any) => !checklistResults[item.itemId]);
  const missingPhotoForItems = photoRequiredItems.filter(
    (item: any) => (evidenceByItemId.get(item.itemId)?.length ?? 0) < 1
  );
  const blockingReasons: string[] = [];
  if (missingRequired.length) blockingReasons.push(`${missingRequired.length} required item(s) not completed`);
  if (!hasMinimumPhotos) blockingReasons.push(`Minimum ${requiredPhotoCount} photos (you have ${totalPhotoCount})`);
  if (missingPhotoForItems.length) blockingReasons.push(`${missingPhotoForItems.length} item(s) need a photo`);
  const canSubmit = blockingReasons.length === 0;

  // Calculate checklist progress
  const completedItems = Object.keys(checklistResults).length;
  const completedRequired = requiredItems.filter(
    (item: any) => checklistResults[item.itemId]
  ).length;
  const checklistProgress = requiredItems.length > 0
    ? Math.round((completedRequired / requiredItems.length) * 100)
    : completedItems > 0
    ? Math.round((completedItems / checklistItems.length) * 100)
    : 0;

  const handleChecklistChange = useCallback(
    (itemId: string, result: "PASS" | "FAIL" | "NA", note?: string) => {
      setChecklistResults((prev) => ({
        ...prev,
        [itemId]: { result, note },
      }));

      // Autosave to ChecklistRun (DB-backed) when we have a run
      if (checklistRunId) {
        if (autosaveTimeoutRef.current) clearTimeout(autosaveTimeoutRef.current);
        autosaveTimeoutRef.current = setTimeout(() => {
          saveChecklistRunItem(checklistRunId, itemId, result, { note }).then((r) => {
            if (!r.success) setError(r.error ?? "Failed to save");
          });
          autosaveTimeoutRef.current = null;
        }, 400);
      }
    },
    [checklistRunId]
  );

  const uploadRedactedBlob = useCallback(
    async (blob: Blob, redactionType: RedactionType, itemId?: string) => {
      if (!existingCompletion?.id) {
        setError("Completion not ready. Save draft first.");
        return;
      }
      if (totalPhotoCount >= 20) {
        setError("Maximum 20 photos per job.");
        return;
      }
      setUploading(true);
      setError(null);
      const formData = new FormData();
      formData.append("file", blob, "evidence.jpg");
      formData.append("jobId", job.id);
      formData.append("completionId", existingCompletion.id);
      formData.append("redactionApplied", "true");
      formData.append("redactionType", redactionType);
      if (itemId) {
        formData.append("itemId", itemId);
        if (checklistRunId) formData.append("checklistRunId", checklistRunId);
      }
      try {
        const res = await fetch("/api/evidence/upload", { method: "POST", body: formData });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error || "Upload failed");
          setLastFailedAction("upload");
        } else {
          setLastFailedAction(null);
          setCameraOpen(null);
          router.refresh();
        }
      } catch {
        setError("Upload failed. Check your connection and take the photo again.");
        setLastFailedAction("upload");
      }
      setUploading(false);
    },
    [checklistRunId, existingCompletion?.id, job.id, totalPhotoCount, router]
  );

  const handleCameraDone = useCallback(
    (blob: Blob, redactionType: RedactionType) => {
      if (cameraOpen === "run") {
        uploadRedactedBlob(blob, redactionType);
      } else if (cameraOpen && typeof cameraOpen === "object" && "itemId" in cameraOpen) {
        uploadRedactedBlob(blob, redactionType, cameraOpen.itemId);
      }
    },
    [cameraOpen, uploadRedactedBlob]
  );

  const handleRemoveUploadedPhoto = async (evidenceId: string) => {
    // TODO: Implement delete evidence action
    setUploadedPhotos((prev) => prev.filter((e) => e.id !== evidenceId));
  };

  const handleSaveDraft = async () => {
    setError(null);
    setSuccess(null);
    setLastFailedAction(null);

    if (checklistRunId) {
      // Flush all current item state to the run (autosave each)
      startTransition(async () => {
        let ok = true;
        for (const [itemId, data] of Object.entries(checklistResults)) {
          const r = await saveChecklistRunItem(checklistRunId, itemId, data.result, { note: data.note });
          if (!r.success) {
            setError(r.error ?? "Failed to save");
            ok = false;
            break;
          }
        }
        if (ok) {
          setSuccess("Progress saved");
          router.refresh();
        }
      });
    } else {
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
    }
  };

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);
    setLastFailedAction(null);

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

    // Submit: use checklist run when available, else legacy submitCompletion
    startTransition(async () => {
      if (checklistRunId) {
        const result = await submitChecklistRun(checklistRunId);
        if (result.success) {
          setLastFailedAction(null);
          setSuccess("Completion submitted successfully");
          router.push("/jobs");
          router.refresh();
        } else {
          setError(result.error || "Failed to submit completion");
          setLastFailedAction("submit");
        }
      } else {
        const result = await submitCompletion({
          jobId: job.id,
          checklistResults,
          notes: "",
        });
        if (result.success) {
          setLastFailedAction(null);
          setSuccess("Completion submitted successfully");
          router.push("/jobs");
          router.refresh();
        } else {
          setError(result.error || "Failed to submit completion");
          setLastFailedAction("submit");
        }
      }
    });
  };

  return (
    <div className="min-h-screen bg-zinc-950 p-4 text-zinc-100 sm:p-6">
      {cameraOpen && (
        <EvidenceCameraCapture
          onDone={handleCameraDone}
          onCancel={() => setCameraOpen(null)}
        />
      )}
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
            {lastFailedAction === "submit" && (
              <p className="mt-2 text-xs text-red-200/80">
                Connection issue? Your progress is saved. Try again when you have a stable connection.
              </p>
            )}
            {lastFailedAction === "submit" && (
              <button
                type="button"
                onClick={() => { setError(null); setLastFailedAction(null); handleSubmit(); }}
                disabled={isPending || !canSubmit}
                className="mt-3 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50"
              >
                Retry submit
              </button>
            )}
            {lastFailedAction === "upload" && (
              <p className="mt-2 text-xs text-red-200/80">
                Take the photo again when you have a stable connection.
              </p>
            )}
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4">
            <p className="text-sm font-medium text-emerald-300">{success}</p>
          </div>
        )}

        {/* Checklist Section — mobile: progress prominent, one-handed tap targets */}
        <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 shadow-xl sm:p-6">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xl font-bold text-white">
                {checklistProgress}%
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white sm:text-xl">Checklist</h2>
                <p className="mt-0.5 text-sm text-zinc-400">
                  {completedRequired} of {requiredItems.length} required done
                </p>
              </div>
            </div>
            <div className="w-full sm:w-48">
              <div className="h-3 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${checklistProgress}%` }}
                />
              </div>
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

                  {/* Large tap targets (min 48px) for one-handed use */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
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
                          className={`min-h-[56px] rounded-xl border px-3 py-3 text-sm font-semibold transition-all duration-200 active:scale-[0.97] sm:min-h-[56px] sm:px-4 sm:py-3.5 ${colors}`}
                        >
                          {result}
                        </button>
                      );
                    })}
                  </div>

                  {/* Failure note */}
                  {currentResult === "FAIL" && (
                    <div className="mt-4">
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

                  {/* Photo required: add photo for this item */}
                  {item.photoRequired && (
                    <div className="mt-4">
                      <p className="text-xs font-medium text-zinc-400 mb-2">
                        Photo required {item.photoPointLabel ? `(${item.photoPointLabel})` : ""}
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        {(evidenceByItemId.get(item.itemId) || []).map((ev) => (
                          <img
                            key={ev.id}
                            src={`/api/evidence/${ev.id}`}
                            alt=""
                            className="h-14 w-14 rounded object-cover border border-zinc-700"
                          />
                        ))}
                        {canAddMorePhotos && (
                          <button
                            type="button"
                            onClick={() => setCameraOpen({ itemId: item.itemId })}
                            disabled={uploading || !existingCompletion?.id}
                            className="flex min-h-[52px] min-w-[120px] items-center justify-center rounded-xl border-2 border-dashed border-zinc-600 bg-zinc-800/50 px-4 py-3 text-sm font-medium text-zinc-400 hover:border-zinc-500 hover:text-zinc-300 disabled:opacity-50"
                          >
                            Take photo
                          </button>
                        )}
                      </div>
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
          {uploadedPhotos.length > 0 && (
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
            </div>
          )}

          {/* Take photo (in-app camera + redaction only; no file picker) */}
          {canAddMorePhotos && (
            <button
              type="button"
              onClick={() => setCameraOpen("run")}
              disabled={uploading || isPending || !existingCompletion?.id}
              className="flex min-h-[56px] w-full items-center justify-center rounded-xl border-2 border-dashed border-zinc-700 bg-zinc-800/30 px-4 py-4 text-base font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:bg-zinc-800/50 disabled:opacity-50 active:scale-[0.99]"
            >
              <span className="mr-2" aria-hidden>📷</span>
              Take photo
            </button>
          )}
          {!canAddMorePhotos && (
            <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm font-medium text-amber-300">
              Maximum 20 photos reached. Remove photos to add more.
            </p>
          )}
        </div>

        {/* Blocking submit — clear summary for one-handed flow */}
        {blockingReasons.length > 0 && (
          <div className="mb-6 rounded-xl border-2 border-amber-500/50 bg-amber-500/15 p-4" role="alert">
            <p className="flex items-center gap-2 text-sm font-bold text-amber-200">
              <span aria-hidden>⚠️</span> Can&apos;t submit yet
            </p>
            <p className="mt-1 text-xs text-amber-200/80">Fix these to enable Submit:</p>
            <ul className="mt-2 space-y-1.5 text-sm text-amber-100">
              {blockingReasons.map((r, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Buttons — large tap targets, safe-area padding for mobile */}
        <div className="sticky bottom-0 flex gap-3 bg-zinc-950 pb-8 pt-4 sm:pt-6">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isPending || uploading}
            className="min-h-[56px] flex-1 rounded-xl border-2 border-zinc-700 bg-zinc-800/80 px-4 py-3.5 text-base font-semibold text-zinc-300 transition-all hover:border-zinc-600 hover:bg-zinc-800 hover:text-white disabled:opacity-50 active:scale-[0.98]"
          >
            {isPending ? "Saving..." : "Save Draft"}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending || uploading || !canSubmit}
            className="min-h-[56px] flex-[2] rounded-xl bg-emerald-600 px-4 py-3.5 text-base font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-500 disabled:opacity-50 disabled:shadow-none active:scale-[0.98]"
            title={!canSubmit && blockingReasons.length > 0 ? blockingReasons[0] : undefined}
          >
            {uploading
              ? "Uploading..."
              : isPending
              ? "Submitting..."
              : !canSubmit && blockingReasons.length > 0
              ? `${blockingReasons.length} to fix`
              : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}
