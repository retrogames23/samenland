import { afterEach, describe, expect, it } from "vitest";
import { setRealm } from "./time";
import { buildable, terrain } from "./world";

afterEach(() => setRealm("europe"));

describe("regional island geography", () => {
  it("keeps every founded overseas village on buildable land", () => {
    const towns: [Parameters<typeof setRealm>[0], number, number][] = [["us-west", 304, 405], ["us-west", 330, 354], ["us-east", 297, 415], ["asia", 374, 379], ["asia", 404, 411]];
    for (const [r, x, y] of towns) {
      setRealm(r);
      for (let j = -6; j <= 6; j += 3) for (let i = -6; i <= 6; i += 3) expect(buildable(terrain(x + i, y + j))).toBe(true);
    }
  });
  it("gives the overseas maps a different outline than Europe", () => {
    const sample = () => { let s = ""; for (let y = 40; y < 1000; y += 60) for (let x = 40; x < 1000; x += 60) s += terrain(x, y)[0]; return s; };
    setRealm("europe"); const eu = sample();
    for (const r of ["us-west", "us-east", "asia"] as const) { setRealm(r); expect(sample()).not.toBe(eu); }
    setRealm("europe"); expect(sample()).toBe(eu);
  });
});
