import { describe, it, expect, afterEach } from "vitest";
import { townOf, poseOf, commandMayor, mayorGoal, clearMayorOrder, ORDER_IDLE } from "./people";
import { type Seed } from "./world";

const s = { id: "mayor", name: "T", owner: "Anna Huber", user_id: "u1", x: 520, y: 480, hue: 30, created_at: "2026-06-01T00:00:00Z" } as unknown as Seed;
const seeds = [s];
const now = Date.parse("2026-06-10T09:00:00Z");

afterEach(() => clearMayorOrder());

describe("steering the mayor", () => {
  it("walks to the tapped tile, waits there, then returns to the routine", () => {
    const t = townOf(s, seeds, now);
    const me = t.people.find((p) => p.role === "mayor")!;
    expect(me).toBeTruthy();
    let goal: [number, number] | null = null;
    for (let dx = -4; dx <= 4 && !goal; dx++) for (let dy = -4; dy <= 4 && !goal; dy++)
      if (commandMayor(me, t, seeds, now, [s.x + dx, s.y + dy])) goal = [s.x + dx, s.y + dy];
    expect(goal).not.toBeNull();
    const g = mayorGoal(now)!;
    // a blocked tap snaps to the nearest walkable tile within 3
    expect(Math.max(Math.abs(g[0] - goal![0]), Math.abs(g[1] - goal![1]))).toBeLessThanOrEqual(3);
    const mid = poseOf(me, t, seeds, now + 1500);
    expect(mid.visible).toBe(true);
    // long enough to arrive, still waiting at the goal
    const there = poseOf(me, t, seeds, now + 40_000);
    expect(Math.hypot(there.x - goal![0], there.y - goal![1])).toBeLessThan(0.01);
    expect(there.walking).toBe(false);
    // after the idle time the order is gone
    poseOf(me, t, seeds, now + (60 + ORDER_IDLE) * 1000 + 60_000);
    expect(mayorGoal(now + 1000)).toBeNull();
  });
  it("refuses tiles nobody can stand on and other villagers", () => {
    const t = townOf(s, seeds, now);
    const other = t.people.find((p) => p.role !== "mayor")!;
    expect(commandMayor(other, t, seeds, now, [s.x + 1, s.y])).toBe(false);
  });
});

describe("stroll routing in a dense village", () => {
  it("reaches walkable tiles beyond corner-to-corner houses", async () => {
    const { setStrollHold } = await import("./people");
    const r = { id: "dense", name: "R", owner: "Anna Huber", user_id: "u1", x: 520, y: 480, hue: 30, created_at: "2026-10-07T23:29:00Z" } as unknown as Seed;
    const at = Date.parse("2026-11-02T15:00:00Z");
    const t = townOf(r, [r], at), me = t.people.find((p) => p.role === "mayor")!;
    setStrollHold(true);
    let ok = 0;
    for (let dx = -8; dx <= 8; dx++) for (let dy = -8; dy <= 8; dy++) if (commandMayor(me, t, [r], at, [r.x + dx, r.y + dy])) ok++;
    setStrollHold(false);
    expect(ok).toBeGreaterThan(50);
  });
});
