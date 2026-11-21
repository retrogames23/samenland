import { describe, expect, it } from "vitest";
import { ACTIVE_FPS, IDLE_FPS, IDLE_AFTER_MS, frameDue } from "./frame-rate";

/** Frames a display of `hz` would draw over `secs` seconds with the given last-input time. */
function drawn(hz: number, secs: number, input: (t: number) => number, busy = false) {
  let last = -1, n = 0;
  for (let t = 0; t < secs * 1000; t += 1000 / hz) if (frameDue(t, last, input(t), busy)) { last = t; n++; }
  return n / secs;
}

describe("frame pacing", () => {
  it("never skips the first frame", () => expect(frameDue(0, -1, 0)).toBe(true));
  it("a 60 Hz screen keeps all its frames while active", () => expect(drawn(60, 3, (t) => t)).toBeGreaterThanOrEqual(59));
  it("a 120 Hz screen is held to about 60 fps while active", () => {
    const f = drawn(120, 3, (t) => t);
    expect(f).toBeGreaterThanOrEqual(ACTIVE_FPS - 1); expect(f).toBeLessThanOrEqual(ACTIVE_FPS + 1);
  });
  it("a resting screen drops to about 30 fps on 60 and 120 Hz alike", () => {
    for (const hz of [60, 120]) { const f = drawn(hz, 4, () => -1e9); expect(f).toBeGreaterThanOrEqual(IDLE_FPS - 1); expect(f).toBeLessThanOrEqual(IDLE_FPS + 1); }
  });
  it("input wakes the loop at once and it rests again after IDLE_AFTER_MS", () => {
    expect(frameDue(1000 / 60, 0, 1000 / 60)).toBe(true); // fresh input: 60 fps cadence is due after one 60 Hz frame
    expect(frameDue(1000 / 60, 0, -1e9)).toBe(false); // resting: still waiting for the 30 fps slot
    expect(frameDue(IDLE_AFTER_MS + 1000 / 60, IDLE_AFTER_MS, 0)).toBe(false); // 5 s after the last input: resting cadence
  });
  it("a moving camera (zoom glide) counts as active", () => expect(frameDue(1000 / 60, 0, -1e9, true)).toBe(true));
});
