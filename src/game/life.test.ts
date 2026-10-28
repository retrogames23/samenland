import { describe, it, expect } from "vitest";
import { setRealm, isSunday } from "./time";
import { traitsOf } from "./traits";
import { townOf, planOf, poseOf, type Person } from "./people";
import type { Seed } from "./world";

const s = { id: "life", name: "T", owner: "", x: 520, y: 480, hue: 30, created_at: "2026-06-01T00:00:00Z" } as unknown as Seed;
const seeds = [s];

describe("village life", () => {
  it("Sunday follows the map's clock, not UTC", () => {
    const t = Date.parse("2026-10-24T23:30:00Z"); // Sat 23:30 UTC = Sun 01:30 Berlin, Sat 16:30 LA
    setRealm("europe"); expect(isSunday(t)).toBe(true);
    setRealm("us-west"); expect(isSunday(t)).toBe(false);
    setRealm("europe");
  });
  it("traits are fixed per person and never contradict", () => {
    for (let id = 0; id < 500; id++) {
      const a = traitsOf(id);
      expect(traitsOf(id)).toEqual(a);
      expect(a.length).toBeGreaterThanOrEqual(1); expect(a.length).toBeLessThanOrEqual(2);
      expect(a.includes("early") && a.includes("owl")).toBe(false);
    }
  });
  it("no fieldwork or building on Sunday; churchgoers go to service", () => {
    const sun = Date.parse("2026-10-25T09:00:00Z"); // Sunday 10:00 Berlin
    const t = townOf(s, seeds, sun);
    const free = t.people.filter((p) => ["farmer", "builder", "mason", "woodcutter"].includes(p.job) && !p.sick && p.carer == null && !p.proc);
    expect(free.length).toBeGreaterThan(0);
    for (const p of free) expect(planOf(p, t).some((e) => e.act === "work")).toBe(false);
    expect(t.people.some((p) => planOf(p, t).some((e) => e.act === "church"))).toBe(true);
  });
  it("every sick villager has a carer from the same home", () => {
    let found = 0;
    for (let d = 0; d < 60; d += 3) {
      const now = Date.parse("2026-09-01T12:00:00Z") + d * 864e5;
      const t = townOf(s, seeds, now);
      for (const p of t.people.filter((q) => q.sick)) {
        found++;
        const c = t.people.find((q) => q.carer === p.id) as Person;
        expect(c).toBeTruthy();
        expect(c.home).toEqual(p.home);
        expect(planOf(p, t).every((e) => e.indoor)).toBe(true);
      }
    }
    expect(found).toBeGreaterThan(0);
  });
  it("the wedding procession ends at the couple's new home", () => {
    const t0 = townOf(s, seeds, Date.parse("2026-09-15T00:00:00Z"));
    const w = t0.weddings[t0.weddings.length - 1]!;
    const t = townOf(s, seeds, w.at + 60e3);
    const bride = t.people.find((p) => p.proc?.role === "bride")!;
    expect(bride).toBeTruthy();
    expect(bride.proc!.to).toEqual(t.people.find((p) => p.proc?.role === "groom")!.home);
    const q = poseOf(bride, t, seeds, w.at + 60e3);
    expect(q.festive).toBe("bride");
  });
});
