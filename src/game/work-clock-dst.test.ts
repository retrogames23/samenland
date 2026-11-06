import { describe, expect, it } from "vitest";
import { setRealm, workClock, workDone } from "./time";

describe("workClock across daylight-saving switches", () => {
  for (const [realm, day] of [["europe", "2026-03-29T00"], ["europe", "2026-10-25T00"], ["us-west", "2026-03-08T10"], ["us-west", "2026-11-01T10"]] as const) {
    // start and end at local night, so three days always hold exactly three working shifts
    it(`never runs backwards on ${realm} ${day}`, () => {
      setRealm(realm);
      const t0 = Date.parse(`${day}:00:00Z`) - 864e5;
      let prev = -Infinity;
      for (let m = 0; m < 3 * 1440; m++) { const w = workClock(t0 + m * 60000); expect(w).toBeGreaterThanOrEqual(prev); prev = w; }
      expect((workClock(t0 + 3 * 864e5) - workClock(t0)) / 3.6e6).toBe(72);
      const done = workDone(t0, 30 * 3.6e6);
      expect(workClock(done) - workClock(t0)).toBeGreaterThanOrEqual(30 * 3.6e6);
    });
  }
});
