import { describe, it, expect } from "vitest";
import { specialSites, MAP, type Seed } from "./world";

describe("2×2 ensembles", () => {
  it("a bought Beginenhof reserves its front tile plus the three tiles behind it", () => {
    const s = { id: "foot", x: 600, y: 600, name: "T", created_at: "2026-01-01T00:00:00Z", hue: 0, bought: [{ item: "beginen", at: 0, x: 605, y: 604 }] } as unknown as Seed;
    const m = specialSites(s);
    expect(m.get(604 * MAP + 605)?.kind).toBe("beginenhof");
    for (const [x, y] of [[604, 604], [605, 603], [604, 603]] as const) expect(m.get(y * MAP + x)?.kind).toBe("square");
  });
  it("a backhaus still takes a single tile", () => {
    const s = { id: "foot2", x: 600, y: 600, name: "T", created_at: "2026-01-01T00:00:00Z", hue: 0, bought: [{ item: "backhaus", at: 0, x: 605, y: 604 }] } as unknown as Seed;
    expect(specialSites(s).size).toBe(1);
  });
});
