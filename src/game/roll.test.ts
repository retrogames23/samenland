import { describe, it, expect } from "vitest";
import { rollOf } from "./roll";
import type { Person } from "./people";

const p = (id: number, home: [number, number], role: Person["role"], last = "Weber"): Person =>
  ({ id, first: `P${id}`, last, sex: "m", age: 30, job: role === "mayor" ? "mayor" : "farmer", home, role } as unknown as Person);

describe("village roll", () => {
  const people = [p(1, [1, 1], "head"), p(2, [1, 1], "spouse"), p(3, [2, 2], "head", "Brandt"), p(9, [1, 1], "mayor", "Graf")];
  const r = rollOf(people);
  it("lists every person exactly once", () => {
    const ids = [r.mayor!.id, ...r.households.flatMap((h) => h.people.map((x) => x.id))].sort();
    expect(ids).toEqual([1, 2, 3, 9]);
  });
  it("puts the mayor first and outside households", () => {
    expect(r.mayor?.id).toBe(9);
    expect(r.households.map((h) => h.name)).toEqual(["Brandt", "Weber"]);
  });
});

describe("roll counts citizens only", () => {
  const g = { id: -5, first: "Gast", last: "", sex: "f", age: 30, job: "homemaker", home: [40, 40], role: "guest" } as unknown as Person;
  const people = [p(1, [1, 1], "head"), p(2, [1, 1], "spouse"), p(9, [1, 1], "mayor", "Graf"), g];
  const r = rollOf(people);
  it("excludes mayor and travelling guests from the total and households", () => {
    expect(r.total).toBe(2);
    expect(r.households.length).toBe(1);
  });
});
