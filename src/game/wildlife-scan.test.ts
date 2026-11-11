import { describe, it, expect } from "vitest";
import { wildCandidate, isDen } from "./wildlife";

const tiles: [number, number][] = [];
for (let y = 0; y < 120; y++) for (let x = 0; x < 120; x++) tiles.push([x, y]);
const dens = tiles.filter(([x, y]) => isDen(x, y));

describe("wild scan order", () => {
  it("never looks up structures on non-den tiles", () => {
    let calls = 0;
    for (const [x, y] of tiles) if (!isDen(x, y)) wildCandidate(x, y, () => { calls++; return false; });
    expect(calls).toBe(0);
  });
  it("looks up structures exactly once per den tile", () => {
    let calls = 0;
    for (const [x, y] of dens) wildCandidate(x, y, () => { calls++; return false; });
    expect(dens.length).toBeGreaterThan(0);
    expect(calls).toBe(dens.length);
  });
  it("free den tiles stay candidates, built ones do not", () => {
    for (const [x, y] of dens) {
      expect(wildCandidate(x, y, () => false)).toBe(true);
      expect(wildCandidate(x, y, () => true)).toBe(false);
    }
  });
});
