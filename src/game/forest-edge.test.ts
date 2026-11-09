import { describe, it, expect } from "vitest";
import { forestExtra, coreDiamond, diamondDist, tileAt, fringeOk, type Pt } from "./forest-edge";
import type { Terrain } from "./world";

// natureAt places tree feet at (+6,-1) and (-5,+3) px from the tile centre
const FEET: Pt[] = [[6, -1], [-5, 3]];
const inPoly = (p: Pt, poly: Pt[]) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i]!, [xj, yj] = poly[j]!; if ((yi > p[1]) !== (yj > p[1]) && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) c = !c; } return c; };
const map = (rows: string[]) => (x: number, y: number): Terrain => {
  const ch = rows[y]?.[x]; return ch === "F" ? "forest" : ch === "~" ? "water" : ch === "s" ? "sand" : ch === "m" ? "mountain" : "grass";
};

describe("forest core (Pilot 3 prototype)", () => {
  for (const core of [0.75, 0.85, 0.9]) it(`tree feet lie inside the core at ${core}`, () => {
    const d = coreDiamond(0, 0, core);
    for (const f of FEET) { expect(diamondDist(f[0], f[1])).toBeLessThan(core); expect(inPoly(f, d)).toBe(true); }
  });
  it("a single forest tile and a one-tile strip keep forest ground", () => {
    const one = forestExtra(0, 4, 0, 4, map(["ggggg", "ggggg", "ggFgg", "ggggg", "ggggg"]), { core: 0.85, grain: 0 });
    expect(one.length).toBe(1);
    const strip = forestExtra(0, 6, 0, 2, map(["ggggggg", "FFFFFFF", "ggggggg"]), { core: 0.85, grain: 0 });
    expect(strip.length).toBe(7);
  });
});

describe("forest fringe", () => {
  const rows = ["gggggg~~", "gFFFFg~~", "gFFFFgss", "gFFFFggg", "gggggmmm", "gggggggg"];
  const ter = map(rows);
  it("is deterministic across chunk ranges", () => {
    const k = (p: Pt[]) => p.map((q) => q.join(",")).join(";");
    const a = new Set(forestExtra(0, 7, 0, 5, ter, { core: 0.85, grain: 4 }).map(k));
    const b = forestExtra(2, 7, 0, 5, ter, { core: 0.85, grain: 4 }).map(k);
    for (const x of b) expect(a.has(x)).toBe(true);
  });
  it("never touches water, sand or rock", () => {
    for (const grain of [2.5, 4, 6]) for (const poly of forestExtra(0, 7, 0, 5, ter, { core: 0.85, grain })) for (const [px, py] of poly) {
      const [tx, ty] = tileAt(px, py), t = ter(Math.round(tx), Math.round(ty));
      expect(t === "forest" || fringeOk(t)).toBe(true);
    }
  });
  it("adds nothing where there is no forest (other layers untouched)", () => {
    expect(forestExtra(0, 7, 0, 5, map(["gg~~ss", "mmgg"]), { core: 0.85, grain: 4 })).toEqual([]);
  });
});
