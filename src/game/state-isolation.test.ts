import { afterAll, describe, expect, it, vi } from "vitest";
import { specialSites, clearStructureCaches, type Seed } from "./world";
import { householdsOf } from "./households";
import { rankInput } from "./rank";
import { economyWorldAt, type EconomyWorld } from "./economy-world";
import { setRealm } from "./time";
import { simulate } from "./simulation/engine";
import { bauhuetteGrowth } from "./vorhaben";
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
// The simulation founds its village after the Bauhütte cutover (engine.ts); identical inputs therefore include that cutover.
const SINCE = bauhuetteGrowth.since, asSim = () => { bauhuetteGrowth.since = c0; };
afterAll(() => { bauhuetteGrowth.since = SINCE; });
const count = (seeds: Seed[], now: number) => { const h = householdsOf(seeds[0]!, seeds, now); return { homes: h.length, citizens: h.reduce((n, q) => n + q.size, 0) }; };

describe("dwellings never depend on earlier calls (state isolation)", () => {
  setRealm("europe");
  it("specialSites sees a purchase appended in place exactly like a fresh copy", () => {
    const s: Seed = { id: "00000000-iso", name: "I", owner: "i", x, y, hue: 0, realm: "europe", user_id: "u", created_at: new Date(c0).toISOString(), bought: [{ item: "hunter", at: c0 + DAY }] };
    expect(specialSites(s).size).toBe(1);
    s.bought!.push({ item: "school", at: c0 + 2 * DAY });
    const fresh = specialSites({ ...s, bought: [...s.bought!] });
    expect(fresh.size).toBe(2);
    expect(specialSites(s)).toEqual(fresh);
  });
  const days = 60, now = c0 + days * DAY;
  const r = simulate({ profile: { ...PROFILES.regelmaessig, repeat: true, ausbau: true }, charter: "farm", location: "workshop", days, rankEvery: 10 });
  it("the simulation reports the households a fresh computation gives for its own purchases", () => {
    asSim();
    const after = count(town(r.bought), now);
    clearStructureCaches();
    const cleared = count(town(r.bought), now);
    expect(cleared).toEqual(after);
    expect({ homes: r.households, citizens: r.population }).toEqual(cleared);
  });
  it("repeated calls and other moments or a simulation in between leave the result unchanged", () => {
    asSim();
    const first = count(town(r.bought), now);
    expect(count(town(r.bought), now)).toEqual(first);
    for (const d of [5, 30, 45, days - 1]) count(town(r.bought), c0 + d * DAY);
    simulate({ profile: { ...PROFILES.sparsam, repeat: true, ausbau: true }, charter: "farm", location: "workshop", days: 20, rankEvery: 10 });
    expect(count(town(r.bought), now)).toEqual(first);
    clearStructureCaches();
    expect(count(town(r.bought), now)).toEqual(first);
  });
  it("a simulation leaves the Bauhütte cutover as it found it", () => {
    const before = bauhuetteGrowth.since;
    simulate({ profile: { ...PROFILES.sparsam, repeat: true, ausbau: true }, charter: "farm", location: "workshop", days: 5, rankEvery: 10 });
    expect(bauhuetteGrowth.since).toBe(before);
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
    asSim();
    const warm = count(town(r.bought), now);
    vi.resetModules();
    const T = await import("./time"), H = await import("./households"), V = await import("./vorhaben");
    T.setRealm("europe"); V.bauhuetteGrowth.since = c0;
    const seeds = town(r.bought), h = H.householdsOf(seeds[0]!, seeds, now);
    expect({ homes: h.length, citizens: h.reduce((n, q) => n + q.size, 0) }).toEqual(warm);
  });
});
