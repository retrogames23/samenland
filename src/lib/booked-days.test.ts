import { describe, it, expect, vi } from "vitest";

let rows: number[] = [];
let fullReads = 0;
// Tiny query stand-in: supports the filters bookedDays uses on tax_receipts.
vi.mock("@/integrations/supabase/client.server", () => ({
  supabaseAdmin: {
    from: () => {
      let min = -Infinity, desc = false, lim = Infinity, head = false;
      const q = {
        select: (_c: string, o?: { head?: boolean }) => { head = !!o?.head; return q; },
        eq: () => q,
        gte: (_c: string, v: number) => { min = v; return q; },
        order: (_c: string, o: { ascending: boolean }) => { desc = !o.ascending; return q; },
        limit: (n: number) => { lim = n; return q; },
        maybeSingle: () => { const r = rows.filter(d => d >= min).sort((a, b) => desc ? b - a : a - b).slice(0, lim); return Promise.resolve({ data: r[0] !== undefined ? { day: r[0] } : null, error: null }); },
        then: (res: (v: unknown) => void) => {
          const r = rows.filter(d => d >= min);
          if (head) return res({ count: r.length, error: null });
          fullReads++;
          return res({ data: r.map(day => ({ day })), error: null });
        },
      };
      return q;
    },
  },
}));

describe("booked tax days", () => {
  it("a gap-free run is recognised from count and last day alone", async () => {
    const { bookedDays } = await import("./treasury.server");
    rows = [1, 2, 3, 10, 11, 12, 13]; fullReads = 0;
    const b = await bookedDays("s", 10);
    expect([9, 10, 13, 14].map(d => b.has(d))).toEqual([false, true, true, false]);
    expect(fullReads).toBe(0);
  });
  it("a hole falls back to reading every day, so the missing day is still booked", async () => {
    const { bookedDays } = await import("./treasury.server");
    rows = [10, 11, 13]; fullReads = 0;
    const b = await bookedDays("s", 10);
    expect([10, 11, 12, 13].map(d => b.has(d))).toEqual([true, true, false, true]);
    expect(fullReads).toBe(1);
  });
  it("no receipts yet: nothing counts as booked", async () => {
    const { bookedDays } = await import("./treasury.server");
    rows = [];
    const b = await bookedDays("s", 5);
    expect(b.has(5)).toBe(false);
  });
});
