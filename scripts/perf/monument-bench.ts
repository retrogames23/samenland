/**
 * Offline benchmark for residentTax with monuments (never imported by the game).
 * bun scripts/perf/monument-bench.ts <sim-result.json> <day> [days]
 * Rebuilds the simulated town of a run.ts result (same seed fields, roads on day 14/45, purchases up to each day) and
 * times one residentTax call per day for <days> consecutive days from <day>, after one warm-up call on <day> - 1
 * (like the daily step of the simulation: every call asks a new time, so only time-independent caches are warm). Counters (formatToParts, monumentChain, specialDone, workClock, guildtowerDone) are
 * read from globalThis.__C when the source tree was instrumented by monument-bench-instrument.sh.
 */
import { readFileSync } from "node:fs";
import { residentTax } from "../../src/game/resident-tax";
import { setRealm } from "../../src/game/time";
import { LOCATIONS } from "../../src/game/simulation/profiles";
import type { Seed } from "../../src/game/world";

const [file, dayArg, repArg = "3"] = process.argv.slice(2);
const r = JSON.parse(readFileSync(file!, "utf8"));
const day = +dayArg!, reps = +repArg, DAY = 864e5;
setRealm("europe");
const c0 = Date.parse("2026-11-12T00:00:00Z");
const [x, y] = LOCATIONS[r.location]!.at;
const pk = typeof r.profile === "string" ? r.profile : r.profile.key;
const seed: Seed = { id: `00000000-sim-${pk}-${r.charter}-${r.location}`, name: "Sim", owner: "sim", x, y, hue: 0, realm: "europe", user_id: "sim",
  created_at: new Date(c0).toISOString(), charter: { path: r.charter, at: c0 + DAY }, bought: [], roads: [], civicRoads: [] };
const nb = (id: string, dx: number): Seed => ({ id, name: id, owner: "nb", x: x + dx, y, hue: 0, realm: "europe", created_at: new Date(c0 - 60 * DAY).toISOString() });
const seeds = [seed, nb("nb1", 15), nb("nb2", -15)];
const upTo = (d: number) => {
  seed.roads = []; seed.civicRoads = [];
  if (d >= 14) { seed.roads.push({ target: "nb1", at: c0 + 14 * DAY }); seed.civicRoads.push({ at: c0 + 14 * DAY }); }
  if (d >= 45) { seed.roads.push({ target: "nb2", at: c0 + 45 * DAY }); seed.civicRoads.push({ at: c0 + 45 * DAY }); }
  seed.bought = (r.bought as { item: string; day: number }[]).filter((b) => b.day <= d).map((b) => ({ item: b.item, at: c0 + b.day * DAY }));
};
const C = (globalThis as { __C?: Record<string, number> }).__C;
let fmtCalls = 0;
const orig = Intl.DateTimeFormat.prototype.formatToParts;
Intl.DateTimeFormat.prototype.formatToParts = function (this: Intl.DateTimeFormat, d?: Date | number) { fmtCalls++; return orig.call(this, d); };
upTo(day - 1); residentTax(seed, [...seeds], c0 + (day - 1) * DAY);
upTo(day);
const monuments = seed.bought!.filter((b) => /^(belfry|theater|cathedral|university|exchange|orangery|opera|harvest|guildtower|lighthouse)\d$/.test(b.item)).length;
const rows: unknown[] = [];
for (let i = 0; i < reps; i++) {
  const now = c0 + (day + i) * DAY; upTo(day + i);
  if (C) for (const k of Object.keys(C)) C[k] = 0;
  fmtCalls = 0;
  const cpu0 = process.cpuUsage(), t0 = performance.now();
  const t = residentTax(seed, [...seeds], now);
  const ms = performance.now() - t0, cpu = process.cpuUsage(cpu0);
  rows.push({ day: day + i, ms: +ms.toFixed(1), cpuMs: +((cpu.user + cpu.system) / 1000).toFixed(1), formatToParts: fmtCalls, ...(C ?? {}), income: t.income, population: t.population, households: t.households, assessed: t.assessed });
}
console.log(JSON.stringify({ file: file!.split("/").pop(), day, bought: seed.bought!.length, monumentRows: monuments, rows }));
