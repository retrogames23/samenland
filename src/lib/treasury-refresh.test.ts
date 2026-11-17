import { describe, it, expect } from "vitest";
import { coalescedRefresh } from "./treasury-refresh";

// server model: BATCH = 7 open days booked per call
function server(open: number) {
  let booked = 0, calls = 0;
  return { calls: () => calls, booked: () => booked, fn: async () => { calls++; const n = Math.min(7, open - booked); booked += n; return { settled: booked === open }; } };
}
const tick = () => new Promise(r => setTimeout(r, 0));

describe("treasury refresh", () => {
  for (const [open, settled, booked] of [[0, true, 0], [1, true, 1], [7, true, 7], [8, false, 7], [30, false, 7]] as const)
    it(`${open} open days: one call`, async () => {
      const s = server(open), r = coalescedRefresh(s.fn);
      expect((await r()).settled).toBe(settled);
      expect(s.calls()).toBe(1); expect(s.booked()).toBe(booked);
    });
  it("next refreshes book the rest step by step (56 days = 8 refreshes)", async () => {
    const s = server(56), r = coalescedRefresh(s.fn);
    let res; let n = 0; do { res = await r(); n++; } while (!res.settled);
    expect(n).toBe(8); expect(s.calls()).toBe(8); expect(s.booked()).toBe(56);
  });
  it("errors propagate and do not block the next refresh", async () => {
    let fail = true; const r = coalescedRefresh(async () => { if (fail) throw new Error("x"); return 1; });
    await expect(r()).rejects.toThrow(); fail = false; expect(await r()).toBe(1);
  });
  it("overlapping triggers: never parallel, coalesced into one follow-up", async () => {
    let active = 0, max = 0, calls = 0;
    const r = coalescedRefresh(async () => { calls++; active++; max = Math.max(max, active); await tick(); active--; return calls; });
    const all = await Promise.all([r(), r(), r(), r()]);
    expect(max).toBe(1); expect(calls).toBe(2); expect(all).toEqual([1, 2, 2, 2]);
  });
});
