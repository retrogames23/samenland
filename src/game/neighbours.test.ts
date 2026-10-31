import { describe, it, expect } from "vitest";
import { tradersOn, isMarketDate, rideTime, letterArrives, walkProgress, RIDE_MIN, RIDE_MAX } from "./wander";
import { links, type Seed } from "./world";
import { setRealm } from "./time";

const seed = (id: string, x: number, y: number): Seed => ({ id, name: id, owner: id, x, y, hue: 0, created_at: new Date(Date.UTC(2026, 0, 1)).toISOString() });

describe("Saturday market", () => {
  setRealm("europe");
  const a = seed("a", 300, 300), b = seed("b", 330, 300);
  const l = links([a, b])[0]!;
  it("traders only walk on Saturdays (realm clock)", () => {
    for (let d = 20500; d < 20514; d++) {
      const wd = new Date(d * 864e5 + 12 * 3.6e6).getUTCDay();
      expect(isMarketDate(d)).toBe(wd === 6);
      expect(tradersOn(l, d).length > 0).toBe(wd === 6 && l.tiles.length >= 7);
    }
  });
  it("traders walk all the way to the neighbour and back home", () => {
    const d = Array.from({ length: 7 }, (_, i) => 20500 + i).find(isMarketDate)!;
    for (const w of tradersOn(l, d)) expect(walkProgress(w, w.t1)).toBe(1);
  });
});

describe("mounted messenger", () => {
  it("rides between 10 minutes and 2 hours", () => {
    expect(rideTime(seed("a", 0, 0), seed("b", 1, 0))).toBe(RIDE_MIN);
    expect(rideTime(seed("a", 0, 0), seed("b", 5000, 0))).toBe(RIDE_MAX);
    expect(RIDE_MIN).toBe(10 * 60e3); expect(RIDE_MAX).toBe(2 * 3.6e6);
  });
  it("arrival is derived from send time", () => {
    const a = seed("a", 0, 0), b = seed("b", 300, 0);
    expect(letterArrives(a, b, 1000)).toBe(1000 + rideTime(a, b));
  });
});
