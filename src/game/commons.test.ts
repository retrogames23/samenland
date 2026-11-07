import { describe, it, expect } from "vitest";
import { commonsDue, commonsOptions, pendingAll, stegOf, mastOn, lifeSeason, lifeScenes, commonsVoices, COMMONS_DAYS, COMMONS_FROM_H, STEG_WORK_H } from "./commons";
import type { Person } from "./people";
import { EVENT_KEYS, choiceOf, pendingEncounter, type Decision } from "./encounters";
import { canPlant, MAP, type Seed } from "./world";
import { setRealm } from "./time";

setRealm("europe");
const H = 3.6e6, D = 864e5;
function land(): [number, number] {
  for (let y = MAP / 2; y < MAP; y += 5) for (let x = MAP / 2; x < MAP; x += 5) if (canPlant(x, y, []) === null) return [x, y];
  throw new Error("no land");
}
const [x, y] = land();
const c0 = Date.parse("2026-09-01T00:00:00Z");
const seed: Seed = { id: "commons-test", name: "T", owner: "o", x, y, hue: 0, created_at: new Date(c0).toISOString() };
const visit = (at: number): Decision => ({ event: "merchant", choice: "pass", at, cost: 0 });

describe("Allmende questions", () => {
  it("are never drawn as visitors", () => {
    for (const k of ["hutewald", "backtag", "steg"]) expect(EVENT_KEYS).not.toContain(k);
  });
  it("prices: oven 10, carpenter 40, everything else free", () => {
    expect(choiceOf("backtag", "bake")?.cost).toBe(10);
    expect(choiceOf("steg", "carpenter")?.cost).toBe(40);
    expect(choiceOf("steg", "together")?.cost).toBe(0);
    expect(choiceOf("hutewald", "mast")?.cost).toBe(0);
  });
  it("first come once the village is 72 h old", () => {
    expect(COMMONS_FROM_H).toBe(72);
    expect(commonsDue(seed, [visit(c0 + 70 * H)], 1000)).toBeNull();
  });
  it("come at most once every 7 days, never the same twice in a row", () => {
    expect(COMMONS_DAYS).toBe(7);
    const opts = commonsOptions(seed, [], 1000);
    if (!opts.length) return;
    const first = commonsDue(seed, [visit(c0 + 100 * H)], 1000)!;
    expect(first).not.toBeNull();
    const ans: Decision = { event: first, choice: Object.keys({})[0] ?? "x", at: c0 + 101 * H, cost: 0 };
    expect(commonsDue(seed, [ans, visit(c0 + 200 * H)], 1000)).toBeNull();
    const next = commonsDue(seed, [ans, visit(ans.at + 7 * D)], 1000);
    if (next) expect(next).not.toBe(first);
  });
  it("keep the visitor draw unchanged", () => {
    const decs = [visit(c0 + 100 * H), { event: "hutewald", choice: "mast", at: c0 + 120 * H, cost: 0 }, visit(c0 + 130 * H)];
    const plain = [visit(c0 + 100 * H), visit(c0 + 130 * H)];
    expect(pendingEncounter(seed, decs, c0 + 140 * H)).toBe(pendingEncounter(seed, plain, c0 + 140 * H));
  });
  it("the footbridge is asked only once and needs a working day together", () => {
    const at = Date.parse("2026-11-04T07:00:00Z"); // 08:00 Berlin
    const decs: Decision[] = [{ event: "steg", choice: "together", at, cost: 0 }];
    expect(commonsOptions(seed, decs, 1000)).not.toContain("steg");
    expect(STEG_WORK_H).toBe(24);
    expect(stegOf(decs)!.done).toBeGreaterThan(at + 12 * H); // 14 working hours, rest at night
  });
  it("pigs stay in the wood for 7 days", () => {
    const at = c0 + 200 * H, decs: Decision[] = [{ event: "hutewald", choice: "mast", at, cost: 0 }];
    expect(mastOn(decs, at + 6 * D)).toBe(true);
    expect(mastOn(decs, at + 7 * D + 1)).toBe(false);
  });
  it("a wedding still comes first", () => {
    expect(pendingAll(seed, [], c0 + 10 * H, 1000)).not.toBe("steg");
  });
});

describe("Village life around 1500", () => {
  it("prices mirror the database guard", () => {
    expect(choiceOf("zaun", "holz")?.cost).toBe(10);
    expect(choiceOf("flur", "hilfe")?.cost).toBe(8);
    expect(choiceOf("scharwerk", "dingen")?.cost).toBe(25);
    expect(choiceOf("pfingsten", "preis")?.cost).toBe(12);
    for (const [e, c] of [["zaun", "buss"], ["zaun", "pfand"], ["flur", "schau"], ["plaggen", "mass"], ["plaggen", "laub"], ["schelte", "widerruf"], ["schelte", "spende"], ["scharwerk", "aufgebot"], ["pfingsten", "reigen"], ["lichtstube", "reigen"], ["lichtstube", "andacht"]] as const) expect(choiceOf(e, c)?.cost).toBe(0);
  });
  it("are never drawn as visitors", () => {
    for (const k of ["zaun", "flur", "plaggen", "schelte", "scharwerk", "pfingsten", "lichtstube"]) expect(EVENT_KEYS).not.toContain(k);
  });
  it("keep their season: spinning room only in winter, stubble quarrel only at harvest", () => {
    expect(lifeSeason("lichtstube", Date.parse("2027-01-10T12:00:00Z"))).toBe(true);
    expect(lifeSeason("lichtstube", Date.parse("2027-06-10T12:00:00Z"))).toBe(false);
    expect(lifeSeason("flur", Date.parse("2027-08-10T12:00:00Z"))).toBe(true);
    expect(lifeSeason("flur", Date.parse("2027-03-10T12:00:00Z"))).toBe(false);
    expect(lifeSeason("schelte", Date.parse("2027-03-10T12:00:00Z"))).toBe(true);
  });
  it("show on the map: the retraction gathers the village before the church at 11 the next day", () => {
    const d: Decision = { event: "schelte", choice: "widerruf", at: Date.parse("2027-03-10T15:00:00Z"), cost: 0 };
    expect(lifeScenes([d], d.at + 3600e3)).toHaveLength(0);
    const hit = lifeScenes([d], Date.parse("2027-03-11T10:30:00Z"));
    expect(hit).toHaveLength(1);
    expect(hit[0]!.sc.place).toBe("church");
  });
  it("name real villagers: the quarrel is between two different households", () => {
    const mk = (id: number, home: [number, number]) => ({ id, first: "A" + id, last: "B", sex: "m", age: 40, job: "farmer", home, role: undefined, sick: false } as unknown as Person);
    const v = commonsVoices("zaun", [mk(1, [0, 0]), mk(2, [0, 0]), mk(3, [5, 5])], 0);
    expect(v.asker).not.toBeNull();
    expect(v.other).not.toBeNull();
    expect(v.other!.home).not.toEqual(v.asker!.home);
  });
});
