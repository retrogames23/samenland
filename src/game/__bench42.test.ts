import { it, vi } from "vitest";
import { readFileSync } from "fs";
const J = (n: string) => JSON.parse(readFileSync(`/tmp/b42/${n}.json`, "utf8"));
const input = { seeds: J("seeds"), purchases: J("purchases"), blessings: J("blessings"), charters: J("charters"), encounters: J("encounters"), roads: J("roads"), votes: J("votes"), works: J("works"), gifts: J("gifts") };
const DAY = 864e5, NOW = Date.UTC(2026, 10, 17);
const days = Array.from({ length: 7 }, (_, i) => NOW - (7 - i) * DAY);
const q = (a: number[]) => { const s = [...a].sort((x, y) => x - y); return { med: +s[Math.floor(s.length / 2)]!.toFixed(2), p95: +s[Math.min(s.length - 1, Math.floor(s.length * 0.95))]!.toFixed(2) }; };
async function load(old: boolean) {
  vi.resetModules(); vi.doUnmock("./world");
  if (old) vi.doMock("./world", () => import("./__world_old"));
  const w = await import("./world"), ew = await import("./economy-world"), rt = await import("./resident-tax"), t = await import("./time");
  t.setRealm("europe" as never);
  return { w, ew, rt };
}
it("bench 4.2", async () => {
  const out: Record<string, unknown> = {};
  const res: Record<string, Record<string, unknown>> = { old: {}, neu: {} };
  for (const mode of ["old", "neu"] as const) {
    const r: Record<string, unknown> = {};
    // twinSince-only scenarios
    let { w, ew } = await load(mode === "old");
    const T = (seeds: any[]) => { const ls = w.links(seeds); const t0 = performance.now(); const v = ls.map((l: any) => w.twinSince(l, seeds)); return { ms: performance.now() - t0, v, n: ls.length }; };
    const s0 = ew.economyWorldAt(input as never, NOW);
    const c1 = T(s0); r.links = c1.n; r.cold = +c1.ms.toFixed(1);
    r.sameArray = +T(s0).ms.toFixed(2);
    r.newArraySameContent = +T(ew.economyWorldAt(input as never, NOW)).ms.toFixed(2);
    const hist = days.map((d) => T(ew.economyWorldAt(input as never, d)).ms); r.sevenStates = { total: +hist.reduce((a, b) => a + b).toFixed(1), ...q(hist) };
    const hist2 = days.map((d) => T(ew.economyWorldAt(input as never, d)).ms); r.sevenStatesRepeat = { total: +hist2.reduce((a, b) => a + b).toFixed(1), ...q(hist2) };
    res[mode]!.since = days.map((d) => T(ew.economyWorldAt(input as never, d)).v);
    if (mode === "neu") r.stats = { calls: (w as any).sinceStats.calls, hits: (w as any).sinceStats.hits, misses: (w as any).sinceStats.misses, size: (w as any).sinceStats.size() };
    // real 7-day treasury batch for the 3 largest player towns, fresh modules
    const batches: number[] = [], taxes: unknown[] = [];
    let mod = await load(mode === "old");
    const big = mod.ew.economyWorldAt(input as never, NOW).filter((s: any) => s.user_id).sort((a: any, b: any) => Date.parse(a.created_at) - Date.parse(b.created_at)).slice(0, 3).map((s: any) => s.id);
    for (const id of big) {
      const t0 = performance.now(); const rts: number[] = [];
      for (const d of days) { const seeds = mod.ew.economyWorldAt(input as never, d); const s = seeds.find((x: any) => x.id === id); const a = performance.now(); taxes.push(JSON.stringify(mod.rt.residentTax(s, seeds, d))); rts.push(performance.now() - a); }
      batches.push(performance.now() - t0); (r as any)["rt_" + id.slice(0, 6)] = q(rts);
    }
    r.batch7 = batches.map((b) => +b.toFixed(0)); res[mode]!.tax = taxes;
    const tw = performance.now(); const sx = mod.ew.economyWorldAt(input as never, NOW - 9 * DAY); mod.w.twinSites(sx, NOW - 9 * DAY); r.twinSitesNewState = +(performance.now() - tw).toFixed(1);
    out[mode] = r;
  }
  out.sinceEqual = JSON.stringify(res.old!.since) === JSON.stringify(res.neu!.since);
  out.taxEqual = JSON.stringify(res.old!.tax) === JSON.stringify(res.neu!.tax);
  out.dayChanges = (res.neu!.since as any[]).slice(1).map((v: any[], i) => v.filter((x, j) => x !== (res.neu!.since as any[])[i][j]).length);
  console.log("RESULT " + JSON.stringify(out));
}, 590000);
