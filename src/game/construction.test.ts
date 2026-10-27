import { describe, it, expect } from "vitest";
import { structureAt, buildTime, type Seed } from "./world";
import { townOf } from "./people";

const seed: Seed = { id: "build-test", x: 512, y: 512, name: "T", hue: 30, created_at: new Date(0).toISOString() } as Seed;

describe("construction sites", () => {
  it("buildings are construction sites before they are finished", () => {
    // the barn landmark is finished at 48 h; shortly before that it is still being built
    const before = (48 - buildTime(48) / 2) * 3.6e6;
    const st = structureAt(510, 513, [seed], before);
    expect(st?.kind).toBe("barn");
    expect(st?.build).toBeGreaterThan(0);
    expect(st?.build).toBeLessThan(1);
    expect(structureAt(510, 513, [seed], 49 * 3.6e6)?.build).toBeUndefined();
  });
  it("construction sites are staffed by carpenters", () => {
    const now = (48 - buildTime(48) / 2) * 3.6e6;
    const t = townOf(seed, [seed], now);
    expect(t.people.some((p) => p.job === "builder")).toBe(true);
  });
});
