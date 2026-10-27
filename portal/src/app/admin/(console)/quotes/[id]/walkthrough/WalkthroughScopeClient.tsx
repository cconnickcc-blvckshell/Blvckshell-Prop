"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  createQuoteAreaLine,
  updateQuoteAreaLine,
  deleteQuoteAreaLine,
  createQuoteAddOnLine,
  updateQuoteAddOnLine,
  deleteQuoteAddOnLine,
  updateQuoteHeaderAndRisk,
  type CreateQuoteAreaLinePayload,
  type UpdateQuoteAreaLinePayload,
  type CreateQuoteAddOnLinePayload,
  type UpdateQuoteAddOnLinePayload,
  type UpdateQuoteHeaderAndRiskPayload,
} from "@/server/actions/quote-actions";
import type { QuoteAreaType, BuildingClass } from "@prisma/client";

const AREA_TYPES: { value: QuoteAreaType; label: string }[] = [
  { value: "LOBBY", label: "Lobby" },
  { value: "HALLWAYS", label: "Hallways" },
  { value: "STAIRWELLS", label: "Stairwells" },
  { value: "ELEVATORS", label: "Elevators" },
  { value: "GARBAGE", label: "Garbage" },
  { value: "WASHROOMS", label: "Washrooms" },
  { value: "GLASS", label: "Glass" },
  { value: "OTHER", label: "Other" },
];

const PRESETS = [
  { value: "S", label: "S" },
  { value: "M", label: "M" },
  { value: "L", label: "L" },
] as const;

type RateCardEntryData = {
  areaType: string;
  size: string;
  sizeLabel: string;
  finish: string;
  finishLabel: string;
  minutes: number;
  description: string | null;
};

type AreaLine = {
  id: string;
  type: QuoteAreaType;
  measurements: Record<string, unknown>;
  computedMinutes: number;
  overrideMinutes: number | null;
  overrideReason: string | null;
};

type AddOnLine = {
  id: string;
  name: string;
  estimatedLaborMinutes: number;
  priceCents: number;
  marginBps: number;
  includedInProposal: boolean;
};

const BUILDING_CLASSES: { value: BuildingClass | ""; label: string }[] = [
  { value: "", label: "—" },
  { value: "POOR", label: "Poor" },
  { value: "AVERAGE", label: "Average" },
  { value: "PREMIUM", label: "Premium" },
];

type WalkthroughScopeClientProps = {
  quoteId: string;
  areaLines: AreaLine[];
  addOnLines: AddOnLine[];
  travelMinutesPerVisit: number;
  winterMinutesPerVisitDelta: number;
  visitsPerWeek: number;
  monthlySupplyCostCents: number;
  expectedSubcontractorRateCentsPerHour: number | null;
  riskFactors: string[] | null;
  buildingClass: BuildingClass | null;
  riskRulesKeys: string[];
  billingRateCentsPerHour: number;
  rateCardEntries: RateCardEntryData[];
};

function baseMinutesFromLines(lines: AreaLine[]): number {
  return lines.reduce(
    (sum, l) => sum + (l.overrideMinutes ?? l.computedMinutes),
    0
  );
}

function formatFinishes(measurements: Record<string, unknown>): string {
  const finishes = measurements.finishes as string[] | undefined;
  if (!finishes || finishes.length === 0) {
    const finish = measurements.finish as string | undefined;
    return finish || "";
  }
  return finishes.join(" + ");
}

export default function WalkthroughScopeClient({
  quoteId,
  areaLines: initialAreaLines,
  addOnLines: initialAddOnLines,
  travelMinutesPerVisit: initialTravel,
  winterMinutesPerVisitDelta: initialWinter,
  visitsPerWeek: initialVisits,
  monthlySupplyCostCents: initialSupply,
  expectedSubcontractorRateCentsPerHour: initialSubRate,
  riskFactors: initialRiskFactors,
  buildingClass: initialBuildingClass,
  riskRulesKeys,
  billingRateCentsPerHour,
  rateCardEntries,
}: WalkthroughScopeClientProps) {
  const router = useRouter();
  const [areaLines, setAreaLines] = useState<AreaLine[]>(initialAreaLines);
  const [addOnLines, setAddOnLines] = useState<AddOnLine[]>(initialAddOnLines);
  const [travelMinutesPerVisit, setTravelMinutesPerVisit] = useState(initialTravel);
  const [winterMinutesPerVisitDelta, setWinterMinutesPerVisitDelta] = useState(initialWinter);
  const [visitsPerWeek, setVisitsPerWeek] = useState(initialVisits);
  const [monthlySupplyCostCents, setMonthlySupplyCostCents] = useState(initialSupply);
  const [expectedSubcontractorRateCentsPerHour, setExpectedSubcontractorRateCentsPerHour] = useState<string>(
    initialSubRate != null ? String(initialSubRate) : ""
  );
  const [riskFactors, setRiskFactors] = useState<string[]>(initialRiskFactors ?? []);
  const [buildingClass, setBuildingClass] = useState<BuildingClass | null>(initialBuildingClass);
  useEffect(() => {
    setAreaLines(initialAreaLines);
    setAddOnLines(initialAddOnLines);
  }, [initialAreaLines, initialAddOnLines]);
  useEffect(() => {
    setTravelMinutesPerVisit(initialTravel);
    setWinterMinutesPerVisitDelta(initialWinter);
    setVisitsPerWeek(initialVisits);
    setMonthlySupplyCostCents(initialSupply);
    setExpectedSubcontractorRateCentsPerHour(initialSubRate != null ? String(initialSubRate) : "");
    setRiskFactors(initialRiskFactors ?? []);
    setBuildingClass(initialBuildingClass);
  }, [initialTravel, initialWinter, initialVisits, initialSupply, initialSubRate, initialRiskFactors, initialBuildingClass]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [editingAreaId, setEditingAreaId] = useState<string | null>(null);

  const baseMinutes = baseMinutesFromLines(areaLines);
  const totalMinutesPerVisit = baseMinutes + travelMinutesPerVisit + winterMinutesPerVisitDelta;
  const canGoToPricing = areaLines.length >= 1 && totalMinutesPerVisit > 0;

  const refresh = () => router.refresh();

  // --- Area line form state (multi-finish) ---
  const [areaForm, setAreaForm] = useState<{
    type: QuoteAreaType;
    preset: "S" | "M" | "L";
    selectedFinishes: string[];
    count: string;
    overrideMinutes: string;
    overrideReason: string;
  }>({ type: "HALLWAYS", preset: "M", selectedFinishes: [], count: "1", overrideMinutes: "", overrideReason: "" });

  const availableFinishes = useMemo(() => {
    return rateCardEntries.filter(
      (e) => e.areaType === areaForm.type && e.size === areaForm.preset
    );
  }, [rateCardEntries, areaForm.type, areaForm.preset]);

  const sizeLabel = useMemo(() => {
    const entry = rateCardEntries.find(
      (e) => e.areaType === areaForm.type && e.size === areaForm.preset
    );
    return entry?.sizeLabel ?? "";
  }, [rateCardEntries, areaForm.type, areaForm.preset]);

  const computedMinutesPreview = useMemo(() => {
    const count = parseInt(areaForm.count || "1", 10) || 1;
    let total = 0;
    for (const f of areaForm.selectedFinishes) {
      const entry = availableFinishes.find((e) => e.finish === f);
      if (entry) total += entry.minutes;
    }
    return total * count;
  }, [availableFinishes, areaForm.selectedFinishes, areaForm.count]);

  function toggleFinish(finish: string) {
    setAreaForm((f) => {
      const current = f.selectedFinishes;
      const next = current.includes(finish)
        ? current.filter((v) => v !== finish)
        : [...current, finish];
      return { ...f, selectedFinishes: next };
    });
  }

  useEffect(() => {
    setAreaForm((f) => ({ ...f, selectedFinishes: [] }));
  }, [areaForm.type, areaForm.preset]);

  async function handleAddAreaLine(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const count = parseInt(areaForm.count || "1", 10);
    if (!Number.isFinite(count) || count < 1 || count > 100) {
      setError("Count must be between 1 and 100");
      setPending(false);
      return;
    }
    if (areaForm.selectedFinishes.length === 0) {
      setError("Select at least one finish");
      setPending(false);
      return;
    }
    const measurements: Record<string, unknown> = {
      preset: areaForm.preset,
      size: areaForm.preset,
      sizeLabel,
      finishes: areaForm.selectedFinishes,
      count,
    };
    const payload: CreateQuoteAreaLinePayload = {
      type: areaForm.type,
      measurements,
    };
    if (areaForm.overrideMinutes.trim()) {
      const ov = parseInt(areaForm.overrideMinutes, 10);
      if (!Number.isFinite(ov)) {
        setError("Override minutes must be a number");
        setPending(false);
        return;
      }
      payload.overrideMinutes = ov;
      payload.overrideReason = areaForm.overrideReason.trim() || undefined;
      if (!payload.overrideReason) {
        setError("Override reason required when override minutes are set");
        setPending(false);
        return;
      }
    }
    const result = await createQuoteAreaLine(quoteId, payload);
    setPending(false);
    if (result.ok) {
      refresh();
      setAreaForm({ type: "HALLWAYS", preset: "M", selectedFinishes: [], count: "1", overrideMinutes: "", overrideReason: "" });
    } else {
      setError(result.error ?? "Failed");
    }
  }

  async function handleUpdateAreaLine(lineId: string, payload: UpdateQuoteAreaLinePayload) {
    setError(null);
    setPending(true);
    const result = await updateQuoteAreaLine(lineId, payload);
    setPending(false);
    if (result.ok) {
      refresh();
      setEditingAreaId(null);
    } else {
      setError(result.error ?? "Failed");
    }
  }

  async function handleDeleteAreaLine(lineId: string) {
    setError(null);
    setPending(true);
    const result = await deleteQuoteAreaLine(lineId);
    setPending(false);
    if (result.ok) refresh();
    else setError(result.error ?? "Failed");
  }

  // --- Add-on form state ---
  const [addOnForm, setAddOnForm] = useState({ name: "", estimatedLaborMinutes: "30", includedInProposal: true });

  async function handleAddAddOnLine(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const minutes = parseInt(addOnForm.estimatedLaborMinutes, 10);
    if (!Number.isFinite(minutes) || minutes <= 0) {
      setError("Estimated labor minutes must be a positive number");
      setPending(false);
      return;
    }
    const result = await createQuoteAddOnLine(quoteId, {
      name: addOnForm.name.trim() || "Add-on",
      estimatedLaborMinutes: minutes,
      includedInProposal: addOnForm.includedInProposal,
    });
    setPending(false);
    if (result.ok) {
      refresh();
      setAddOnForm({ name: "", estimatedLaborMinutes: "30", includedInProposal: true });
    } else {
      setError(result.error ?? "Failed");
    }
  }

  async function handleUpdateAddOnLine(lineId: string, payload: UpdateQuoteAddOnLinePayload) {
    setError(null);
    setPending(true);
    const result = await updateQuoteAddOnLine(lineId, payload);
    setPending(false);
    if (result.ok) {
      refresh();
    } else {
      setError(result.error ?? "Failed");
    }
  }

  async function handleDeleteAddOnLine(lineId: string) {
    setError(null);
    setPending(true);
    const result = await deleteQuoteAddOnLine(lineId);
    setPending(false);
    if (result.ok) refresh();
    else setError(result.error ?? "Failed");
  }

  async function handleSaveHeaderAndRisk(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const payload: UpdateQuoteHeaderAndRiskPayload = {
      visitsPerWeek,
      travelMinutesPerVisit,
      winterMinutesPerVisitDelta,
      monthlySupplyCostCents,
      expectedSubcontractorRateCentsPerHour: expectedSubcontractorRateCentsPerHour.trim() === ""
        ? null
        : parseInt(expectedSubcontractorRateCentsPerHour, 10),
      riskFactors,
      buildingClass,
    };
    if (Number.isNaN(payload.expectedSubcontractorRateCentsPerHour as number)) {
      payload.expectedSubcontractorRateCentsPerHour = null;
    }
    const result = await updateQuoteHeaderAndRisk(quoteId, payload);
    setPending(false);
    if (result.ok) refresh();
    else setError(result.error ?? "Failed");
  }

  function toggleRiskFactor(key: string) {
    setRiskFactors((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <div className="flex-1 space-y-6">
        {error && (
          <div className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-2 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Quote header & risk */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">Quote header & risk</h2>
          <form onSubmit={handleSaveHeaderAndRisk} className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
            <div>
              <label className="block text-xs text-zinc-400">Visits/week</label>
              <input
                type="number"
                min={1}
                max={14}
                value={visitsPerWeek}
                onChange={(e) => setVisitsPerWeek(parseInt(e.target.value, 10) || 1)}
                className="mt-0.5 w-full rounded border border-zinc-600 bg-zinc-800 px-2 py-1.5 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400">Travel time (min)</label>
              <input
                type="number"
                min={0}
                max={999}
                value={travelMinutesPerVisit}
                onChange={(e) => setTravelMinutesPerVisit(parseInt(e.target.value, 10) || 0)}
                className="mt-0.5 w-full rounded border border-zinc-600 bg-zinc-800 px-2 py-1.5 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400">Extra winter minutes</label>
              <input
                type="number"
                min={-999}
                max={999}
                value={winterMinutesPerVisitDelta}
                onChange={(e) => setWinterMinutesPerVisitDelta(parseInt(e.target.value, 10) || 0)}
                className="mt-0.5 w-full rounded border border-zinc-600 bg-zinc-800 px-2 py-1.5 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400">Monthly supplies ($)</label>
              <input
                type="number"
                step="0.01"
                min={0}
                value={(monthlySupplyCostCents / 100).toFixed(2)}
                onChange={(e) => setMonthlySupplyCostCents(Math.round(parseFloat(e.target.value || "0") * 100))}
                className="mt-0.5 w-full rounded border border-zinc-600 bg-zinc-800 px-2 py-1.5 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400">Subcontractor rate ($/hr)</label>
              <input
                type="number"
                step="0.01"
                min={0}
                value={expectedSubcontractorRateCentsPerHour.trim() === "" ? "" : (parseInt(expectedSubcontractorRateCentsPerHour) / 100).toFixed(2)}
                onChange={(e) => {
                  if (e.target.value === "") {
                    setExpectedSubcontractorRateCentsPerHour("");
                  } else {
                    setExpectedSubcontractorRateCentsPerHour(String(Math.round(parseFloat(e.target.value) * 100)));
                  }
                }}
                placeholder="e.g. 30.00"
                className="mt-0.5 w-full rounded border border-zinc-600 bg-zinc-800 px-2 py-1.5 text-sm text-white"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={pending}
                className="rounded bg-zinc-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-500 disabled:opacity-50"
              >
                Save header & risk
              </button>
            </div>
          </form>
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-xs text-zinc-400">Building class</label>
              <select
                value={buildingClass ?? ""}
                onChange={(e) => setBuildingClass((e.target.value || null) as BuildingClass | null)}
                className="mt-0.5 rounded border border-zinc-600 bg-zinc-800 px-2 py-1.5 text-sm text-white"
              >
                {BUILDING_CLASSES.map((c) => (
                  <option key={c.value || "none"} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            {riskRulesKeys.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <span className="text-xs text-zinc-400">Risk factors:</span>
                {riskRulesKeys.map((key) => (
                  <label key={key} className="flex items-center gap-1.5 text-sm text-zinc-300">
                    <input
                      type="checkbox"
                      checked={riskFactors.includes(key)}
                      onChange={() => toggleRiskFactor(key)}
                      className="rounded border-zinc-600"
                    />
                    {key}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Area lines */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">Area lines</h2>
          <ul className="mb-4 divide-y divide-zinc-800">
            {areaLines.length === 0 ? (
              <li className="py-3 text-sm text-zinc-500">No area lines. Add one below.</li>
            ) : (
              areaLines.map((line) => {
                const m = line.measurements as Record<string, unknown>;
                const finishesStr = formatFinishes(m);
                const sizeLbl = (m.sizeLabel as string) || (m.preset as string) || "—";
                return (
                  <li key={line.id} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0">
                    <div>
                      <span className="font-medium text-white">
                        {AREA_TYPES.find((a) => a.value === line.type)?.label ?? line.type}
                      </span>
                      <span className="ml-2 text-zinc-400">
                        {(m.preset as string) || "—"}
                        {(m.sizeLabel as string) ? ` (${m.sizeLabel as string})` : ""}
                      </span>
                      {finishesStr && (
                        <span className="ml-2 text-zinc-500">{finishesStr}</span>
                      )}
                      <span className="ml-2 text-zinc-500">
                        = {line.overrideMinutes ?? line.computedMinutes} min
                        {line.overrideMinutes != null && line.overrideReason && (
                          <span className="ml-1 text-xs">override: {line.overrideReason}</span>
                        )}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleDeleteAreaLine(line.id)}
                        disabled={pending}
                        className="text-sm text-red-400 hover:text-red-300 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                );
              })
            )}
          </ul>

          <form onSubmit={handleAddAreaLine} className="space-y-4 rounded-lg border border-zinc-700/50 bg-zinc-800/50 p-4">
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="block text-xs text-zinc-400">Type</label>
                <select
                  value={areaForm.type}
                  onChange={(e) => setAreaForm((f) => ({ ...f, type: e.target.value as QuoteAreaType, selectedFinishes: [] }))}
                  className="mt-0.5 rounded border border-zinc-600 bg-zinc-800 px-2 py-1.5 text-sm text-white"
                >
                  {AREA_TYPES.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-zinc-400">Size</label>
                <div className="flex items-center gap-2">
                  <select
                    value={areaForm.preset}
                    onChange={(e) => setAreaForm((f) => ({ ...f, preset: e.target.value as "S" | "M" | "L", selectedFinishes: [] }))}
                    className="mt-0.5 rounded border border-zinc-600 bg-zinc-800 px-2 py-1.5 text-sm text-white"
                  >
                    {PRESETS.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                  {sizeLabel && (
                    <span className="text-xs text-zinc-400">({sizeLabel})</span>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-xs text-zinc-400">Count</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={areaForm.count}
                  onChange={(e) => setAreaForm((f) => ({ ...f, count: e.target.value }))}
                  className="mt-0.5 w-20 rounded border border-zinc-600 bg-zinc-800 px-2 py-1.5 text-sm text-white"
                />
              </div>
            </div>

            {/* Multi-finish checkboxes */}
            <div>
              <label className="block text-xs text-zinc-400 mb-2">Finishes (select multiple)</label>
              {availableFinishes.length === 0 ? (
                <p className="text-xs text-zinc-500">No finishes configured for this area type + size</p>
              ) : (
                <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  {availableFinishes.map((entry) => (
                    <label
                      key={entry.finish}
                      className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm cursor-pointer transition-colors ${
                        areaForm.selectedFinishes.includes(entry.finish)
                          ? "border-emerald-500/50 bg-emerald-500/10 text-white"
                          : "border-zinc-700 bg-zinc-800/50 text-zinc-300 hover:border-zinc-600"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={areaForm.selectedFinishes.includes(entry.finish)}
                        onChange={() => toggleFinish(entry.finish)}
                        className="rounded border-zinc-600"
                      />
                      <span className="flex-1">
                        {entry.finishLabel}
                        {entry.description && (
                          <span className="ml-1 text-xs text-zinc-500">— {entry.description}</span>
                        )}
                      </span>
                      <span className="text-xs font-mono text-zinc-400">{entry.minutes} min</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Running total */}
            {areaForm.selectedFinishes.length > 0 && (
              <div className="flex items-center gap-3 rounded-md border border-emerald-500/30 bg-emerald-500/5 px-3 py-2">
                <span className="text-sm text-zinc-300">Total:</span>
                <span className="text-lg font-bold text-emerald-400">{computedMinutesPreview} min</span>
                <span className="text-xs text-zinc-500">
                  ({areaForm.selectedFinishes.length} finish{areaForm.selectedFinishes.length > 1 ? "es" : ""} × {areaForm.count || "1"})
                </span>
              </div>
            )}

            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="block text-xs text-zinc-400">Override min (optional)</label>
                <input
                  type="number"
                  min={0}
                  max={999}
                  value={areaForm.overrideMinutes}
                  onChange={(e) => setAreaForm((f) => ({ ...f, overrideMinutes: e.target.value }))}
                  className="mt-0.5 w-20 rounded border border-zinc-600 bg-zinc-800 px-2 py-1.5 text-sm text-white"
                />
              </div>
              {areaForm.overrideMinutes.trim() && (
                <div className="min-w-[160px]">
                  <label className="block text-xs text-zinc-400">Override reason (required)</label>
                  <input
                    type="text"
                    value={areaForm.overrideReason}
                    onChange={(e) => setAreaForm((f) => ({ ...f, overrideReason: e.target.value }))}
                    placeholder="Reason"
                    className="mt-0.5 w-full rounded border border-zinc-600 bg-zinc-800 px-2 py-1.5 text-sm text-white"
                  />
                </div>
              )}
              <button
                type="submit"
                disabled={pending || areaForm.selectedFinishes.length === 0}
                className="rounded bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
              >
                Add area line
              </button>
            </div>
          </form>
        </div>

        {/* Add-on lines */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">Add-on lines</h2>
          <ul className="mb-4 divide-y divide-zinc-800">
            {addOnLines.length === 0 ? (
              <li className="py-3 text-sm text-zinc-500">No add-ons. Add one below.</li>
            ) : (
              addOnLines.map((line) => (
                <li key={line.id} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0">
                  <div>
                    <span className="font-medium text-white">{line.name}</span>
                    <span className="ml-2 text-zinc-400">{line.estimatedLaborMinutes} min</span>
                    <span className="ml-2 text-zinc-500">
                      ${(line.priceCents / 100).toFixed(2)} · margin {(line.marginBps / 100).toFixed(1)}%
                    </span>
                    {line.includedInProposal && (
                      <span className="ml-2 rounded bg-emerald-500/20 px-1.5 py-0.5 text-xs text-emerald-300">
                        In proposal
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleDeleteAddOnLine(line.id)}
                      disabled={pending}
                      className="text-sm text-red-400 hover:text-red-300 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))
            )}
          </ul>

          <form onSubmit={handleAddAddOnLine} className="flex flex-wrap items-end gap-3 rounded-lg border border-zinc-700/50 bg-zinc-800/50 p-4">
            <div>
              <label className="block text-xs text-zinc-400">Name</label>
              <input
                type="text"
                value={addOnForm.name}
                onChange={(e) => setAddOnForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Add-on name"
                className="mt-0.5 w-40 rounded border border-zinc-600 bg-zinc-800 px-2 py-1.5 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400">Est. minutes</label>
              <input
                type="number"
                min={1}
                max={999}
                value={addOnForm.estimatedLaborMinutes}
                onChange={(e) => setAddOnForm((f) => ({ ...f, estimatedLaborMinutes: e.target.value }))}
                className="mt-0.5 w-24 rounded border border-zinc-600 bg-zinc-800 px-2 py-1.5 text-sm text-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="includedInProposal"
                checked={addOnForm.includedInProposal}
                onChange={(e) => setAddOnForm((f) => ({ ...f, includedInProposal: e.target.checked }))}
                className="rounded border-zinc-600"
              />
              <label htmlFor="includedInProposal" className="text-sm text-zinc-400">Include in proposal</label>
            </div>
            <button
              type="submit"
              disabled={pending}
              className="rounded bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              Add add-on
            </button>
          </form>
        </div>
      </div>

      {/* Sidebar: minutes summary + Go to pricing */}
      <aside className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 lg:w-72 lg:shrink-0">
        <h3 className="mb-3 text-sm font-semibold text-zinc-300">Minutes per visit</h3>
        <ul className="space-y-1 text-sm text-zinc-400">
          <li>Base (areas): {baseMinutes} min</li>
          <li>Travel: {travelMinutesPerVisit} min</li>
          <li>Winter delta: {winterMinutesPerVisitDelta} min</li>
          <li className="border-t border-zinc-700 pt-2 font-medium text-white">
            Total: {totalMinutesPerVisit} min
          </li>
        </ul>
        <p className="mt-2 text-xs text-zinc-500">
          {visitsPerWeek} visits/week → ~{((totalMinutesPerVisit / 60) * visitsPerWeek * 4.33).toFixed(1)} hrs/mo
        </p>
        {/* Live price estimate */}
        <div className="mt-3 border-t border-zinc-700 pt-3">
          <p className="text-xs text-zinc-500">Estimated monthly price</p>
          <p className="text-2xl font-bold text-emerald-400">
            ${((totalMinutesPerVisit / 60) * visitsPerWeek * 4.33 * (billingRateCentsPerHour / 100)).toFixed(0)}
          </p>
          <p className="text-[10px] text-zinc-600">
            Based on ${(billingRateCentsPerHour / 100).toFixed(0)}/hr × {((totalMinutesPerVisit / 60) * visitsPerWeek * 4.33).toFixed(1)} hrs/mo
          </p>
        </div>
        <div className="mt-4">
          {!canGoToPricing ? (
            <p className="text-sm text-amber-400">
              Add at least one area line and ensure total minutes &gt; 0 to unlock pricing.
            </p>
          ) : (
            <a
              href={`/admin/quotes/${quoteId}/pricing`}
              className="inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
            >
              Go to pricing
            </a>
          )}
        </div>
      </aside>
    </div>
  );
}
