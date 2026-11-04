import { describe, it, expect } from "vitest";
import { sheavesOut, woodpileLevel, frost, strawOn, laundryOut, dryingSmoke } from "./seasonal-props";
import { pealPause, setRealm } from "./time";
import { workshopOpen } from "./crafts";

setRealm("europe");
const at = (iso: string) => Date.parse(iso);
describe("seasonal traces", () => {
  it("sheaves only from mid-August to mid-October", () => {
    expect(sheavesOut(at("2026-09-10T12:00:00Z"))).toBe(true);
    expect(sheavesOut(at("2026-07-10T12:00:00Z"))).toBe(false);
    expect(sheavesOut(at("2026-11-10T12:00:00Z"))).toBe(false);
  });
  it("firewood is highest in early winter and lowest in summer", () => {
    expect(woodpileLevel(at("2026-12-15T00:00:00Z"))).toBe(1);
    expect(woodpileLevel(at("2026-07-01T00:00:00Z"))).toBeCloseTo(0.2);
  });
  it("ice only in frost, straw mantles from November to March", () => {
    expect(frost(at("2026-01-15T12:00:00Z"))).toBe(true);
    expect(frost(at("2026-06-15T12:00:00Z"))).toBe(false);
    expect(strawOn(at("2026-12-01T12:00:00Z"))).toBe(true);
    expect(strawOn(at("2026-06-01T12:00:00Z"))).toBe(false);
  });
  it("no laundry on Sundays or at night", () => {
    for (let sd = 0; sd < 200; sd++) {
      expect(laundryOut(sd, at("2026-05-03T10:00:00Z"))).toBe(false); // Sunday
      expect(laundryOut(sd, at("2026-05-05T21:00:00Z"))).toBe(false); // 23:00 Berlin
    }
    expect(Array.from({ length: 200 }, (_, sd) => laundryOut(sd, at("2026-05-05T09:00:00Z"))).some(Boolean)).toBe(true);
  });
  it("drying ovens smoke only in autumn", () => {
    expect(Array.from({ length: 200 }, (_, sd) => dryingSmoke(sd, at("2026-04-05T09:00:00Z"))).some(Boolean)).toBe(false);
  });
});
describe("bell and workshops", () => {
  it("workers pause at 06, 12 and 20 Berlin time for 20 s", () => {
    expect(pealPause(at("2026-06-10T04:00:10Z"))).toBe(true); // 06:00 CEST
    expect(pealPause(at("2026-06-10T10:00:05Z"))).toBe(true);
    expect(pealPause(at("2026-06-10T18:00:05Z"))).toBe(true);
    expect(pealPause(at("2026-06-10T10:00:30Z"))).toBe(false);
    expect(pealPause(at("2026-06-10T09:00:05Z"))).toBe(false);
  });
  it("cooper and weaver rest at night and on Sundays", () => {
    expect(workshopOpen(10, false)).toBe(true);
    expect(workshopOpen(22, false)).toBe(false);
    expect(workshopOpen(10, true)).toBe(false);
  });
});
