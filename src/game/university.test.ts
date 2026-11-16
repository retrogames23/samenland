import { describe, it, expect } from "vitest";
import { universityDone, careHealthExtra, careStage, monumentChain, stepsPaid, cathedralDone, lighthouseDone, careFoodExtra, specialTile, UNIVERSITY_MESSENGER, hash, type Link, type Seed } from "./world";
import { sickChance } from "./sickness";
import { walkersOn, uniChancery, MESSENGER_DAY, HERBERGE_WALZ } from "./wander";
import { prosperityAt, PRESTIGE_BONUS, PROSPER_MONUMENTS, civicWealth } from "./prosperity";
import { townOf } from "./people";

const T = Date.parse("2026-03-02T06:00:00Z"), DAY = 864e5;
const town = (items: [string, number][], id = "uni", x = 400, y = 540): Seed => ({ id, name: "U", owner: "o", hue: 1, x, y, user_id: "u",
  created_at: "2025-01-01T00:00:00Z", bought: items.map(([item, at]) => ({ item, at, ...(item === "university1" ? { x: x + 4, y: y + 3 } : {}) })) } as Seed);
const uni = (n: number, at = T, extra: [string, number][] = []) => town([...extra, ...Array.from({ length: n }, (_, i) => [`university${i + 1}`, at + i] as [string, number])]);
const doneAt = (s: Seed, i: number) => monumentChain(s, "university")[i]!.done;

describe("Universität: nur fertig gebaute Abschnitte wirken", () => {
  it("universityDone folgt der Fertigstellung, nicht der Zahlung", () => {
    const s = uni(4);
    expect(stepsPaid(s, "university", T + 10)).toBe(4);
    expect(universityDone(s, T + 10)).toBe(0);
    for (let i = 0; i < 4; i++) { expect(universityDone(s, doneAt(s, i) - 1)).toBe(i); expect(universityDone(s, doneAt(s, i))).toBe(i + 1); }
    expect(universityDone(town([]), T)).toBe(0);
  });
  it("Schritt 1: zwei Dozenten erst nach Fertigstellung, keine zusätzlichen Bewohner", () => {
    const s = uni(1, T - 300 * DAY), d = doneAt(s, 0), tl = specialTile(s, "university")!;
    const at = (t: number) => townOf(s, [s], t).people.filter((p) => p.job === "teacher" && p.work?.[0] === tl[0] && p.work?.[1] === tl[1]);
    const before = townOf(s, [s], d - 1), after = townOf(s, [s], d);
    expect(at(d - 1).length).toBe(0);
    expect(at(d).length).toBe(2);
    expect(after.people.length).toBe(before.people.length);
  });
  it("Schritt 3: exakt +1 Gemeinwesen, ohne Rekursion; keine Doppelzählung mit Bibliothek", () => {
    const base: [string, number][] = [["fisher", T - DAY], ["hunter", T - DAY], ["granary", T - DAY], ["herbs", T - DAY]];
    const s = uni(3, T, base), d = doneAt(s, 2), own = new Set(["fisher", "hunter", "granary", "herbs"]);
    expect(careHealthExtra(s, d - 1, own)).toBe(0);
    expect(careHealthExtra(s, d, own)).toBe(1);
    expect(careHealthExtra(uni(4, T, base), doneAt(uni(4, T, base), 3), own)).toBe(1);
    expect(careStage(s, d)).toBe(careStage(s, d - 1) + 1);
    const lib = uni(3, T, [...base, ["library", T - DAY]]);
    expect(careHealthExtra(lib, d, new Set([...own, "library"]))).toBe(1);
  });
  it("kein Krankheitsbonus mehr", () => {
    const s = uni(4), d = doneAt(s, 3) + DAY;
    expect(sickChance(s, d)).toBeCloseTo(sickChance(town([]), d), 12);
  });
  it("Schritt 4: zwei Zivilwerke erst nach Fertigstellung; Prestigeliste unverändert", () => {
    const s = uni(4), d = doneAt(s, 3);
    expect(PRESTIGE_BONUS["university4"]).toBe(15);
    expect(PROSPER_MONUMENTS).toContain("university4");
    const H6 = 6 * 3.6e6, base = prosperityAt(town([]), d + H6, 500);
    // bezahlt, aber noch nicht fertig: keine Zivilwerke
    expect(prosperityAt(s, d - 1, 500)).toBeCloseTo(prosperityAt(town([]), d - 1, 500), 9);
    // fertig, aber < 6 h: keine Zivilwerke
    expect(prosperityAt(s, d + H6 - 1, 500)).toBeCloseTo(prosperityAt(town([]), d + H6 - 1, 500), 9);
    // fertig und 6 h vergangen: +2 Zivilwerke
    expect(prosperityAt(s, d + H6, 500) - base).toBeCloseTo(100 * 0.3 * 2 / 20, 9);
    // legacy civic wealth (DB-mirrored) keeps its six-hour maturing from the paid row
    const paid = s.bought!.find((b) => b.item === "university4")!.at;
    expect(civicWealth(s, paid + 6 * 3.6e6) - civicWealth(s, paid + 6 * 3.6e6 - 1)).toBe(15);
  });
  it("andere Monumente unberührt", () => {
    const s = uni(4), d = doneAt(s, 3);
    expect(cathedralDone(s, d)).toBe(0); expect(lighthouseDone(s, d)).toBe(0); expect(careFoodExtra(s, d)).toBe(0);
  });
});

describe("Schritt 2: Kanzleiboten +20 %", () => {
  const a = uni(2, T - 300 * DAY), b = town([], "nb", 440, 540);
  const tiles = Array.from({ length: 40 }, (_, i) => [400 + i, 540] as [number, number]);
  const l = { a, b, tiles, since: 0, baseBuild: 24 * 3.6e6, doneAt: 24 * 3.6e6 } as unknown as Link;
  it("exakt 20 % auf die Basiswahrscheinlichkeit, erst ab fertigem Schritt 2, Gesellen unverändert", () => {
    expect(UNIVERSITY_MESSENGER).toBe(1.2); expect(MESSENGER_DAY * UNIVERSITY_MESSENGER).toBeCloseTo(0.72, 12);
    const d2 = Math.ceil(doneAt(a, 1) / DAY), d1 = Math.floor(doneAt(a, 1) / DAY) - 1;
    expect(uniChancery(l!, d1)).toBe(false); expect(uniChancery(l!, d2)).toBe(true);
    const lb = { ...l, a: town([], "uni", 400, 540) } as Link;
    let more = 0, journ = 0;
    for (let d = d2; d < d2 + 400; d++) {
      const w = walkersOn(l!, d), w0 = walkersOn(lb, d);
      const m = w.some((x) => x.kind === "messenger"), m0 = w0.some((x) => x.kind === "messenger");
      if (m0) expect(m).toBe(true);
      if (m && !m0) more++;
      expect(w.some((x) => x.kind === "journeyman")).toBe(w0.some((x) => x.kind === "journeyman"));
      if (w.some((x) => x.kind === "journeyman")) journ++;
    }
    expect(more).toBeGreaterThan(0);
    expect(HERBERGE_WALZ).toBe(0.5); void hash; void journ;
  });
});
