import { describe, it, expect } from "vitest";
import { waysideNear, WAY_KEYS, WAY_GRAPH, WAYSIDE, WAY_PAUSE_H } from "./wayside";
import { WAYSIDE_TEXT } from "./lang/wayside";
import { LANGS } from "./i18n";

const H = 3600e3, T0 = 1_800_000_000_000, any = () => true;
const scan = (now: number, mem = { last: 0, met: {} }) => { const r = []; for (let x = 20; x < 980; x += 9) for (let y = 20; y < 980; y += 37) { const w = waysideNear(x, y, now, mem, any); if (w) r.push(w); } return r; };

describe("wayside encounters", () => {
  it("has at least 20 distinct encounters", () => expect(WAY_KEYS.length).toBeGreaterThanOrEqual(20));
  it("stays hidden during the pause after a meeting", () => {
    expect(scan(T0, { last: T0 - (WAY_PAUSE_H - 1) * H, met: {} })).toHaveLength(0);
    expect(scan(T0, { last: T0 - (WAY_PAUSE_H + 1) * H, met: {} }).length).toBeGreaterThan(0);
  });
  it("is rare: only part of the map hosts one", () => {
    let hit = 0, n = 0; for (let x = 20; x < 980; x += 28) for (let y = 20; y < 980; y += 28) { n++; if (waysideNear(x, y, T0, { last: 0, met: {} }, any)) hit++; }
    expect(hit / n).toBeLessThan(0.9); expect(hit).toBeGreaterThan(0);
  });
  it("never repeats an encounter met within 14 days", () => {
    const met = Object.fromEntries(WAY_KEYS.filter((k) => k !== "pilger").map((k) => [k, T0 - 5 * 24 * H]));
    for (const w of scan(T0, { last: 0, met })) expect(w.key).toBe("pilger");
  });
  it("respects the land check", () => expect(waysideNear(500, 500, T0, { last: 0, met: {} }, () => false)).toBeNull());
  it("every node has text in all eight languages", () => {
    for (const l of LANGS) for (const k of WAY_KEYS) for (const node of Object.keys(WAY_GRAPH[WAYSIDE[k].tree])) {
      const n = (WAYSIDE_TEXT[l].enc[k].nodes as Record<string, { say: string; ask?: string }>)[node];
      expect(n?.say, `${l}.${k}.${node}`).toBeTruthy();
      if (node !== "start") expect(n?.ask, `${l}.${k}.${node}`).toBeTruthy();
    }
    for (const l of LANGS) expect(WAYSIDE_TEXT[l].ui.leave).toBeTruthy();
  });
});

import { vignetteOf } from "./wayside";
describe("wayside vignettes", () => {
  it("maps figures to fitting woodcuts", () => {
    expect(vignetteOf("hirschkalb")).toBe("beast");
    expect(vignetteOf("salzfuhre")).toBe("cart");
    expect(vignetteOf("brief")).toBe("rider");
    expect(vignetteOf("koehler")).toBe("craft");
    expect(vignetteOf("pilger")).toBe("walker");
  });
});
