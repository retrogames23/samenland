import { describe, it, expect } from "vitest";
import { structureAt, type Seed } from "./world";

const T0 = Date.parse("2026-10-29T00:00:00Z");
const mk = (id: string, x: number, y: number) => ({ id, name: "T", owner: "t", user_id: "u1", x, y, hue: 0, realm: "europe", bought: [], created_at: new Date(T0).toISOString() } as unknown as Seed);
const HOMES = new Set(["farmhouse", "cottage", "barn", "hut", "handwerker", "coop"]);
const at = (s: Seed, x: number, y: number, h: number) => { const st = structureAt(x, y, [s], T0 + h * 3.6e6); return st?.seed.id === s.id ? st : null; };

describe("Gebäude werden nicht von Wegen überrollt", () => {
  it("Sommersdorf [575,627]: finished farmhouse stays from hour 87.5 to 100", () => {
    const s = mk("cc48af03-3473-424d-a783-4b635e4776fb", 572, 630);
    let done = false;
    for (let h = 87.5; h <= 100; h += 0.25) {
      const st = at(s, 575, 627, h);
      if (st && !st.build && HOMES.has(st.kind)) done = true;
      else if (done) throw new Error(`house vanished at ${h}: ${st?.kind}`);
    }
    expect(done).toBe(true);
  });
  it("no finished home turns into a path or empty ground in its era (several seeds)", () => {
    const bad: string[] = [];
    for (const [sx, sy] of [[572, 630], [300, 400], [180, 220], [420, 310], [250, 520]] as [number, number][]) {
      const s = mk(`roll-${sx}-${sy}`, sx, sy);
      for (let y = sy - 8; y <= sy + 8; y++) for (let x = sx - 8; x <= sx + 8; x++) {
        let home = false;
        for (let h = 10; h <= 130; h += 1) { // effAge stays below the first ring (240) and third spoke
          const st = at(s, x, y, h);
          const k = st && !st.build ? st.kind : null;
          if (k && HOMES.has(k)) home = true;
          else if (home && (k === null || k === "path")) { bad.push(`${s.id} ${x},${y}@${h} ${k}`); break; }
        }
      }
    }
    expect(bad).toEqual([]);
  });
});

describe("Wege bleiben während fremder Baustellen", () => {
  it("Gebbingen [104,801]: path stays from hour 18 to 22", () => {
    const s = mk("7cc50325-1e0f-4929-8840-8c9def793829", 101, 803);
    for (let h = 18; h <= 22; h += 0.1) expect(at(s, 104, 801, h)?.kind, `h=${h}`).toBe("path");
  });
  it("a path once shown never blinks out while sites elsewhere are under way (several seeds)", () => {
    const bad: string[] = [];
    for (const [sx, sy] of [[101, 803], [300, 400], [420, 310]] as [number, number][]) {
      const s = mk(`blink-${sx}-${sy}`, sx, sy);
      for (let y = sy - 6; y <= sy + 6; y++) for (let x = sx - 6; x <= sx + 6; x++) {
        const seq = [] as string[];
        for (let h = 8; h <= 60; h += 0.5) seq.push(at(s, x, y, h)?.kind ?? "-");
        const s2 = seq.join(" ");
        if (/path( -)+ path/.test(s2)) bad.push(`${s.id} ${x},${y}`);
      }
    }
    expect(bad).toEqual([]);
  });
  it("result of a tile does not depend on evaluation order", () => {
    const s = mk("7cc50325-1e0f-4929-8840-8c9def793829", 101, 803), t = T0 + 20 * 3.6e6;
    const a = structureAt(104, 801, [s], t)?.kind;
    structureAt(105, 805, [s], t);
    expect(structureAt(104, 801, [s], t)?.kind).toBe(a);
  });
});
