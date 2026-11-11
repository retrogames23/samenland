/**
 * Validation CLI: bun src/game/simulation/validate.ts <dumpDir>
 * Recomputes every stored tax receipt with the production path (economyWorldAt + residentTax, same as
 * treasury.server.ts) from a JSON dump of the live tables and reports the deviations. Read-only, offline.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { economyWorldAt, type EconomyWorld } from "../economy-world";
import { residentTax } from "../resident-tax";
import { setRealm, type Realm } from "../time";
import type { Seed } from "../world";

const DAY = 86400000;
export type Receipt = { seed_id: string; day: number; population: number; households: number; income: number; realm: string };
export type Check = Receipt & { simPop: number; simHouseholds: number; simIncome: number; diff: number };

export function validateReceipts(input: EconomyWorld, receipts: Receipt[]): Check[] {
  const out: Check[] = [];
  for (const r of receipts) {
    const realm = r.realm as Realm;
    setRealm(realm);
    const world = { ...input, seeds: input.seeds.filter((s) => s.realm === realm) };
    const s0 = world.seeds.find((s) => s.id === r.seed_id);
    if (!s0) continue;
    const at = Date.parse(s0.created_at) + r.day * DAY, seeds = economyWorldAt(world, at), seed = seeds.find((s) => s.id === r.seed_id)!;
    const t = residentTax(seed, seeds, at);
    out.push({ ...r, simPop: t.population, simHouseholds: t.households, simIncome: t.income, diff: t.income - r.income });
  }
  return out;
}

if (import.meta.main) {
  const dir = process.argv[2] ?? "/tmp/val";
  const j = (n: string) => JSON.parse(readFileSync(`${dir}/${n}.json`, "utf8"));
  const input: EconomyWorld = { seeds: j("seeds") as Seed[], purchases: j("purchases"), blessings: j("blessings"), charters: j("charters"), encounters: j("encounters"), roads: j("roads"), votes: j("votes"), works: j("works"), gifts: j("gifts") };
  const res = validateReceipts(input, j("receipts"));
  writeFileSync(`${dir}/validation.json`, JSON.stringify(res));
  const exact = res.filter((r) => r.diff === 0).length;
  console.log(`receipts=${res.length} exact=${exact} mean|diff|=${(res.reduce((a, r) => a + Math.abs(r.diff), 0) / res.length).toFixed(2)}`);
  for (const r of res.filter((r) => r.diff !== 0).slice(0, 40)) console.log(r.seed_id.slice(0, 8), r.realm, "d" + r.day, "stored", r.income, r.population, r.households, "sim", r.simIncome, r.simPop, r.simHouseholds);
}
