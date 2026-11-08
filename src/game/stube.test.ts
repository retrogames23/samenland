import { describe, expect, it } from "vitest";
import { stubePlaces, PATRICIAN_SLOTS } from "./stube";
import type { Pose } from "./people";

const pose = (id: number, act: string, visible: boolean, extra: Record<string, unknown> = {}) =>
  ({ p: { id, home: [5, 5], age: 30, job: "farmer", first: `P${id}`, ...extra }, x: visible ? 9 : 5, y: visible ? 9 : 5, visible, act } as unknown as Pose);

describe("Schaukasten: only people really at home appear", () => {
  it("someone out on the field is listed as out", () => {
    expect(stubePlaces([pose(1, "work", true)])[0]!.spot).toBe("out");
  });
  it("sleepers lie in the box beds", () => {
    expect(stubePlaces([pose(1, "sleep", false)])[0]!.spot).toBe("bed");
  });
  it("at most two beds; a third sleeper is not drawn", () => {
    const r = stubePlaces([pose(1, "sleep", false), pose(2, "sleep", false), pose(3, "sleep", false)]);
    expect(r.filter((x) => x.spot === "bed").length).toBe(2);
  });
  it("the homemaker cooks at the hearth, the family eats at the table", () => {
    const r = stubePlaces([pose(1, "home", false, { job: "homemaker" }), pose(2, "lunch", false)]);
    expect(r.find((x) => x.p.id === 1)!.spot).toBe("hearth");
    expect(r.find((x) => x.p.id === 2)!.spot).toBe("table");
  });
});

import { poseMix } from "@/components/Stube";
describe("stube gestures", () => {
  it("holds each pose, then moves between them", () => {
    expect(poseMix(0.5, 1, 0.3, 1.5)).toBe(0);
    expect(poseMix(2, 1, 0.3, 1.5)).toBe(1);
    expect(poseMix(1.15, 1, 0.3, 1.5)).toBeCloseTo(0.5);
  });
});

describe("Schaukasten: merchant's house storeys", () => {
  it("an awake adult at home sits at the counting desk", () => {
    expect(stubePlaces([pose(1, "home", false)], PATRICIAN_SLOTS)[0]!.spot).toBe("desk");
  });
  it("sleepers still go to the bedchamber, eaters to the Dornse table", () => {
    const r = stubePlaces([pose(1, "sleep", false), pose(2, "lunch", false)], PATRICIAN_SLOTS);
    expect(r.map((x) => x.spot)).toEqual(["bed", "table"]);
  });
  it("farmhouses have no desk", () => {
    expect(stubePlaces([pose(1, "home", false)])[0]!.spot).toBe("table");
  });
  it("children never take the desk", () => {
    expect(stubePlaces([pose(1, "home", false, { age: 9 })], PATRICIAN_SLOTS)[0]!.spot).toBe("table");
  });
});
