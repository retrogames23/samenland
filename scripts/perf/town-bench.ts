/**
 * Town-build benchmark (diagnosis only): cold townOf / larderOf / residentTax of a grown 730-day town
 * (src/game/__ref/town-fixture.json) at chosen days, with an exact fingerprint of every result.
 * usage: npx tsx scripts/perf/town-bench.ts [days…]   (default 100 300 650; or bun scripts/perf/town-bench.ts …)
 * Compare engines and branches by the printed values; timings depend on the machine.
 */
import { townSnapshot } from "../../src/game/__ref/town-fixture";
import { ageMemoStats } from "../../src/game/world";

const days = process.argv.slice(2).map(Number).filter(Number.isFinite);
for (const d of days.length ? days : [100, 300, 650]) {
  const m0 = ageMemoStats.misses;
  const r = townSnapshot(d);
  console.log(JSON.stringify({ ...r.values, ms: r.ms, effAgeMisses: ageMemoStats.misses - m0 }));
}
