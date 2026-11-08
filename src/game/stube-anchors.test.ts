import { describe, it, expect } from "vitest";
import { BODY_ANCHORS, FURNITURE, anchorBottom, anchorX, furnitureY, stubeFigureKey, type StubePlace, type StubeLayoutKey } from "./stube";
import type { Person } from "./people";

const P = (age: number, sex: "m" | "f", spot: StubePlace["spot"]): StubePlace => ({ p: { id: 1, age, sex } as Person, spot, slot: 0 });
const layouts: StubeLayoutKey[] = ["wide", "tall", "coast"];

describe("Schaukasten anchors", () => {
  it("every figure that can appear has a body-contact anchor", () => {
    for (const pat of [false, true]) for (const spot of ["table", "fire", "hearth", "desk"] as const)
      for (const age of [8, 30, 70]) for (const sex of ["m", "f"] as const)
        expect(BODY_ANCHORS[stubeFigureKey(P(age, sex, spot), pat)], `${spot}/${age}/${sex}/${pat}`).toBeDefined();
  });
  it("every seat in all three layouts has a furniture anchor with a seat top above the floor", () => {
    for (const l of layouts) {
      for (const f of FURNITURE[l].table!) { expect(f.seat).toBeDefined(); expect(f.seat!).toBeLessThan(f.floor); }
      expect(FURNITURE[l].fire![0]!.kind).toBe("stool");
    }
    expect(FURNITURE.wide.table![0]!.kind).toBe("bench");
    expect(FURNITURE.tall.desk![0]!.kind).toBe("chair");
  });
  it("body and furniture anchor coincide for adults and children alike", () => {
    for (const l of layouts) for (const furn of [...FURNITURE[l].table!, ...FURNITURE[l].fire!]) for (const key of ["eat-man", "eat-girl", "warm-boy", "pat-eat-boy"]) {
      const body = BODY_ANCHORS[key]!;
      for (const h of [0.08, 0.26]) expect(anchorBottom(furn, body, h) - body.at * h).toBeCloseTo(furnitureY(furn, body), 9);
    }
  });
  it("a child sits on the same seat top as an adult, only its feet hang higher", () => {
    const f = FURNITURE.wide.table![0]!, b = BODY_ANCHORS["eat-girl"]!;
    expect(anchorBottom(f, b, 0.15)).toBeLessThan(anchorBottom(f, b, 0.26));
    expect(anchorBottom(f, b, 0.15) - b.at * 0.15).toBeCloseTo(anchorBottom(f, b, 0.26) - b.at * 0.26, 9);
  });
  it("figures painted with their own stool stand on the floor", () => {
    expect(anchorBottom(FURNITURE.wide.fire![0]!, BODY_ANCHORS["elder-woman"]!, 0.22)).toBe(0.82);
  });
});

describe("stool contact", () => {
  it("a seated figure's seat point lands on the stool, mirrored figures too", () => {
    const f = FURNITURE.coast.table![0]!, b = BODY_ANCHORS["eat-man"]!, h = 0.19, a = 1024 / 1536;
    for (const flip of [false, true]) {
      const x = anchorX(f, b, h, flip, a);
      expect(x + (b.dx ?? 0) * h * a * (flip ? -1 : 1)).toBeCloseTo(f.x, 9);
    }
    expect(anchorX(FURNITURE.wide.table![0]!, b, 0.26, false, a)).toBe(FURNITURE.wide.table![0]!.x); // long bench
  });
});
