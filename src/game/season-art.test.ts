import { describe, expect, it } from "vitest";
import { recolorRows, type ArtRole } from "./season-art";

/** The former synchronous loop is recolorRows(0..h); staged slices must give the same bytes. */
const look = { green: [0.98, 0.94, 0.88] as [number, number, number], stone: [0.82, 0.8, 0.82] as [number, number, number], sand: [1.02, 0.98, 0.9] as [number, number, number], water: [0.86, 0.88, 0.9] as [number, number, number], conifer: 0.3, birch: 0.45, heather: 0.05 };
const img = (w: number, h: number) => { const d = new Uint8ClampedArray(w * h * 4); let s = 7; for (let i = 0; i < d.length; i++) { s = (s * 1103515245 + 12345) >>> 0; d[i] = s >>> 24; } for (let i = 3; i < d.length; i += 40) d[i] = 0; return d; };
const roles: ArtRole[] = ["building", "leaf", "fir", "ground", "field", "water", "flower", "track"];
const seasons = [{ winter: 1, spring: 0, summer: 0, autumn: 0 }, { winter: 0, spring: 0.4, summer: 0, autumn: 0.6 }, { winter: 0, spring: 1, summer: 0, autumn: 0 }];

describe("staged seasonal recolour", () => {
  for (const role of roles) for (const [si, w] of seasons.entries()) for (const lk of [null, look]) it(`${role} season ${si} ${lk ? "biome" : "plain"} is pixel-identical`, () => {
    const W = 37, H = 61, ref = img(W, H), st = ref.slice();
    recolorRows(ref, W, H, 0, H, role, w, 0.4, lk);
    for (let y = 0; y < H; y += 24) recolorRows(st, W, H, y, Math.min(H, y + 24), role, w, 0.4, lk);
    expect(Buffer.from(st).equals(Buffer.from(ref))).toBe(true);
  });
  it("transparent pixels stay untouched", () => {
    const d = new Uint8ClampedArray([10, 200, 30, 0]); recolorRows(d, 1, 1, 0, 1, "leaf", seasons[0]!, 1, look);
    expect([...d]).toEqual([10, 200, 30, 0]);
  });
});
