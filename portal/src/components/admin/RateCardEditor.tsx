"use client";

import { useState, useMemo } from "react";
import {
  updateRateCardEntry,
  createRateCardEntry,
  deleteRateCardEntry,
} from "@/server/actions/rate-card-actions";

type Entry = {
  id: string;
  areaType: string;
  size: string;
  sizeLabel: string;
  finish: string;
  finishLabel: string;
  minutes: number;
  description: string | null;
  sortOrder: number;
};

type RateCardEditorProps = {
  rateCardId: string;
  version: string;
  entries: Entry[];
};

const AREA_TYPE_LABELS: Record<string, string> = {
  LOBBY: "Lobby",
  HALLWAYS: "Hallways",
  STAIRWELLS: "Stairwells",
  ELEVATORS: "Elevators",
  GARBAGE: "Garbage",
  WASHROOMS: "Washrooms",
  GLASS: "Glass",
  OTHER: "Other",
};

const AREA_TYPES = Object.keys(AREA_TYPE_LABELS);

export default function RateCardEditor({ rateCardId, version, entries: initialEntries }: RateCardEditorProps) {
  const [entries, setEntries] = useState(initialEntries);
  const [expandedType, setExpandedType] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({
    areaType: "LOBBY",
    size: "M",
    sizeLabel: "",
    finish: "",
    finishLabel: "",
    minutes: "10",
    description: "",
  });

  const groupedEntries = useMemo(() => {
    const groups: Record<string, Entry[]> = {};
    for (const type of AREA_TYPES) {
      groups[type] = entries.filter((e) => e.areaType === type);
    }
    return groups;
  }, [entries]);

  async function handleSaveMinutes(entryId: string) {
    const minutes = parseInt(editValue, 10);
    if (!Number.isFinite(minutes) || minutes < 0 || minutes > 999) {
      setError("Minutes must be 0-999");
      return;
    }
    setPending(true);
    setError(null);
    const result = await updateRateCardEntry(entryId, minutes);
    setPending(false);
    if (result.ok) {
      setEntries((prev) =>
        prev.map((e) => (e.id === entryId ? { ...e, minutes } : e))
      );
      setEditingId(null);
    } else {
      setError(result.error ?? "Failed");
    }
  }

  async function handleDelete(entryId: string) {
    if (!confirm("Delete this rate card entry?")) return;
    setPending(true);
    setError(null);
    const result = await deleteRateCardEntry(entryId);
    setPending(false);
    if (result.ok) {
      setEntries((prev) => prev.filter((e) => e.id !== entryId));
    } else {
      setError(result.error ?? "Failed");
    }
  }

  async function handleAddEntry(e: React.FormEvent) {
    e.preventDefault();
    const minutes = parseInt(addForm.minutes, 10);
    if (!addForm.finish.trim() || !addForm.finishLabel.trim()) {
      setError("Finish key and label are required");
      return;
    }
    if (!Number.isFinite(minutes) || minutes < 0 || minutes > 999) {
      setError("Minutes must be 0-999");
      return;
    }
    setPending(true);
    setError(null);
    const result = await createRateCardEntry({
      rateCardId,
      areaType: addForm.areaType,
      size: addForm.size,
      sizeLabel: addForm.sizeLabel.trim() || `${addForm.size} size`,
      finish: addForm.finish.trim().toLowerCase(),
      finishLabel: addForm.finishLabel.trim(),
      minutes,
      description: addForm.description.trim() || undefined,
    });
    setPending(false);
    if (result.ok) {
      setShowAddForm(false);
      setAddForm({ areaType: "LOBBY", size: "M", sizeLabel: "", finish: "", finishLabel: "", minutes: "10", description: "" });
      window.location.reload();
    } else {
      setError(result.error ?? "Failed");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Rate Card: {version}</h2>
          <p className="text-sm text-zinc-400">{entries.length} entries across {AREA_TYPES.length} area types</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="rounded bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500"
        >
          {showAddForm ? "Cancel" : "Add entry"}
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-2 text-sm text-red-400">
          {error}
        </div>
      )}

      {showAddForm && (
        <form onSubmit={handleAddEntry} className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <label className="block text-xs text-zinc-400">Area type</label>
              <select
                value={addForm.areaType}
                onChange={(e) => setAddForm((f) => ({ ...f, areaType: e.target.value }))}
                className="mt-0.5 w-full rounded border border-zinc-600 bg-zinc-800 px-2 py-1.5 text-sm text-white"
              >
                {AREA_TYPES.map((t) => (
                  <option key={t} value={t}>{AREA_TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-400">Size</label>
              <select
                value={addForm.size}
                onChange={(e) => setAddForm((f) => ({ ...f, size: e.target.value }))}
                className="mt-0.5 w-full rounded border border-zinc-600 bg-zinc-800 px-2 py-1.5 text-sm text-white"
              >
                <option value="S">S</option>
                <option value="M">M</option>
                <option value="L">L</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-400">Size label</label>
              <input
                type="text"
                value={addForm.sizeLabel}
                onChange={(e) => setAddForm((f) => ({ ...f, sizeLabel: e.target.value }))}
                placeholder="e.g. 2-3 cars"
                className="mt-0.5 w-full rounded border border-zinc-600 bg-zinc-800 px-2 py-1.5 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400">Minutes</label>
              <input
                type="number"
                min={0}
                max={999}
                value={addForm.minutes}
                onChange={(e) => setAddForm((f) => ({ ...f, minutes: e.target.value }))}
                className="mt-0.5 w-full rounded border border-zinc-600 bg-zinc-800 px-2 py-1.5 text-sm text-white"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-xs text-zinc-400">Finish key</label>
              <input
                type="text"
                value={addForm.finish}
                onChange={(e) => setAddForm((f) => ({ ...f, finish: e.target.value }))}
                placeholder="e.g. chrome"
                className="mt-0.5 w-full rounded border border-zinc-600 bg-zinc-800 px-2 py-1.5 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400">Finish label</label>
              <input
                type="text"
                value={addForm.finishLabel}
                onChange={(e) => setAddForm((f) => ({ ...f, finishLabel: e.target.value }))}
                placeholder="e.g. Chrome polishing"
                className="mt-0.5 w-full rounded border border-zinc-600 bg-zinc-800 px-2 py-1.5 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400">Description</label>
              <input
                type="text"
                value={addForm.description}
                onChange={(e) => setAddForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="e.g. Streak-free polish"
                className="mt-0.5 w-full rounded border border-zinc-600 bg-zinc-800 px-2 py-1.5 text-sm text-white"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={pending}
            className="rounded bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            Create entry
          </button>
        </form>
      )}

      {/* Accordion by area type */}
      <div className="space-y-2">
        {AREA_TYPES.map((type) => {
          const typeEntries = groupedEntries[type] || [];
          if (typeEntries.length === 0) return null;
          const isExpanded = expandedType === type;
          return (
            <div key={type} className="rounded-lg border border-zinc-800 bg-zinc-900/50">
              <button
                onClick={() => setExpandedType(isExpanded ? null : type)}
                className="flex w-full items-center justify-between px-4 py-3 text-left"
              >
                <span className="font-medium text-white">
                  {AREA_TYPE_LABELS[type] || type}
                  <span className="ml-2 text-xs text-zinc-500">{typeEntries.length} entries</span>
                </span>
                <span className="text-zinc-500">{isExpanded ? "▲" : "▼"}</span>
              </button>
              {isExpanded && (
                <div className="border-t border-zinc-800 px-4 pb-4">
                  <table className="mt-2 w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-zinc-500">
                        <th className="pb-1 pr-3">Size</th>
                        <th className="pb-1 pr-3">Size label</th>
                        <th className="pb-1 pr-3">Finish</th>
                        <th className="pb-1 pr-3">Label</th>
                        <th className="pb-1 pr-3">Min</th>
                        <th className="pb-1 pr-3">Description</th>
                        <th className="pb-1"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {typeEntries.map((entry) => (
                        <tr key={entry.id} className="border-t border-zinc-800/50">
                          <td className="py-1.5 pr-3 text-zinc-300">{entry.size}</td>
                          <td className="py-1.5 pr-3 text-zinc-400 text-xs">{entry.sizeLabel}</td>
                          <td className="py-1.5 pr-3 text-zinc-300">{entry.finish}</td>
                          <td className="py-1.5 pr-3 text-zinc-400">{entry.finishLabel}</td>
                          <td className="py-1.5 pr-3">
                            {editingId === entry.id ? (
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  min={0}
                                  max={999}
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") handleSaveMinutes(entry.id);
                                    if (e.key === "Escape") setEditingId(null);
                                  }}
                                  onBlur={() => handleSaveMinutes(entry.id)}
                                  autoFocus
                                  className="w-16 rounded border border-zinc-600 bg-zinc-800 px-1 py-0.5 text-sm text-white"
                                />
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setEditingId(entry.id);
                                  setEditValue(String(entry.minutes));
                                }}
                                className="cursor-pointer font-mono text-emerald-400 hover:text-emerald-300"
                                title="Click to edit"
                              >
                                {entry.minutes}
                              </button>
                            )}
                          </td>
                          <td className="py-1.5 pr-3 text-xs text-zinc-500">{entry.description || "—"}</td>
                          <td className="py-1.5">
                            <button
                              onClick={() => handleDelete(entry.id)}
                              disabled={pending}
                              className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
                            >
                              ×
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
