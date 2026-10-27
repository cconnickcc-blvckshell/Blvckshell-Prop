import { describe, expect, it } from "vitest";
import { torontoWindows } from "@/lib/toronto-time";

describe("torontoWindows", () => {
  it("uses an exclusive end for October 2026 (EDT, UTC-4)", () => {
    const windows = torontoWindows(new Date("2026-10-26T23:15:00.000Z"));
    expect(windows.hour).toBe(19);
    expect(windows.todayStart.toISOString()).toBe("2026-10-26T04:00:00.000Z");
    expect(windows.todayEnd.toISOString()).toBe("2026-10-27T04:00:00.000Z");
    expect(windows.monthStart.toISOString()).toBe("2026-10-01T04:00:00.000Z");
    expect(windows.monthEnd.toISOString()).toBe("2026-11-01T04:00:00.000Z");
  });

  it("uses an exclusive end for January 2026 (EST, UTC-5)", () => {
    const windows = torontoWindows(new Date("2026-01-15T15:00:00.000Z"));
    expect(windows.hour).toBe(10);
    expect(windows.monthStart.toISOString()).toBe("2026-01-01T05:00:00.000Z");
    expect(windows.monthEnd.toISOString()).toBe("2026-02-01T05:00:00.000Z");
    expect(windows.todayStart.toISOString()).toBe("2026-01-15T05:00:00.000Z");
    expect(windows.todayEnd.toISOString()).toBe("2026-01-16T05:00:00.000Z");
  });
});
