import { describe, it, expect } from "vitest";
import { weddingDates } from "./weddings";
import { weddingReceiptRows, receiptsComplete, WEDDING_RECEIPT_VERSION } from "./wedding-receipts";
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

  it("the lab realm never produces receipts", () => {
    expect(weddingReceiptRows({ ...s, realm: "lab" } as Seed, c0 + 400 * D)).toEqual([]);
  });

  it("receiptsComplete: exactly 0..n-1 counts as complete, holes and strays do not", () => {
    expect(receiptsComplete(0, null, 0)).toBe(true);
    expect(receiptsComplete(5, 4, 5)).toBe(true); // 0,1,2,3,4
    expect(receiptsComplete(4, 4, 5)).toBe(false); // 0,1,2,4 -> hole at 3
    expect(receiptsComplete(5, 5, 5)).toBe(false); // 0,1,2,4,5 -> hole at 3, stray 5
    expect(receiptsComplete(6, 5, 5)).toBe(false); // more receipts than the calendar has
    expect(receiptsComplete(3, 2, 5)).toBe(false); // simply not booked yet
    expect(receiptsComplete(0, null, 3)).toBe(false);
  });
});
