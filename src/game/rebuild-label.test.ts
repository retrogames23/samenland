import { describe, it, expect, beforeAll } from "vitest";
import { fires, rebuildAt, FIRE_REBUILD } from "./disasters";
import { tileFacts } from "./tile-info";
import { inspectAt } from "./inspect";
import { structureAt, MAP, type Seed } from "./world";
import { TILEINFO } from "./lang/tileinfo";
import { LANGS } from "./i18n";
import { setRealm } from "./time";

// Gebington (Gebbingen, 27.11.2026): a hen coop burnt down and stood as a building site for a day and a half, next to
// houses that went up within two hours. The site looked stuck: nothing said it was a 36-hour rebuild after a fire.
// The tile strip and the place card now name the rebuild and its time left.
const H = 3.6e6,
  DAY = 864e5,
  c0 = Date.parse("2026-01-01T00:00:00Z");

describe("a rebuild after fire is named, with the time left", () => {
  beforeAll(() => setRealm("europe"));
  // a village with a fire that destroys something (no fire house), found deterministically
  const pick = () => {
    for (let n = 0; n < 40; n++) {
      const s: Seed = {
        id: `reb${n}`,
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
        const t = f.tiles.find(
          (k) => structureAt(k % MAP, Math.floor(k / MAP), W, f.end + 8 * H)?.build !== undefined,
        );
        if (t !== undefined) return { s, W, f, x: t % MAP, y: Math.floor(t / MAP) };
      }
    }
    throw new Error("no destructive fire found");
  };
  const { s, W, f, x, y } = pick();

  it("eight hours into the rebuild: fire rebuild, about 28 of 36 hours left", () => {
    const now = f.end + 8 * H,
      r = rebuildAt(s, x, y, now)!;
    expect(r.kind).toBe("f");
    expect(r.left).toBeGreaterThan(0);
    expect(r.left).toBeLessThanOrEqual(FIRE_REBUILD - 8 * H + 1000); // exactly 28 h without aid or charter
    const facts = tileFacts(x, y, W, now, false);
    expect(facts.rebuild).toEqual(r);
    const ins = inspectAt(x, y, W, now)!;
    expect(ins.build).not.toBeNull();
    expect(ins.rebuild).toBe("f");
    expect(ins.doneAt).toBe(now + r.left);
    // at that instant the site is really finished
    expect(structureAt(x, y, W, now + r.left + 60000)?.build).toBeUndefined();
  });

  it("not before the fire, not while it burns, not after the rebuild", () => {
    for (const now of [f.at - H, f.at + (f.end - f.at) / 2, f.end + 4 * FIRE_REBUILD]) {
      expect(rebuildAt(s, x, y, now), String(now - f.at)).toBeNull();
      expect(tileFacts(x, y, W, now, false).rebuild).toBeNull();
    }
  });

  it("an ordinary building site is no rebuild", () => {
    let seen = 0;
    for (let h = 30; h < 30 * 24 && seen < 3; h += 0.5) {
      const now = c0 + h * H;
      for (let j = -6; j <= 6; j++)
        for (let i = -6; i <= 6; i++) {
          const st = structureAt(s.x + i, s.y + j, W, now);
          if (!st || st.build === undefined || st.fire || rebuildAt(s, s.x + i, s.y + j, now))
            continue;
          seen++;
          expect(tileFacts(s.x + i, s.y + j, W, now, false).rebuild).toBeNull();
          expect(inspectAt(s.x + i, s.y + j, W, now)?.rebuild ?? null).toBeNull();
        }
    }
    expect(seen).toBeGreaterThan(0);
  });

  it("every language names both rebuilds", () => {
    for (const l of LANGS) {
      expect(TILEINFO[l].rebuild.f.length, l).toBeGreaterThan(3);
      expect(TILEINFO[l].rebuild.w.length, l).toBeGreaterThan(3);
      expect(TILEINFO[l].rebuild.f).not.toBe(TILEINFO[l].rebuild.w);
    }
  });
});
