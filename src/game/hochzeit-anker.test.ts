// Paket A2 (Anker-Fortsetzung): the pure planning of wedding receipts (wedding-receipts.ts planReceipts,
// weddings.ts weddingCalendarFrom) with the REAL unified rule. The switch instant is fixed in the code (placeholder
// 2100-01-04), so villages are founded shortly before it, exactly like hochzeitspaket.test.ts. Booking is simulated by
// keeping the planned rows as "booked" — the database side of the same properties is tested on real PostgreSQL in
// src/lib/hochzeit-anker.pg.test.ts.
//
// Abnahmekriterien (test names start with the criterion):
//   A2-K1  a booked wedding stays unchanged when calendar factors change later
//   A2-K2  the next wedding continues from the last booking anchor
//   A2-K3  a village without weddings gets a traceable initial state
//   A2-K4  a non-reconstructible stock is quarantined, never repaired
//   A2-K8  the wedding rule is unchanged (continuation = the same step; see also hochzeit-regel-golden.test.ts)
//   A2-K9  regression: later Gesellenherberge, Holzfällerlager, Handwerks-Freibrief
import { describe, expect, it } from "vitest";
import { weddingCalendar, weddingCalendarFrom, wedGapHours, WEDDING_SWITCH_SINCE, WEDDING_SWITCH_LAB_SINCE, WED_FIRST } from "./weddings";
import { planReceipts, weddingReceiptRows, type BookedReceipt, type WeddingReceiptRow } from "./wedding-receipts";
import type { Seed } from "./world";

const D = 864e5, H = 3.6e6, T = WEDDING_SWITCH_SINCE;
const C0 = T - 320 * D;
let n = 0;
const village = (P: number, extra: [string, number][], realm = "europe", over: Partial<Seed> = {}): Seed =>
  ({ id: `a2-${++n}`, user_id: "u", realm, x: 500, y: 500, created_at: new Date(C0).toISOString(),
     bought: [["fisher", C0 + D], ["hunter", C0 + 2 * D], ...extra].map(([item, at]) => ({ item, at })), ...over }) as unknown as Seed;
/** a fresh id: no calendar cache hit, as on another worker */
const fresh = (s: Seed): Seed => ({ ...JSON.parse(JSON.stringify(s)), id: `a2-${++n}` });
const BASES: { name: string; make: (P: number) => Seed }[] = [
  { name: "Dom 1–3", make: (P) => village(P, [["cathedral1", P], ["cathedral2", P + 1], ["cathedral3", P + 2]]) },
  { name: "Universität 1–3", make: (P) => village(P, [["university1", P], ["university2", P + 1], ["university3", P + 2]]) },
  { name: "Dom 1–3 (lab)", make: (P) => village(P, [["cathedral1", P], ["cathedral2", P + 1], ["cathedral3", P + 2]], "lab") },
  { name: "Dom 1–5 + Universität 1–4", make: (P) => village(P, [["cathedral1", P], ["cathedral2", P + 1], ["cathedral3", P + 2], ["cathedral4", P + 3],
      ["cathedral5", P + 4], ["university1", P + 5], ["university2", P + 6], ["university3", P + 7], ["university4", P + 8]], "europe",
      { blessed: [P - 3 * D, P - D], decisions: [{ event: "journeyman", choice: "host", at: P - 2 * D, cost: 30 }], aid: [P - D] } as Partial<Seed>) },
];
type Act = { name: string; apply: (s: Seed, at: number) => Seed };
const buy = (item: string) => (s: Seed, at: number): Seed => ({ ...s, bought: [...(s.bought ?? []), { item, at }] });
/** The three known retroactive calendar factors (O1 release review T15, world.ts buildWith without a date check). */
const RETRO: Act[] = [
  { name: "Gesellenherberge", apply: buy("herberge") },
  { name: "Holzfällerlager", apply: buy("woodcamp") },
  { name: "Handwerks-Freibrief", apply: (s, at) => ({ ...s, charter: { path: "craft", at } }) as Seed },
];
const OTHER: Act[] = [
  ...["markethall", "herbs", "healer", "library", "badestube", "beginen", "granary", "dairy", "cathedral4", "orangery1", "orangery2", "school"].map((i) => ({ name: i, apply: buy(i) })),
  { name: "Segnung", apply: (s, at) => ({ ...s, blessed: [...(s.blessed ?? []), at] }) },
  { name: "Entscheidung", apply: (s, at) => ({ ...s, decisions: [...(s.decisions ?? []), { event: "journeyman", choice: "host", at, cost: 30 }] }) as Seed },
  { name: "Freibrief Handel", apply: (s, at) => ({ ...s, charter: { path: "trade", at } }) as Seed },
];
const stored = (rows: WeddingReceiptRow[]): BookedReceipt[] => rows.map(({ seed_id: _s, ...r }) => ({ ...r }));
const fields = (r: BookedReceipt | WeddingReceiptRow) => [r.wedding_index, Date.parse(r.occurred_at), r.dowry, r.is_grand, r.is_town, r.version, r.next_at ? Date.parse(r.next_at) : null];
/** Books everything up to `at` the way the trusted server does (planReceipts, then keep the rows). */
const settle = (s: Seed, booked: BookedReceipt[], at: number) => {
  const p = planReceipts(fresh(s), booked, at);
  expect(p.quarantine, "no quarantine expected").toBeNull();
  return [...booked, ...stored(p.rows)];
};
/** Purchase times of the monument steps around the switch and cut points (the grid of the O1 release review, T15). */
const Ps = Array.from({ length: 40 }, (_, i) => T - 6 * D + i * 18 * H);
const cuts = (s: Seed) => weddingReceiptRows(fresh(s), T + 70 * D).filter((r) => Date.parse(r.occurred_at) >= T && Date.parse(r.occurred_at) < T + 55 * D)
  .filter((_, i) => i % 3 === 0).map((r) => Date.parse(r.occurred_at) + 30 * 60e3);

describe("Paket A2 – Anker-Fortsetzung (pure planning, real unified rule)", () => {
  it("A2-K1/A2-K9 booked weddings never move: later Herberge, Holzfällerlager, Handwerks-Freibrief and other actions", () => {
    const stat: Record<string, { cases: number; refMoved: number }> = {};
    for (const a of [...RETRO, ...OTHER]) stat[a.name] = { cases: 0, refMoved: 0 };
    for (const b of BASES) for (const [pi, P] of Ps.entries()) {
      const s0 = b.make(P);
      for (const [xi, X] of cuts(s0).entries()) {
        const booked = settle(s0, [], X);
        const anchorRow = booked[booked.length - 1]!;
        // all retroactive factors on the full grid; the other actions on every fifth purchase time and the first cuts
        for (const a of pi % 5 === 0 && xi < 4 ? [...RETRO, ...OTHER] : RETRO) {
          const s1 = a.apply(s0, X + H);
          const later = X + 40 * D;
          const p = planReceipts(fresh(s1), booked, later);
          stat[a.name]!.cases++;
          // the booked history is accepted as it is: no quarantine, no re-plan of a booked index
          expect(p.quarantine, `${b.name} ${a.name}`).toBeNull();
          expect(p.kind).toBe("anchored");
          expect(p.rows.every((r) => r.wedding_index > anchorRow.wedding_index)).toBe(true);
          // after booking the continuation the earlier receipts are byte-identical (receipts are append-only)
          const after = [...booked, ...stored(p.rows)];
          expect(after.slice(0, booked.length).map(fields)).toEqual(booked.map(fields));
          // the reference recomputation would have moved booked weddings for the retroactive factors (the test bites)
          const hist = (r: BookedReceipt | WeddingReceiptRow) => fields(r).slice(0, 6).join("|");
          if (weddingReceiptRows(fresh(s1), X).map(hist).join(";") !== booked.map(hist).join(";")) stat[a.name]!.refMoved++;
        }
      }
    }
    // the three retroactive factors really would move booked weddings without the anchor …
    for (const a of RETRO) expect(stat[a.name]!.refMoved, a.name).toBeGreaterThan(0);
    // … and every case was covered (bases × purchase times × cut points)
    for (const a of RETRO) expect(stat[a.name]!.cases).toBeGreaterThan(900);
    for (const a of OTHER) expect(stat[a.name]!.cases).toBeGreaterThan(100);
    console.log("A2-K1/K9", JSON.stringify(stat));
  }, 300000);

  it("A2-K2 the continuation starts at the stored next instant with the next index and steps with the unchanged rule", () => {
    let checked = 0;
    for (const b of BASES) for (const P of Ps.filter((_, i) => i % 3 === 0)) {
      const s0 = b.make(P);
      const X = T + 9 * D + 7 * H;
      const booked = settle(s0, [], X);
      const last = booked[booked.length - 1]!;
      for (const a of RETRO) {
        const s1 = a.apply(s0, X + H);
        const p = planReceipts(fresh(s1), booked, X + 50 * D);
        expect(p.anchor).toEqual({ k: last.wedding_index, at: Date.parse(last.occurred_at), next: Date.parse(last.next_at!) });
        const first = p.rows[0]!;
        expect(first.wedding_index).toBe(last.wedding_index + 1);
        expect(Date.parse(first.occurred_at)).toBe(Date.parse(last.next_at!));
        for (let i = 0; i < p.rows.length; i++) {
          const t = Date.parse(p.rows[i]!.occurred_at), nx = Date.parse(p.rows[i]!.next_at);
          expect(nx - t).toBe(wedGapHours(s1, t) * H); // the rule's own gap, from the current state
          if (i + 1 < p.rows.length) expect(Date.parse(p.rows[i + 1]!.occurred_at)).toBe(nx);
          expect(p.rows[i]!.wedding_index).toBe(last.wedding_index + 1 + i);
          expect(p.rows[i]!.version).toBe(2);
        }
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(30);
  });

  it("A2-K8 without later changes the continuation is exactly the reference calendar (same step, same rule)", () => {
    for (const b of BASES) for (const P of Ps.filter((_, i) => i % 4 === 0)) {
      const s = b.make(P);
      const until = T + 70 * D, ref = weddingReceiptRows(fresh(s), until);
      for (const X of [T - 3 * D, T + 2 * H, T + 20 * D, T + 41 * D]) {
        const booked = settle(s, [], X);
        const p = planReceipts(fresh(s), booked, until);
        expect([...booked, ...stored(p.rows)].map(fields), `${b.name} X=${new Date(X).toISOString()}`).toEqual(stored(ref).map(fields));
      }
      // weddingCalendarFrom from any calendar point reproduces the calendar's tail
      const cal = weddingCalendar(fresh(s), until);
      for (const k of [3, 10, cal.length - 5]) {
        const w = cal[k]!, nx = cal[k + 1]!.at;
        const tail = weddingCalendarFrom(fresh(s), { k: w.k, at: w.at, next: nx }, until).list;
        expect(tail).toEqual(cal.slice(k + 1));
      }
    }
  });

  it("A2-K3 a village without weddings: initial state from the founding (index 0 on day 2, anchors chained)", () => {
    const s = village(T - 2 * D, []);
    const c0 = Date.parse(s.created_at);
    const none = planReceipts(s, [], c0 + WED_FIRST - 1);
    expect(none).toMatchObject({ kind: "initial", anchor: null, rows: [], quarantine: null });
    const p = planReceipts(s, [], c0 + 90 * D);
    expect(p.kind).toBe("initial");
    expect(p.anchor).toBeNull();
    expect(p.rows[0]).toMatchObject({ wedding_index: 0, occurred_at: new Date(c0 + WED_FIRST).toISOString(), version: 1 });
    p.rows.forEach((r, i) => { if (i + 1 < p.rows.length) expect(r.next_at).toBe(p.rows[i + 1]!.occurred_at); });
    expect(p.rows.map(fields)).toEqual(stored(weddingReceiptRows(fresh(s), c0 + 90 * D)).map(fields));
    // once the first unified-rule receipt is booked, the village is anchored there
    const later = T + 30 * D, booked = settle(s, [], later);
    const again = planReceipts(fresh(s), booked, later);
    expect(again.kind).toBe("anchored");
    expect(again.anchor?.k).toBe(booked[booked.length - 1]!.wedding_index);
    expect(again.rows).toEqual([]);
    // a village founded after the switch starts at index 0 with version 2; lab starts at its first wedding from the switch
    const late = { ...s, id: "a2-late", created_at: new Date(T + D).toISOString() } as Seed;
    expect(planReceipts(late, [], T + 20 * D).rows[0]).toMatchObject({ wedding_index: 0, version: 2 });
    const lab = { ...s, id: "a2-lab", realm: "lab", created_at: new Date(WEDDING_SWITCH_LAB_SINCE - 30 * D).toISOString() } as Seed;
    const lp = planReceipts(lab, [], WEDDING_SWITCH_LAB_SINCE + 20 * D);
    expect(lp.kind).toBe("initial");
    expect(Date.parse(lp.rows[0]!.occurred_at)).toBeGreaterThanOrEqual(WEDDING_SWITCH_LAB_SINCE);
    expect(lp.rows[0]!.wedding_index).toBeGreaterThan(0);
  });

  describe("A2-K4 quarantine instead of repair", () => {
    const s = BASES[0]!.make(Ps[6]!);
    const X = T + 25 * D;
    const good = () => settle(s, [], X);
    const firstNew = (b: BookedReceipt[]) => b.findIndex((r) => r.version === 2);
    it("A2-K4 legacy receipt that differs (dowry, instant, hole, unexpected): legacy_divergent, nothing planned", () => {
      const cases: [string, (b: BookedReceipt[]) => BookedReceipt[]][] = [
        ["dowry", (b) => b.map((r, i) => (i === 3 ? { ...r, dowry: r.dowry + 1 } : r))],
        ["instant", (b) => b.map((r, i) => (i === 2 ? { ...r, occurred_at: new Date(Date.parse(r.occurred_at) + 1).toISOString() } : r))],
        ["hole", (b) => b.filter((_, i) => i !== 4)],
        ["unexpected", (b) => [...b.slice(0, firstNew(b)), { ...b[0]!, wedding_index: 999 }]],
      ];
      for (const [name, mutate] of cases) {
        const p = planReceipts(fresh(s), mutate(good()), X + 10 * D);
        expect(p.quarantine?.reason, name).toBe("legacy_divergent");
        expect(p.rows, name).toEqual([]);
        expect(p.anchor, name).toBeNull();
      }
    });
    it("A2-K4 unified receipt without anchor (booked before 0160): unanchored, never recomputed or re-booked", () => {
      const b = good().map((r) => (r.version === 2 ? { ...r, next_at: null } : r));
      const p = planReceipts(fresh(s), b, X + 10 * D);
      expect(p.quarantine?.reason).toBe("unanchored");
      expect(p.quarantine?.indices.length).toBe(b.filter((r) => r.version === 2).length);
      expect(p.rows).toEqual([]);
    });
    it("A2-K4 broken chain (gap, instant ≠ previous next_at, wrong first unified instant): chain_break", () => {
      const b = good(), i = firstNew(b);
      const gap = b.filter((_, k) => k !== i + 2);
      expect(planReceipts(fresh(s), gap, X + 10 * D).quarantine?.reason).toBe("chain_break");
      const moved = b.map((r, k) => (k === i + 3 ? { ...r, occurred_at: new Date(Date.parse(r.occurred_at) + H).toISOString() } : r));
      expect(planReceipts(fresh(s), moved, X + 10 * D).quarantine).toEqual({ reason: "chain_break", indices: [b[i + 3]!.wedding_index] });
      const shifted = b.map((r, k) => (k === i ? { ...r, occurred_at: new Date(Date.parse(r.occurred_at) - H).toISOString() } : r));
      expect(planReceipts(fresh(s), shifted, X + 10 * D).quarantine?.reason).toBe("chain_break");
    });
    it("A2-K4 the planner never changes booked receipts: in every quarantine case the booked list is returned untouched", () => {
      const b = good().map((r, k) => (k === 1 ? { ...r, dowry: 0 } : r));
      const copy = JSON.stringify(b);
      const p = planReceipts(fresh(s), b, X + 10 * D);
      expect(JSON.stringify(b)).toBe(copy);
      expect(p.audit.missing).toEqual([]);
    });
  });
});
