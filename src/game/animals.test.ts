import { afterEach, describe, expect, it } from "vitest";
import { animalsSleeping, sheepPose, mastSeason, farmAnimalKind, farmAnimalPose } from "./animals";
import { setRealm } from "./time";

afterEach(() => setRealm("europe"));
describe("historical village animal dressing", () => {
  const free = { free: true, nearVillage: true, oak: false, shore: false, hutBeside: false, autumn: false };
  it("shows oak mast pigs in autumn, not summer or winter", () => {
    expect(mastSeason(Date.parse("2026-10-15T12:00Z"))).toBe(true);
    expect(mastSeason(Date.parse("2026-07-15T12:00Z"))).toBe(false);
    expect(mastSeason(Date.parse("2026-01-15T12:00Z"))).toBe(false);
    expect(farmAnimalKind({ ...free, oak: true, autumn: true })).toBe("pig");
    expect(farmAnimalKind({ ...free, oak: true })).toBeNull();
  });
  it("keeps geese at the water throughout the year", () => {
    for (const autumn of [true, false]) expect(farmAnimalKind({ ...free, shore: true, autumn })).toBe("goose");
    expect(farmAnimalKind(free)).toBeNull();
  });
  it("puts goats beside huts, not on unrelated land or occupied tiles", () => {
    expect(farmAnimalKind({ ...free, hutBeside: true })).toBe("goat");
    expect(farmAnimalKind({ ...free, hutBeside: true, free: false })).toBeNull();
    expect(farmAnimalKind({ ...free, hutBeside: true, nearVillage: false })).toBeNull();
  });
  it("uses four articulated walk frames and holds feet still when resting", () => {
    const now = Date.parse("2026-10-15T12:00Z");
    const poses = Array.from({ length: 1200 }, (_, k) => farmAnimalPose(17, 1, now + k * 100));
    expect(new Set(poses.filter(p => p.walking).map(p => p.frame)).size).toBe(4);
    expect(poses.filter(p => !p.walking).every(p => p.frame === 1)).toBe(true);
  });
});
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
import { herdAt, COW_SHARE } from "./animals";
import { terrain } from "./world";
describe("pasture herds", () => {
  it("hill pastures keep sheep, lowland pastures are mostly cattle", () => {
    let low = 0, cows = 0;
    for (let x = 100; x < 400; x += 3) for (let y = 100; y < 400; y += 3) {
      const t = terrain(x, y);
      if (t === "hill") expect(herdAt(x, y)).toBe("sheep");
      if (t === "meadow" || t === "grass" || t === "fertile") { low++; if (herdAt(x, y) === "cow") cows++; }
    }
    expect(Math.abs(cows / low - COW_SHARE)).toBeLessThan(0.05);
  });
});
