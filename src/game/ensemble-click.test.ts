import { describe, it, expect } from "vitest";
import { canPlaceSpecial, type Seed } from "./world";
import { inspectAt } from "./inspect";

const seed = (bought: unknown[]) => ({ id: "ens", x: 600, y: 600, name: "T", created_at: "2026-01-01T00:00:00Z", hue: 0, bought }) as unknown as Seed;
const now = Date.parse("2026-06-01T12:00:00Z");

describe("2×2 ensembles", () => {
  it("a click on a paved back tile opens the Beginenhof", () => {
    const s = seed([{ item: "beginen", at: 0, x: 605, y: 604 }]);
    for (const [x, y] of [[604, 604], [605, 603], [604, 603]]) expect(inspectAt(x, y, [s], now)?.kind).toBe("beginenhof");
  });
  it("a Beginenhof cannot be placed right beside a bought hostel", () => {
    const s = seed([{ item: "herberge", at: 0, x: 605, y: 602 }]);
    expect(canPlaceSpecial("beginen", 605, 604, s, [s], now)).toBe("taken");
  });
});
