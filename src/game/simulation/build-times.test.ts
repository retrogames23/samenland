import { describe, it, expect } from "vitest";
import { buildTimes, simulate } from "./engine";
import { PROFILES, LOCATIONS } from "./profiles";
import { setRealm, workClock } from "../time";
import { residentTax } from "../resident-tax";
import { specialDone, monumentChain, stepsDone, type Seed, type CharterPath } from "../world";
import { prosperityAt } from "../prosperity";
import { VORHABEN } from "../vorhaben";

// Bauzeiten in der Offline-Simulation: the engine never re-implements build times; these tests pin that the
// simulated town goes through the production rules (specialDone, bauhuetteDone, monumentChain) and that the
// report (SimResult.builds) shows exactly those times.
const H = 3.6e6, DAY = 864e5;
const C0 = Date.parse("2026-11-12T00:00:00Z");
/** 08:00 realm time (Europe/Berlin, winter) on day d, so the day shift is running. */
const morning = (d: number) => C0 + d * DAY + 7 * H;
const [X, Y] = LOCATIONS["grain"]!.at;
function town(path: CharterPath | null, bought: [string, number][]): Seed[] {
  const s = { id: "00000000-sim-build-test", name: "Sim", owner: "sim", x: X, y: Y, hue: 0, realm: "europe", user_id: "sim",
    created_at: new Date(C0).toISOString(), ...(path ? { charter: { path, at: C0 } } : {}),
    bought: bought.map(([item, at]) => ({ item, at })), roads: [], civicRoads: [] } as unknown as Seed;
  return [s];
}
const hours = (seeds: Seed[], at: number) => (specialDone(seeds[0]!, seeds, at) - at) / H;
const work = (seeds: Seed[], at: number) => (workClock(specialDone(seeds[0]!, seeds, at)) - workClock(at)) / H;

describe("Bauzeiten in der Simulation (Produktionsfunktionen)", () => {
  setRealm("europe");
  const t = morning(3);

  it("ein Kaufbau steht erst nach seiner Bauzeit und nie sofort", () => {
    const seeds = town(null, [["backhaus", t]]);
    expect(hours(seeds, t)).toBeGreaterThan(0);
    // 6 Arbeitsstunden ohne jede Beschleunigung (SPECIAL_BUILD), gemessen auf der Arbeitsuhr
    expect(work(seeds, t)).toBeCloseTo(6, 5);
  });

  it("Beschleuniger wirken multiplikativ und nur auf die Arbeitszeit", () => {
    const plain = work(town(null, [["backhaus", t]]), t);
    const camp = work(town(null, [["woodcamp", t - DAY], ["backhaus", t]]), t);
    const inn = work(town(null, [["herberge", t - DAY], ["backhaus", t]]), t);
    const both = work(town(null, [["woodcamp", t - DAY], ["herberge", t - DAY], ["backhaus", t]]), t);
    const craft = work(town("craft", [["backhaus", t]]), t);
    expect(camp / plain).toBeCloseTo(0.75, 5);
    expect(inn / plain).toBeCloseTo(0.85, 5);
    expect(both / plain).toBeCloseTo(0.75 * 0.85, 5);
    expect(craft / plain).toBeCloseTo(0.5, 5);
  });

  it("Bauhütte beschleunigt nur die Restarbeit im Fenster, ohne Doppelanrechnung", () => {
    const base = work(town(null, [["backhaus", t]]), t);
    const helped = work(town(null, [["bauhuette1", t], ["backhaus", t]]), t);
    expect(helped).toBeCloseTo(base / 1.5, 5);
    // ein später gekauftes Fenster wirkt nur auf die verbleibende Arbeit
    const late = town(null, [["backhaus", t], ["bauhuette1", t + 2 * H]]);
    const lateWork = work(late, t);
    expect(lateWork).toBeLessThan(base);
    expect(lateWork).toBeGreaterThan(base / 1.5);
    // ein Fenster nach der Fertigstellung ändert nichts
    const after = town(null, [["backhaus", t], ["bauhuette1", t + 3 * DAY]]);
    expect(work(after, t)).toBeCloseTo(base, 5);
    // Fenster überlappen nie (Pause länger als Dauer), also kann keine Arbeit doppelt beschleunigt werden
    expect(VORHABEN.bauhuette.gap).toBeGreaterThan(VORHABEN.bauhuette.len);
  });

  it("Kombination: Charta, Lager, Herberge und Bauhütte", () => {
    const plain = work(town(null, [["backhaus", t]]), t);
    const all = work(town("craft", [["woodcamp", t - DAY], ["herberge", t - DAY], ["bauhuette1", t], ["backhaus", t]]), t);
    expect(all / plain).toBeCloseTo((0.5 * 0.75 * 0.85) / 1.5, 4);
  });

  it("Monumentstufen bauen nacheinander und wirken erst nach Fertigstellung", () => {
    const seeds = town(null, [["harvest1", t], ["harvest2", t], ["harvest3", t]]);
    const chain = monumentChain(seeds[0]!, "harvest");
    expect(chain).toHaveLength(3);
    expect(chain[1]!.start).toBe(chain[0]!.done);
    expect(chain[2]!.start).toBe(chain[1]!.done);
    expect(stepsDone(seeds[0]!, "harvest", t)).toBe(0);
    expect(stepsDone(seeds[0]!, "harvest", chain[0]!.done)).toBe(1);
    expect(stepsDone(seeds[0]!, "harvest", chain[2]!.done - 1)).toBe(2);
    expect(stepsDone(seeds[0]!, "harvest", chain[2]!.done)).toBe(3);
    // Wohlstand zählt das Monument erst, wenn die letzte Stufe steht
    expect(prosperityAt(seeds[0]!, chain[2]!.done - 1, 300)).toBeLessThan(prosperityAt(seeds[0]!, chain[2]!.done, 300));
  });

  it("der Bericht zeigt genau die Produktionszeiten", () => {
    const seeds = town("craft", [["woodcamp", t - DAY], ["backhaus", t], ["belfry1", t], ["belfry2", t + H], ["rank2", t], ["chest2", t]]);
    const b = buildTimes(seeds[0]!, seeds, C0);
    expect(b.map((x) => x.item)).toEqual(["woodcamp", "backhaus", "belfry1", "belfry2"]);
    const back = b.find((x) => x.item === "backhaus")!;
    expect(back.doneDay).toBeCloseTo((specialDone(seeds[0]!, seeds, t) - C0) / DAY, 3);
    const chain = monumentChain(seeds[0]!, "belfry");
    expect(b.find((x) => x.item === "belfry2")!.doneDay).toBeCloseTo((chain[1]!.done - C0) / DAY, 3);
  });

  it("Simulationslauf: jeder Kaufbau steht nach dem Kauf, Bauhütte ändert die Tagessteuer nicht", () => {
    const r = simulate({ profile: { ...PROFILES.optimierer, repeat: true, ausbau: true }, charter: "craft", location: "grain", days: 40 });
    expect(r.builds.length).toBeGreaterThan(5);
    for (const b of r.builds) { expect(b.doneDay).toBeGreaterThan(b.paidDay); expect(b.hours).toBeGreaterThan(0); }
    expect(r.bought.some((b) => b.item.startsWith("bauhuette"))).toBe(true);
    // Gegenprobe ohne Bauhütten-Zeilen: Bauzeiten liegen unter einem Tag, die tägliche Steuer bleibt gleich
    const mk = (keep: (i: string) => boolean): Seed[] => {
      const [s] = town("craft", r.bought.filter((b) => keep(b.item)).map((b) => [b.item, C0 + b.day * DAY] as [string, number]));
      return [{ ...s!, charter: { path: "craft", at: C0 + DAY } }];
    };
    const a = mk(() => true), n = mk((i) => !i.startsWith("bauhuette"));
    for (const d of [10, 20, 30, 40]) expect(residentTax(a[0]!, a, C0 + d * DAY).income).toBe(residentTax(n[0]!, n, C0 + d * DAY).income);
  });
});
