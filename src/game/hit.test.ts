import { describe, expect, it } from "vitest";
import { personHit } from "./hit";

const f = (id: string, x: number, y: number) => ({ x, y, q: { p: id } });

describe("personHit", () => {
  it("hits head, belly and feet of the figure", () => {
    const figs = [f("a", 0, 0)];
    for (const y of [0, -5, -10.9]) expect(personHit(figs, 1, y, 2, false)).toBe("a");
  });
  it("mouse tolerance is capped at 24 CSS px around the body", () => {
    const figs = [f("a", 0, 0)];
    // zoom 2: 24px = 12 world units beyond the 2.5 half-width
    expect(personHit(figs, 2.5 + 11.9, -5, 2, false)).toBe("a");
    expect(personHit(figs, 2.5 + 12.1, -5, 2, false)).toBeNull();
  });
  it("a free tile one tile away from a person does not select it (stroll mode)", () => {
    // at zoom 4 a tile is ~32 world units wide: clicking its centre is far beyond 6 units tolerance
    expect(personHit([f("a", 0, 0)], 32, 0, 4, false)).toBeNull();
  });
  it("overlapping bodies pick the front-most figure (drawn last)", () => {
    const figs = [f("front", 0, 3), f("back", 0.5, 0)];
    expect(personHit(figs, 0.2, -2, 2, false)).toBe("front");
  });
  it("outside all bodies picks the nearest", () => {
    const figs = [f("l", -10, 0), f("r", 10, 0)];
    expect(personHit(figs, 6, -4, 1, false)).toBe("r");
  });
});
