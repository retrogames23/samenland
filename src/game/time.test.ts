import { expect, test } from "vitest";
import { worldHour } from "./time";
test("world time is Berlin time regardless of client zone", () => {
  expect(worldHour(Date.UTC(2026, 9, 27, 21, 30))).toBeCloseTo(22.5); // CET
  expect(worldHour(Date.UTC(2026, 6, 1, 10, 0))).toBeCloseTo(12); // CEST
});
import { realmForOffset, setRealm } from "./time";
test("time zones map to four realms", () => {
  expect(realmForOffset(-8)).toBe("us-west");
  expect(realmForOffset(-5)).toBe("us-east");
  expect(realmForOffset(1)).toBe("europe");
  expect(realmForOffset(3)).toBe("europe");
  expect(realmForOffset(8)).toBe("asia");
  expect(realmForOffset(10)).toBe("asia");
});
test("realm clock follows its zone", () => {
  setRealm("asia");
  expect(worldHour(Date.UTC(2026, 9, 27, 0, 0))).toBeCloseTo(9);
  setRealm("europe");
});
import { clock, cacheTick, LAB_SPEED } from "./time";
test("test map runs at normal speed so the view stays smooth", () => {
  setRealm("lab");
  expect(LAB_SPEED).toBe(1);
  expect(clock(Date.UTC(2026, 9, 28, 22, 0))).toBe(Date.UTC(2026, 9, 28, 22, 0));
  expect(cacheTick(60000)).toBe(1);
  setRealm("europe");
});
