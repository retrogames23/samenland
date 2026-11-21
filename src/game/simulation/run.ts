/**
 * CLI: bun src/game/simulation/run.ts <profile|all> <charter|all> <location|base|probes|all> [days]
 * Writes one JSON per scenario to $SIM_OUT (default /tmp/sim-out). Deterministic: same input, same file.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { simulate } from "./engine";
import { PROFILES, LOCATIONS, BASE_LOCATIONS, PROBE_LOCATIONS } from "./profiles";
import type { CharterPath } from "../world";
import { bauhuetteGrowth } from "../vorhaben";
// Calibration only: BH_RATE overrides the Bauhütte growth rate for this run.
if (process.env["BH_RATE"] !== undefined) bauhuetteGrowth.rate = +process.env["BH_RATE"];
const [p = "all", c = "all", l = "base", d = "730"] = process.argv.slice(2);
const ps = p === "all" ? Object.keys(PROFILES) : p.split(","), cs = c === "all" ? ["farm", "craft", "trade", "culture"] : c.split(",");
const ls = l === "base" ? BASE_LOCATIONS : l === "probes" ? PROBE_LOCATIONS : l === "all" ? Object.keys(LOCATIONS) : l.split(",");
const out = process.env["SIM_OUT"] ?? "/tmp/sim-out";
mkdirSync(out, { recursive: true });
for (const pk of ps) for (const ck of cs) for (const lk of ls) {
  const t = Date.now();
  const r = simulate({ profile: { ...PROFILES[pk as keyof typeof PROFILES], repeat: process.env["REPEAT"] === "1", ausbau: process.env["AUSBAU"] === "1" }, charter: ck as CharterPath, location: lk, days: +d, rankEvery: +(process.env["RANK_EVERY"] ?? 10) });
  writeFileSync(`${out}/${pk}-${ck}-${lk}.json`, JSON.stringify(r));
  console.log(pk, ck, lk, r.way, `hanse=${r.hansestadtDay}`, `sat=${r.saturationDay}`, `lost=${r.lostShare}`, `${((Date.now() - t) / 1000).toFixed(0)}s`);
}
