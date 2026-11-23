import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { ENCOUNTERS, boonHours } from "./encounters";
import { attributes } from "./economy";
import { DICT, LANGS } from "./i18n";
import type { Seed } from "./world";

// AGENTS.md "Jede Ausgabe muss einen spielmechanischen Gegenwert haben": an encounter option that costs Mark
// must have a real effect. The only real encounter effect is growth (boonHours → effAge); food/health numbers
// only moved HUD bars and scenes (cow, maypole, sapling, bridge, village life) are visual only.
type Fx = { h?: number; growth?: number };
const all = Object.entries(
  ENCOUNTERS as unknown as Record<string, Record<string, { cost: number; fx: Fx }>>,
).flatMap(([ev, cs]) => Object.entries(cs).map(([c, ch]) => ({ ev, c, key: `${ev}:${c}`, ...ch })));
const H = 3600e3,
  t0 = Date.UTC(2026, 3, 1, 6);
const realHours = (ev: string, c: string) =>
  boonHours([{ event: ev, choice: c, cost: 0, at: t0 }], t0 + 1000 * H);

describe("paid encounter options have a real effect", () => {
  it("every option that costs Mark gives real growth hours", () => {
    const paid = all.filter((o) => o.cost > 0);
    expect(paid.length).toBe(8);
    for (const o of paid) expect(realHours(o.ev, o.c), o.key).toBeGreaterThan(0);
  });
  it("effects hold only real keys: growth with its duration; no food, health or wealth bar values", () => {
    for (const o of all) {
      expect(
        Object.keys(o.fx).every((k) => k === "h" || k === "growth"),
        o.key,
      ).toBe(true);
      if (o.fx.growth) expect(o.fx.h, `${o.key} growth needs a duration`).toBeGreaterThan(0);
      // a bare duration only drives the orphan's stay (orphan.ts), nothing else reads it
      if (o.fx.h && !o.fx.growth) expect(o.ev, o.key).toBe("orphan");
    }
  });
  it("encounter decisions no longer move the HUD food or health bars", () => {
    const s = {
      id: "g1",
      name: "Testdorf",
      x: 520,
      y: 480,
      created_at: new Date(t0).toISOString(),
      user_id: null,
    } as unknown as Seed;
    const decided = {
      ...s,
      decisions: all
        .filter((o) => o.cost >= 0)
        .map((o, i) => ({ event: o.ev, choice: o.c, cost: o.cost, at: t0 + i * 1000 })),
    } as Seed;
    const at = t0 + 2 * H;
    const a = attributes(s, [s], [], at),
      b = attributes(decided, [decided], [], at);
    expect([b.food, b.health]).toEqual([a.food, a.health]);
  });
  it("no visual-only option (scene, cow, maypole, sapling, bridge, bake day) costs Mark", () => {
    for (const k of [
      "cow:show",
      "maypole:pole",
      "nursery:cherry",
      "nursery:quince",
      "steg:carpenter",
      "backtag:bake",
      "zaun:holz",
      "flur:hilfe",
      "scharwerk:dingen",
      "pfingsten:preis",
      "besthaupt:loesen",
      "funken:lehm",
      "rotte:bier",
      "wolfspur:fallen",
      "miete:korn",
      "kaper:geleit",
      "hansetag:gefolge",
      "hansetag:vollmacht",
      "seuche:absondern",
    ])
      expect(all.find((o) => o.key === k)!.cost, k).toBe(0);
  });
  it("no paid option is matched or beaten by a free sibling", () => {
    const worth = (o: { fx: Fx }) => (o.fx.growth ?? 0) * (o.fx.h ?? 0);
    for (const o of all.filter((x) => x.cost > 0))
      for (const f of all.filter((x) => x.ev === o.ev && x.cost <= 0))
        expect(worth(f) < worth(o), `${o.key} vs ${f.c}`).toBe(true);
  });
});

describe("prices mirror the database guard", () => {
  const sql = readFileSync("drizzle/migrations/0138_encounters_server_only.sql", "utf8");
  const db = new Map(
    [...sql.matchAll(/WHEN '(\w+:\w+)' THEN (-?\d+)/g)].map((m) => [m[1]!, Number(m[2])]),
  );
  it("every option has the same price in ENCOUNTERS and in encounter_guard", () => {
    for (const o of all) expect(db.get(o.key), o.key).toBe(o.cost);
    expect(db.size).toBe(all.length);
  });
});

describe("texts of all eight languages", () => {
  it("every option has a label in every language", () => {
    for (const l of LANGS)
      for (const o of all)
        expect(
          (DICT[l].enc.choices as Record<string, string>)[o.key],
          `${l} ${o.key}`,
        ).toBeTruthy();
  });
  it("free options never mention paying from the chest, and labels promise no numbers", () => {
    const money: Record<string, RegExp> = {
      de: /kasse|geld|bezahl|zahlen|kaufen|einkauf|mehr milch/i,
      en: /chest|coin|money|\bpay|\bbuy|more milk/i,
      fr: /caisse|argent|payer|achet|achats|plus de lait/i,
      es: /caja|dinero|pagar|comprar|más leche/i,
    };
    for (const [l, re] of Object.entries(money))
      for (const o of all.filter((x) => x.cost === 0)) {
        const txt = (DICT[l as keyof typeof DICT].enc.choices as Record<string, string>)[o.key]!;
        expect(re.test(txt), `${l} ${o.key}: ${txt}`).toBe(false);
      }
    for (const l of LANGS)
      for (const o of all)
        expect(
          (DICT[l].enc.choices as Record<string, string>)[o.key]!,
          `${l} ${o.key}`,
        ).not.toMatch(/\+\s?\d/);
  });
});
