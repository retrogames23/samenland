import { describe, it, expect } from "vitest";
import { weddingDates } from "./weddings";
import { weddingReceiptRows, auditReceipts, divergentIndices, WEDDING_RECEIPT_VERSION, type BookedReceipt } from "./wedding-receipts";
import type { Seed } from "./world";

const s = { id: "w", user_id: "u", x: 500, y: 500, created_at: "2026-01-01T00:00:00Z" } as unknown as Seed;
const c0 = Date.parse(s.created_at), D = 864e5;
const CARE = ["fisher", "hunter", "granary", "dairy", "herbs", "healer"].map((item) => ({ item, at: 0 }));
const grown = { ...s, id: "g", bought: CARE } as Seed;

describe("wedding receipts", () => {
  it("no weddings before day 2, one exactly at day 2", () => {
    expect(weddingReceiptRows(s, c0 + 2 * D - 1)).toHaveLength(0);
    expect(weddingReceiptRows(s, c0 + 2 * D)).toHaveLength(1);
  });

  it("rows mirror weddingDates one to one (the TypeScript calendar stays the single source)", () => {
    for (const seed of [s, grown]) {
      const now = c0 + 400 * D, dates = weddingDates(seed, now), rows = weddingReceiptRows(seed, now);
      expect(rows).toHaveLength(dates.length);
      rows.forEach((r, i) => {
        expect(r.seed_id).toBe(seed.id);
        expect(r.wedding_index).toBe(dates[i]!.k);
        expect(Date.parse(r.occurred_at)).toBe(dates[i]!.at);
        expect(r.dowry).toBe(dates[i]!.dowry);
        expect(r.is_grand).toBe(dates[i]!.grand);
        expect(r.is_town).toBe(dates[i]!.town);
        expect(r.version).toBe(WEDDING_RECEIPT_VERSION);
      });
    }
  });

  it("indices are gap-free from 0 and instants strictly increase (matches UNIQUE/PK in the migration)", () => {
    const rows = weddingReceiptRows(grown, c0 + 900 * D);
    expect(rows.length).toBeGreaterThan(20);
    rows.forEach((r, i) => expect(r.wedding_index).toBe(i));
    for (let i = 1; i < rows.length; i++) expect(Date.parse(rows[i]!.occurred_at)).toBeGreaterThan(Date.parse(rows[i - 1]!.occurred_at));
  });

  it("dowries are non-negative integers and timestamps survive the millisecond round trip", () => {
    for (const r of weddingReceiptRows(grown, c0 + 900 * D)) {
      expect(Number.isInteger(r.dowry) && r.dowry >= 0).toBe(true);
      expect(new Date(r.occurred_at).toISOString()).toBe(r.occurred_at);
    }
  });

  it("is append-only over time: a later settlement only adds rows, never changes earlier ones", () => {
    const early = weddingReceiptRows(grown, c0 + 300 * D), late = weddingReceiptRows(grown, c0 + 600 * D);
    expect(late.length).toBeGreaterThan(early.length);
    expect(late.slice(0, early.length)).toEqual(early);
  });

  it("the lab realm produces no receipts before its switch (the SQL calendar pays those dowries)", () => {
    expect(weddingReceiptRows({ ...s, realm: "lab" } as Seed, c0 + 400 * D)).toEqual([]);
  });

  describe("auditReceipts: full comparison, never a count shortcut (Korrektur A)", () => {
    const rows = () => weddingReceiptRows(grown, c0 + 300 * D);
    const store = (r: ReturnType<typeof rows>): BookedReceipt[] =>
      r.map(({ wedding_index, occurred_at, dowry, is_grand, is_town, version }) => ({ wedding_index, occurred_at, dowry, is_grand, is_town, version }));
    it("has enough weddings to test holes in the middle", () => expect(rows().length).toBeGreaterThan(6));

    it("A1 complete indices but a wrong dowry: divergent", () => {
      const r = rows(), b = store(r); b[3] = { ...b[3]!, dowry: b[3]!.dowry + 1 };
      const a = auditReceipts(r, b);
      expect(a.changed).toEqual([{ index: 3, fields: ["dowry"] }]);
      expect(divergentIndices(a)).toEqual([3]);
      expect(a.missing).toEqual([]);
    });
    it("A2 complete indices but a wrong instant (one millisecond): divergent", () => {
      const r = rows(), b = store(r); b[2] = { ...b[2]!, occurred_at: new Date(Date.parse(b[2]!.occurred_at) + 1).toISOString() };
      expect(auditReceipts(r, b).changed).toEqual([{ index: 2, fields: ["occurred_at"] }]);
      // the same instant written differently is the same receipt
      const c = store(r); c[2] = { ...c[2]!, occurred_at: c[2]!.occurred_at.replace("Z", "+00:00") };
      expect(divergentIndices(auditReceipts(r, c))).toEqual([]);
    });
    it("A3 complete indices but a wrong version: divergent (also grand/town flags)", () => {
      const r = rows(), b = store(r); b[1] = { ...b[1]!, version: 2 }; b[4] = { ...b[4]!, is_grand: !b[4]!.is_grand };
      expect(auditReceipts(r, b).changed).toEqual([{ index: 1, fields: ["version"] }, { index: 4, fields: ["is_grand"] }]);
    });
    it("A4 a missing middle index is a hole (divergent), not something to fill", () => {
      const r = rows(), b = store(r).filter((x) => x.wedding_index !== 3);
      const a = auditReceipts(r, b);
      expect(a.holes).toEqual([3]);
      expect(a.missing).toEqual([]);
      expect(divergentIndices(a)).toEqual([3]);
    });
    it("A5 a missing first receipt is a hole; missing last ones are only not settled yet", () => {
      const r = rows();
      const first = auditReceipts(r, store(r).slice(1));
      expect(first.holes).toEqual([0]);
      const last = auditReceipts(r, store(r).slice(0, r.length - 2));
      expect(divergentIndices(last)).toEqual([]);
      expect(last.missing.map((x) => x.wedding_index)).toEqual([r.length - 2, r.length - 1]);
      const none = auditReceipts(r, []);
      expect(none.missing).toHaveLength(r.length);
      expect(divergentIndices(none)).toEqual([]);
    });
    it("A6 a receipt the calendar does not have is unexpected (divergent)", () => {
      const r = rows(), b = store(r);
      b.push({ ...b[b.length - 1]!, wedding_index: r.length + 4, occurred_at: new Date(Date.parse(b[b.length - 1]!.occurred_at) + 5).toISOString() });
      const a = auditReceipts(r, b);
      expect(a.unexpected).toEqual([r.length + 4]);
      expect(divergentIndices(a)).toEqual([r.length + 4]);
    });
    it("A7 a correct complete set: nothing to send, nothing divergent", () => {
      const r = rows(), a = auditReceipts(r, store(r));
      expect(a).toEqual({ missing: [], holes: [], changed: [], unexpected: [] });
    });
    it("lab: receipts start at the first wedding after the switch, so the earlier indices are not holes", () => {
      const r = rows().slice(4), a = auditReceipts(r, store(r.slice(0, 2)));
      expect(a.holes).toEqual([]);
      expect(a.missing.map((x) => x.wedding_index)).toEqual(r.slice(2).map((x) => x.wedding_index));
    });
  });
});
