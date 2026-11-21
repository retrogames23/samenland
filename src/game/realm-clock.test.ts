import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { _setPerfSource, initTimeSync, getSyncedTime, applySync, syncServerTime, wakeSync, SYNC_TIMEOUT, WAKE_REFINE_MS, clock, isLab, setRealm, setLabJump, labJump, LAB_EPOCH, LAB_SPEED } from "./time";

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
    for (let i = 0; i < 1000; i++) {
      p += 37; if (i % 25 === 0) applySync(T0 + p - 1000 + ((i * 7919) % 20000) - 10000, p - 50, p);
      const v = getSyncedTime(); expect(v).toBeGreaterThanOrEqual(prev); prev = v;
    }
  });
  it("drops parallel syncs ", async () => {
    let release!: (v: { serverTime: number }) => void;
    const a = syncServerTime(() => new Promise((r) => { release = r; }));
    expect(await syncServerTime(async () => ({ serverTime: 0 }))).toBe(false);
    release({ serverTime: T0 }); await a;
  });
  it("explicit clock arguments stay untouched, lab off on public maps", () => {
    expect(clock(12345)).toBe(12345); expect(isLab()).toBe(false); expect(clock()).toBe(getSyncedTime());
  });
  it("lab map: no server request, lab time formula", async () => {
    setRealm("lab"); setLabJump(2);
    try {
      let calls = 0;
      expect(await syncServerTime(async () => { calls++; return { serverTime: T0 }; })).toBe(false);
      expect(calls).toBe(0);
      const r = LAB_EPOCH + 3_600_000;
      expect(clock(r)).toBe(LAB_EPOCH + (r - LAB_EPOCH) * LAB_SPEED + labJump() * 3.6e6);
      expect(clock(r)).toBe(r + 2 * 3.6e6);
    } finally { setLabJump(0); setRealm("europe"); }
    expect(isLab()).toBe(false);
  });
});

describe("wake from standby (phones stop performance.now())", () => {
  const HOUR = 3_600_000;
  afterEach(() => { vi.useRealTimers(); });
  /** The page slept 6 h: the real server time moved on, the performance clock did not. A slow first answer (rtt 1500 ms) follows. */
  const slow = (serverTime: number) => async () => { p += 1500; return { serverTime }; };
  it("a slow first answer after sleep is dropped by the normal sync and leaves the clock hours behind", async () => {
    vi.useFakeTimers();
    expect(await syncServerTime(slow(T0 + 6 * HOUR))).toBe(false);
    expect(getSyncedTime()).toBeLessThan(T0 + HOUR);
  });
  it("wake sync accepts it once and the clock jumps to the real time", async () => {
    vi.useFakeTimers();
    expect(await wakeSync(slow(T0 + 6 * HOUR))).toBe(true);
    expect(getSyncedTime()).toBeGreaterThanOrEqual(T0 + 6 * HOUR);
    expect(getSyncedTime()).toBeLessThan(T0 + 6 * HOUR + 5000);
  });
  it("wake sync still refuses absurdly slow answers", async () => {
    vi.useFakeTimers();
    expect(await wakeSync(async () => { p += 9000; return { serverTime: T0 + 6 * HOUR }; })).toBe(false);
    expect(getSyncedTime()).toBeLessThan(T0 + HOUR);
  });
  it("refines with a normal sample shortly after and never moves the clock backwards", async () => {
    vi.useFakeTimers();
    let calls = 0;
    // first answer slow (loose estimate), second fast (tight estimate, slightly earlier)
    const f = async () => { calls++; if (calls === 1) { p += 1500; return { serverTime: T0 + 6 * HOUR }; } p += 50; return { serverTime: T0 + 6 * HOUR - 400 }; };
    await wakeSync(f);
    const before = getSyncedTime();
    expect(calls).toBe(1);
    await vi.advanceTimersByTimeAsync(WAKE_REFINE_MS + 10);
    expect(calls).toBe(2);
    expect(getSyncedTime()).toBeGreaterThanOrEqual(before);
  });
  it("duplicate wake events (visibilitychange, pageshow, focus) trigger one request", async () => {
    vi.useFakeTimers();
    let calls = 0;
    const f = async () => { calls++; return { serverTime: T0 }; };
    await Promise.all([wakeSync(f), wakeSync(f), wakeSync(f)]);
    expect(calls).toBe(1);
  });
  it("a request that never answers times out and does not block later syncs", async () => {
    vi.useFakeTimers();
    const hung = syncServerTime(() => new Promise(() => {}));
    await vi.advanceTimersByTimeAsync(SYNC_TIMEOUT + 10);
    expect(await hung).toBe(false);
    p += 100;
    expect(await syncServerTime(async () => ({ serverTime: T0 + 5000 }))).toBe(true);
  });
});
