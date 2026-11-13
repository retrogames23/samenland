import { describe, it, expect } from "vitest";
import { specialBuild, SPECIAL_BUILD, type Seed } from "./world";
import { BELFRY_FIRE } from "./disasters";

const base: Seed = { id: "steps", name: "S", owner: "L", hue: 1, x: 300, y: 300, user_id: "u", created_at: "2026-01-01T00:00:00Z" };
const withSteps = (key: string, n: number): Seed => ({ ...base, bought: Array.from({ length: n }, (_, i) => ({ item: `${key}${i + 1}`, at: 0 })) });

describe("monument step boons", () => {
  it("each paid Zunftturm step makes bought buildings 5 % faster (15 % at the top)", () => {
    expect(specialBuild(withSteps("guildtower", 0))).toBe(SPECIAL_BUILD);
    expect(specialBuild(withSteps("guildtower", 1))).toBeCloseTo(SPECIAL_BUILD * 0.95);
    expect(specialBuild(withSteps("guildtower", 3))).toBeCloseTo(SPECIAL_BUILD * 0.85);
  });
  it("belfry shortens fires by 10 % from step 1 and 25 % from step 3", () => {
    expect(BELFRY_FIRE).toEqual([0.9, 0.75]);
  });
});

import { tradeCapOf, transitShare, careStage, CATHEDRAL_SICK } from "./world";
import { sickRate } from "./people";
import { floods } from "./disasters";
describe("monument step effects (paid steps)", () => {
  const T = Date.parse("2026-03-01T00:00:00Z");
  const town = (steps: string[]): Seed => ({ id: "mfx", name: "M", owner: "o", hue: 1, x: 400, y: 540, user_id: "u", created_at: "2026-01-01T00:00:00Z", bought: steps.map((item) => ({ item, at: T })) } as Seed);
  it("lighthouse steps 2/3 raise the trade ceiling by 0.03/0.05", () => {
    const b = tradeCapOf(town([]), T + 1);
    expect(tradeCapOf(town(["lighthouse1", "lighthouse2"]), T + 1) - b).toBeCloseTo(0.03);
    expect(tradeCapOf(town(["lighthouse1", "lighthouse2", "lighthouse3"]), T + 1) - b).toBeCloseTo(0.05);
  });
  it("exchange: routed trade 0.75 → 0.80 (step 2) → 0.85 (step 4)", () => {
    expect(transitShare(town(["exchange1"]), T + 1)).toBe(0.75);
    expect(transitShare(town(["exchange1", "exchange2"]), T + 1)).toBe(0.8);
    expect(transitShare(town(["exchange1", "exchange2", "exchange3", "exchange4"]), T + 1)).toBe(0.85);
  });
  it("cathedral step 5 lowers sickness by 2 points; step 3 counts as care", () => {
    const at = Date.parse("2026-07-21T00:00:00Z"); // a day without wedding joy in either town
    expect(sickRate(town([]), at) - sickRate(town(["cathedral1", "cathedral2", "cathedral3", "cathedral4", "cathedral5"]), at)).toBeCloseTo(CATHEDRAL_SICK);
    const base = ["fisher", "hunter", "granary", "herbs", "healer"];
    expect(careStage(town([...base, "cathedral1", "cathedral2", "cathedral3"]), T + 1)).toBeGreaterThan(careStage(town(base), T + 1));
  });
  it("orangery step 2 acts like a herb hut", () => {
    const at = Date.parse("2026-07-21T00:00:00Z");
    expect(sickRate(town(["orangery1", "orangery2"]), at)).toBeCloseTo(sickRate(town(["herbs"]), at));
  });
  it("lighthouse step 1 shortens floods by 30 %", () => {
    let fs: ReturnType<typeof floods> = [];
    outer: for (let y = 100; y < 900; y += 20) for (let x = 100; x < 900; x += 20) {
      fs = floods({ ...town(["lighthouse1"]), x, y }, T + 400 * 864e5).filter((f) => f.at > T);
      if (fs.length) break outer;
    }
    expect(fs.length).toBeGreaterThan(0);
    for (const f of fs) expect(f.end - f.at).toBeCloseTo(48 * 3.6e6 * 0.7);
  });
});
