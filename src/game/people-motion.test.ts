import { describe, it, expect } from "vitest";
import { talkState } from "./people";

describe("conversations", () => {
  it("pairs do not switch speaker in lockstep", () => {
    let same = 0, n = 0;
    for (let t = 0; t < 600000; t += 1000) {
      const a = talkState(3, 8, t), b = talkState(41, 77, t);
      if (a || b) { n++; if (!!a === !!b) same++; }
    }
    expect(same / n).toBeLessThan(0.8);
  });
  it("includes silent pauses", () => {
    let quiet = 0;
    for (let t = 0; t < 600000; t += 1000) if (!talkState(5, 9, t)) quiet++;
    expect(quiet).toBeGreaterThan(100);
  });
});
