import { describe, it, expect } from "vitest";
import { allIn, allPages } from "./fetch-all";
const rows = Array.from({ length: 2345 }, (_, i) => ({ id: i, seed: `s${i % 400}` }));
const fake = (filter: (r: (typeof rows)[number]) => boolean) => ({
  range: async (a: number, b: number) => ({ data: rows.filter(filter).slice(a, Math.min(b + 1, a + 1000)), error: null }),
});
describe("fetch-all", () => {
  it("reads past the 1000-row cap", async () => { expect((await allPages(() => fake(() => true))).length).toBe(2345); });
  it("chunks village ids and keeps every row", async () => {
    const ids = Array.from({ length: 400 }, (_, i) => `s${i}`);
    expect((await allIn(ids, (c) => fake((r) => c.includes(r.seed)))).length).toBe(2345);
  });
});
