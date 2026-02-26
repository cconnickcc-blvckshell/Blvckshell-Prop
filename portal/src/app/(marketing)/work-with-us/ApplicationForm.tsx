"use client";

import { useState } from "react";

type ApplicationType = "INDIVIDUAL" | "SUBCONTRACTOR";
type Shift = "morning" | "afternoon" | "evening" | "flexible";

interface Reference {
  name: string;
  phone: string;
  relationship: string;
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  province: string;
  applicationType: ApplicationType;
  companyName: string;
  experienceYears: string;
  experienceSummary: string;
  availableDays: string[];
  availableShift: Shift;
  hasVehicle: boolean;
  hasDriversLicense: boolean;
  hasCOI: boolean;
  hasWSIB: boolean;
  references: Reference[];
  resumeFile: File | null;
  coiFile: File | null;
  wsibFile: File | null;
  agreedToTerms: boolean;
  agreedToBackgroundCheck: boolean;
}

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const SHIFTS: { value: Shift; label: string }[] = [
  { value: "morning", label: "Morning (5am–12pm)" },
  { value: "afternoon", label: "Afternoon (12pm–6pm)" },
  { value: "evening", label: "Evening (6pm–12am)" },
  { value: "flexible", label: "Flexible" },
];

const PROVINCES = [
  "AB",
  "BC",
  "MB",
  "NB",
  "NL",
  "NS",
  "NT",
  "NU",
  "ON",
  "PE",
  "QC",
  "SK",
  "YT",
];

const STEPS = ["Basic Info", "Experience & Availability", "Credentials & Documents", "Agreements & Submit"];

function initialFormData(): FormData {
  return {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    city: "",
    province: "ON",
    applicationType: "INDIVIDUAL",
    companyName: "",
    experienceYears: "",
    experienceSummary: "",
    availableDays: [],
    availableShift: "flexible",
    hasVehicle: false,
    hasDriversLicense: false,
    hasCOI: false,
    hasWSIB: false,
    references: [],
    resumeFile: null,
    coiFile: null,
    wsibFile: null,
    agreedToTerms: false,
    agreedToBackgroundCheck: false,
  };
}

export default function ApplicationForm() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [applicationId, setApplicationId] = useState<string | null>(null);

  function updateField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleDay(day: string) {
    setForm((prev) => ({
      ...prev,
      availableDays: prev.availableDays.includes(day)
        ? prev.availableDays.filter((d) => d !== day)
        : [...prev.availableDays, day],
    }));
  }

  function addReference() {
    if (form.references.length >= 3) return;
    setForm((prev) => ({
      ...prev,
      references: [...prev.references, { name: "", phone: "", relationship: "" }],
    }));
  }

  function updateReference(index: number, field: keyof Reference, value: string) {
    setForm((prev) => {
      const refs = [...prev.references];
      refs[index] = { ...refs[index], [field]: value };
      return { ...prev, references: refs };
    });
  }

  function removeReference(index: number) {
    setForm((prev) => ({
      ...prev,
      references: prev.references.filter((_, i) => i !== index),
    }));
  }

  function canAdvance(): boolean {
    switch (step) {
      case 0:
        return !!(
          form.firstName.trim() &&
          form.lastName.trim() &&
          form.email.trim() &&
          form.phone.trim() &&
          form.city.trim() &&
          (form.applicationType !== "SUBCONTRACTOR" || form.companyName.trim())
        );
      case 1:
        return form.availableDays.length > 0;
      case 2:
        return true;
      case 3:
        return form.agreedToTerms && form.agreedToBackgroundCheck;
      default:
        return false;
    }
  }

  async function handleSubmit() {
    if (!canAdvance()) return;
    setSubmitting(true);
    setError(null);

    try {
      const payload = new FormData();
      payload.append("firstName", form.firstName);
      payload.append("lastName", form.lastName);
      payload.append("email", form.email);
      payload.append("phone", form.phone);
      payload.append("city", form.city);
      payload.append("province", form.province);
      payload.append("applicationType", form.applicationType);
      if (form.companyName) payload.append("companyName", form.companyName);
      if (form.experienceYears) payload.append("experienceYears", form.experienceYears);
      if (form.experienceSummary) payload.append("experienceSummary", form.experienceSummary);
      payload.append("availableDays", JSON.stringify(form.availableDays));
      payload.append("availableShift", form.availableShift);
      payload.append("hasVehicle", String(form.hasVehicle));
      payload.append("hasDriversLicense", String(form.hasDriversLicense));
      payload.append("hasCOI", String(form.hasCOI));
      payload.append("hasWSIB", String(form.hasWSIB));
      payload.append("references", JSON.stringify(form.references));
      payload.append("agreedToTerms", String(form.agreedToTerms));
      payload.append("agreedToBackgroundCheck", String(form.agreedToBackgroundCheck));
      if (form.resumeFile) payload.append("resume", form.resumeFile);
      if (form.coiFile) payload.append("coi", form.coiFile);
      if (form.wsibFile) payload.append("wsib", form.wsibFile);

      const res = await fetch("/api/applications/worker", {
        method: "POST",
        body: payload,
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      setApplicationId(data.applicationId);
      setSubmitted(true);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
          <svg className="h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-white">Application Received</h3>
        <p className="mt-3 text-zinc-400">
          We&apos;ll review your application within 3 business days. If selected, we&apos;ll
          contact you via SMS to confirm your interest and schedule next steps.
        </p>
        {applicationId && (
          <p className="mt-4 text-sm text-zinc-500">
            Application ID:{" "}
            <span className="font-mono text-zinc-300">{applicationId}</span>
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 sm:p-8">
      {/* Step indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((label, i) => (
            <div key={label} className="flex flex-1 items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                    i < step
                      ? "bg-emerald-600 text-white"
                      : i === step
                        ? "border-2 border-emerald-500 bg-zinc-900 text-emerald-400"
                        : "border border-zinc-700 bg-zinc-900 text-zinc-500"
                  }`}
                >
                  {i < step ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </div>
                <span className="mt-1 hidden text-xs text-zinc-500 sm:block">{label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`mx-2 h-0.5 flex-1 ${
                    i < step ? "bg-emerald-600" : "bg-zinc-700"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step content */}
      {step === 0 && (
        <div className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-300">First Name *</label>
              <input
                type="text"
                value={form.firstName}
                onChange={(e) => updateField("firstName", e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="First name"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-300">Last Name *</label>
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => updateField("lastName", e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="Last name"
              />
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-300">Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-300">Phone *</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="(555) 123-4567"
              />
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-300">City *</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => updateField("city", e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="Windsor"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-300">Province</label>
              <select
                value={form.province}
                onChange={(e) => updateField("province", e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {PROVINCES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-300">Application Type *</label>
            <div className="flex gap-4">
              {(["INDIVIDUAL", "SUBCONTRACTOR"] as const).map((type) => (
                <label
                  key={type}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-3 text-sm transition ${
                    form.applicationType === type
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-300"
                      : "border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600"
                  }`}
                >
                  <input
                    type="radio"
                    name="applicationType"
                    value={type}
                    checked={form.applicationType === type}
                    onChange={() => updateField("applicationType", type)}
                    className="sr-only"
                  />
                  {type === "INDIVIDUAL" ? "Individual Worker" : "Subcontractor Company"}
                </label>
              ))}
            </div>
          </div>
          {form.applicationType === "SUBCONTRACTOR" && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-300">Company Name *</label>
              <input
                type="text"
                value={form.companyName}
                onChange={(e) => updateField("companyName", e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="Your company name"
              />
            </div>
          )}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-300">
                Years of Cleaning/Facilities Experience
              </label>
              <input
                type="number"
                min="0"
                max="50"
                value={form.experienceYears}
                onChange={(e) => updateField("experienceYears", e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="0"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-300">
              Experience Summary
            </label>
            <textarea
              value={form.experienceSummary}
              onChange={(e) => updateField("experienceSummary", e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="Briefly describe your relevant experience..."
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-300">
              Available Days *
            </label>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`rounded-lg border px-3 py-2 text-sm transition ${
                    form.availableDays.includes(day)
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-300"
                      : "border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600"
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-300">Preferred Shift</label>
            <div className="grid gap-2 sm:grid-cols-2">
              {SHIFTS.map((shift) => (
                <label
                  key={shift.value}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-3 text-sm transition ${
                    form.availableShift === shift.value
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-300"
                      : "border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600"
                  }`}
                >
                  <input
                    type="radio"
                    name="shift"
                    value={shift.value}
                    checked={form.availableShift === shift.value}
                    onChange={() => updateField("availableShift", shift.value)}
                    className="sr-only"
                  />
                  {shift.label}
                </label>
              ))}
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="flex items-center gap-3 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={form.hasVehicle}
                onChange={(e) => updateField("hasVehicle", e.target.checked)}
                className="h-4 w-4 rounded border-zinc-600 bg-zinc-700 text-emerald-500 focus:ring-emerald-500"
              />
              I have access to a vehicle
            </label>
            <label className="flex items-center gap-3 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={form.hasDriversLicense}
                onChange={(e) => updateField("hasDriversLicense", e.target.checked)}
                className="h-4 w-4 rounded border-zinc-600 bg-zinc-700 text-emerald-500 focus:ring-emerald-500"
              />
              I have a valid driver&apos;s license
            </label>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="flex items-center gap-3 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={form.hasCOI}
                onChange={(e) => updateField("hasCOI", e.target.checked)}
                className="h-4 w-4 rounded border-zinc-600 bg-zinc-700 text-emerald-500 focus:ring-emerald-500"
              />
              I have a Certificate of Insurance (COI)
            </label>
            <label className="flex items-center gap-3 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={form.hasWSIB}
                onChange={(e) => updateField("hasWSIB", e.target.checked)}
                className="h-4 w-4 rounded border-zinc-600 bg-zinc-700 text-emerald-500 focus:ring-emerald-500"
              />
              I have WSIB coverage
            </label>
          </div>

          {/* References */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-zinc-300">
                References (up to 3)
              </label>
              {form.references.length < 3 && (
                <button
                  type="button"
                  onClick={addReference}
                  className="text-sm text-emerald-400 hover:text-emerald-300"
                >
                  + Add Reference
                </button>
              )}
            </div>
            {form.references.map((ref, i) => (
              <div
                key={i}
                className="mt-3 rounded-lg border border-zinc-700 bg-zinc-800/50 p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-500">
                    Reference {i + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeReference(i)}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Remove
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <input
                    type="text"
                    placeholder="Name"
                    value={ref.name}
                    onChange={(e) => updateReference(i, "name", e.target.value)}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
                  />
                  <input
                    type="tel"
                    placeholder="Phone"
                    value={ref.phone}
                    onChange={(e) => updateReference(i, "phone", e.target.value)}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Relationship"
                    value={ref.relationship}
                    onChange={(e) =>
                      updateReference(i, "relationship", e.target.value)
                    }
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* File uploads */}
          <div className="space-y-4">
            <p className="text-sm font-medium text-zinc-300">
              Documents (optional)
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              {(
                [
                  ["resumeFile", "Resume"] as const,
                  ["coiFile", "COI Document"] as const,
                  ["wsibFile", "WSIB Document"] as const,
                ] as const
              ).map(([key, label]) => (
                <div key={key}>
                  <label className="block text-xs text-zinc-500 mb-1.5">{label}</label>
                  <label className="flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-zinc-700 bg-zinc-800/50 px-4 py-6 text-sm text-zinc-400 transition hover:border-zinc-600 hover:text-zinc-300">
                    {form[key] ? (
                      <span className="truncate text-emerald-400">
                        {form[key]!.name}
                      </span>
                    ) : (
                      <span>Choose file</span>
                    )}
                    <input
                      type="file"
                      className="sr-only"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0] ?? null;
                        updateField(key, file);
                      }}
                    />
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-5">
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-5 py-4">
            <p className="text-sm leading-relaxed text-zinc-300">
              All positions begin as temporary part-time contracts. Performance,
              reliability, and professional conduct determine advancement to
              increased hours and potential full-time roles. This is a merit-based
              progression.
            </p>
          </div>

          <label className="flex items-start gap-3 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-4 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={form.agreedToTerms}
              onChange={(e) => updateField("agreedToTerms", e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-zinc-600 bg-zinc-700 text-emerald-500 focus:ring-emerald-500"
            />
            <span>
              I agree to the{" "}
              <a
                href="/compliance"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 underline hover:text-emerald-300"
              >
                BLVCKSHELL Workforce Terms and Conditions
              </a>{" "}
              *
            </span>
          </label>

          <label className="flex items-start gap-3 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-4 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={form.agreedToBackgroundCheck}
              onChange={(e) =>
                updateField("agreedToBackgroundCheck", e.target.checked)
              }
              className="mt-0.5 h-4 w-4 rounded border-zinc-600 bg-zinc-700 text-emerald-500 focus:ring-emerald-500"
            />
            <span>
              I consent to a background check as part of the application process *
            </span>
          </label>
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="mt-8 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setStep((s) => s - 1)}
          className={`rounded-lg border border-zinc-700 bg-zinc-800 px-5 py-2.5 text-sm font-medium text-zinc-300 transition hover:bg-zinc-700 ${
            step === 0 ? "invisible" : ""
          }`}
        >
          Back
        </button>

        {step < STEPS.length - 1 ? (
          <button
            type="button"
            disabled={!canAdvance()}
            onClick={() => setStep((s) => s + 1)}
            className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Continue
          </button>
        ) : (
          <button
            type="button"
            disabled={!canAdvance() || submitting}
            onClick={handleSubmit}
            className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit Application"}
          </button>
        )}
      </div>
    </div>
  );
}
