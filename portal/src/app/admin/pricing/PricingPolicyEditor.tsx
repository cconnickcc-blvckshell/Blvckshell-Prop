"use client";

import { useState, useTransition } from "react";
import { updatePricingPolicy, createPricingPolicy } from "@/server/actions/pricing-policy-actions";

type Policy = {
  id: string;
  cityCode: string;
  effectiveDate: string;
  version: number;
  anchorBillingRateCentsPerHour: number;
  minimumMonthlyRevenueCents: number;
  targetMarginBps: number;
  stressMarginBps: number;
  minStressMarginBps: number;
  subPayoutCeilingCentsPerHour: number;
  addonBillingRateCentsPerHour: number;
  addonMinMarginBps: number;
  defaultTravelMinutesPerVisit: number;
  defaultMonthlySupplyCostCents?: number | null;
  defaultWinterMinutesPerVisitDelta: number;
  daysValid: number;
  winterStartMonth: number;
  winterEndMonth: number;
};

const FIELDS: { key: keyof Policy; label: string; unit: "dollars" | "percent" | "minutes" | "days" | "month" | "text"; centsField?: boolean; bpsField?: boolean }[] = [
  { key: "cityCode", label: "City", unit: "text" },
  { key: "anchorBillingRateCentsPerHour", label: "Billing rate ($/hr)", unit: "dollars", centsField: true },
  { key: "minimumMonthlyRevenueCents", label: "Minimum monthly revenue ($)", unit: "dollars", centsField: true },
  { key: "targetMarginBps", label: "Target margin (%)", unit: "percent", bpsField: true },
  { key: "stressMarginBps", label: "Stress margin (%)", unit: "percent", bpsField: true },
  { key: "minStressMarginBps", label: "Min stress margin (%)", unit: "percent", bpsField: true },
  { key: "subPayoutCeilingCentsPerHour", label: "Max subcontractor rate ($/hr)", unit: "dollars", centsField: true },
  { key: "addonBillingRateCentsPerHour", label: "Add-on billing rate ($/hr)", unit: "dollars", centsField: true },
  { key: "addonMinMarginBps", label: "Min add-on margin (%)", unit: "percent", bpsField: true },
  { key: "defaultTravelMinutesPerVisit", label: "Default travel time (min)", unit: "minutes" },
  { key: "defaultMonthlySupplyCostCents", label: "Default supply cost ($)", unit: "dollars", centsField: true },
  { key: "defaultWinterMinutesPerVisitDelta", label: "Winter extra minutes", unit: "minutes" },
  { key: "daysValid", label: "Quote valid for (days)", unit: "days" },
  { key: "winterStartMonth", label: "Winter start month", unit: "month" },
  { key: "winterEndMonth", label: "Winter end month", unit: "month" },
];

function displayValue(field: typeof FIELDS[number], raw: number | string | null | undefined): string {
  if (raw == null) return "—";
  if (field.unit === "text") return String(raw);
  const num = Number(raw);
  if (field.centsField) return (num / 100).toFixed(2);
  if (field.bpsField) return (num / 100).toFixed(1);
  return String(num);
}

function toStoredValue(field: typeof FIELDS[number], display: string): number {
  const num = parseFloat(display);
  if (isNaN(num)) return 0;
  if (field.centsField) return Math.round(num * 100);
  if (field.bpsField) return Math.round(num * 100);
  return Math.round(num);
}

const MONTH_NAMES = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function PricingPolicyEditor({ policies }: { policies: Policy[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [showCreate, setShowCreate] = useState(false);
  const [createValues, setCreateValues] = useState<Record<string, string>>({
    cityCode: "YYZ",
    effectiveDate: new Date().toISOString().slice(0, 10),
    anchorBillingRateCentsPerHour: "45.00",
    minimumMonthlyRevenueCents: "500.00",
    targetMarginBps: "25.0",
    stressMarginBps: "20.0",
    minStressMarginBps: "15.0",
    subPayoutCeilingCentsPerHour: "30.00",
    addonBillingRateCentsPerHour: "50.00",
    addonMinMarginBps: "30.0",
    defaultTravelMinutesPerVisit: "15",
    defaultWinterMinutesPerVisitDelta: "5",
    daysValid: "30",
    winterStartMonth: "10",
    winterEndMonth: "3",
  });
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  function startEditing(policy: Policy) {
    const vals: Record<string, string> = {};
    for (const f of FIELDS) {
      if (f.key === "cityCode") continue;
      vals[f.key] = displayValue(f, policy[f.key] as number);
    }
    setEditValues(vals);
    setEditingId(policy.id);
  }

  function handleSave(policyId: string) {
    startTransition(async () => {
      const data: Record<string, number> = {};
      for (const f of FIELDS) {
        if (f.key === "cityCode") continue;
        if (editValues[f.key] != null) {
          data[f.key] = toStoredValue(f, editValues[f.key]);
        }
      }
      const result = await updatePricingPolicy(policyId, data);
      if (result.ok) {
        setFeedback("Saved");
        setEditingId(null);
        setTimeout(() => setFeedback(null), 2000);
      }
    });
  }

  function handleCreate() {
    startTransition(async () => {
      const data: Record<string, number | string> = {
        cityCode: createValues.cityCode,
        effectiveDate: createValues.effectiveDate,
      };
      for (const f of FIELDS) {
        if (f.key === "cityCode") continue;
        if (createValues[f.key] != null) {
          data[f.key] = toStoredValue(f, createValues[f.key]);
        }
      }
      const result = await createPricingPolicy(data as Parameters<typeof createPricingPolicy>[0]);
      if (result.ok) {
        setFeedback("Policy created");
        setShowCreate(false);
        setTimeout(() => setFeedback(null), 2000);
      }
    });
  }

  return (
    <div className="space-y-6">
      {feedback && (
        <div className="rounded-lg border border-emerald-500/50 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-400">
          {feedback}
        </div>
      )}

      {policies.map((policy) => (
        <div key={policy.id} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">
                {policy.cityCode}
                <span className="ml-2 text-sm font-normal text-zinc-500">
                  v{policy.version} · {new Date(policy.effectiveDate).toLocaleDateString()}
                </span>
              </h3>
            </div>
            {editingId === policy.id ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleSave(policy.id)}
                  disabled={isPending}
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
                >
                  {isPending ? "Saving…" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-1.5 text-sm font-medium text-white"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => startEditing(policy)}
                className="rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700"
              >
                Edit
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {FIELDS.filter(f => f.key !== "cityCode").map((f) => (
              <div key={f.key}>
                <p className="text-xs text-zinc-500">{f.label}</p>
                {editingId === policy.id ? (
                  <input
                    type={f.unit === "text" ? "text" : "number"}
                    step={f.centsField || f.bpsField ? "0.01" : "1"}
                    value={editValues[f.key] ?? ""}
                    onChange={(e) => setEditValues((v) => ({ ...v, [f.key]: e.target.value }))}
                    className="mt-0.5 w-full rounded border border-zinc-600 bg-zinc-800 px-2 py-1 text-sm text-white"
                  />
                ) : (
                  <p className="mt-0.5 text-sm font-medium text-white">
                    {f.centsField ? `$${displayValue(f, policy[f.key] as number)}` :
                     f.bpsField ? `${displayValue(f, policy[f.key] as number)}%` :
                     f.unit === "month" ? MONTH_NAMES[Number(policy[f.key])] || String(policy[f.key]) :
                     f.unit === "minutes" ? `${policy[f.key]} min` :
                     f.unit === "days" ? `${policy[f.key]} days` :
                     String(policy[f.key] ?? "—")}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {!showCreate ? (
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="rounded-lg border border-dashed border-zinc-700 bg-zinc-900/30 px-4 py-3 text-sm font-medium text-zinc-400 hover:border-zinc-500 hover:text-white"
        >
          + Create new policy
        </button>
      ) : (
        <div className="rounded-xl border border-zinc-700 bg-zinc-900/50 p-5">
          <h3 className="mb-4 text-lg font-semibold text-white">New Pricing Policy</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <div>
              <label className="block text-xs text-zinc-500">City code</label>
              <input
                type="text"
                value={createValues.cityCode}
                onChange={(e) => setCreateValues((v) => ({ ...v, cityCode: e.target.value }))}
                className="mt-0.5 w-full rounded border border-zinc-600 bg-zinc-800 px-2 py-1 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500">Effective date</label>
              <input
                type="date"
                value={createValues.effectiveDate}
                onChange={(e) => setCreateValues((v) => ({ ...v, effectiveDate: e.target.value }))}
                className="mt-0.5 w-full rounded border border-zinc-600 bg-zinc-800 px-2 py-1 text-sm text-white"
              />
            </div>
            {FIELDS.filter(f => f.key !== "cityCode").map((f) => (
              <div key={f.key}>
                <label className="block text-xs text-zinc-500">{f.label}</label>
                <input
                  type={f.unit === "text" ? "text" : "number"}
                  step={f.centsField || f.bpsField ? "0.01" : "1"}
                  value={createValues[f.key] ?? ""}
                  onChange={(e) => setCreateValues((v) => ({ ...v, [f.key]: e.target.value }))}
                  className="mt-0.5 w-full rounded border border-zinc-600 bg-zinc-800 px-2 py-1 text-sm text-white"
                />
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={handleCreate}
              disabled={isPending}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              {isPending ? "Creating…" : "Create policy"}
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="rounded-lg border border-zinc-600 bg-zinc-800 px-4 py-2 text-sm font-medium text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
