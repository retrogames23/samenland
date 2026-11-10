import { describe, it, expect } from "vitest";
import { specialSites, structureAt, MAP, type Seed } from "./world";

// pass2.huntScan finds lodges via specialSites instead of a tile scan: every lodge structureAt shows must be listed there
describe("lodge lookup", () => {
  it("every built lodge tile appears in specialSites", () => {
    const s = { id: "lodge-test-seed", x: 300, y: 300, created_at: new Date(Date.now() - 400 * 3.6e6).toISOString(), name: "T", hue: 30, bought: [{ item: "hunter", at: Date.now() - 300 * 3.6e6 }] } as unknown as Seed;
    const seeds = [s], now = Date.now();
    const scanned: number[] = [];
    for (let y = s.y - 30; y <= s.y + 30; y++) for (let x = s.x - 30; x <= s.x + 30; x++) if (structureAt(x, y, seeds, now)?.kind === "lodge") scanned.push(y * MAP + x);
    const listed = [...specialSites(s)].filter(([, v]) => v.kind === "lodge").map(([k]) => k);
    expect(scanned.length).toBeGreaterThan(0);
    for (const k of scanned) expect(listed).toContain(k);
  });
});
