import { describe, it, expect } from "vitest";
import { orphanNow, orphanStays } from "./orphan";

const H = 3.6e6;
describe("orphan stay", () => {
  it("foster family keeps him 7 days, apprenticeship 4 days", () => {
    const d = [{ event: "orphan", choice: "adopt", at: 0, cost: 20 }, { event: "orphan", choice: "apprentice", at: 1000 * H, cost: 0 }];
    const s = orphanStays(d);
    expect(s[0]!.until).toBe(168 * H);
    expect(s[1]!.until - s[1]!.at).toBe(96 * H);
  });
  it("is gone after the stay ends", () => {
    const d = [{ event: "orphan", choice: "adopt", at: 0, cost: 20 }];
    expect(orphanNow(d, 167 * H)).not.toBeNull();
    expect(orphanNow(d, 168 * H)).toBeNull();
  });
  it("only one boy at a time even if the encounter repeats", () => {
    const d = [{ event: "orphan", choice: "adopt", at: 0, cost: 20 }, { event: "orphan", choice: "adopt", at: 10 * H, cost: 20 }];
    expect(orphanNow(d, 20 * H)!.at).toBe(10 * H);
  });
});
