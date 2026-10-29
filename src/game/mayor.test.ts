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
    expect(mayorGoal(now)).toEqual(goal);
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
