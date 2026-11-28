import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import {
  drawBurntSite,
  BURNT_BEAMS_UNTIL,
  BURNT_POSTS_UNTIL,
  BURNT_SMOKE_UNTIL,
  type BurntCtx,
} from "./burnt-site";
import { fires, floods, tileHits } from "./disasters";
import { structureAt, MAP, type Seed } from "./world";
import { setRealm } from "./time";

// Gebington (Gebbingen): a burnt hen coop looked like any new building site for a day and a half. A rebuild after a
// fire is now drawn with soot, ash and charred beams (burnt-site.ts), and only that kind of site.
const H = 3.6e6,
  DAY = 864e5,
  c0 = Date.parse("2026-01-01T00:00:00Z");
const record = (p: number, detail = true) => {
  const calls: { op: "fill" | "stroke"; style: string; width: number }[] = [];
  const c = {
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
    lineCap: "butt",
    beginPath() {},
    moveTo() {},
    lineTo() {},
    closePath() {},
    ellipse() {},
    fill() {
      calls.push({ op: "fill", style: String(this.fillStyle), width: 0 });
    },
    stroke() {
      calls.push({ op: "stroke", style: String(this.strokeStyle), width: this.lineWidth });
    },
  };
  drawBurntSite(c as unknown as BurntCtx, 0, 0, 11, 5.5, p, 4711, 600, detail);
  return calls;
};
const alpha = (s: string) => Number(s.slice(s.lastIndexOf(",") + 1, -1));

describe("the look of a rebuild after a fire", () => {
  beforeAll(() => setRealm("europe"));

  it("soot stays visible to the end and fades; beams, posts and smoke are cleared in turn", () => {
    const soot = (p: number) => alpha(record(p)[0]!.style);
    expect(soot(0)).toBeGreaterThan(0.5);
    expect(soot(0.7)).toBeGreaterThan(0.25); // the reported coop stood at 70 %: still clearly scorched
    expect(soot(1)).toBeGreaterThan(0.1);
    expect(soot(0.7)).toBeLessThan(soot(0.1));
    const beams = (p: number) =>
      record(p).filter((x) => x.op === "stroke" && x.width === 1.5).length;
    expect(beams(0.02)).toBe(4);
    expect(beams(BURNT_BEAMS_UNTIL - 0.01)).toBe(1);
    expect(beams(BURNT_BEAMS_UNTIL)).toBe(0);
    const posts = (p: number) =>
      record(p).filter((x) => x.op === "stroke" && x.width === 1.4).length;
    expect(posts(0.1)).toBe(2);
    expect(posts(BURNT_POSTS_UNTIL)).toBe(0);
    const smoke = (p: number) =>
      record(p).filter((x) => x.op === "fill" && x.style.startsWith("rgba(190,186,180")).length;
    expect(smoke(0.01)).toBe(2);
    expect(smoke(BURNT_SMOKE_UNTIL)).toBe(0);
    // far zoom (no detail): ground and beams only
    expect(record(0.1, false).some((x) => x.width === 1.4)).toBe(false);
  });

  it("only a fire rebuild is marked burnt: not the burning house, not a flood ruin, not a new site", () => {
    let fireSites = 0,
      floodSites = 0,
      plain = 0;
    for (let n = 0; n < 60 && (!fireSites || !plain); n++) {
      const s: Seed = {
        id: `burnt${n}`,
        name: "T",
        owner: "o",
        x: 400 + n * 3,
        y: 540,
        hue: 1,
        created_at: new Date(c0).toISOString(),
        user_id: "u",
      };
      const W = [s];
      for (const f of fires(s, c0 + 300 * DAY)) {
        if (f.guarded || !f.tiles.length) continue;
        for (const t of f.tiles) {
          const x = t % MAP,
            y = Math.floor(t / MAP);
          const burning = structureAt(x, y, W, f.at + (f.end - f.at) / 2);
          if (burning?.fire) expect(burning.burnt).toBeUndefined();
          const st = structureAt(x, y, W, f.end + 8 * H);
          if (st?.build !== undefined && tileHits(s, f.end + 8 * H).get(t)?.burnt) {
            fireSites++;
            expect(st.burnt).toBe(true);
          }
          expect(structureAt(x, y, W, f.end + 200 * H)?.burnt).toBeUndefined(); // rebuilt
        }
      }
      for (const f of floods(s, c0 + 300 * DAY))
        for (const t of f.ruined) {
          const st = structureAt(t % MAP, Math.floor(t / MAP), W, f.end + 8 * H);
          if (st?.build !== undefined && !tileHits(s, f.end + 8 * H).get(t)?.burnt) {
            floodSites++;
            expect(st.burnt).toBeUndefined();
          }
        }
      for (let h = 30; h < 400 && plain < 3; h += 1)
        for (let j = -5; j <= 5; j++)
          for (let i = -5; i <= 5; i++) {
            const st = structureAt(s.x + i, s.y + j, W, c0 + h * H);
            if (
              st?.build !== undefined &&
              !tileHits(s, c0 + h * H).has((s.y + j) * MAP + s.x + i)
            ) {
              plain++;
              expect(st.burnt).toBeUndefined();
            }
          }
    }
    expect(fireSites).toBeGreaterThan(0);
    expect(plain).toBeGreaterThan(0);
    expect(floodSites).toBeGreaterThanOrEqual(0);
  });

  it("drawSite paints the burnt layer for such sites and skips the staking", () => {
    const src = readFileSync("src/game/render.ts", "utf8");
    expect(src).toContain("if (s.burnt) drawBurntSite(c, cx, cy, hw, hh, p, sd, t, detail);");
    expect(src).toContain("if (p < 0.3 && !s.burnt) {");
  });
});
