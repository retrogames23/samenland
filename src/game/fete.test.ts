import { describe, it, expect } from "vitest";
import { inauguration, townOf, poseOf, FETE_SECS } from "./people";
import { LANDMARKS, effAge, type Seed } from "./world";

const s = { id: "fete", name: "T", owner: "", x: 520, y: 480, hue: 30, created_at: "2026-06-01T00:00:00Z" } as unknown as Seed;
const seeds = [s];

describe("inauguration", () => {
  it("villagers gather in front of a just-finished landmark", () => {
    const chapel = LANDMARKS.find((l) => l.kind === "chapel")!;
    let lo = Date.parse(s.created_at), hi = lo + 60 * 864e5;
    for (let n = 0; n < 40; n++) { const m = (lo + hi) / 2; if (effAge(s, seeds, m) >= chapel.at) hi = m; else lo = m; }
    const now = hi + 20 * 60e3;
    const ina = inauguration(s, seeds, now);
    expect(ina).not.toBeNull();
    expect(Math.abs(ina!.at - hi)).toBeLessThan(5 * 60e3);
    const t = townOf(s, seeds, now);
    const guests = t.people.filter((p) => p.fete);
    expect(guests.length).toBeGreaterThanOrEqual(Math.min(t.people.length / 2, 15));
    expect(guests.length).toBeLessThanOrEqual(30);
    const gathering = guests.filter((p) => poseOf(p, t, seeds, now).act === "fete");
    expect(gathering.length).toBeGreaterThan(0);
    expect(inauguration(s, seeds, hi + (FETE_SECS + 3 * 3600) * 1000)?.kind === "chapel").toBe(false);
  });
});
