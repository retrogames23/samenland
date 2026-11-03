import { describe, expect, it } from "vitest";
import { princelyTask, princelyClaims, PRINCELY_COUNT, PRINCELY_REWARDS } from "./princely";

describe("princely decrees", () => {
  it("has 12 decrees worth 980 Taler", () => {
    expect(PRINCELY_COUNT).toBe(12);
    expect(PRINCELY_REWARDS.reduce((a, b) => a + b, 0)).toBe(980);
  });
  it("cycles six kinds like the DB", () => {
    expect(princelyTask(1).kind).toBe("wonder");
    expect(princelyTask(7)).toEqual({ kind: "wonder", reward: 80 });
    expect(princelyTask(12)).toEqual({ kind: "road", reward: 150 });
  });
  it("only fulfilled decrees pay", () => {
    const rows = [
      { id: "a", seed_id: "s", step: 1, task: "wonder", reward: 40, accepted_at: "x", done_at: "2026-11-01T00:00:00Z" },
      { id: "b", seed_id: "s", step: 2, task: "letter", reward: 40, accepted_at: "x", done_at: null },
    ];
    expect(princelyClaims(rows).map((c) => c.reward)).toEqual([40]);
  });
});

import { heraldVisit, HERALD_RETURN_H, PRINCELY_REST_H } from "./princely";
describe("prince's messenger", () => {
  const H = 3600e3, base = Date.parse("2026-11-01T10:00:00Z");
  const row = (step: number, acc: number, done: number | null) => ({ id: `r${step}`, seed_id: "s", step, task: "letter", reward: 40, accepted_at: new Date(acc).toISOString(), done_at: done == null ? null : new Date(done).toISOString() });
  it("never comes before the first audience", () => expect(heraldVisit([], "s", base)).toBeNull());
  it("arrives exactly when the 20 h rest is over", () => {
    const rows = [row(1, base - 5 * H, base)];
    expect(heraldVisit(rows, "s", base + PRINCELY_REST_H * H - 1)).toBeNull();
    expect(heraldVisit(rows, "s", base + PRINCELY_REST_H * H)?.phase).toBe("arrive");
    expect(heraldVisit(rows, "s", base + PRINCELY_REST_H * H + 60e3)?.phase).toBe("wait");
  });
  it("rides off after handing out and returns for the report", () => {
    const rows = [row(1, base - 30 * H, base - 25 * H), row(2, base, null)];
    expect(heraldVisit(rows, "s", base + 1000)?.phase).toBe("leave");
    expect(heraldVisit(rows, "s", base + H)).toBeNull();
    expect(heraldVisit(rows, "s", base + HERALD_RETURN_H * H + 60e3)?.phase).toBe("wait");
  });
  it("stays away after all 12 decrees", () => {
    const rows = Array.from({ length: 12 }, (_, i) => row(i + 1, base - 100 * H + i * H, base - 99 * H + i * H));
    expect(heraldVisit(rows, "s", base + 50 * H)).toBeNull();
  });
});
