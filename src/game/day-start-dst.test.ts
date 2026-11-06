import { describe, it, expect } from "vitest";
import { setRealm, worldDayStart } from "./time";

describe("worldDayStart is the real realm midnight on DST days", () => {
  it("Berlin spring switch: 23:00Z the day before", () => {
    setRealm("europe");
    expect(new Date(worldDayStart(Date.parse("2026-03-29T01:30:00Z"))).toISOString()).toBe("2026-03-28T23:00:00.000Z");
  });
  it("Berlin autumn switch: 22:00Z the day before", () => {
    setRealm("europe");
    expect(new Date(worldDayStart(Date.parse("2026-10-25T01:30:00Z"))).toISOString()).toBe("2026-10-24T22:00:00.000Z");
  });
  it("New York spring switch: 05:00Z", () => {
    setRealm("us-east");
    expect(new Date(worldDayStart(Date.parse("2026-03-08T15:00:00Z"))).toISOString()).toBe("2026-03-08T05:00:00.000Z");
    setRealm("europe");
  });
  it("ordinary day: Berlin winter midnight 23:00Z", () => {
    setRealm("europe");
    expect(new Date(worldDayStart(Date.parse("2026-11-06T22:30:00Z"))).toISOString()).toBe("2026-11-06T23:00:00.000Z".replace("06T23","05T23"));
  });
});
