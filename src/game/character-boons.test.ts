import { describe, it, expect } from "vitest";
import { fires, STONE_FIRE } from "./disasters";
import { hubBonus, TRANSIT_HUB, GATEWAY_HUB, type Seed } from "./world";
import { GRAIN_WINTER } from "./households";
import { townCharacter } from "./character";

const start = Date.parse("2026-01-01T00:00:00Z"), at = start + 730 * 864e5;
const town = (x: number, y: number, user_id: string | null = "u"): Seed => ({ x, y, id: `b${x}`, name: "B", owner: "L", hue: 1, user_id, created_at: new Date(start).toISOString(), bought: [] } as Seed);
const plains = town(532, 124), hills = town(364, 196), coast = town(436, 124);

describe("character strengths", () => {
  it("fixture towns have the expected characters", () => {
    expect([plains, hills, coast].map(s => townCharacter(s).main)).toEqual(["grain", "workshop", "gateway"]);
  });
  it("stone hill towns burn at 60 % of the usual fire chance", () => {
    expect(STONE_FIRE).toBe(0.6);
    expect(fires(hills, at).length).toBeLessThan(fires(town(364, 196, null), at).length);
  });
  it("gateway hubs earn one and a half times the transit hub bonus", () => {
    expect(GATEWAY_HUB).toBe(1.5);
    expect(hubBonus(coast)).toBeCloseTo(TRANSIT_HUB * 1.5);
    expect(hubBonus(plains)).toBe(TRANSIT_HUB);
    expect(hubBonus(hills)).toBe(TRANSIT_HUB);
  });
  it("plains feel only 80 % of the winter food shortfall", () => {
    expect(GRAIN_WINTER).toBe(0.8);
  });
});
