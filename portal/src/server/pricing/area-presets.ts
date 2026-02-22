/**
 * Base minutes per area type and size preset (S/M/L).
 * Used when creating/updating QuoteAreaLine from preset; replace with RateCard when editor exists.
 * Bump AREA_PRESETS_VERSION when changing BASE_MINUTES or FINISH_ADDERS so snapshots record identity.
 */
import type { QuoteAreaType } from "@prisma/client";

/** Version of this preset table; stored on QuoteSnapshot as rateCardRef = `area-presets:${AREA_PRESETS_VERSION}` */
export const AREA_PRESETS_VERSION = "2026-02-22-v1";

const SIZE_KEYS = ["S", "M", "L"] as const;
export type SizePreset = (typeof SIZE_KEYS)[number];

export type AreaMeasurements = {
  preset?: SizePreset;
  finish?: string;
  count?: number;
  [key: string]: unknown;
};

/** Base minutes by QuoteAreaType and S/M/L. Tune via RateCard editor later. */
const BASE_MINUTES: Record<QuoteAreaType, Record<SizePreset, number>> = {
  LOBBY: { S: 15, M: 25, L: 40 },
  HALLWAYS: { S: 20, M: 35, L: 55 },
  STAIRWELLS: { S: 10, M: 18, L: 28 },
  ELEVATORS: { S: 8, M: 15, L: 25 },
  GARBAGE: { S: 5, M: 12, L: 20 },
  WASHROOMS: { S: 10, M: 18, L: 28 },
  GLASS: { S: 5, M: 12, L: 20 },
  OTHER: { S: 10, M: 20, L: 35 },
};

/** Finish adders (minutes) applied when measurements.finish is set. */
const FINISH_ADDERS: Record<string, number> = {
  carpet: 0,
  tile: 2,
  vinyl: 1,
  mixed: 3,
  "glass-heavy": 5,
  chrome: 4,
  concrete: 0,
  premium: 5,
};

const MAX_COMPUTED_MINUTES = 999;
const MIN_MINUTES = 0;

/**
 * Compute base minutes from area type and measurements (preset + optional finish).
 * Returns null if preset missing or invalid.
 */
export function computeAreaMinutesFromPreset(
  type: QuoteAreaType,
  measurements: AreaMeasurements
): number | null {
  const preset = measurements?.preset;
  if (!preset || !SIZE_KEYS.includes(preset as SizePreset)) return null;
  const byType = BASE_MINUTES[type];
  if (!byType) return null;
  let base = byType[preset as SizePreset] ?? byType.M;
  const count = typeof measurements.count === "number" && measurements.count > 0 ? measurements.count : 1;
  base = base * count;
  const finish = typeof measurements.finish === "string" ? measurements.finish : undefined;
  if (finish && Object.prototype.hasOwnProperty.call(FINISH_ADDERS, finish)) {
    base += FINISH_ADDERS[finish] * count;
  }
  return Math.min(MAX_COMPUTED_MINUTES, Math.max(MIN_MINUTES, Math.round(base)));
}

export function clampMinutes(value: number): number {
  return Math.min(MAX_COMPUTED_MINUTES, Math.max(MIN_MINUTES, Math.round(value)));
}

export const AREA_PRESET_MINUTES = BASE_MINUTES;
