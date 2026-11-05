import { expect, it } from "vitest";
import { sunTimes, nightLevel } from "./sun";
import { setRealm } from "./time";

it("follows real north German sun times incl. summer time", () => {
  setRealm("europe");
  const nov = sunTimes(Date.UTC(2026, 10, 5, 12));
  expect(nov.set).toBeGreaterThan(16.3); expect(nov.set).toBeLessThan(16.9);
  const jun = sunTimes(Date.UTC(2026, 5, 21, 12));
  expect(jun.set).toBeGreaterThan(21.6); expect(jun.set).toBeLessThan(22.2);
  expect(jun.rise).toBeGreaterThan(4.5); expect(jun.rise).toBeLessThan(5.1);
});
it("is dark at 18:30 in November but light in June", () => {
  setRealm("europe");
  expect(nightLevel(Date.UTC(2026, 10, 5, 17, 30))).toBeGreaterThan(0.9);
  expect(nightLevel(Date.UTC(2026, 5, 21, 16, 30))).toBe(0);
});
