import { describe, it, expect } from "vitest";
import { faceFlip, MIRROR_KINDS, type Kind, type Structure, type Seed } from "./world";
import { streetFront, streetHouse } from "./street-layout";

const KINDS: Kind[] = [...MIRROR_KINDS, "mill", "church", "seat1", "townhall", "well", "market"] as Kind[];
const seed = (x: number, y: number) => ({ id: "s", x, y }) as unknown as Seed;
// pseudo-random road layouts incl. crossings, several neighbours, negative coords and none
const roadSet = (n: number) => (x: number, y: number) => ((x * 73856093) ^ (y * 19349663) ^ (n * 83492791)) % 3 === 0;

describe("shared street front equals separate computation", () => {
  it("streetHouse and faceFlip give identical results with a precomputed front", () => {
    let checked = 0;
    for (let n = 0; n < 12; n++) {
      const isRoad = n === 0 ? () => false : n === 1 ? () => true : roadSet(n);
      for (let x = -6; x < 8; x++) for (let y = -6; y < 8; y++) for (const kind of KINDS) for (const hk of [undefined, "cottage" as Kind]) {
        const s = { kind, v: 0, seed: seed(n * 7 - 20, n * 3 - 10), homeKind: hk } as unknown as Structure;
        const pre = streetFront(x, y, isRoad);
        const a = streetHouse(s, x, y, isRoad), b = streetHouse(s, x, y, isRoad, pre);
        expect(b.kind).toBe(a.kind); expect(b.homeKind).toBe(a.homeKind);
        expect(faceFlip(a.kind, x, y, isRoad, pre)).toBe(faceFlip(a.kind, x, y, isRoad));
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(50000);
  });
});
