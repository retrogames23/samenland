import { describe, it, expect } from "vitest";
import { larderOf, storedAt, chainOf } from "./goods";
import { townOf } from "./people";

const seed = { id: "g1", name: "Testdorf", x: 500, y: 500, created_at: new Date(Date.UTC(2025, 0, 1)).toISOString(), user_id: null } as never;
const AUTUMN = Date.UTC(2026, 9, 1, 12), SPRING = Date.UTC(2026, 3, 15, 12);

describe("derived larder", () => {
  it("is deterministic and never negative", () => {
    const a = larderOf(seed, [seed], AUTUMN), b = larderOf(seed, [seed], AUTUMN);
    expect(a.flows).toEqual(b.flows);
    expect(a.flows.length).toBeGreaterThan(0);
    for (const f of a.flows) expect(f.stock).toBeGreaterThanOrEqual(0);
  });
  it("harvest season yields more grain than spring", () => {
    const g = (n: number) => larderOf(seed, [seed], n).flows.find((f) => f.ware === "grain")?.stock ?? 0;
    expect(g(AUTUMN)).toBeGreaterThan(g(SPRING));
  });
  it("mill shows field → mill → bakery chain and stored goods", () => {
    const l = larderOf(seed, [seed], AUTUMN);
    const mill = [...(l.byKind.get("mill") ?? []), ...(l.byKind.get("watermill") ?? [])][0];
    expect(mill).toBeTruthy();
    const ch = chainOf("mill", mill!, l, townOf(seed, [seed], AUTUMN).people)!;
    expect(ch.map((c) => c.kind)[0]).toBe("field");
    expect(ch[1]!.here).toBe(true);
    expect(storedAt("mill", mill!, l).length).toBeGreaterThan(0);
  });
});
