/**
 * Neutral placeholder tasks per area. Real task wording is edited in Settings.
 */
export const QUOTE_AREA_TYPES = [
  "LOBBY",
  "HALLWAYS",
  "STAIRWELLS",
  "ELEVATORS",
  "GARBAGE",
  "WASHROOMS",
  "GLASS",
  "OTHER",
] as const;

export type QuoteAreaTypeKey = (typeof QUOTE_AREA_TYPES)[number];

export const QUOTE_AREA_LABELS: Record<string, string> = {
  LOBBY: "Lobby",
  HALLWAYS: "Hallways",
  STAIRWELLS: "Stairwells",
  ELEVATORS: "Elevators",
  GARBAGE: "Garbage room",
  WASHROOMS: "Washrooms",
  GLASS: "Glass",
  OTHER: "Other area",
};

export type AreaTaskSource = {
  areaType: string;
  description: string;
  frequency: string;
  sortOrder?: number;
};

export type AreaTaskRow = {
  description: string;
  frequency: string;
};

const AREA_NAMES: Record<string, string> = {
  LOBBY: "Lobby",
  HALLWAYS: "Hallway",
  STAIRWELLS: "Stairwell",
  ELEVATORS: "Elevator",
  GARBAGE: "Garbage room",
  WASHROOMS: "Washroom",
  GLASS: "Glass",
  OTHER: "Area",
};

function placeholderTasks(areaType: string): AreaTaskSource[] {
  const name = AREA_NAMES[areaType] ?? "Area";
  return [
    {
      areaType,
      description: `[${name} task 1 — edit in Settings]`,
      frequency: "Each visit",
      sortOrder: 10,
    },
    {
      areaType,
      description: `[${name} task 2 — edit in Settings]`,
      frequency: "Weekly",
      sortOrder: 20,
    },
  ];
}

export const PROPOSAL_AREA_TASK_CATALOG: AreaTaskSource[] = QUOTE_AREA_TYPES.flatMap((areaType) =>
  placeholderTasks(areaType)
);

export function isQuoteAreaType(value: string): value is QuoteAreaTypeKey {
  return (QUOTE_AREA_TYPES as readonly string[]).includes(value);
}

/** Stored "Each visit" follows the quote rhythm. Any other frequency is shown as written. */
export function displayFrequency(stored: string, visitsPerWeek: number): string {
  const value = stored.trim();
  if (value && value.toLowerCase() !== "each visit") return value;
  const visits = Number.isFinite(visitsPerWeek) ? Math.round(visitsPerWeek) : 0;
  if (visits <= 1) return "Weekly";
  if (visits >= 7) return "Daily";
  return `${visits} days per week`;
}

function cleanTasks(rows: AreaTaskSource[]): AreaTaskSource[] {
  return rows
    .map((row, index) => ({
      areaType: row.areaType,
      description: row.description.trim(),
      frequency: row.frequency.trim() || "Each visit",
      sortOrder: row.sortOrder ?? (index + 1) * 10,
    }))
    .filter((row) => row.description.length > 0)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

function tasksFromMeasurements(measurements: unknown): AreaTaskSource[] | null {
  if (!measurements || typeof measurements !== "object") return null;
  const raw = (measurements as { tasks?: unknown }).tasks;
  if (!Array.isArray(raw)) return null;
  const rows: AreaTaskSource[] = [];
  raw.forEach((entry, index) => {
    if (!entry || typeof entry !== "object") return;
    const record = entry as { description?: unknown; task?: unknown; frequency?: unknown };
    const description = typeof record.description === "string" ? record.description : typeof record.task === "string" ? record.task : "";
    const frequency = typeof record.frequency === "string" ? record.frequency : "Each visit";
    if (description.trim()) {
      rows.push({ areaType: "", description, frequency, sortOrder: (index + 1) * 10 });
    }
  });
  return rows.length > 0 ? rows : null;
}

export function resolveAreaTasks(input: {
  areaType: string;
  measurements: unknown;
  visitsPerWeek: number;
  defaults?: AreaTaskSource[];
  overrides?: AreaTaskSource[];
  checklist?: AreaTaskSource[];
}): AreaTaskRow[] {
  const overrides = cleanTasks((input.overrides ?? []).filter((row) => row.areaType === input.areaType));
  const embedded = tasksFromMeasurements(input.measurements);
  const checklist = cleanTasks((input.checklist ?? []).filter((row) => row.areaType === input.areaType));
  const storedDefaults = cleanTasks((input.defaults ?? []).filter((row) => row.areaType === input.areaType));
  const fallback = storedDefaults.length > 0 ? storedDefaults : placeholderTasks(input.areaType);
  const chosen = overrides.length > 0 ? overrides : embedded ?? (checklist.length > 0 ? checklist : fallback);
  return chosen.map((row) => ({
    description: row.description,
    frequency: displayFrequency(row.frequency, input.visitsPerWeek),
  }));
}
