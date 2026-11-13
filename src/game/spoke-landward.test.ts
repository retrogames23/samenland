import { describe, it, expect } from "vitest";
import { LOCATIONS } from "./simulation/profiles";
import { setRealm } from "./time";
import { spokeDirs, structureAt, terrain, buildable, SPOKE_PROBE, type Seed } from "./world";

setRealm("europe");
const GOLD = 2.39996;
const seedAt = (key: string) => { const [x, y] = LOCATIONS[key]!.at; return { id: `b21a-${key}`, name: "S", owner: "o", x, y, hue: 0, realm: "europe", created_at: "2026-11-12T00:00:00Z" } as Seed; };
const nominal = (s: Seed) => { let sn = 0; for (const ch of s.id) sn = (sn * 31 + ch.charCodeAt(0)) | 0; const b = (spokeDirs(s)[0]! - 0); return { sn, b }; };
const run = (s: Seed, a: number) => { let t = 1; for (; t <= 40; t++) if (!buildable(terrain(Math.round(s.x + Math.cos(a) * t), Math.round(s.y + Math.sin(a) * t)))) break; return t - 1; };
const roads = (s: Seed) => { const at = Date.parse("2028-11-12T00:00:00Z"); const out: string[] = []; for (let j = -40; j <= 40; j++) for (let i = -40; i <= 40; i++) { const st = structureAt(s.x + i, s.y + j, [s], at); if (st && (st.kind === "path" || st.kind === "street" || st.kind === "avenue")) out.push(`${i},${j}`); } return out; };

describe("landward spokes", () => {
  it("keeps exactly eight spokes", () => { for (const k of ["grain", "gateway", "gateway-trap"]) expect(spokeDirs(seedAt(k))).toHaveLength(8); });
  it("flatland and free hills keep their golden-angle headings where land is open", () => {
    for (const k of ["grain", "gateway-river"]) {
      const s = seedAt(k), d = spokeDirs(s); void nominal;
      d.forEach((a, i) => expect(a).toBeCloseTo(d[0]! + i * GOLD, 9));
    }
  });
  it("coast: no spoke of gateway ends in water within the near range any more", () => {
    const s = seedAt("gateway");
    for (const a of spokeDirs(s)) expect(run(s, a)).toBeGreaterThan(SPOKE_PROBE);
  });
  it("roads never lie on water or rock", () => {
    for (const k of ["gateway", "grain-trap", "gateway-trap", "workshop-tight"]) {
      const s = seedAt(k);
      for (const p of roads(s)) { const [i, j] = p.split(",").map(Number); expect(buildable(terrain(s.x + i!, s.y + j!))).toBe(true); }
    }
  });
});
