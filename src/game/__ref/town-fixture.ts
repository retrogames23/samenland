/* Test- and benchmark-only fixture (never imported by the game): a grown town of 730 days as database rows. */
import { economyWorldAt, type EconomyWorld } from "../economy-world";
import { residentTax } from "../resident-tax";
import { townOf } from "../people";
import { larderOf, boonsOf } from "../goods";
import { effAge, clearStructureCaches, type Seed } from "../world";
import { setRealm } from "../time";
import rows from "./town-fixture.json";

/**
 * Source: economy simulation (stage 2) — a regular player, grain site with two road partners, 730 days. The rows are
 * the database state after replaying the run through the real migrations; production's validator recomputed all 730
 * tax receipts exactly. Used to measure and pin the full town build (townOf → buildTown) of a large, monument-rich town.
 */
export const OWN = "00000000-econ-vernetzt";
const input: EconomyWorld = {
  ...(rows as unknown as EconomyWorld),
  votes: [],
  works: [],
  gifts: [],
};
export const C0 = Date.parse(input.seeds.find((s) => s.id === OWN)!.created_at);
/** Login moment of a simulation day: 18:00:30 UTC of day `d` (day 1 = founding day). */
export const loginAt = (d: number) => C0 + (d - 1) * 864e5 + (18 * 60 + 0.5) * 6e4;
export function worldAt(at: number): { me: Seed; seeds: Seed[] } {
  setRealm("europe");
  const seeds = economyWorldAt(input, at);
  return { me: seeds.find((s) => s.id === OWN)!, seeds };
}

/** Stable short hash (FNV-1a, 2 × 32 bit) of a JSON value; Maps are serialised as entry lists. */
export function fingerprint(x: unknown): string {
  const s = JSON.stringify(x, (_k, v) => (v instanceof Map ? [...v] : v));
  let a = 0x811c9dc5,
    b = 0x01000193;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    a = Math.imul(a ^ c, 0x01000193) >>> 0;
    b = Math.imul(b ^ c, 0x5bd1e995) >>> 0;
  }
  return a.toString(16).padStart(8, "0") + b.toString(16).padStart(8, "0");
}

/** Everything the town build feeds into the economy and the picture, from cold caches, with timings. */
export function townSnapshot(d: number) {
  clearStructureCaches();
  const at = loginAt(d),
    { me, seeds } = worldAt(at);
  const t0 = performance.now();
  const tax = residentTax(me, seeds, at);
  const t1 = performance.now();
  const town = townOf(me, seeds, at);
  const t2 = performance.now();
  const larder = larderOf(me, seeds, at);
  const t3 = performance.now();
  const people = town.people.map((p) => [p.home, p.job, p.work, p.estate, p.sick]);
  return {
    values: {
      day: d,
      people: town.people.length,
      tax: [tax.income, tax.population, tax.households],
      effAge: effAge(me, seeds, at),
      surplus: boonsOf(larder).surplus,
      fpPeople: fingerprint(people),
      fpLarder: fingerprint(larder.flows),
    },
    ms: {
      residentTax: Math.round(t1 - t0),
      townOf: Math.round(t2 - t1),
      larderRest: Math.round(t3 - t2),
    },
  };
}
