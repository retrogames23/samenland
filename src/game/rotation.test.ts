import { describe, it, expect } from "vitest";
import { roleOf, fieldLook } from "./rotation";
const at = (y: number, m: number, d: number) => Date.UTC(y, m - 1, d);
describe("three-field rotation", () => {
  it("each acre moves winter -> summer -> fallow -> winter year by year", () => {
    const next = { winter: "summer", summer: "fallow", fallow: "winter" } as const;
    for (let id = 0; id < 50; id++) expect(roleOf(id, at(2027, 5, 1))).toBe(next[roleOf(id, at(2026, 5, 1))]);
  });
  it("a third of the acres lies fallow", () => {
    let f = 0; for (let id = 0; id < 3000; id++) if (roleOf(id * 7 + 3, at(2026, 6, 1)) === "fallow") f++;
    expect(Math.abs(f / 3000 - 1 / 3)).toBeLessThan(0.03);
  });
  it("rye is ripe in July, oats in August, fallow is grazed in May", () => {
    const of = (r: string) => { for (let id = 0; ; id++) if (roleOf(id, at(2026, 1, 1)) === r) return id; };
    expect(fieldLook(of("winter"), at(2026, 7, 15))).toBe("ripe");
    expect(fieldLook(of("summer"), at(2026, 8, 10))).toBe("ripe");
    expect(fieldLook(of("fallow"), at(2026, 5, 10))).toBe("fallow");
  });
});

import { farmTask } from "./rotation";
describe("farmTask", () => {
  it("reaps only ripe grain", () => { expect(farmTask("ripe")).toBe("reap"); expect(farmTask("green")).toBe("till"); expect(farmTask("ploughed")).toBe("till"); });
  it("keeps farmers at the farmstead on stubble and fallow", () => { expect(farmTask("stubble")).toBe("yard"); expect(farmTask("fallow")).toBe("yard"); });
});
