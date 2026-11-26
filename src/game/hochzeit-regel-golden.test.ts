// Paket A2 (Anker-Fortsetzung), Abnahmekriterium 8: die Hochzeitsregel bleibt unverändert.
// Golden Master: der reine Kalender (weddingCalendar, ohne Anker) für 72 feste Dörfer — Legacy-Regel vor dem Umschalt-
// zeitpunkt, einheitliche Regel danach, europe und lab, Dom/Universität/Klostergarten/Gemeinwesen/Freibriefe — als
// SHA-256 über Zeitpunkt, Index, Mitgift, town und grand. Der Hash wurde auf dem Paketstand 94d0527 (vor A2) berechnet
// und hier fest eingetragen. Jede Änderung an wedStage/wedPop/wedGapHours/wedHealth/dowryAt oder am Schrittverfahren
// ändert ihn. Zusätzlich: der Fortsetzungsschritt ab einem Anker ist derselbe Schritt (weddingCalendarFrom = Kalender).
import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { weddingCalendar, WEDDING_SWITCH_SINCE } from "./weddings";
import type { Seed } from "./world";

const D = 864e5, H = 3.6e6, T = WEDDING_SWITCH_SINCE;
/** Fester Hash des Kalenders aller GOLDEN-Dörfer auf 94d0527 (vor A2). */
export const GOLDEN_SHA256 = "9bdfdb14dbaa9013e6c9986060a09380b7c3268d0d26193d2321d16e22790e16";

const SETS: [string, number][][] = [
  [],
  [["fisher", 1], ["hunter", 2]],
  [["fisher", 1], ["hunter", 2], ["herbs", 9], ["healer", 30]],
  [["fisher", 1], ["hunter", 2], ["granary", 5], ["herbs", 9], ["healer", 30], ["library", 40], ["badestube", 50], ["beginen", 60]],
  [["fisher", 1], ["hunter", 2], ["granary", 5], ["cathedral1", 100], ["cathedral2", 101], ["cathedral3", 102], ["herberge", 90]],
  [["fisher", 1], ["hunter", 2], ["dairy", 8], ["university1", 110], ["university2", 111], ["university3", 112], ["woodcamp", 95]],
  [["fisher", 1], ["hunter", 2], ["orangery1", 120], ["orangery2", 121], ["school", 20], ["markethall", 70]],
  [["fisher", 1], ["hunter", 2], ["granary", 5], ["dairy", 8], ["herbs", 9], ["healer", 30], ["cathedral1", 200], ["cathedral2", 201],
   ["cathedral3", 202], ["cathedral4", 203], ["university1", 204], ["university2", 205], ["university3", 206], ["orangery3", 207]],
];
/** 8 Kaufmuster × 3 Gründungszeitpunkte × (europe, lab, Freibrief Handwerk) = 72 Dörfer. */
export function goldenVillages(): Seed[] {
  const out: Seed[] = [];
  let k = 0;
  for (const [si, set] of SETS.entries()) for (const c0 of [T - 320 * D, T - 150 * D, T - 20 * D]) for (const variant of ["europe", "lab", "craft"]) {
    out.push({
      id: `golden-${k++}`, user_id: "u", realm: variant === "lab" ? "lab" : "europe", x: 500, y: 500, created_at: new Date(c0 + si * 3_600_123).toISOString(),
      bought: set.map(([item, d]) => ({ item, at: c0 + d * D + (d % 5) * H })),
      ...(variant === "craft" ? { charter: { path: "craft", at: c0 + 60 * D } } : {}),
    } as unknown as Seed);
  }
  return out;
}
export const GOLDEN_UNTIL = T + 90 * D;
export function goldenHash(cal: (s: Seed, now: number) => { at: number; k: number; dowry: number; town: boolean; grand: boolean }[]) {
  const h = createHash("sha256");
  let n = 0;
  for (const s of goldenVillages()) for (const w of cal(s, GOLDEN_UNTIL)) { h.update(`${s.id}|${w.k}|${w.at}|${w.dowry}|${+w.town}|${+w.grand}\n`); n++; }
  return { sha: h.digest("hex"), weddings: n };
}

describe("A2 Kriterium 8: die Hochzeitsregel bleibt unverändert (Golden Master 94d0527)", () => {
  it("A2-K8 golden master: weddingCalendar für 72 feste Dörfer hat denselben SHA-256 wie auf 94d0527", () => {
    const { sha, weddings } = goldenHash(weddingCalendar);
    expect(weddings).toBeGreaterThan(2000);
    expect(sha).toBe(GOLDEN_SHA256);
  });
});
