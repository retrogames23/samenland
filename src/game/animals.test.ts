import { afterEach, describe, expect, it } from "vitest";
import { animalsSleeping, sheepPose } from "./animals";
import { setRealm } from "./time";

afterEach(() => setRealm("europe"));
describe("animal night rest", () => {
  it("rests between 21:00 and 06:00 on the shared realm clock", () => {
    setRealm("europe");
    expect(animalsSleeping(Date.parse("2026-10-28T19:59:59Z"))).toBe(false);
    expect(animalsSleeping(Date.parse("2026-10-28T20:00:00Z"))).toBe(true);
    expect(animalsSleeping(Date.parse("2026-10-29T04:59:59Z"))).toBe(true);
    expect(animalsSleeping(Date.parse("2026-10-29T05:00:00Z"))).toBe(false);
  });
  it("keeps every sheep stationary without grazing all night", () => {
    setRealm("europe");
    const dusk = Date.parse("2026-10-28T20:00:00Z");
    for (let k = 0; k < 3; k++) {
      const pose = sheepPose(123, k, dusk);
      for (let h = 0; h < 9; h += 0.25) {
        expect(sheepPose(123, k, dusk + h * 3.6e6)).toEqual(pose);
      }
      expect(pose.sleeping).toBe(true);
      expect(pose.walking).toBe(false);
      expect(pose.graze).toBe(false);
    }
  });
  it("uses the map's timezone rather than the device's", () => {
    const now = Date.parse("2026-10-28T20:00:00Z");
    setRealm("europe"); expect(animalsSleeping(now)).toBe(true);
    setRealm("us-west"); expect(animalsSleeping(now)).toBe(false);
  });
  it("continues moving and grazing during the day", () => {
    setRealm("europe");
    const day = Date.parse("2026-10-28T10:00:00Z");
    const poses = Array.from({ length: 60 }, (_, i) => sheepPose(123, 0, day + i * 1000));
    expect(poses.some(p => p.walking)).toBe(true);
    expect(poses.some(p => p.graze)).toBe(true);
    expect(poses.every(p => !p.sleeping)).toBe(true);
  });
});