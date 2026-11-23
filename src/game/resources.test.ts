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
  SITE_KONTOR,
  SITE_STONE,
  SITE_WOOD,
  STEINGRUBE_PRICE,
  STEINGRUBE_WOOD,
  kontorQuote,
  materialNeed,
  materialOf,
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
    // 0142 had the buildings and upgrades; 0143 (below) adds the Steingrube
    expect([...sqlItems].sort()).toEqual(MATERIAL_ITEMS.filter((i) => i !== "steingrube").sort());
    expect(MATERIAL_ITEMS).toHaveLength(
      Object.keys(ITEMS).length + Object.keys(AUSBAU_PRICE).length + 1,
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

// ---------------- Paket 2: Steingrube and location (migration 0143) ----------------
const SQL2 = readFileSync(
  new URL("../../drizzle/migrations/0143_steingrube.sql", import.meta.url),
  "utf8",
);

describe("Paket 2: TypeScript mirrors migration 0143", () => {
  it("the material list of 0143 equals MATERIAL_ITEMS, the Steingrube uses a fixed 20 wood and no stone", () => {
    const block = /IF NEW\.item NOT IN \(([^)]+)\)/.exec(SQL2)![1]!;
    expect([...block.matchAll(/'([a-z0-9]+)'/g)].map((m) => m[1]).sort()).toEqual(
      [...MATERIAL_ITEMS].sort(),
    );
    expect(SQL2).toContain(`IF NEW.item = 'steingrube' THEN nw := ${STEINGRUBE_WOOD}; ns := 0;`);
    expect(materialOf("steingrube")).toEqual({ wood: 20, stone: 0 });
    expect(materialOf("healer")).toEqual(materialNeed(550));
    expect(materialOf("chest2")).toBeNull();
  });
  it("Steingrube: one plain price of 150 Mark — UI constant, quote and the server's guard expression agree", () => {
    expect(STEINGRUBE_PRICE).toBe(150);
    expect(materialPrice("steingrube")).toBe(STEINGRUBE_PRICE);
    // 0143 is already applied and stays untouched; its expression must evaluate to exactly this price
    const m = /IF NEW\.item = 'steingrube' THEN\s+price := (\d+) - (\d+);/.exec(SQL2)!;
    expect(Number(m[1]) - Number(m[2])).toBe(STEINGRUBE_PRICE);
    // nothing in 0143 credits money for it (no balance addition, no reward row)
    expect(SQL2).not.toMatch(
      /village_balance[^;]*\+|INSERT INTO public\.(gifts|quest_claims|referrals)/,
    );
    expect(ITEMS).not.toHaveProperty("steingrube"); // no civic work: prosperity, tax and dowries stay untouched
  });
  it("location factors in SQL equal SITE_WOOD / SITE_STONE / SITE_KONTOR (Variante D original, Phase 1.2)", () => {
    expect(SQL2).toContain(
      `WHEN 'workshop' THEN ${SITE_WOOD.workshop} WHEN 'gateway' THEN ${SITE_WOOD.gateway} ELSE ${SITE_WOOD.grain} END`,
    );
    expect(SQL2).toContain(
      `WHEN 'workshop' THEN ${SITE_STONE.workshop} WHEN 'gateway' THEN ${SITE_STONE.gateway} ELSE ${SITE_STONE.grain} END`,
    );
    expect(SQL2).toContain(`= 'gateway' THEN ${SITE_KONTOR.gateway} ELSE 1 END`);
    expect(SITE_KONTOR).toEqual({ grain: 1, workshop: 1, gateway: 0.9 }); // no surcharges anywhere
  });
  it("wood: Binnenland keeps exactly the 5 wood/day of Paket 1; Wald/Hügel 7; Küste 4 (Variante D: 1 + 4 × 1 / 1.5 / 0.75)", () => {
    const camp = new Set(["woodcamp"]);
    expect(resourceRates(camp, "grain").wood.rate).toBe(5);
    expect(resourceRates(camp, null).wood.rate).toBe(5); // uncertified shows Binnenland, as in Paket 1
    expect(resourceRates(camp, "workshop").wood.rate).toBe(7);
    expect(resourceRates(camp, "gateway").wood.rate).toBe(4);
    for (const w of ["grain", "workshop", "gateway"] as const)
      expect(resourceRates(new Set(), w).wood.rate).toBe(1);
  });
  it("stone: base 0.5 everywhere, a Steingrube adds 3 / 4 / 1 (coast 1 = Variante D original; V5's 2 stays open)", () => {
    const pit = new Set(["steingrube"]);
    expect(resourceRates(pit, "grain").stone.rate).toBe(3.5);
    expect(resourceRates(pit, "workshop").stone.rate).toBe(4.5);
    expect(resourceRates(pit, "gateway").stone.rate).toBe(1.5);
    expect(resourceRates(new Set(), "gateway").stone.rate).toBe(0.5);
  });
  it("the coast pays 90 % at the Kontor, rounded half up like SQL; everywhere else the full price", () => {
    const need = { wood: 0, stone: 40 },
      stock = { wood: 0, stone: 30 };
    expect(kontorQuote(need, stock, "grain").cost).toBe(60);
    expect(kontorQuote(need, stock, "workshop").cost).toBe(60);
    expect(kontorQuote(need, stock, "gateway").cost).toBe(54);
    expect(kontorQuote({ wood: 15, stone: 0 }, { wood: 0, stone: 0 }, "gateway").cost).toBe(54); // 60 × 0.9
    expect(kontorQuote({ wood: 3, stone: 0 }, { wood: 0, stone: 0 }, "gateway").cost).toBe(11); // 10.8
    expect(kontorQuote({ wood: 0, stone: 9 }, { wood: 0, stone: 0 }, "gateway").cost).toBe(49); // 48.6
  });
});

describe("Paket 2: migration 0143 order", () => {
  it("the purchase_guard patch is the first statement, before any table or function is created", () => {
    const firstDo = SQL2.indexOf("DO $do$"),
      firstCreate = SQL2.search(/^CREATE /m);
    expect(firstDo).toBeGreaterThan(0);
    expect(firstDo).toBeLessThan(firstCreate);
  });
});

describe("Steingrube texts: plain building, no grant", () => {
  it("German title and description are exactly the agreed wording", () => {
    expect(RESOURCE_T.de.quarry).toBe("Steingrube");
    expect(RESOURCE_T.de.quarryText).toBe(
      "Eine Steingrube fördert täglich zusätzlichen Stein. Die Fördermenge hängt vom Standort deines Dorfes ab.",
    );
  });
  it("no language mentions a council, grant, start-up aid or founding discount any more", () => {
    const banned =
      /Rat\b|Rates|Zuschuss|Starthilfe|Nachlass|Gründung|Auftrag|council|grant|commission|discount|conseil|remise|commande|concejo|encargo|descuento|المجلس|تكليف|خصم|परिषद|आदेश|छूट|议会|委托|折扣|評議会|依頼|割引/;
    for (const l of LANGS) {
      const t = RESOURCE_T[l];
      for (const v of [t.quarry, t.quarryText, t.build, t.paid]) expect(v, l).not.toMatch(banned);
      expect(Object.keys(t), l).not.toContain("auftrag");
    }
  });
});
