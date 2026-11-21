import { describe, expect, it, vi } from "vitest";
import { specialSites, clearStructureCaches, seedsKey, soloSeeds, seedGuard, type Seed } from "./world";
import { householdsOf } from "./households";
import { rankInput } from "./rank";
import { economyWorldAt, type EconomyWorld } from "./economy-world";
import { setRealm } from "./time";
import { simulate } from "./simulation/engine";
import { PROFILES, LOCATIONS } from "./simulation/profiles";

// Same inputs and the same moment must give the same dwellings in every context: fresh process, repeated calls,
// after other calls or a whole simulation, and on the server path. A cache keyed by array identity once returned
// stale bought sites after the simulation pushed into seed.bought, so its towns had too many homes.
const DAY = 864e5, c0 = Date.parse("2026-11-12T00:00:00Z");
const [x, y] = LOCATIONS["workshop"]!.at;
const ID = "00000000-sim-regelmaessig-farm-workshop";
const town = (bought: { item: string; day: number }[], roads = true): Seed[] => {
  const s: Seed = { id: ID, name: "Sim", owner: "sim", x, y, hue: 0, realm: "europe", user_id: "sim", created_at: new Date(c0).toISOString(),
    charter: { path: "farm", at: c0 + DAY }, bought: bought.map((b) => ({ item: b.item, at: c0 + b.day * DAY })),
    roads: roads ? [{ target: "nb1", at: c0 + 14 * DAY }, { target: "nb2", at: c0 + 45 * DAY }] : [], civicRoads: roads ? [{ at: c0 + 14 * DAY }, { at: c0 + 45 * DAY }] : [] };
  const nb = (id: string, dx: number): Seed => ({ id, name: id, owner: "nb", x: x + dx, y, hue: 0, realm: "europe", created_at: new Date(c0 - 60 * DAY).toISOString() });
  return [s, nb("nb1", 15), nb("nb2", -15)];
};
/** Runs fn with the dev freeze off, so the cache itself (not the guard) must notice an in-place change. */
const unguarded = (fn: () => void) => { const on = seedGuard.on; seedGuard.on = false; try { fn(); } finally { seedGuard.on = on; } };
const count = (seeds: Seed[], now: number) => { const h = householdsOf(seeds[0]!, seeds, now); return { homes: h.length, citizens: h.reduce((n, q) => n + q.size, 0) }; };

describe("dwellings never depend on earlier calls (state isolation)", () => {
  setRealm("europe");
  it("specialSites sees a purchase appended in place exactly like a fresh copy", () => unguarded(() => {
    const s: Seed = { id: "00000000-iso", name: "I", owner: "i", x, y, hue: 0, realm: "europe", user_id: "u", created_at: new Date(c0).toISOString(), bought: [{ item: "hunter", at: c0 + DAY }] };
    expect(specialSites(s).size).toBe(1);
    s.bought!.push({ item: "school", at: c0 + 2 * DAY });
    const fresh = specialSites({ ...s, bought: [...s.bought!] });
    expect(fresh.size).toBe(2);
    expect(specialSites(s)).toEqual(fresh);
  }));
  const days = 60, now = c0 + days * DAY;
  const r = simulate({ profile: { ...PROFILES.regelmaessig, repeat: true, ausbau: true }, charter: "farm", location: "workshop", days, rankEvery: 10 });
  it("the simulation reports the households a fresh computation gives for its own purchases", () => {
    const after = count(town(r.bought), now);
    clearStructureCaches();
    const cleared = count(town(r.bought), now);
    expect(cleared).toEqual(after);
    expect({ homes: r.households, citizens: r.population }).toEqual(cleared);
  });
  it("repeated calls and other moments or a simulation in between leave the result unchanged", () => {
    const first = count(town(r.bought), now);
    expect(count(town(r.bought), now)).toEqual(first);
    for (const d of [5, 30, 45, days - 1]) count(town(r.bought), c0 + d * DAY);
    simulate({ profile: { ...PROFILES.sparsam, repeat: true, ausbau: true }, charter: "farm", location: "workshop", days: 20, rankEvery: 10 });
    expect(count(town(r.bought), now)).toEqual(first);
    clearStructureCaches();
    expect(count(town(r.bought), now)).toEqual(first);
  });
  it("the server path (economyWorldAt) counts the same dwellings and rank as directly built seeds", () => {
    const iso = (t: number) => new Date(t).toISOString();
    const [s, a, b] = town(r.bought, false);
    const input: EconomyWorld = { seeds: [s!, a!, b!].map(({ bought: _b, charter: _c, roads: _r, civicRoads: _cr, ...base }) => base as Seed),
      purchases: r.bought.map((p) => ({ seed_id: ID, item: p.item, created_at: iso(c0 + p.day * DAY) })),
      blessings: [], charters: [{ seed_id: ID, path: "farm", created_at: iso(c0 + DAY) }], encounters: [], roads: [], votes: [], works: [], gifts: [] };
    const direct = town(r.bought, false), server = economyWorldAt(input, now);
    expect(count(server, now)).toEqual(count(direct, now));
    expect(rankInput(server[0]!, server, now)).toEqual(rankInput(direct[0]!, direct, now));
  });
  it("fresh module state (as in a new process) gives the same result as this process after the simulation", async () => {
    const warm = count(town(r.bought), now);
    vi.resetModules();
    const T = await import("./time"), H = await import("./households");
    T.setRealm("europe");
    const seeds = town(r.bought), h = H.householdsOf(seeds[0]!, seeds, now);
    expect({ homes: h.length, citizens: h.reduce((n, q) => n + q.size, 0) }).toEqual(warm);
  });
});

// The four in-place gaps found in the PR 15 review. specialSites compares every bought and move row element by element;
// outside production builds every seed a cache has seen is frozen, so in-place writers fail loudly and copy-on-write works.
describe("seed inputs are immutable: in-place changes never answer from a stale cache", () => {
  setRealm("europe");
  const mk = (): Seed => ({ id: "00000000-gap", name: "G", owner: "g", x, y, hue: 0, realm: "europe", user_id: "u", created_at: new Date(c0).toISOString(),
    bought: [{ item: "hunter", at: c0 + DAY }, { item: "herbs", at: c0 + 2 * DAY }] });
  const kinds = (m: Map<number, { kind: string }>) => [...m.values()].map((v) => v.kind).sort();
  const copy = (s: Seed): Seed => ({ ...s, bought: s.bought!.map((b) => ({ ...b })), ...(s.moves ? { moves: s.moves.map((m) => ({ ...m })) } : {}) });
  it("the guard is active in tests and in the simulation", () => expect(seedGuard.on).toBe(true));
  it("gap 1: a middle row replaced in place (same length, same last row)", () => {
    unguarded(() => {
      const s = mk(); specialSites(s);
      s.bought![0] = { item: "school", at: c0 + DAY };
      expect(kinds(specialSites(s))).toEqual(kinds(specialSites(copy(s))));
      expect(kinds(specialSites(s))).toContain("school");
    });
    const s = mk(); specialSites(s);
    expect(() => { s.bought![0] = { item: "school", at: c0 + DAY }; }).toThrow(TypeError);
  });
  it("gap 2: a field of a bought row (player-chosen spot) changed in place", () => {
    unguarded(() => {
      const s = mk(); specialSites(s);
      s.bought![1]!.x = x + 4; s.bought![1]!.y = y - 3;
      expect([...specialSites(s).keys()]).toEqual([...specialSites(copy(s)).keys()]);
      expect(specialSites(s).has((y - 3) * 1024 + x + 4)).toBe(true);
    });
    const s = mk(); specialSites(s);
    expect(() => { s.bought![1]!.x = x + 4; }).toThrow(TypeError);
  });
  it("gap 3: a relocation pushed into moves in place", () => {
    const tile = (y + 3) * 1024 + x + 4;
    unguarded(() => {
      const s = { ...mk(), moves: [] as NonNullable<Seed["moves"]> }; specialSites(s);
      s.moves.push({ item: "hunter", x: x + 4, y: y + 3, at: c0 + 5 * DAY });
      expect(specialSites(s).has(tile)).toBe(true);
      expect(specialSites(s)).toEqual(specialSites(copy(s)));
    });
    const s = { ...mk(), moves: [] as NonNullable<Seed["moves"]> }; specialSites(s);
    expect(() => s.moves.push({ item: "hunter", x: x + 4, y: y + 3, at: c0 + 5 * DAY })).toThrow(TypeError);
  });
  it("gap 4: seedsKey, soloSeeds and pick memos on a reused array: in-place writes throw, copy-on-write gets new keys", () => {
    const s = mk(), arr = [s], k1 = seedsKey(arr), solo = soloSeeds(s), ks = seedsKey(solo);
    expect(() => { s.bought = [...s.bought!, { item: "school", at: c0 + 3 * DAY }]; }).toThrow(TypeError);
    expect(() => s.bought!.push({ item: "school", at: c0 + 3 * DAY })).toThrow(TypeError);
    expect(() => arr.push(mk())).toThrow(TypeError);
    expect(() => { arr[0] = mk(); }).toThrow(TypeError);
    expect(() => solo.push(mk())).toThrow(TypeError);
    expect(seedsKey(arr)).toBe(k1);
    const s2 = { ...s, bought: [...s.bought!, { item: "school", at: c0 + 3 * DAY }] };
    expect(seedsKey([s2])).not.toBe(k1);
    expect(seedsKey([s2])).toBe(seedsKey([copy(s2)]));
    expect(soloSeeds(s2)).not.toBe(solo);
    expect(seedsKey(soloSeeds(s2))).not.toBe(ks);
    expect(kinds(specialSites(s2))).toContain("school");
  });
});
