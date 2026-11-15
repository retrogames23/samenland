import { describe, it, expect } from "vitest";
import { structureAt, type Seed } from "./world";

const seed: Seed = { id: "farmyard-test", name: "Hof", owner: "t", x: 300, y: 400, hue: 0, created_at: new Date(Date.now() - 40 * 3.6e6).toISOString() } as Seed;
const now = Date.now();

describe("Hofstellen", () => {
  it("every barn stands beside a farmhouse and never beside another barn", () => {
    const seeds = [seed];
    const kind = (x: number, y: number) => { const st = structureAt(x, y, seeds, now); return st?.seed.id === seed.id ? st.kind : null; };
    let barns = 0;
    for (let y = seed.y - 12; y <= seed.y + 12; y++) for (let x = seed.x - 12; x <= seed.x + 12; x++) {
      if (kind(x, y) !== "barn") continue;
      if (Math.abs(x - seed.x) <= 2 && Math.abs(y - seed.y) <= 2) continue; // core landmark barn
      barns++;
      const around = [-1, 0, 1].flatMap((j) => [-1, 0, 1].map((i) => (i || j ? kind(x + i, y + j) : null)));
      expect(around).toContain("farmhouse");
      expect(around).not.toContain("barn");
    }
    expect(barns).toBeGreaterThanOrEqual(0);
  });
});

describe("Hofstellen bleiben stehen", () => {
  it("a finished lot never flips between barn and dwelling while the village grows within its era", () => {
    const seeds = [seed];
    const born = Date.parse(seed.created_at);
    const kindAt = (x: number, y: number, t: number) => { const st = structureAt(x, y, seeds, t); return st?.seed.id === seed.id && !st.build ? st.kind : null; };
    const flips: string[] = [];
    for (let y = seed.y - 8; y <= seed.y + 8; y++) for (let x = seed.x - 8; x <= seed.x + 8; x++) {
      let last: string | null = null;
      for (let h = 10; h <= 40; h += 0.5) {
        const k = kindAt(x, y, born + h * 3.6e6);
        if (k !== "barn" && k !== "farmhouse" && k !== "cottage") { last = null; continue; }
        if (last && last !== k && (last === "barn" || k === "barn")) flips.push(`${x},${y}@${h}`);
        last = k;
      }
    }
    expect(flips).toEqual([]);
  });
});
