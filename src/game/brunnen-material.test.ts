// P3b Marktbrunnen-Material (migration 0157, Masterplan v6.1 Variante A): TypeScript side and its agreement with the SQL.
// The real booking (guard, store, Kontor, kontor_max, chest) runs in src/lib/brunnen-material.pg.test.ts.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { FOUNTAIN_PRICE, FOUNTAIN_STEPS } from "./civic-fountain";
import {
  fountainNeed,
  INVESTMENT_ITEMS,
  isAnkauf,
  kontorQuote,
  MATERIAL_ITEMS,
  materialOf,
} from "./resources";
import { countsAsBuilding } from "./civic";

const mig = (f: string) =>
  readFileSync(new URL(`../../drizzle/migrations/${f}`, import.meta.url), "utf8");
const fn = (s: string) =>
  s.slice(s.indexOf("CREATE OR REPLACE FUNCTION public.purchase_material()"));
const M145 = fn(mig("0145_a1_investment_material.sql")),
  M157 = mig("0157_brunnen_material.sql");

describe("P3b: Marktbrunnen material at the Gemeindebau rate", () => {
  it("the three steps: 20/13, 40/27, 60/40 (wood price/200, stone price/300)", () => {
    expect(FOUNTAIN_STEPS.map((k) => [FOUNTAIN_PRICE[k], materialOf(k)])).toEqual([
      [4000, { wood: 20, stone: 13 }],
      [8000, { wood: 40, stone: 27 }],
      [12000, { wood: 60, stone: 40 }],
    ]);
    expect(fountainNeed(8000)).toEqual({ wood: 40, stone: 27 });
  });

  it("the Kontor quote fills only what is missing, with the site and Waage factors as for every purchase", () => {
    const need = materialOf("fountain2")!;
    expect(kontorQuote(need, { wood: 100, stone: 100 }).cost).toBe(0);
    expect(kontorQuote(need, { wood: 30, stone: 20 })).toEqual({
      need: { wood: 40, stone: 27 },
      missing: { wood: 10, stone: 7 },
      cost: 10 * 4 + 7 * 6,
    });
    expect(kontorQuote(need, { wood: 30, stone: 20 }, "gateway").cost).toBe(Math.round(82 * 0.9));
    expect(kontorQuote(need, { wood: 30, stone: 20 }, "grain", true).cost).toBe(
      Math.round(82 * 0.85),
    );
  });

  it("no mixing: not in the full-rate or A1 lists, still a normal building purchase, never Ankauf", () => {
    for (const k of FOUNTAIN_STEPS) {
      expect(MATERIAL_ITEMS).not.toContain(k);
      expect(INVESTMENT_ITEMS).not.toContain(k);
      expect(countsAsBuilding(k)).toBe(true);
      expect(isAnkauf(k)).toBe(false);
    }
    expect(materialOf("school")).toEqual({ wood: 60, stone: 40 }); // full rate unchanged
    expect(materialOf("belfry1")).toEqual({ wood: 10, stone: 0 }); // A1 unchanged
    expect(materialOf("chest2")).toBeNull();
  });

  it("0157 is exactly the 0145 function plus the fountain branch — one statement, nothing else", () => {
    expect(M157.match(/CREATE OR REPLACE FUNCTION/g)).toHaveLength(1);
    const code = M157.split("\n")
      .filter((l) => !l.trimStart().startsWith("--"))
      .join("\n");
    expect(code).not.toMatch(
      /\b(ALTER|DROP|GRANT|REVOKE|CREATE TABLE|CREATE TRIGGER|CREATE INDEX|INSERT INTO|UPDATE public)\b/,
    );
    const list = /fo := NEW\.item IN \(([^)]+)\)/.exec(M157)![1]!;
    expect([...list.matchAll(/'([a-z0-9]+)'/g)].map((m) => m[1])).toEqual([...FOUNTAIN_STEPS]);
    expect(M157).toContain("nw := round(NEW.cost::numeric / 200);");
    expect(M157).toContain("ns := round(NEW.cost::numeric / 300);");
    const back = fn(M157)
      .replace(" fo boolean;", "")
      .replace("  fo := NEW.item IN ('fountain1','fountain2','fountain3');\n", "")
      .replace("IF NOT a1 AND NOT fo AND NEW.item", "IF NOT a1 AND NEW.item")
      .replace(/ {2}ELSIF fo THEN\n(?:.*\n){3}/, "");
    expect(back).toBe(M145);
  });
});
