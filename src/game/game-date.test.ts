import { expect, test } from "vitest";
import { gameYear, setRealm } from "./time";
test("calendar runs about 1500: 2026 is 1500, 2027 is 1501", () => {
  setRealm("europe");
  expect(gameYear(Date.parse("2026-11-02T12:00:00Z"))).toBe(1500);
  expect(gameYear(Date.parse("2027-01-02T12:00:00Z"))).toBe(1501);
});
