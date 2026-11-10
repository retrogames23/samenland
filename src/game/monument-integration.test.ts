import { describe, expect, it } from "vitest";
import { attributes } from "./economy";
import { monumentProgress, monumentDone, specialBuild, specialDone, specialSites, type Seed } from "./world";
import { buildMailDue } from "./build-mail";
import { workClock, workDone } from "./time";

// Timestamps of the four purchases accepted by the real purchase_guard (migration 0104) in the isolated test database.
const BUYS = ["20:29:37.295", "20:29:37.300", "20:29:37.302", "20:29:37.304"].map((t) => Date.parse(`2026-11-10T${t}Z`));
const H = 3.6e6;
const town = (ats: number[], extra: { item: string; at: number }[] = []): Seed => ({ id: "itest", name: "Prüfstadt", owner: "o", x: 300, y: 300, hue: 0,
  created_at: "2026-04-24T00:00:00Z", bought: [...extra, ...ats.map((at, i) => ({ item: `belfry${i + 1}`, at, ...(i ? {} : { x: 303, y: 302 }) }))] });
const rows = (s: Seed) => s.bought!.map((b, i) => ({ id: `${i}`, seed_id: s.id, item: b.item, cost: 0, created_at: new Date(b.at).toISOString() }));
const wealth = (s: Seed, t: number) => attributes(s, [s], rows(s), t).wealth;
const placed = (s: Seed) => new Set([...specialSites(s).values()].map((v) => v.at));
/** Which rows the 15-minute cron would enqueue between from and to (timing only; once-only delivery is proven in src/lib/build-mail-outbox.pg.test.ts). */
function mails(s: Seed, from: number, to: number) {
  const sent = new Set<string>();
  for (let t = from; t <= to; t += 15 * 60000) for (const b of s.bought!) if (buildMailDue(s, b.item, b.at, placed(s), t, 3 * H)) sent.add(b.item);
  return [...sent];
}

describe("integration: four belfry steps bought at once", () => {
  const s = town(BUYS), B = specialBuild(s), done = monumentDone(s, [s], "belfry")!;
  it("starts at 0 % and paying does not fake progress", () => {
    expect(monumentProgress(s, BUYS[3]! + 1)).toBeLessThan(0.001);
  });
  it("steps are built one after another over the builders' work time", () => {
    for (let k = 1; k <= 4; k++) expect(monumentProgress(s, workDone(BUYS[0]!, k * B) + 1000)).toBeCloseTo(k / 4, 2);
    expect(done).toBe(specialDone(s, [s], specialDone(s, [s], specialDone(s, [s], specialDone(s, [s], BUYS[0]!)))));
    expect(monumentProgress(s, done - H)).toBeLessThan(1);
    expect(monumentProgress(s, done + 1000)).toBe(1);
  });
  it("existing speed boni (woodcamp, herberge) still shorten it", () => {
    const f = town(BUYS, [{ item: "woodcamp", at: 0 }, { item: "herberge", at: 0 }]);
    expect(specialBuild(f)).toBeCloseTo(B * 0.75 * 0.85, 0);
    expect(monumentDone(f, [f], "belfry")!).toBeLessThan(done);
  });
  it("bonus only once the whole tower stands", () => {
    expect(wealth(s, done - H)).toBe(wealth(s, BUYS[3]! + H));
    expect(wealth(s, done + H)).toBeGreaterThan(wealth(s, done - H));
    expect(wealth(s, done + 30 * 24 * H)).toBe(wealth(s, done + H));
  });
  it("finished letter: not after step 1, exactly once after step 4", () => {
    const step1 = specialDone(s, [s], BUYS[0]!);
    expect(mails(s, BUYS[0]!, step1 + 2 * H)).toEqual([]);
    expect(mails(s, BUYS[0]!, done + 24 * H)).toEqual(["belfry4"]);
  });
});

describe("integration: backwards compatibility", () => {
  const T = Date.parse("2026-11-02T06:00:00Z");
  it("A: old monument, first step half built", () => {
    const s = town([T]); const now = workDone(T, specialBuild(s) / 2);
    expect(monumentProgress(s, now)).toBeCloseTo(0.125, 2);
    expect(monumentDone(s, [s], "belfry")).toBeNull();
    expect(mails(s, T, now + 48 * H)).toEqual([]);
  });
  it("B: old steps (paid each after the previous stood, as the old button required) keep their progress", () => {
    const s0 = town([T]); const B = specialBuild(s0);
    const t2 = specialDone(s0, [s0], T) + 2 * H, t3 = specialDone(s0, [s0], t2) + 5 * H;
    const s = town([T, t2, t3]); const now = workDone(t3, B / 2);
    // legacy rule: every paid step counts from its own payment time
    const old = [T, t2, t3].reduce((a, at) => a + Math.min(1, Math.max(0, (workClock(now) - workClock(at)) / B)), 0) / 4;
    expect(old).toBeCloseTo(0.625, 2);
    expect(monumentProgress(s, now)).toBeCloseTo(old, 6);
    expect(mails(s, T, now)).toEqual([]);
  });
  it("C: finished monument keeps 100 % and its bonus, no new letter", () => {
    const s = town([T - 40 * 24 * H, T - 39 * 24 * H, T - 38 * 24 * H, T - 37 * 24 * H]);
    expect(monumentProgress(s, T)).toBe(1);
    expect(wealth(s, T)).toBeGreaterThan(wealth(town([]), T));
    expect(mails(s, T, T + 24 * H)).toEqual([]);
  });
});
