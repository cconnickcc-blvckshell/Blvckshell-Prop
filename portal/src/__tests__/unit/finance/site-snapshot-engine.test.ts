/**
 * Site snapshot engine tests: CLOSED immutable, add-on revenue separated.
 */
import { describe, it, expect } from "vitest";
import { testDb } from "../../setup";
import { computeSiteSnapshot, persistSiteSnapshot } from "@/server/finance/site-snapshot-engine";

describe("Site snapshot engine", () => {
  it("computeSiteSnapshot returns draft with base and add-on revenue separated", async () => {
    const client = await testDb.clientOrganization.create({
      data: {
        name: "Finance Test Client",
        primaryContactName: "C",
        primaryContactEmail: "fin@test.com",
        primaryContactPhone: "1",
      },
    });
    const site = await testDb.site.create({
      data: {
        clientOrganizationId: client.id,
        name: "Finance Test Site",
        address: "123 Finance St",
        requiredPhotoCount: 4,
        suppliesProvidedBy: "COMPANY",
      },
    });

    const result = await computeSiteSnapshot({
      siteId: site.id,
      month: new Date("2025-01-15"),
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.draft.siteId).toBe(site.id);
    expect(typeof result.draft.baseRevenueCents).toBe("number");
    expect(typeof result.draft.addOnRevenueCents).toBe("number");
    expect(typeof result.draft.ar_0_30_cents).toBe("number");
    expect(typeof result.draft.ar_31_60_cents).toBe("number");
    expect(typeof result.draft.ar_61_90_cents).toBe("number");
    expect(typeof result.draft.ar_90_plus_cents).toBe("number");
  });

  it("persist then close: CLOSED snapshot blocks recompute for same site+month", async () => {
    const client = await testDb.clientOrganization.create({
      data: {
        name: "Finance Test Client 2",
        primaryContactName: "C",
        primaryContactEmail: "fin2@test.com",
        primaryContactPhone: "1",
      },
    });
    const site = await testDb.site.create({
      data: {
        clientOrganizationId: client.id,
        name: "Finance Test Site 2",
        address: "456 Finance St",
        requiredPhotoCount: 4,
        suppliesProvidedBy: "COMPANY",
      },
    });
    const user = await testDb.user.create({
      data: {
        email: "snap@test.com",
        passwordHash: "x",
        role: "ADMIN",
        name: "Snap User",
      },
    });

    const result = await computeSiteSnapshot({
      siteId: site.id,
      month: new Date("2025-02-01"),
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const persist = await persistSiteSnapshot(result.draft, user.id);
    expect(persist.ok).toBe(true);
    if (!persist.ok) return;

    await testDb.sitePerformanceSnapshot.update({
      where: { id: persist.id },
      data: { status: "CLOSED", lockedAt: new Date() },
    });

    const result2 = await computeSiteSnapshot({
      siteId: site.id,
      month: new Date("2025-02-01"),
    });
    expect(result2.ok).toBe(false);
    if (result2.ok) return;
    expect(result2.error).toContain("CLOSED");
  });
});
