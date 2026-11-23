import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ITEMS } from "./economy";
import { AUSBAU_PRICE } from "./ausbau";
import {
  KONTOR_PRICE,
  MATERIAL_ITEMS,
  RESOURCES,
  RESOURCES_LAB_SINCE,
  RESOURCES_SINCE,
  RESOURCE_START,
  STONE_FROM_PRICE,
  kontorQuote,
  materialNeed,
  materialPrice,
  resourceDaily,
  resourceRates,
  resourcesSince,
} from "./resources";
import { RESOURCE_T } from "./lang/resources";
import { LANGS } from "./i18n";

// Wirtschaft Paket 1: the TypeScript mirror (display, quote) must equal the database rules in migration 0142.
const SQL = readFileSync(
  new URL("../../drizzle/migrations/0142_resources.sql", import.meta.url),
  "utf8",
);
const ts = (s: string) => Date.parse(s.replace(" ", "T").replace("+00", "Z"));

describe("resources: TypeScript mirrors migration 0142", () => {
  it("cut-over dates: lab from 2026-11-23, public maps only from the far future (a Monday)", () => {
    const m = /WHEN _realm = 'lab' THEN '([^']+)'::timestamptz\s+ELSE '([^']+)'::timestamptz/.exec(
      SQL,
    )!;
    expect(ts(m[1]!)).toBe(RESOURCES_LAB_SINCE);
    expect(ts(m[2]!)).toBe(RESOURCES_SINCE);
    expect(resourcesSince("lab")).toBe(RESOURCES_LAB_SINCE);
    for (const r of ["europe", "europe-2", "us-west", "asia-2"])
      expect(resourcesSince(r)).toBe(RESOURCES_SINCE);
    expect(RESOURCES_SINCE).toBeGreaterThan(Date.UTC(2099, 0, 1));
  });
  it("the same resources, start stock, Kontor prices and stone threshold", () => {
    expect(SQL).toContain(`resource IN (${RESOURCES.map((r) => `'${r}'`).join(",")})`);
    expect(SQL).toContain(`'wood', ${RESOURCE_START.wood}, 'start'`);
    expect(SQL).toContain(`'stone', ${RESOURCE_START.stone}, 'start'`);
    expect(SQL).toContain(`kontor := mw * ${KONTOR_PRICE.wood} + ms * ${KONTOR_PRICE.stone};`);
    expect(SQL).toContain(
      `WHEN NEW.cost >= ${STONE_FROM_PRICE} THEN round(NEW.cost::numeric / 30)`,
    );
    expect(SQL).toContain("nw := round(NEW.cost::numeric / 20);");
  });
  it("exactly the buildings and upgrades use material — the list in SQL equals MATERIAL_ITEMS", () => {
    const block = /IF NEW\.item NOT IN \(([^)]+)\)/.exec(SQL)![1]!;
    const sqlItems = [...block.matchAll(/'([a-z0-9]+)'/g)].map((m) => m[1]);
    expect([...sqlItems].sort()).toEqual([...MATERIAL_ITEMS].sort());
    expect(MATERIAL_ITEMS).toHaveLength(
      Object.keys(ITEMS).length + Object.keys(AUSBAU_PRICE).length,
    );
    for (const it of [
      "chest2",
      "belfry1",
      "freimarkt1",
      "bauhuette1",
      "fountain1",
      "rank2",
      "title1",
    ])
      expect(MATERIAL_ITEMS).not.toContain(it);
  });
  it("production and storage follow Variante D in both places", () => {
    expect(resourceRates(new Set())).toEqual({
      wood: { rate: 1, cap: 100 },
      stone: { rate: 0.5, cap: 100 },
    });
    expect(resourceRates(new Set(["woodcamp", "granary", "granary2"]))).toEqual({
      wood: { rate: 5, cap: 600 },
      stone: { rate: 0.5, cap: 400 },
    });
    expect(SQL).toContain("WHEN 'wood' THEN 1 + 4 * (EXISTS");
    expect(SQL).toContain("WHEN 'stone' THEN 0.5");
    expect(SQL).toContain("WHEN _resource = 'wood' THEN 200 * (EXISTS");
    expect(SQL.match(/150 \* \(EXISTS/g)).toHaveLength(2);
  });
});

describe("resources: material, Kontor and daily units", () => {
  it("wood price/20 for every building, stone price/30 only from 500 Mark (V1)", () => {
    expect(materialNeed(90)).toEqual({ wood: 5, stone: 0 }); // 4.5 rounds up like SQL round()
    expect(materialNeed(240)).toEqual({ wood: 12, stone: 0 });
    expect(materialNeed(499)).toEqual({ wood: 25, stone: 0 });
    expect(materialNeed(500)).toEqual({ wood: 25, stone: 17 });
    expect(materialNeed(1200)).toEqual({ wood: 60, stone: 40 });
    expect(materialPrice("healer")).toBe(550);
    expect(materialPrice("granary3")).toBe(1000);
    expect(materialPrice("chest2")).toBeNull();
  });
  it("the Kontor charges only the missing units: wood 4, stone 6 Mark", () => {
    expect(kontorQuote({ wood: 60, stone: 40 }, { wood: 60, stone: 30 })).toEqual({
      need: { wood: 60, stone: 40 },
      missing: { wood: 0, stone: 10 },
      cost: 60,
    });
    expect(kontorQuote({ wood: 12, stone: 0 }, { wood: 3, stone: 0 })).toMatchObject({
      missing: { wood: 9, stone: 0 },
      cost: 36,
    });
    expect(kontorQuote({ wood: 5, stone: 0 }, { wood: 50, stone: 10 }).cost).toBe(0);
  });
  it("fractional rates become whole units without drift: 0.5 gives exactly one unit every second day", () => {
    let sum = 0;
    for (let d = 1; d <= 100; d++) {
      const a = resourceDaily(0.5, d);
      expect([0, 1]).toContain(a);
      sum += a;
    }
    expect(sum).toBe(50);
    for (let d = 1; d <= 10; d++) expect(resourceDaily(5, d)).toBe(5);
  });
  it("texts exist in all eight languages", () => {
    for (const l of LANGS) {
      const t = RESOURCE_T[l];
      expect(t.wood && t.stone && t.need && t.short && t.store, l).toBeTruthy();
      expect(t.kontor("3 x", "18 M"), l).toContain("18 M");
      expect(t.perDay("5"), l).toContain("5");
    }
  });
});
