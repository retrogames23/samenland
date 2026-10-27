import { expect, test } from "vitest";
import { worldHour } from "./time";
test("world time is Berlin time regardless of client zone", () => {
  expect(worldHour(Date.UTC(2026, 9, 27, 21, 30))).toBeCloseTo(22.5); // CET
  expect(worldHour(Date.UTC(2026, 6, 1, 10, 0))).toBeCloseTo(12); // CEST
});
