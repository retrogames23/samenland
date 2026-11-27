// Paket B (O2), client side: the pending rule and the paths that use it.
//   B4  pending is never "not enough money" (no shared words; the client maps it to its own text)
//   B11 a timeout or lost response is never retried; a pending answer syncs once and is retried at most once
//   B12 every money / resource action of the client goes through retryOnPending; the server paths settle first
import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { SETTLEMENT_PENDING, PENDING_CODE, codePending, dbPending, isSettlementPending, retryOnPending } from "./settlement-pending";
import { SETTLEMENT_T } from "@/game/lang/settlement";
import { LANGS } from "@/game/i18n";
import { guardCode } from "./encounter.server";

const src = (p: string) => readFileSync(new globalThis.URL(`../${p}`, import.meta.url), "utf8");
const pendingRow = { data: null, error: { message: SETTLEMENT_PENDING } };
const okRow = { data: { id: "1" }, error: null };

describe("Paket B – pending on the client", () => {
  it("B4 pending and lack of money share no words; every language has its own pending text", () => {
    expect(isSettlementPending("not enough money")).toBe(false);
    expect(/money|enough/.test(SETTLEMENT_PENDING)).toBe(false);
    expect(guardCode(SETTLEMENT_PENDING)).toBe(PENDING_CODE);
    expect(guardCode("not enough money")).toBe("poor");
    for (const l of LANGS) { expect(SETTLEMENT_T[l].pending.length).toBeGreaterThan(20); expect(SETTLEMENT_T[l].resources.length).toBeGreaterThan(10); }
  });
  it("B11 no pending: one call, no sync", async () => {
    const run = vi.fn(async () => okRow), sync = vi.fn(async () => null);
    expect(await retryOnPending(run, dbPending, sync)).toBe(okRow);
    expect([run.mock.calls.length, sync.mock.calls.length]).toEqual([1, 0]);
  });
  it("B11 pending: sync once, then exactly one more try (which succeeds)", async () => {
    let k = 0;
    const run = vi.fn(async () => (k++ === 0 ? pendingRow : okRow)), sync = vi.fn(async () => null);
    expect(await retryOnPending(run, dbPending, sync)).toBe(okRow);
    expect([run.mock.calls.length, sync.mock.calls.length]).toEqual([2, 1]);
  });
  it("B11 still pending after the sync: the action stays suspended — two calls, never a third", async () => {
    const run = vi.fn(async () => pendingRow), sync = vi.fn(async () => null);
    expect(dbPending(await retryOnPending(run, dbPending, sync))).toBe(true);
    expect([run.mock.calls.length, sync.mock.calls.length]).toEqual([2, 1]);
  });
  it("B11 a timeout (thrown) is never retried: its outcome is unknown, a repeat could double the action", async () => {
    const run = vi.fn(async () => { throw new Error("timeout"); }), sync = vi.fn(async () => null);
    await expect(retryOnPending(run, dbPending, sync)).rejects.toThrow("timeout");
    expect([run.mock.calls.length, sync.mock.calls.length]).toEqual([1, 0]);
    // a server function whose call failed returns null in the client (catch → null): no retry either
    const fn = vi.fn(async () => null as null | { ok: boolean; code?: string });
    expect(await retryOnPending(fn, codePending, sync)).toBeNull();
    expect(fn.mock.calls.length).toBe(1);
  });
  it("B11 other refusals are not retried (not enough money, duplicate, already)", async () => {
    for (const message of ["not enough money", "duplicate key value violates unique constraint", "one gift per day"]) {
      const run = vi.fn(async () => ({ data: null, error: { message } })), sync = vi.fn(async () => null);
      await retryOnPending(run, dbPending, sync);
      expect([run.mock.calls.length, sync.mock.calls.length]).toEqual([1, 0]);
    }
  });
  it("B11 a failing sync ends the attempt without a retry", async () => {
    const run = vi.fn(async () => pendingRow), sync = vi.fn(async () => { throw new Error("offline"); });
    expect(dbPending(await retryOnPending(run, dbPending, sync))).toBe(true);
    expect(run.mock.calls.length).toBe(1);
  });
  it("B11 server-function results: pending code retried once, other codes never", async () => {
    let k = 0;
    const run = vi.fn(async () => (k++ === 0 ? { ok: false, code: "pending" } : { ok: true })), sync = vi.fn(async () => null);
    expect(await retryOnPending(run, codePending, sync)).toEqual({ ok: true });
    const poor = vi.fn(async () => ({ ok: false, code: "poor" }));
    await retryOnPending(poor, codePending, sync);
    expect(poor.mock.calls.length).toBe(1);
  });

  it("B12 every client money and resource action in Game.tsx is wrapped in retryOnPending", () => {
    const game = src("components/Game.tsx");
    const actions = [
      'supabase.from("purchases").insert({ seed_id: my.id, user_id: userId!, item, x:',  // buy (incl. purchase_material)
      'supabase.from("purchases").insert({ seed_id: my.id, user_id: userId!, item: civicDeposit(', // Gemeindebau instalment
      'supabase.from("gifts").insert(',
      'supabase.from("twin_works").insert(',
      'supabase.from("building_moves").insert(',
      '("civic_raise_budget_v2", {',
      'decideFn({ data: { seed: my.id, event, choice, client: CLIENT_PROTOCOL } })',
      'nothilfeFn({ data: { seed: my.id, kind, at, client: CLIENT_PROTOCOL } })',
    ];
    for (const a of actions) {
      const i = game.indexOf(a);
      expect(i, a).toBeGreaterThan(0);
      const line = game.slice(game.lastIndexOf("\n", i), game.indexOf("\n", i));
      expect(line, a).toContain("retryOnPending(");
      expect(game.indexOf(a, i + 1), `${a} appears only once`).toBe(-1);
    }
    // the pending text is shown, not the money text
    expect((game.match(/pendingMsg\(\)/g) ?? []).length).toBeGreaterThanOrEqual(7); // civicErr serves both Gemeindebau paths
  });
  it("B12 the server paths follow the same order: settle (with proof) before the money action", () => {
    const enc = src("lib/encounter.server.ts"), tre = src("lib/treasury.server.ts");
    expect(enc.indexOf("settleBeforeSpend(")).toBeGreaterThan(0);
    expect(enc.indexOf("settleBeforeSpend(")).toBeLessThan(enc.indexOf('.from("encounters")'));
    const noth = tre.slice(tre.indexOf("export async function bookNothilfe"));
    expect(noth.indexOf("settleBeforeSpend(")).toBeGreaterThan(0);
    expect(noth.indexOf("settleBeforeSpend(")).toBeLessThan(noth.indexOf('.from("purchases").insert'));
    const calc = tre.slice(tre.indexOf("export async function calculateTreasury"), tre.indexOf("/** Books one Zimmerleute-Nothilfe"));
    // (the first checkedBalance belongs to the path before the tax cut-over, which books nothing; the main path uses the last)
    const order = [calc.indexOf("await settleWeddings("), calc.indexOf("await refreshResources("), calc.indexOf('.from("tax_receipts").upsert'), calc.lastIndexOf("await checkedBalance(")];
    expect(order.every((x) => x > 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(calc).not.toContain('rpc("resource_refresh"');
    expect(src("routes/api/public/chest-mail.ts")).toContain('"village_balance_checked"');
  });
});
