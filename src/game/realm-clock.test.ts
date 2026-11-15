import { describe, it, expect, beforeEach } from "vitest";
import { _setPerfSource, initTimeSync, getSyncedTime, applySync, syncServerTime, clock, isLab } from "./time";

let p = 0;
const T0 = 1_800_000_000_000;
beforeEach(() => { p = 1000; _setPerfSource(() => p); initTimeSync(T0); });

describe("realm clock", () => {
  it("initial anchor", () => { expect(getSyncedTime()).toBe(T0); p += 500; expect(getSyncedTime()).toBe(T0 + 500); });
  it("RTT/2", () => { p = 2000; expect(applySync(T0 + 5000, 1800, 2000)).toBe(true); expect(getSyncedTime()).toBe(T0 + 5100); });
  it("discards RTT over 800 ms", () => { p = 3000; expect(applySync(T0 + 99999, 2000, 3000)).toBe(false); expect(getSyncedTime()).toBe(T0 + 2000); });
  it("positive correction jumps forward", () => { p = 2000; applySync(T0 + 4000, 2000, 2000); expect(getSyncedTime()).toBe(T0 + 4000); });
  it("holds up to 3 s behind, then resumes", () => {
    p = 2000; applySync(T0 - 1000, 2000, 2000); // displayed T0+1000, server T0-1000 → 2 s hold
    expect(getSyncedTime()).toBe(T0 + 1000); p += 1500; expect(getSyncedTime()).toBe(T0 + 1000);
    p += 1000; expect(getSyncedTime()).toBe(T0 + 1500); p += 100; expect(getSyncedTime()).toBe(T0 + 1600);
  });
  it("slews at half speed for −120 s, then returns to normal", () => {
    p = 2000; applySync(T0 + 1000 - 120_000, 2000, 2000); // 120 s ahead
    p += 10_000; expect(getSyncedTime()).toBe(T0 + 1000 + 5000);
    p = 2000 + 240_000; expect(getSyncedTime()).toBe(T0 + 1000 + 120_000); // converged
    p += 1000; expect(getSyncedTime()).toBe(T0 + 1000 + 121_000);         // normal speed
  });
  it("stays monotonic across repeated calls and syncs", () => {
    let prev = -Infinity;
    for (let i = 0; i < 500; i++) {
      p += 37; if (i % 25 === 0) applySync(T0 + p - 1000 + ((i * 7919) % 20000) - 10000, p - 50, p);
      const v = getSyncedTime(); expect(v).toBeGreaterThanOrEqual(prev); prev = v;
    }
  });
  it("drops parallel syncs and keeps explicit clock args and lab isolated", async () => {
    let release!: (v: { serverTime: number }) => void;
    const a = syncServerTime(() => new Promise((r) => { release = r; }));
    expect(await syncServerTime(async () => ({ serverTime: 0 }))).toBe(false);
    release({ serverTime: T0 }); await a;
    expect(clock(12345)).toBe(12345); expect(isLab()).toBe(false);
  });
});
