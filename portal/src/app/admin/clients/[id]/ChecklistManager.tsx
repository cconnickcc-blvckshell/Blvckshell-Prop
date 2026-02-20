"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { assignChecklistTemplate, removeChecklistTemplate } from "./checklist-actions";
import { getAvailableChecklistTemplates } from "@/lib/checklist-parser";

interface ChecklistTemplate {
  id: string;
  checklistId?: string | null; // optional: not in current schema (one template per site)
  version: number;
  isActive: boolean;
  items: any; // Prisma JsonValue type
}

interface ChecklistManagerProps {
  siteId: string;
  siteName: string;
  currentTemplates: ChecklistTemplate[];
}

export default function ChecklistManager({
  siteId,
  siteName,
  currentTemplates,
}: ChecklistManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedChecklistId, setSelectedChecklistId] = useState<string>("");

  const availableTemplates = getAvailableChecklistTemplates();
  
  // Filter out already assigned templates
  const assignedIds = new Set(currentTemplates.map(t => t.checklistId).filter((id): id is string => id != null));
  // One template per site: if site has a template, show all as "assigned" for display purposes
  const availableToAssign = currentTemplates.length > 0 ? [] : availableTemplates;

  const handleAssign = async () => {
    if (!selectedChecklistId) {
      setError("Please select a checklist template");
      return;
    }

    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.append("siteId", siteId);
      formData.append("checklistId", selectedChecklistId);

      const result = await assignChecklistTemplate(formData);

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(`Checklist template assigned successfully`);
        setSelectedChecklistId("");
        router.refresh();
      }
    });
  };

  const handleRemove = async (templateId: string) => {
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.append("templateId", templateId);

      const result = await removeChecklistTemplate(formData);

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess("Checklist template removed");
        router.refresh();
      }
    });
  };

  return (
    <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-white">Checklist Templates</h4>
          {currentTemplates.length > 0 ? (
            <div className="mt-2 space-y-2">
              {currentTemplates.map((template) => {
                const templateName = template.checklistId ? (availableTemplates.find(t => t.id === template.checklistId)?.name || template.checklistId) : "Site checklist";
                return (
                  <div key={template.id} className="flex items-center justify-between rounded-md bg-zinc-800/50 px-3 py-2">
                    <div>
                      <p className="text-sm text-zinc-300">
                        {templateName} (v{template.version})
                      </p>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {Array.isArray(template.items) ? template.items.length : 0} items
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemove(template.id)}
                      disabled={isPending}
                      className="shrink-0 rounded-md border border-red-500/40 bg-red-500/10 px-2 py-1 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="mt-2 text-sm text-zinc-500">No checklist templates assigned</p>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-3 rounded-md border border-red-500/40 bg-red-500/10 p-2">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {success && (
        <div className="mt-3 rounded-md border border-emerald-500/40 bg-emerald-500/10 p-2">
          <p className="text-xs text-emerald-400">{success}</p>
        </div>
      )}

      {availableToAssign.length > 0 && (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <select
            value={selectedChecklistId}
            onChange={(e) => setSelectedChecklistId(e.target.value)}
            disabled={isPending}
            className="flex-1 rounded-md border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600 disabled:opacity-50"
          >
            <option value="">Select checklist template to add...</option>
            {availableToAssign.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleAssign}
            disabled={isPending || !selectedChecklistId}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? "Assigning..." : "Add Template"}
          </button>
        </div>
      )}
      {availableToAssign.length === 0 && currentTemplates.length > 0 && (
        <p className="mt-4 text-xs text-zinc-500">All available templates are already assigned to this site.</p>
      )}
    </div>
  );
}
