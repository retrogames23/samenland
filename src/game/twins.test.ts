import { describe, expect, it } from "vitest";
import { links, twinSince, isTwin, pactOf, workOf, effAge, PACT_WAIT, WORK_BUILD, type Seed } from "./world";
import { attributes } from "./economy";

const T0 = Date.parse("2026-01-01T00:00:00Z");
const mk = (id: string, x: number, extra: Partial<Seed> = {}): Seed => ({ id, name: id, owner: id, x, y: 420, hue: 0, created_at: "2026-01-01T00:00:00Z", user_id: `u-${id}`, ...extra });
const pairOf = (a: Seed, b: Seed) => { const seeds = [a, b]; return { seeds, l: links(seeds)[0]! }; };

describe("twin towns", () => {
  const { seeds, l } = pairOf(mk("a", 306), mk("b", 348));
  const ts = l ? twinSince(l, seeds) : null;

  it("two neighbouring towns grow together at some point", () => {
    expect(l).toBeDefined();
    expect(ts).not.toBeNull();
    expect(isTwin(l, seeds, ts! - 60000)).toBe(false);
    expect(isTwin(l, seeds, ts!)).toBe(true);
  });

  it("twins grow 10% faster from the moment they touch", () => {
    const later = ts! + 100 * 3.6e6;
    const solo = effAge(seeds[0]!, seeds, ts!);
    expect(effAge(seeds[0]!, seeds, later) - solo).toBeGreaterThan(100 * 1.1 - 1);
  });

  it("a pact holds when both pick the same", () => {
    const a = mk("a", 306, { votes: [{ partner: "b", pact: "trade", at: ts! + 1000 }] });
    const b = mk("b", 348, { votes: [{ partner: "a", pact: "trade", at: ts! + 5000 }] });
    expect(pactOf(a, b, [a, b], ts! + 9000)).toEqual({ kind: "trade", at: ts! + 5000 });
  });

  it("silence for 7 days adopts the partner's choice", () => {
    const a = mk("a", 306, { votes: [{ partner: "b", pact: "shield", at: ts! + 1000 }] });
    const b = mk("b", 348);
    expect(pactOf(a, b, [a, b], ts! + 1000 + PACT_WAIT - 1)).toBeNull();
    expect(pactOf(a, b, [a, b], ts! + 1000 + PACT_WAIT)?.kind).toBe("shield");
  });

  it("sample towns follow the player's choice at once", () => {
    const a = mk("a", 306, { votes: [{ partner: "b", pact: "culture", at: ts! + 1000 }] });
    const b = mk("b", 348, { user_id: null });
    expect(pactOf(a, b, [a, b], ts! + 1000)?.kind).toBe("culture");
  });

  it("the joint building starts only when both halves are paid and takes 48 hours", () => {
    const a = mk("a", 306, { works: [{ partner: "b", work: "hall", cost: 300, at: T0 + 1000 }] });
    const b = mk("b", 348);
    expect(workOf(a, b, T0 + 2000).done).toBeNull();
    const b2 = mk("b", 348, { works: [{ partner: "a", work: "hall", cost: 300, at: T0 + 9000 }] });
    expect(workOf(a, b2, T0 + 10000).done).toBe(T0 + 9000 + WORK_BUILD);
  });

  it("a twin's healer counts half (+15 health) for the neighbour", () => {
    const now = ts! + 1000;
    const without = attributes(seeds[0]!, seeds, [], now).health;
    const withHealer = attributes(seeds[0]!, seeds, [{ id: "p", seed_id: "b", item: "healer", cost: 900, created_at: "2026-01-01T00:00:00Z" }], now).health;
    expect(withHealer - without).toBe(15);
  });
});
