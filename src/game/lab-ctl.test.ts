import { test, expect } from "vitest";
import { setRealm } from "./time";
import { setLabFeast, setLabWeather, resetLab } from "./lab-ctl";
import { feastOn } from "./feasts";
import { weatherAt } from "./weather";

const NOW = Date.parse("2026-11-05T12:00:00Z");

test("control desk overrides only act on the test map", () => {
  setLabFeast("easter"); setLabWeather("storm");
  setRealm("europe");
  expect(feastOn(NOW)).not.toBe("easter");
  setRealm("lab");
  expect(feastOn(NOW)).toBe("easter");
  expect(weatherAt(NOW).kind).toBe("storm");
  resetLab(); setRealm("europe");
});
