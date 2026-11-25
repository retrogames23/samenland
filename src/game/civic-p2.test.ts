import { describe, it, expect } from "vitest";
import { sickChance, SPITAL_SICK } from "./sickness";
import { kontorQuote, WAAGE_DISCOUNT } from "./resources";
import { chronicleEvents } from "./chronicle";
import {
  CIVIC,
  civicBudgetMax,
  civicDone,
  civicNeed,
  civicPhase,
  isCivicMoney,
  kontorCost,
  type CivicRow,
} from "./civic";
import type { Seed } from "./world";

const T0 = Date.UTC(2026, 10, 25),
  DONE = T0 + 30 * 864e5,
  SUMMER = Date.UTC(2027, 6, 15, 12);
const seed = (bought: { item: string; at: number }[]): Seed =>
  ({
    id: "civic-test",
    x: 500,
    y: 500,
    created_at: new Date(T0 - 864e5).toISOString(),
    user_id: null,
    bought,
  }) as unknown as Seed;

describe("Gemeindebauten Stufe 1 (P2)", () => {
  it("Preise, Bauzeit, Material /200 und /300", () => {
    expect(CIVIC.spital1).toMatchObject({ price: 10000, days: 21, rank: 2 });
    expect(CIVIC.waage1).toMatchObject({ price: 12000, days: 14, rank: 2 });
    expect(civicNeed("spital1")).toEqual({ wood: 50, stone: 33 });
    expect(civicNeed("waage1")).toEqual({ wood: 60, stone: 40 });
  });
  it("Spital: Krankheit ×0,85 erst ab der Fertigstellungs-Zeile, nie rückwirkend", () => {
    const plain = sickChance(seed([]), SUMMER);
    const s = seed([
      { item: "spital1:r1", at: T0 },
      { item: "spital1", at: SUMMER + 1 },
    ]);
    expect(sickChance(s, SUMMER)).toBeCloseTo(plain, 9);
    expect(sickChance(s, SUMMER + 2)).toBeCloseTo(plain * SPITAL_SICK, 9);
    // instalments alone never act
    expect(
      sickChance(
        seed([
          { item: "spital1:r1", at: T0 },
          { item: "spital1:refund", at: T0 },
        ]),
        SUMMER,
      ),
    ).toBeCloseTo(plain, 9);
  });
  it("Waage: Kontor −15 %, gleich in Anzeige und Gemeindebau-Rechnung", () => {
    const need = { wood: 50, stone: 33 },
      stock = { wood: 0, stone: 0 };
    const base = kontorQuote(need, stock).cost,
      cut = kontorQuote(need, stock, null, true).cost;
    expect(base).toBe(398);
    expect(cut).toBe(Math.round(398 * WAAGE_DISCOUNT));
    expect(kontorCost(need, null, true)).toBe(cut);
    expect(civicBudgetMax("spital1", null, false)).toBe(398);
    expect(civicDone(seed([{ item: "waage1", at: DONE }]), "waage1", DONE - 1)).toBe(false);
    expect(civicDone(seed([{ item: "waage1", at: DONE }]), "waage1", DONE)).toBe(true);
  });
  it("Geldzeilen sind keine Bauten in der Chronik", () => {
    expect(isCivicMoney("spital1:r1")).toBe(true);
    expect(isCivicMoney("waage1:refund")).toBe(true);
    expect(isCivicMoney("spital1")).toBe(false);
    expect(isCivicMoney("spital1:r0")).toBe(false);
    const s = seed([
      { item: "spital1:r1", at: T0 },
      { item: "spital1:refund", at: T0 + 864e5 },
    ]);
    const ev = chronicleEvents(s, [s], T0 - 864e5, T0 + 5 * 864e5).events;
    expect(
      ev.some((e) => "item" in e && String((e as { item: string }).item).startsWith("spital1:")),
    ).toBe(false);
  });
  it("Phasen: Einzahlen, Material, Bau, fertig", () => {
    const r: CivicRow = {
      item: "spital1",
      price: 10000,
      budget: 0,
      need_wood: 50,
      need_stone: 33,
      paid: 0,
      wood_got: 0,
      stone_got: 0,
      kontor_spent: 0,
      opened_at: new Date(T0).toISOString(),
      funded_at: null,
      material_at: null,
      done_at: null,
    } as CivicRow;
    expect(civicPhase(r, T0)).toBe("funding");
    expect(civicPhase({ ...r, funded_at: new Date(T0).toISOString() }, T0)).toBe("material");
    const built = {
      ...r,
      funded_at: new Date(T0).toISOString(),
      material_at: new Date(T0).toISOString(),
      done_at: new Date(DONE).toISOString(),
    };
    expect(civicPhase(built, DONE - 1)).toBe("building");
    expect(civicPhase(built, DONE)).toBe("done");
  });
});
