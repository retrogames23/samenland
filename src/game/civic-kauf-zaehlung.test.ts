// F-P2-1 (migration 0153): the one counting rule behind the quest progress and the decree display in Game.tsx.
// The database side and the agreement of both run in src/lib/civic-kauf-zaehlung.pg.test.ts.
import { describe, expect, it } from "vitest";
import { countsAsBuilding, isCivicMoney } from "./civic";

describe("countsAsBuilding: a Gemeindebau stage counts once, by its completion marker", () => {
  it("ordinary purchases and completion markers count", () => {
    for (const item of [
      "hunter",
      "herbs",
      "chest2",
      "belfry1",
      "spital1",
      "waage1",
      "spital3",
      "waage2",
    ])
      expect(countsAsBuilding(item)).toBe(true);
  });
  it("instalments, daily Kontor rows and Ankauf credits do not — for every stage of Spital and Waage", () => {
    for (const item of [
      "spital1:r1",
      "spital1:r17",
      "waage1:k20261202",
      "spital2:r1",
      "spital3:k20270101",
      "waage2:r4",
      "waage12:k20261231",
      "ankauf:20261202",
    ])
      expect(countsAsBuilding(item)).toBe(false);
  });
  it("money rows need the exact form; anything else is no money row", () => {
    for (const item of [
      "spital1:r0",
      "spital0:r1",
      "spital1:k2026120",
      "spitalx:r1",
      "markt1:r1",
      "spital1:kx",
    ])
      expect(isCivicMoney(item)).toBe(false);
  });
});
