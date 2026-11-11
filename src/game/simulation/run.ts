/** CLI: bun src/game/simulation/run.ts <profile|all> <charter|all> <location|all> [days] — writes JSON to /tmp/sim-out. */
import { mkdirSync, writeFileSync } from "node:fs";
import { simulate } from "./engine";
import { PROFILES, LOCATIONS } from "./profiles";
import type { CharterPath } from "../world";
const [p = "all", c = "all", l = "all", d = "730"] = process.argv.slice(2);
const ps = p === "all" ? Object.keys(PROFILES) : [p], cs = c === "all" ? ["farm", "craft", "trade", "culture"] : [c], ls = l === "all" ? Object.keys(LOCATIONS) : [l];
const out = process.env.SIM_OUT ?? "/tmp/sim-out";
mkdirSync(out, { recursive: true });
for (const pk of ps) for (const ck of cs) for (const lk of ls) {
  const t = Date.now();
  const r = simulate({ profile: PROFILES[pk as keyof typeof PROFILES], charter: ck as CharterPath, location: lk as keyof typeof LOCATIONS, days: +d });
  writeFileSync(`${out}/${pk}-${ck}-${lk}.json`, JSON.stringify(r));
  console.log(pk, ck, lk, `hanse=${r.hansestadtDay}`, `sat=${r.saturationDay}`, `lost=${r.lostShare}`, `${((Date.now() - t) / 1000).toFixed(0)}s`);
}
