import { describe, it, expect } from "vitest";
import { sacksAt, fishingNow, breadOut } from "./crafts";

describe("craft scenes", () => {
  it("fisher rests at night, on Sundays and on winter ice", () => {
    expect(fishingNow(10, false, 0)).toBe(true);
    expect(fishingNow(2, false, 0)).toBe(false);
    expect(fishingNow(10, true, 0)).toBe(false);
    expect(fishingNow(10, false, 0.9)).toBe(false);
  });
  it("flour sack stack grows through the workday", () => {
    expect(sacksAt(5, false)).toBe(0);
    expect(sacksAt(7, false)).toBe(1);
    expect(sacksAt(17, false)).toBe(4);
    expect(sacksAt(12, true)).toBe(0);
    expect(sacksAt(9, false)).toBeLessThanOrEqual(sacksAt(15, false));
  });
  it("bread basket only by day", () => {
    expect(breadOut(10)).toBe(true);
    expect(breadOut(23)).toBe(false);
  });
});

import { waterDir } from "./people";
import { setRealm } from "./time";
describe("fisher faces the water", () => {
  it("Schlehenburg's fisher looks at his carp pond to the south-west", () => {
    setRealm("europe-2");
    const s = { id: "7a3b0ac1-ee19-439c-86b6-f4107dd8efae", name: "S", owner: "M", x: 571, y: 552, hue: 1, created_at: "2026-11-14T14:39:59Z", user_id: "u", bought: [{ item: "fisher", at: 1, x: 569, y: 555 }] } as never;
    const d = waterDir(569, 554, [s])!;
    expect(d[0]).toBeLessThan(0); expect(d[1]).toBeGreaterThan(0);
    setRealm("europe");
  });
});
