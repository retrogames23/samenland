import { describe, it, expect } from "vitest";
import { workClock, workDone, isWorkHour, WORK_RATE, setRealm } from "./time";

setRealm("europe");
const H = 3.6e6;
// 2026-11-04 is CET (UTC+1): Berlin hour = UTC hour + 1
const at = (berlinHour: number) => Date.UTC(2026, 10, 4, berlinHour - 1);

describe("builders rest at night (1500 town law: 6–20 h)", () => {
  it("works from the 6 o'clock morning bell to the 8 o'clock evening bell", () => {
    expect(isWorkHour(at(5) + 59 * 60000)).toBe(false);
    expect(isWorkHour(at(6))).toBe(true);
    expect(isWorkHour(at(19) + 59 * 60000)).toBe(true);
    expect(isWorkHour(at(20))).toBe(false);
  });
  it("the day shift is 24/14 times as fast", () => {
    expect(WORK_RATE).toBeCloseTo(24 / 14);
    expect(workClock(at(9)) - workClock(at(8))).toBeCloseTo(WORK_RATE * H);
  });
  it("nothing advances at night", () => {
    expect(workClock(at(23))).toBe(workClock(at(21)));
  });
  it("a whole day of work equals 24 real hours, so balance stays unchanged", () => {
    expect(workClock(at(10) + 24 * H) - workClock(at(10))).toBeCloseTo(24 * H);
  });
  it("a 6 h build ordered at 21:00 is done next morning at 9:30", () => {
    expect(workDone(at(21), 6 * H)).toBeCloseTo(at(30) - 0.5 * H, -4);
  });
});
