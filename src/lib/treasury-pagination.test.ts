import { describe, it, expect, vi, beforeEach } from "vitest";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db: { tables: any; fail?: { table: string; from: number }; ranges: string[] } = { tables: {}, ranges: [] };

// Minimal PostgREST stand-in: eq/in/gte filters, multi-key order, range slicing, upsert with unique key.
vi.mock("@/integrations/supabase/client.server", () => ({
  supabaseAdmin: {
    rpc: (fn: string) => Promise.resolve({ data: fn === "village_balance" ? 0 : (db.tables.tax_receipts ?? []).reduce((a, r) => a + (r.income as number), 0), error: null }),
    from: (table: string) => {
      const filters: ((r: Row) => boolean)[] = [], orders: [string, boolean][] = [];
      let range: [number, number] | null = null, lim = Infinity, head = false;
      const rows = () => {
        let r = (db.tables[table] ?? []).filter(x => filters.every(f => f(x)));
        r = [...r].sort((a, b) => { for (const [k, asc] of orders) { const c = String(a[k]).localeCompare(String(b[k]), undefined, { numeric: true }); if (c) return asc ? c : -c; } return 0; });
        return r;
      };
      const run = () => {
        if (head) return { count: rows().length, error: null };
        if (range) {
          db.ranges.push(`${table}:${range[0]}`);
          if (db.fail && db.fail.table === table && db.fail.from === range[0]) return { data: null, error: { message: "boom" } };
          return { data: rows().slice(range[0], range[1] + 1), error: null };
        }
        return { data: rows().slice(0, Math.min(lim, 1000)), error: null }; // server cap like the Data API
      };
      const q = {
        select: (_c: string, o?: { head?: boolean }) => { head = !!o?.head; return q; },
        eq: (k: string, v: unknown) => { filters.push(r => r[k] === v); return q; },
        in: (k: string, v: unknown[]) => { const s = new Set(v); filters.push(r => s.has(r[k])); return q; },
        gte: (k: string, v: number) => { filters.push(r => (r[k] as number) >= v); return q; },
        order: (k: string, o?: { ascending?: boolean }) => { orders.push([k, o?.ascending !== false]); return q; },
        limit: (n: number) => { lim = n; return q; },
        range: (a: number, z: number) => { range = [a, z]; return q; },
        maybeSingle: () => { const d = run() as { data: Row[] | null; error: unknown }; return Promise.resolve({ data: table === "tax_cutover" ? (db.tables.tax_cutover ?? [])[0] ?? null : d.data?.[0] ?? null, error: d.error }); },
        upsert: (ins: Row[]) => { const t = (db.tables[table] ??= []); for (const r of ins) if (!t.some(x => x.seed_id === r.seed_id && x.day === r.day)) t.push(r); return Promise.resolve({ error: null }); },
        then: (res: (v: unknown) => void, rej?: (e: unknown) => void) => Promise.resolve(run()).then(res, rej),
      };
      return q;
    },
  },
}));
// Tax formulas are out of scope here: one Mark per day, so double bookings would show in the total.
vi.mock("@/game/resident-tax", () => ({ residentTax: () => ({ population: 1, households: 1, income: 1 }) }));
vi.mock("@/game/economy-world", () => ({ economyWorldAt: (w: { seeds: unknown[] }) => w.seeds }));

const empty = () => ({ seeds: [], purchases: [], blessings: [], charters: [], encounters: [], first_roads: [], twin_votes: [], twin_works: [], gifts: [], tax_receipts: [] }) as Record<string, Row[]>;
beforeEach(() => { db.tables = empty(); db.fail = undefined; db.ranges = []; });

describe("treasury pagination", () => {
  it("loadEconomyInput reads purchases across several pages, keeping their order", async () => {
    const { loadEconomyInput } = await import("./treasury.server");
    db.tables.seeds = [{ id: "a", realm: "europe", created_at: "2026-01-01" }];
    db.tables.purchases = Array.from({ length: 2345 }, (_, i) => ({ id: `p${i}`, seed_id: "a", item: "x", created_at: String(100000 + i) }));
    const w = await loadEconomyInput("europe");
    expect(w.purchases.length).toBe(2345);
    expect(w.purchases.at(-1)!.created_at).toBe("102344");
    expect(db.ranges.filter(r => r.startsWith("purchases"))).toEqual(["purchases:0", "purchases:1000", "purchases:2000"]);
  });
  it("an exactly full page asks once more and stops on the empty page", async () => {
    const { loadEconomyInput } = await import("./treasury.server");
    db.tables.seeds = [{ id: "a", realm: "europe", created_at: "1" }];
    db.tables.gifts = Array.from({ length: 1000 }, (_, i) => ({ id: `g${String(i).padStart(4, "0")}`, to_seed: "a", created_at: "1" }));
    const w = await loadEconomyInput("europe");
    expect(w.gifts.length).toBe(1000);
    expect(db.ranges.filter(r => r.startsWith("gifts"))).toEqual(["gifts:0", "gifts:1000"]);
  });
  it("an empty table ends after one request", async () => {
    const { loadEconomyInput } = await import("./treasury.server");
    const w = await loadEconomyInput("europe");
    expect(w.seeds).toEqual([]);
    expect(db.ranges.filter(r => r.startsWith("seeds"))).toEqual(["seeds:0"]);
  });
  it("an error on a later page is raised, never a partial result", async () => {
    const { loadEconomyInput } = await import("./treasury.server");
    db.tables.seeds = [{ id: "a", realm: "europe", created_at: "1" }];
    db.tables.encounters = Array.from({ length: 1500 }, (_, i) => ({ id: `e${i}`, seed_id: "a", created_at: String(i) }));
    db.fail = { table: "encounters", from: 1000 };
    await expect(loadEconomyInput("europe")).rejects.toThrow(/Encounters unavailable \(rows from 1000\)/);
  });
  it("bookedDays sees booked days on every page when the run has a hole", async () => {
    const { bookedDays } = await import("./treasury.server");
    db.tables.tax_receipts = Array.from({ length: 2600 }, (_, i) => i + 1).filter(d => d !== 500).map(day => ({ seed_id: "a", day }));
    const b = await bookedDays("a", 1);
    expect([1, 499, 500, 1500, 2600, 2601].map(d => b.has(d))).toEqual([true, true, false, true, true, false]);
    expect(db.ranges).toEqual(["tax_receipts:0", "tax_receipts:1000", "tax_receipts:2000"]);
  });
  it("repeated settlement never books a day twice, also after a hole beyond the first page", async () => {
    const { calculateTreasury } = await import("./treasury.server");
    const created = Date.now() - 1210 * 86400000 - 1000;
    db.tables.seeds = [{ id: "a", realm: "europe", created_at: new Date(created).toISOString() }];
    db.tables.tax_cutover = [{ at: new Date(created).toISOString(), singleton: true }];
    db.tables.tax_receipts = Array.from({ length: 1210 }, (_, i) => i + 1).filter(d => d !== 1100).map(day => ({ seed_id: "a", day, income: 1 }));
    await calculateTreasury("a", "europe");
    await calculateTreasury("a", "europe");
    const days = db.tables.tax_receipts.map(r => r.day as number);
    expect(days.length).toBe(1210);
    expect(new Set(days).size).toBe(1210);
    expect(days).toContain(1100);
  });
});
