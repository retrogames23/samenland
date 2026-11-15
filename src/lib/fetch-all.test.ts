import { describe, it, expect } from "vitest";
import { allIn, allPages, allEither } from "./fetch-all";
type R = { id: string; seed: string; to?: string; created_at: string };
const pad = (i: number) => String(i).padStart(6, "0");
/** Fake data API: honours in/gt/or(chrono)/order/limit and caps every reply at 1000 rows. */
function db(rows: R[], opts: { fail?: number; nullAt?: number; onPage?: (n: number) => void } = {}) {
  let pages = 0;
  return (filter: (r: R) => boolean = () => true) => {
    let f = filter, key = "id"; const orders: string[] = [];
    const b = {
      in: (c: keyof R, v: string[]) => { const g = f; f = (r) => g(r) && v.includes(r[c] as string); return b; },
      gt: (c: keyof R, v: string) => { const g = f; f = (r) => g(r) && (r[c] as string) > v; return b; },
      or: (s: string) => { const m = /created_at\.gt\."([^"]+)".*id\.gt\."([^"]+)"/.exec(s)!; const g = f; f = (r) => g(r) && (r.created_at > m[1]! || (r.created_at === m[1] && r.id > m[2]!)); return b; },
      order: (c: string) => { orders.push(c); key = c; return b; },
      limit: async (n: number) => {
        const p = pages++; opts.onPage?.(p);
        if (opts.fail === p) return { data: null, error: { message: "boom" } };
        if (opts.nullAt === p) return { data: null, error: null };
        const out = rows.filter(f).sort((a, c) => { for (const o of orders) { const x = String(a[o as keyof R]), y = String(c[o as keyof R]); if (x !== y) return x < y ? -1 : 1; } return 0; });
        void key; return { data: out.slice(0, Math.min(n, 1000)), error: null };
      },
    };
    return b;
  };
}
const mk = (n: number, seeds = 1) => Array.from({ length: n }, (_, i) => ({ id: pad(i), seed: `s${pad(i % seeds)}`, created_at: `2026-01-01T00:${pad(Math.floor(i / 7))}` }));

describe("fetch-all keyset", () => {
  it("reads more than 1000 rows of a single village chunk", async () => {
    const q = db(mk(2345, 1));
    expect((await allIn(["s000000"], (c) => q().in("seed", c))).length).toBe(2345);
  });
  it("reads every row across several id chunks", async () => {
    const rows = mk(5000, 400), q = db(rows);
    const ids = Array.from({ length: 400 }, (_, i) => `s${pad(i)}`);
    const got = await allIn<R>(ids, (c) => q().in("seed", c));
    expect(got.length).toBe(5000);
    expect(new Set(got.map((r) => r.id)).size).toBe(5000);
  });
  it("never skips or repeats rows while new rows arrive mid-read", async () => {
    const rows = mk(2500);
    // a row inserted at the very start (older id) would shift an offset page; keyset ignores it
    const q = db(rows, { onPage: (p) => { if (p === 1) rows.unshift({ id: "-new", seed: "s", created_at: "0" }); } });
    const got = await allPages<R>(() => q());
    expect(got.length).toBe(2500);
    expect(new Set(got.map((r) => r.id)).size).toBe(2500);
  });
  it("pages chronologically with ties on created_at", async () => {
    const q = db(mk(2100)); const got = await allPages<R>(() => q(), "chrono");
    expect(got.map((r) => r.id)).toEqual(mk(2100).map((r) => r.id));
  });
  it("an error on a later page fails the whole read", async () => {
    const q = db(mk(2500), { fail: 1 }); await expect(allPages(() => q())).rejects.toThrow();
  });
  it("data === null fails the whole read", async () => {
    const q = db(mk(2500), { nullAt: 2 }); await expect(allPages(() => q())).rejects.toThrow();
    const q2 = db(mk(10), { nullAt: 0 }); await expect(allIn(["s000000"], (c) => q2().in("seed", c))).rejects.toThrow();
  });
  it("letters, visits and referrals: either side on this map, each row once", async () => {
    const rows: R[] = [
      { id: "a", seed: "m1", to: "far", created_at: "1" }, // sent from this map to another map
      { id: "b", seed: "far", to: "m2", created_at: "2" }, // received from another map
      { id: "c", seed: "m1", to: "m2", created_at: "3" }, // both on this map: once, not twice
      { id: "d", seed: "far", to: "far2", created_at: "4" }, // foreign pair: not loaded
    ];
    const q = db(rows);
    const got = await allEither<R>(["m1", "m2"], ["seed", "to"], (col, c) => q().in(col as keyof R, c));
    expect(got.map((r) => r.id).sort()).toEqual(["a", "b", "c"]);
  });
});
