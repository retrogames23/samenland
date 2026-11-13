import { describe, expect, it } from "vitest";
import { prosperityAt } from "./prosperity";
import { attributes } from "./economy";
import { buildMailDoneAt } from "./build-mail";
import { monumentProgress, monumentDone, monumentChain, specialDone, specialBuild, sawmillUp, structureAt, specialSites, SAWMILL_AGE, type Seed } from "./world";

const H = 3.6e6, T = Date.parse("2026-11-02T06:00:00Z");
const town = (buys: number[], created: string) => ({ id: "f", name: "F", owner: "o", x: 300, y: 300, hue: 0, created_at: created,
  bought: buys.map((at, i) => ({ item: `belfry${i + 1}`, at, ...(i ? {} : { x: 303, y: 302 }) })) }) as Seed;
const young = (b: number[]) => town(b, new Date(T - 2 * H).toISOString());
const old = (b: number[]) => town(b, "2024-01-01T00:00:00Z");
const buys = (s: Seed) => (s.bought ?? []).map((b, i) => ({ id: `${i}`, seed_id: s.id, item: b.item, cost: 0, created_at: new Date(b.at).toISOString() }));

function agree(s: Seed) {
  const done = monumentDone(s, [s], "belfry")!;
  expect(buildMailDoneAt(s, "belfry4", s.bought![3]!.at, new Set())).toBe(done);
  expect(monumentProgress(s, done - 60000)).toBeLessThan(1);
  expect(monumentProgress(s, done)).toBe(1);
  // Wohlstand switches exactly at the finish
  expect(prosperityAt(s, done, 500)).toBeGreaterThan(prosperityAt(s, done - 60000, 500));
  const tile = [...specialSites(s).keys()][0]!, x = tile % 1000, y = Math.floor(tile / 1000);
  void x; void y;
  expect(attributes(s, [s], buys(s), done).health).toBeGreaterThanOrEqual(attributes(s, [s], buys(s), done - 60000).health);
  return done;
}

describe("monument finish: one chain for display, effects, Wohlstand and letter", () => {
  it("all steps bought at once: built one after another", () => {
    const s = old([T, T + 1, T + 2, T + 3]), c = monumentChain(s, "belfry");
    for (let i = 1; i < 4; i++) expect(c[i]!.start).toBe(c[i - 1]!.done);
    expect(monumentProgress(s, T + 10)).toBeLessThan(0.01);
    agree(s);
  });
  it("step by step: a step stands at its own specialDone", () => {
    const s = old([T]); const d1 = specialDone(s, [s], T);
    expect(monumentProgress(s, d1)).toBe(0.25);
    expect(monumentDone(s, [s], "belfry")).toBeNull();
  });
  it("sawmill active: faster, and every consumer agrees", () => {
    const s = old([T, T + 1, T + 2, T + 3]);
    expect(sawmillUp(s, [s], T)).toBe(true);
    const done = agree(s);
    let slow = T; for (let i = 0; i < 4; i++) slow = specialDone({ ...s, created_at: new Date(T).toISOString() }, [], slow);
    expect(done).toBeLessThanOrEqual(slow);
  });
  it("sawmill not yet active: slow time, still all agree", () => {
    const s = young([T, T + 1, T + 2, T + 3]);
    expect(SAWMILL_AGE).toBeGreaterThan(24);
    expect(sawmillUp(s, [s], T + 24 * H)).toBe(false);
    agree(s);
  });
  it("finished monuments of existing towns stay finished", () => {
    const s = old([T - 40 * 24 * H, T - 39 * 24 * H, T - 38 * 24 * H, T - 37 * 24 * H]);
    expect(monumentProgress(s, T)).toBe(1);
    expect(structureAt(303, 302, [s], T)?.build).toBeUndefined();
    expect(specialBuild(s)).toBeGreaterThan(0);
  });
});
