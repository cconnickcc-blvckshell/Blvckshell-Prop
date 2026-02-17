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
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{job.site.name}</h1>
          <p className="text-gray-600">{job.site.address}</p>
          <p className="mt-2 text-sm text-gray-500">
            Scheduled: {new Date(job.scheduledStart).toLocaleString()}
          </p>
        </div>

        {/* Access Instructions */}
        {job.site.accessInstructions && (
          <div className="mb-6 rounded-lg bg-blue-50 p-4">
            <h2 className="font-semibold text-blue-900">Access Instructions</h2>
            <p className="mt-1 text-sm text-blue-800">{job.site.accessInstructions}</p>
            {job.site.accessCredentials.length > 0 && (
              <div className="mt-2">
                <p className="text-sm font-medium text-blue-900">Credentials:</p>
                <ul className="mt-1 list-disc pl-5 text-sm text-blue-800">
                  {job.site.accessCredentials.map((cred) => (
                    <li key={cred.id}>
                      {cred.type}: {cred.type === "CODE" ? (cred.identifierHint ?? "****") : (cred.identifier ?? "—")}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-md bg-green-50 p-4">
            <p className="text-sm text-green-800">{success}</p>
          </div>
        )}

        {/* Checklist */}
        <div className="mb-6 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Checklist</h2>
          <div className="space-y-4">
            {checklistItems.map((item: any) => (
              <div key={item.itemId} className="border-b pb-4 last:border-b-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <label className="text-sm font-medium text-gray-700">
                      {item.label}
                      {item.required && <span className="text-red-500">*</span>}
                    </label>
                  </div>
                  <div className="ml-4 flex gap-2">
                    {(["PASS", "FAIL", "NA"] as const).map((result) => (
                      <button
                        key={result}
                        type="button"
                        onClick={() => handleChecklistChange(item.itemId, result)}
                        className={`rounded px-3 py-1 text-xs font-medium ${
                          checklistResults[item.itemId]?.result === result
                            ? result === "PASS"
                              ? "bg-green-100 text-green-800"
                              : result === "FAIL"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                            : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {result}
                      </button>
                    ))}
                  </div>
                </div>
                {checklistResults[item.itemId]?.result === "FAIL" && (
                  <div className="mt-2">
                    <textarea
                      placeholder="Reason for failure..."
                      value={checklistResults[item.itemId]?.note || ""}
                      onChange={(e) =>
                        handleChecklistChange(
                          item.itemId,
                          "FAIL",
                          e.target.value
                        )
                      }
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                      rows={2}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Photo Upload */}
        <div className="mb-6 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Photo Evidence
          </h2>
          <p className="mb-4 text-sm text-gray-600">
            Required: {requiredPhotoCount} photos | Maximum: 20 photos | Current:{" "}
            {totalPhotoCount}
          </p>

          {/* Uploaded Photos */}
          {uploadedPhotos.length > 0 && (
            <div className="mb-4 grid grid-cols-4 gap-4">
              {uploadedPhotos.map((evidence) => (
                <div key={evidence.id} className="relative">
                  <img
                    src={`/api/evidence/${evidence.id}`}
                    alt="Evidence"
                    className="h-24 w-full rounded object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/placeholder-image.png";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveUploadedPhoto(evidence.id)}
                    className="absolute right-1 top-1 rounded bg-red-500 px-2 py-1 text-xs text-white hover:bg-red-600"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* New Photos */}
          {photos.length > 0 && (
            <div className="mb-4 grid grid-cols-4 gap-4">
              {photos.map((photo, index) => (
                <div key={index} className="relative">
                  <img
                    src={URL.createObjectURL(photo)}
                    alt={`Photo ${index + 1}`}
                    className="h-24 w-full rounded object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(index)}
                    className="absolute right-1 top-1 rounded bg-red-500 px-2 py-1 text-xs text-white hover:bg-red-600"
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
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                multiple
                onChange={handlePhotoSelect}
                disabled={uploading || isPending}
                className="block w-full text-sm text-gray-500 file:mr-4 file:rounded file:border-0 file:bg-gray-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-gray-700 hover:file:bg-gray-100"
              />
            </label>
          )}
          {!canAddMorePhotos && (
            <p className="text-sm text-red-600">
              Maximum 20 photos reached. Remove photos to add more.
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isPending || uploading}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {isPending ? "Saving..." : "Save Draft"}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending || uploading || !hasMinimumPhotos}
            className="flex-1 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
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
