import { describe, it, expect } from "vitest";
import { cathedralDone, careHealthExtra, careStage, monumentChain, specialTile, stepsPaid, CATHEDRAL_WINTER, type Seed } from "./world";
import { sickChance, SICK_BASE, SICK_WINTER } from "./sickness";
import { seasonAt } from "./season";
import { falls, townOf, type Person } from "./people";

const T = Date.parse("2026-03-02T06:00:00Z"), DAY = 864e5;
const W = Date.parse("2027-01-15T12:00:00Z"), S = Date.parse("2026-07-21T12:00:00Z");
const town = (items: [string, number][], id = "dom"): Seed => ({ id, name: "D", owner: "o", hue: 1, x: 400, y: 540, user_id: "u",
  created_at: "2025-01-01T00:00:00Z", bought: items.map(([item, at], i) => ({ item, at, ...(item === "cathedral1" ? { x: 404, y: 543 } : {}), ...(i < 0 ? {} : {}) })) } as Seed);
const dom = (n: number, at = T, extra: [string, number][] = []) => town([...extra, ...Array.from({ length: n }, (_, i) => [`cathedral${i + 1}`, at + i] as [string, number])]);
const doneAt = (s: Seed, i: number) => monumentChain(s, "cathedral")[i]!.done;
const early = (items: string[]) => items.map((i) => [i, T - 400 * DAY] as [string, number]);

describe("Dom: nur fertig gebaute Abschnitte wirken", () => {
  it("cathedralDone folgt der Fertigstellung, nicht der Zahlung", () => {
    const s = dom(5);
    expect(stepsPaid(s, "cathedral", T + 10)).toBe(5);
    expect(cathedralDone(s, T + 10)).toBe(0);
    for (let i = 0; i < 5; i++) { expect(cathedralDone(s, doneAt(s, i) - 1)).toBe(i); expect(cathedralDone(s, doneAt(s, i))).toBe(i + 1); }
    expect(cathedralDone(town([]), T)).toBe(0);
  });
  it("Schritt 3: exakt +1 Gemeinwesen im Care-Gate, erst fertig, ohne Rekursion", () => {
    const base: [string, number][] = [["fisher", T - DAY], ["hunter", T - DAY], ["granary", T - DAY], ["herbs", T - DAY]];
    const s = dom(3, T, base), d = doneAt(s, 2), own = new Set(["fisher", "hunter", "granary", "herbs"]);
    expect(careHealthExtra(s, d - 1, own)).toBe(0);
    expect(careHealthExtra(s, d, own)).toBe(1);
    expect(careStage(s, d)).toBe(careStage(s, d - 1) + 1);
    expect(careHealthExtra(dom(5, T, base), doneAt(dom(5, T, base), 4), own)).toBe(1);
  });
  it("Schritt 2: der fertige Chor wird Kirchplatz – über den eigenen Dombauplatz, nicht irgendein factory-Feld", () => {
    const s = dom(5, T - 300 * DAY), t = doneAt(s, 4) + DAY, tl = specialTile(s, "factory")!;
    expect(tl).not.toBeNull();
    const c = townOf(s, [s], t).church!;
    expect(Math.max(Math.abs(c[0] - tl[0]), Math.abs(c[1] - tl[1]))).toBeLessThanOrEqual(2);
    const one = dom(1, T - 300 * DAY), c1 = townOf(one, [one], t).church;
    expect(c1 == null || Math.max(Math.abs(c1[0] - tl[0]), Math.abs(c1[1] - tl[1])) > 1).toBe(true);
  });
});

describe("Dom Schritt 5: nur der winterliche Zuschlag sinkt um ein Drittel", () => {
  const all = ["herbs", "healer", "beginen"];
  const harvest = (s: Seed) => ({ ...s, bought: [...(s.bought ?? []), ...[1, 2, 3].map((i) => ({ item: `harvest${i}`, at: T - 400 * DAY + i }))] }) as Seed;
  const built = (extra: string[] = []) => dom(5, T - 300 * DAY, early(extra));
  const plain = (extra: string[] = []) => town(early(extra));
  const winterPart = (s: Seed, t: number, others: number) => sickChance(s, t) / others;
  it("ohne Dom unverändert die bisherige Formel", () => {
    expect(sickChance(plain(), W)).toBeCloseTo(SICK_BASE + SICK_WINTER * seasonAt(W).winter, 9);
  });
  it("Sommer: keine zusätzliche Domwirkung", () => {
    expect(sickChance(built(), S)).toBeCloseTo(sickChance(plain(), S), 9);
    expect(sickChance(built(all), S)).toBeCloseTo(sickChance(plain(all), S), 9);
  });
  it("mit Dom: Winterzuschlag × 2/3, Grundrisiko bleibt", () => {
    const w = seasonAt(W).winter;
    expect(sickChance(built(), W)).toBeCloseTo(SICK_BASE + SICK_WINTER * w * CATHEDRAL_WINTER, 9);
  });
  it("mit Erntedankhalle: Hälfte, mit Dom zusätzlich ein Drittel des Rests", () => {
    const w = seasonAt(W).winter;
    expect(sickChance(harvest(plain()), W)).toBeCloseTo(SICK_BASE + SICK_WINTER * w * 0.5, 9);
    expect(sickChance(harvest(built()), W)).toBeCloseTo(SICK_BASE + SICK_WINTER * w * 0.5 * CATHEDRAL_WINTER, 9);
  });
  it("Kräuter und Heiler bleiben voll erhalten, Dom wirkt darauf multiplikativ nur im Winteranteil", () => {
    const k = sickChance(plain(["herbs", "healer"]), S) / sickChance(plain(), S);
    expect(sickChance(built(["herbs", "healer"]), W)).toBeCloseTo(sickChance(built(), W) * k, 9);
    expect(sickChance(built(["herbs", "healer"]), W)).toBeLessThan(sickChance(plain(["herbs", "healer"]), W));
  });
  it("alle Schutzwirkungen kombiniert: jede bleibt wirksam", () => {
    const k = sickChance(plain(all), S) / sickChance(plain(), S), w = seasonAt(W).winter;
    expect(winterPart(harvest(built(all)), W, k)).toBeCloseTo(SICK_BASE + SICK_WINTER * w * 0.5 * CATHEDRAL_WINTER, 9);
    expect(sickChance(harvest(built(all)), W)).toBeLessThan(sickChance(harvest(plain(all)), W));
  });
  it("vor Fertigstellung von Schritt 5 keine Winterdämpfung", () => {
    const s = dom(5), d = doneAt(s, 4), w = seasonAt(d - 1).winter;
    expect(sickChance(s, d - 1)).toBeCloseTo(SICK_BASE + SICK_WINTER * w, 9);
  });
});

describe("Domspital (Schritt 4): zwei Dompriester pflegen nach den Beginen", () => {
  const D: [number, number] = [404, 543], HOF: [number, number] = [380, 520];
  let id = 0;
  const P = (o: Partial<Person>): Person => ({ id: ++id, first: "x", last: "y", sex: "m", age: 40, job: "farmer", home: [0, 0], work: null, workIndoor: false, speed: 1, ...o } as Person);
  const make = (homes: number, begs = 0) => {
    id = 0; const people: Person[] = [];
    for (let h = 0; h < homes; h++) { const home: [number, number] = [300 + h, 300]; people.push(P({ home, role: "head", hh: h }), P({ home, role: "spouse", sex: "f", hh: h })); }
    const priests = [P({ job: "priest", work: D }), P({ job: "priest", work: [D[0] + 1, D[1]] })];
    const parish = P({ job: "priest", work: [350, 350] });
    const beg = Array.from({ length: begs }, () => P({ job: "herbalist", sex: "f", work: HOF }));
    people.push(...priests, parish, ...beg);
    return { people, priests, parish, beg };
  };
  const s = { ...town([]), bought: [{ item: "beginen", at: 0 }] } as Seed;
  const run = (n: number, sick: number, domOn = true, begs = 0) => {
    const r = make(n, begs); falls(s, r.people, T, begs ? HOF : null, domOn ? D : null, (hh) => hh < sick);
    const carers = r.people.filter((p) => p.carer != null).length, nursed = r.people.filter((p) => p.nurse).map((p) => `${p.nurse}`);
    return { ...r, carers, nursed };
  };
  it("zwei Kranke: beide Priester pflegen, kein Angehöriger bleibt daheim", () => {
    const r = run(6, 2); expect(r.priests.every((p) => p.nurse)).toBe(true); expect(r.carers).toBe(0);
  });
  it("drei Kranke: zwei vom Dom, einer vom Angehörigen", () => { const r = run(6, 3); expect(r.nursed.length).toBe(2); expect(r.carers).toBe(1); });
  it("fünf Kranke: zwei vom Dom, drei Angehörige", () => { const r = run(6, 5); expect(r.nursed.length).toBe(2); expect(r.carers).toBe(3); });
  it("Beginenhof hat Vorrang, dann Dom", () => {
    const r = run(8, 5, true, 3);
    expect(r.beg.every((b) => b.nurse)).toBe(true); expect(r.priests.every((p) => p.nurse)).toBe(true); expect(r.carers).toBe(0);
    const r2 = run(8, 3, true, 3); expect(r2.priests.some((p) => p.nurse)).toBe(false);
  });
  it("keine doppelte Pflege: jeder kranke Haushalt genau einmal versorgt", () => {
    const r = run(8, 6, true, 3); expect(new Set(r.nursed).size).toBe(r.nursed.length);
    expect(r.people.filter((p) => p.sick).length).toBe(6);
  });
  it("nach Genesung sind die Priester wieder frei; Pfarrkirchen-Priester nie betroffen", () => {
    const r = run(6, 0); expect(r.priests.some((p) => p.nurse)).toBe(false);
    expect(run(6, 5).parish.nurse).toBeUndefined();
  });
  it("ohne fertigen Schritt 4 keine Dompflege; Krankheitszahl unverändert", () => {
    const a = run(6, 3, false), b = run(6, 3, true);
    expect(a.nursed.length).toBe(0); expect(a.carers).toBe(3);
    expect(a.people.filter((p) => p.sick).length).toBe(b.people.filter((p) => p.sick).length);
  });
});
