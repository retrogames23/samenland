// Hochzeitspaket: the real settleWeddings + sweep driver against an in-memory wedding_receipts table that enforces
// the migration's keys (PK seed_id+wedding_index with ignoreDuplicates, UNIQUE seed_id+occurred_at, no updates).
// Proves: missing receipts are added exactly once, existing ones are never rewritten, repeated and parallel sweeps
// book nothing twice, an abort mid-run resumes cleanly, a disagreeing receipt halts before anything is written.
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Seed } from "@/game/world";
import { weddingReceiptRows, type WeddingReceiptRow } from "@/game/wedding-receipts";

type Row = WeddingReceiptRow;
const db = { rows: [] as Row[], upserts: 0, failAfter: Infinity, writes: [] as Row[] };

class Query implements PromiseLike<{ data: unknown; error: unknown; count?: number | null }> {
  private f: ((r: Row) => boolean)[] = [];
  private desc = false;
  private lim = Infinity;
  private head = false;
  private single = false;
  private up: Row[] | null = null;
  select(_c: string, o?: { count?: string; head?: boolean }) { this.head = !!o?.head; return this; }
  eq(k: keyof Row, v: unknown) { this.f.push((r) => r[k] === v); return this; }
  gt(k: keyof Row, v: number) { this.f.push((r) => (r[k] as number) > v); return this; }
  order(_k: string, o?: { ascending?: boolean }) { this.desc = o?.ascending === false; return this; }
  limit(n: number) { this.lim = n; return this; }
  maybeSingle() { this.single = true; return this; }
  upsert(rows: Row[], o: { onConflict: string; ignoreDuplicates: boolean }) {
    expect(o).toEqual({ onConflict: "seed_id,wedding_index", ignoreDuplicates: true });
    this.up = rows; return this;
  }
  then<A, B>(ok?: ((v: { data: unknown; error: unknown; count?: number | null }) => A | PromiseLike<A>) | null, bad?: ((e: unknown) => B | PromiseLike<B>) | null) {
    return Promise.resolve(this.run()).then(ok, bad);
  }
  private run() {
    if (this.up) {
      if (++db.upserts > db.failAfter) return { data: null, error: { message: "network down" } };
      // one statement = all or nothing (PostgreSQL), like the real upsert
      const next = [...db.rows];
      for (const r of this.up) {
        if (next.some((x) => x.seed_id === r.seed_id && x.wedding_index === r.wedding_index)) continue; // ON CONFLICT DO NOTHING
        if (next.some((x) => x.seed_id === r.seed_id && Date.parse(x.occurred_at) === Date.parse(r.occurred_at)))
          return { data: null, error: { message: "duplicate key value violates unique constraint" } };
        next.push({ ...r });
      }
      db.writes.push(...next.slice(db.rows.length));
      db.rows = next;
      return { data: null, error: null };
    }
    const hit = db.rows.filter((r) => this.f.every((g) => g(r))).sort((a, b) => (this.desc ? b.wedding_index - a.wedding_index : a.wedding_index - b.wedding_index));
    if (this.head) return { data: null, error: null, count: hit.length };
    const out = hit.slice(0, this.lim).map((r) => ({ wedding_index: r.wedding_index, occurred_at: r.occurred_at, dowry: r.dowry }));
    return this.single ? { data: out[0] ?? null, error: null } : { data: out, error: null };
  }
}
const dbSwitch = { value: "2100-01-04T00:00:00+00:00" as string | null };
vi.mock("@/integrations/supabase/client.server", () => ({ supabaseAdmin: {
  from: (t: string) => { expect(t).toBe("wedding_receipts"); return new Query(); },
  rpc: async (fn: string, args: { _realm: string }) => {
    expect(fn).toBe("wedding_switch_since"); expect(typeof args._realm).toBe("string");
    return dbSwitch.value == null ? { data: null, error: { code: "PGRST202", message: "Could not find the function public.wedding_switch_since" } } : { data: dbSwitch.value, error: null };
  },
} }));

const { settleWeddings, resetWeddingSwitchCache } = await import("./treasury.server");
const { runSweep } = await import("./wedding-sweep.server");

const D = 864e5, c0 = Date.parse("2026-03-01T00:00:00Z"), NOW = c0 + 260 * D;
const CARE = ["fisher", "hunter", "granary", "herbs", "healer"].map((item) => ({ item, at: c0 + D }));
const villages: Seed[] = Array.from({ length: 12 }, (_, i) => ({
  id: `00000000-0000-0000-0000-${String(i + 1).padStart(12, "0")}`, user_id: `u${i}`, realm: "europe", x: 0, y: 0,
  created_at: new Date(c0 + i * 7 * D).toISOString(), bought: i % 2 ? CARE : [],
}) as unknown as Seed);
const unowned = { ...villages[0]!, id: "00000000-0000-0000-0000-0000000000ff", user_id: null } as Seed;
const all = [...villages, unowned];
const settle = (s: Seed, apply: boolean) => settleWeddings(s, NOW, { apply });
const expected = () => villages.flatMap((s) => weddingReceiptRows(s, NOW));
const key = (r: Row) => `${r.seed_id}#${r.wedding_index}`;
const snapshot = () => JSON.stringify([...db.rows].sort((a, b) => key(a).localeCompare(key(b))));

/** Today's live state: most villages complete, some with 1–3 receipts still missing (the 84 of 202). */
function seedLiveState() {
  dbSwitch.value = "2100-01-04T00:00:00+00:00";
  resetWeddingSwitchCache();
  db.rows = []; db.upserts = 0; db.failAfter = Infinity; db.writes = [];
  villages.forEach((s, i) => {
    const rows = weddingReceiptRows(s, NOW);
    const drop = i % 3 === 0 ? 0 : (i % 3); // 0, 1 or 2 newest missing; village 4 also a hole in the middle
    db.rows.push(...rows.slice(0, rows.length - drop));
    if (i === 4) db.rows = db.rows.filter((r) => !(r.seed_id === s.id && r.wedding_index === 3));
  });
}

describe("wedding receipt sweep (real settleWeddings, in-memory keys)", () => {
  beforeEach(seedLiveState);

  it("dry run reports what is missing and writes nothing", async () => {
    const before = snapshot();
    const r = await runSweep(all, settle, { realm: "europe", limit: 100 }, NOW);
    expect(r.apply).toBe(false);
    expect(r.checked).toBe(12); // the unowned village is never touched
    expect(r.missing).toBe(expected().length - db.rows.length);
    expect(r.inserted).toBe(0);
    expect(snapshot()).toBe(before);
  });

  it("apply adds every missing receipt exactly once and leaves every existing one byte-identical", async () => {
    const before = new Map(db.rows.map((r) => [key(r), JSON.stringify(r)]));
    const r = await runSweep(all, settle, { realm: "europe", apply: true, limit: 100 }, NOW);
    expect(r.halted).toBeNull();
    expect(r.errors).toEqual([]);
    expect(r.missing).toBeGreaterThanOrEqual(8);
    expect(r.inserted).toBe(r.missing);
    expect(new Set(db.writes.map(key)).size).toBe(db.writes.length);
    for (const w of db.writes) expect(before.has(key(w))).toBe(false);
    for (const [k, v] of before) expect(JSON.stringify(db.rows.find((x) => key(x) === k))).toBe(v);
    expect(snapshot()).toBe(JSON.stringify([...expected()].sort((a, b) => key(a).localeCompare(key(b)))));
    expect(r.next).toBeNull();
  });

  it("a repeated sweep books nothing (idempotent)", async () => {
    await runSweep(all, settle, { realm: "europe", apply: true, limit: 100 }, NOW);
    const done = snapshot(), n = db.upserts;
    const again = await runSweep(all, settle, { realm: "europe", apply: true, limit: 100 }, NOW);
    expect(again.inserted).toBe(0);
    expect(again.missing).toBe(0);
    expect(db.upserts).toBe(n);
    expect(snapshot()).toBe(done);
  });

  it("parallel sweeps cannot double-book", async () => {
    await Promise.all([1, 2, 3].map(() => runSweep(all, settle, { realm: "europe", apply: true, limit: 100 }, NOW)));
    expect(snapshot()).toBe(JSON.stringify([...expected()].sort((a, b) => key(a).localeCompare(key(b)))));
  });

  it("an abort mid-run resumes from the cursor (or from the start) without loss or duplicates", async () => {
    db.failAfter = 3;
    const first = await runSweep(all, settle, { realm: "europe", apply: true, limit: 100 }, NOW);
    expect(first.errors).toHaveLength(1);
    expect(first.checked).toBeLessThan(12);
    db.failAfter = Infinity;
    let r = await runSweep(all, settle, { realm: "europe", apply: true, after: first.next, limit: 4 }, NOW);
    while (r.next) r = await runSweep(all, settle, { realm: "europe", apply: true, after: r.next, limit: 4 }, NOW);
    expect(snapshot()).toBe(JSON.stringify([...expected()].sort((a, b) => key(a).localeCompare(key(b)))));
    // and a full rerun from the start changes nothing
    const done = snapshot();
    await runSweep(all, settle, { realm: "europe", apply: true, limit: 100 }, NOW);
    expect(snapshot()).toBe(done);
  });

  it("batches walk the realm in id order with a resume cursor", async () => {
    const seen: string[] = [];
    let r = await runSweep(all, settle, { realm: "europe", limit: 5 }, NOW);
    seen.push(...r.villages.map((v) => v.seed));
    while (r.next) { r = await runSweep(all, settle, { realm: "europe", after: r.next, limit: 5 }, NOW); seen.push(...r.villages.map((v) => v.seed)); }
    expect(seen).toEqual(villages.map((s) => s.id));
  });

  it("a receipt that disagrees with the calendar halts the sweep before anything is written for that village", async () => {
    const victim = villages[5]!;
    const i = db.rows.findIndex((r) => r.seed_id === victim.id && r.wedding_index === 1);
    db.rows[i] = { ...db.rows[i]!, dowry: db.rows[i]!.dowry + 7 };
    const before = snapshot();
    const r = await runSweep(all, settle, { realm: "europe", apply: true, after: villages[4]!.id, limit: 100 }, NOW);
    expect(r.halted).toEqual({ seed: victim.id, mismatches: [1] });
    expect(r.next).toBe(villages[4]!.id);
    expect(r.inserted).toBe(0);
    expect(snapshot()).toBe(before);
  });

  it("interlock: if the database's switch date differs (one deploy missing), the sweep halts and books nothing beyond it", async () => {
    // the database switched earlier than this code knows: receipts after that instant would be frozen under the wrong rule
    const cut = Date.parse(weddingReceiptRows(villages[1]!, NOW).at(-1)!.occurred_at) - 1;
    dbSwitch.value = new Date(cut).toISOString();
    resetWeddingSwitchCache();
    const r = await runSweep(all, settle, { realm: "europe", apply: true, limit: 100 }, NOW);
    expect(r.halted?.switchMismatch).toBe(true);
    expect(r.halted?.seed).toBe(villages[0]!.id);
    for (const w of db.writes) expect(Date.parse(w.occurred_at)).toBeLessThan(cut);
    // the treasury path (settle without the sweep) books only the rows both sides agree on
    const before = db.rows.length;
    const s1 = await settleWeddings(villages[1]!, NOW);
    expect(s1.switchMismatch).toBe(true);
    for (const w of db.rows.slice(before)) expect(Date.parse(w.occurred_at)).toBeLessThan(cut);
    expect(db.rows.some((x) => x.seed_id === villages[1]!.id && Date.parse(x.occurred_at) > cut)).toBe(false);
  });

  it("before migration 0159 (function missing) the database counts as legacy forever: settle still books, the sweep halts", async () => {
    const r = await (async () => { dbSwitch.value = null; resetWeddingSwitchCache(); return runSweep(all, settle, { realm: "europe", apply: true, limit: 100 }, NOW); })();
    expect(r.halted?.switchMismatch).toBe(true);
    expect(r.inserted).toBe(0);
    dbSwitch.value = null;
    resetWeddingSwitchCache();
    const s1 = await settleWeddings(villages[2]!, NOW);
    expect(s1.switchMismatch).toBe(true);
    expect(s1.mismatches).toEqual([]);
  });
});
