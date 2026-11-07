import { describe, it, expect } from "vitest";
import { ageBand, tradeOf, censusOf } from "./census";
import type { Person } from "./people";

const P = (o: Partial<Person>): Person => ({ id: 0, first: "A", last: "B", sex: "m", age: 30, job: "farmer", home: [0, 0], role: "head", ...o } as Person);

describe("census", () => {
  it("splits the four ages at 14, 21 and 50", () => {
    expect([13, 14, 20, 21, 49, 50].map(ageBand)).toEqual([0, 1, 1, 2, 2, 3]);
  });
  it("sorts livelihoods into food, craft and common good", () => {
    expect(tradeOf("fisher")).toBe("food");
    expect(tradeOf("smith")).toBe("craft");
    expect(tradeOf("priest")).toBe("common");
    expect(tradeOf("child")).toBeNull();
  });
  it("counts households by the head's estate and skips the mayor", () => {
    const c = censusOf([
      P({ id: 1, hh: 1, estate: "wealthy", spouse: 2 }), P({ id: 2, hh: 1, role: "spouse", sex: "f", spouse: 1, job: "homemaker" }),
      P({ id: 3, hh: 2, estate: "ordinary" }), P({ id: 9, role: "mayor", job: "mayor" }),
    ]);
    expect(c.souls).toBe(3);
    expect(c.estates.wealthy).toEqual({ hearths: 1, souls: 2 });
    expect(c.estates.ordinary).toEqual({ hearths: 1, souls: 1 });
    expect(c.couples).toBe(1);
  });
});
