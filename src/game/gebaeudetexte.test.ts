// T1 (text package): purchase texts name only effects the code really has. Tooltip values (attributes() in economy.ts,
// read only by the HUD) never appear as a building's effect, and every number or membership a text states is tied to
// the constant or list that produces it.
import { describe, expect, it } from "vitest";
import { DICT, LANGS, type Lang } from "./i18n";
import { AUSBAU } from "./lang/ausbau";
import { PROSPER_WORKS } from "./prosperity";
import { CARE_FOOD, SEA_WAYS_MAX } from "./world";
import { GEMEINWESEN_CLASSIC } from "./gemeinwesen";
import { FOOD_CRAFTS } from "./food-crafts";
import { WAY_BIG, questKey } from "./quests";
import { ITEMS, WAY_ITEM } from "./economy";
import { BACKHAUS_GRAIN, GRAIN_PER_GRANARY } from "./goods";
import { BACKHAUS_LEVEL_GRAIN, GRANARY_STEP_CAP } from "./ausbau";
import { HEALER_SICK, HERBS_SICK } from "./sickness";
import { fires, tileHits } from "./disasters";
import type { Seed } from "./world";

/** "+N food/health" as each language wrote the tooltip values before T1. */
const HUD: Record<Lang, RegExp> = {
  de: /\+\s?\d+\s(Nahrung|Gesundheit)/,
  en: /\+\s?\d+\s(food|health)/,
  fr: /\+\s?\d+\s(vivres|santé|nourriture)/,
  es: /\+\s?\d+\s(de\s)?(alimento|salud|comida)/,
  ar: /\+\s?\d+\s(غذاء|صحة|طعام)/,
  hi: /\+\s?\d+\s(भोजन|स्वास्थ्य|खाद्य)/,
  zh: /\+\s?\d+(食物|健康)/,
  ja: /(食料|健康)\+\s?\d+/,
};
const SEA: Record<Lang, string> = {
  de: "Seeweg",
  en: "sea way",
  fr: "voie maritime",
  es: "ruta marítima",
  ar: "طريقًا بحريًا",
  hi: "समुद्री मार्ग",
  zh: "海路",
  ja: "航路",
};
const LARDER: Record<Lang, string> = {
  de: "Vorratskammer",
  en: "arder",
  fr: "arde-manger",
  es: "espensa",
  ar: "بيت المؤونة",
  hi: "रसद-कोठार",
  zh: "储藏室",
  ja: "食料庫",
};
const BUILDINGS = [...Object.keys(ITEMS), "steingrube"];
const MONUMENT_TEXTS = [
  "belfry1",
  "theater1",
  "cathedral1",
  "university1",
  "exchange1",
  "orangery1",
  "opera1",
  "harvest1",
  "guildtower1",
  "lighthouse1",
];
const de = DICT.de.items;

describe("T1: purchase texts in all eight languages", () => {
  it("every language has a name and a text for every building and monument", () => {
    for (const l of LANGS)
      for (const k of [...BUILDINGS, ...MONUMENT_TEXTS]) {
        const v = DICT[l].items[k];
        expect(v?.[0], `${l} ${k}`).toBeTruthy();
        expect(v?.[1], `${l} ${k}`).toBeTruthy();
      }
  });

  it("no building or monument text presents a tooltip value (+N food/health) as its effect", () => {
    for (const l of LANGS)
      for (const k of [...BUILDINGS, ...MONUMENT_TEXTS])
        expect(DICT[l].items[k]![1], `${l} ${k}`).not.toMatch(HUD[l]);
  });

  it("the large way buildings name their real value; sea ways only where the code counts them", () => {
    for (const l of LANGS) {
      // the title the player sees for the way quest of exactly this building (Game.tsx: quests.list[questKey(…, way)])
      for (const k of WAY_BIG) {
        const title =
          DICT[l].quests.list[questKey("metro", WAY_ITEM[k as keyof typeof WAY_ITEM])]![0];
        expect(DICT[l].items[k]![1], `${l} ${k}`).toContain(title);
      }
      for (const k of ["saltquay", "smokehouse", "fisher"])
        expect(DICT[l].items[k]![1], `${l} ${k}`).toContain(SEA[l]);
      for (const k of ["millrow", "hammerworks", "bigstore", "stonemason"])
        expect(DICT[l].items[k]![1], `${l} ${k}`).not.toContain(SEA[l]);
      expect(DICT[l].items["saltquay"]![1], l).toContain(String(SEA_WAYS_MAX));
      // assignHauls (people.ts): one miller per workplace carries flour, only to a bakery under 45 tiles away
      expect(DICT[l].items["millrow"]![1], l).toContain("45");
    }
  });

  it("larder effects are marked as larder effects (Backhaus, Kornspeicher, Ausbaustufen, Erntedankhalle step 2)", () => {
    for (const l of LANGS) {
      for (const k of ["backhaus", "granary", "harvest1"])
        expect(DICT[l].items[k]![1], `${l} ${k}`).toContain(LARDER[l]);
      for (const k of ["backhaus2", "backhaus3", "granary2", "granary3"])
        expect(AUSBAU[l].steps[k]![1], `${l} ${k}`).toContain(LARDER[l]);
    }
  });
});

describe("T1: what the texts state is what the code does (German reference)", () => {
  it("“Versorgungsbau” exactly for the supply buildings of the care gate and household capacity", () => {
    for (const k of BUILDINGS)
      expect(de[k]![1].includes("Versorgungsbau"), k).toBe(CARE_FOOD.includes(k));
    expect(CARE_FOOD).toEqual([...FOOD_CRAFTS, "markethall", "guildhall"]);
  });

  it("“Gemeinwesen-Einrichtung” exactly for herb hut, healer and library (counted before and after the cut-over)", () => {
    for (const k of BUILDINGS)
      expect(de[k]![1].includes("Gemeinwesen-Einrichtung"), k).toBe(
        (GEMEINWESEN_CLASSIC as readonly string[]).includes(k),
      );
  });

  it("every stated number of Bürgerwerke matches PROSPER_WORKS; buildings without works state none", () => {
    for (const k of BUILDINGS) {
      const m = /\+(\d) Bürgerwerke?\b/.exec(de[k]![1]);
      if (m) expect(+m[1]!, k).toBe(PROSPER_WORKS[k]);
    }
    for (const k of ["millrow", "hammerworks", "saltquay"])
      expect(PROSPER_WORKS[k], k).toBeUndefined();
  });

  it("stated figures follow their constants", () => {
    expect(de["backhaus"]![1]).toContain(
      `${Math.round((1 - BACKHAUS_GRAIN) * 100)} % weniger Getreide`,
    );
    expect(de["granary"]![1]).toContain(`${GRAIN_PER_GRANARY} Garben`);
    expect(AUSBAU.de.steps["backhaus2"]![1]).toContain(
      `${Math.round((1 - BACKHAUS_LEVEL_GRAIN[1]) * 100)} %`,
    );
    expect(AUSBAU.de.steps["backhaus3"]![1]).toContain(
      `${Math.round((1 - BACKHAUS_LEVEL_GRAIN[2]) * 100)} %`,
    );
    expect(AUSBAU.de.steps["granary2"]![1]).toContain(`+${GRANARY_STEP_CAP}`);
    expect(HEALER_SICK).toBeGreaterThan(HERBS_SICK); // "deutlich seltener krank" vs "seltener krank"
    // Klostergarten: sickChance and careHealthExtra read stepsPaid (payment), not stepsDone
    expect(de["orangery1"]![1]).toContain("ab Bezahlung von Abschnitt 2");
    expect(de["millrow"]![1]).toContain("einer bringt Mehl");
  });
});

describe("T1: the fire house text matches the fire mechanics", () => {
  it("with the fire house fires still break out, but every one is out within half an hour, kills nobody and leaves no ruin", () => {
    const H = 3600e3,
      DAY = 24 * H,
      c0 = Date.parse("2026-11-12T00:00:00Z");
    const s = {
      id: "00000000-t1-firehouse",
      x: 500,
      y: 340,
      realm: "europe",
      user_id: "t1",
      created_at: new Date(c0).toISOString(),
      bought: [{ item: "firehouse", at: c0 }],
    } as unknown as Seed;
    const fs = fires(s, c0 + 400 * DAY);
    expect(fs.length).toBeGreaterThan(0); // houses still catch fire …
    for (const f of fs) {
      expect(f.guarded && !f.dead).toBe(true);
      expect(f.end - f.at).toBeLessThanOrEqual(0.5 * H); // … are put out quickly …
      const hits = tileHits(s, f.end + H);
      for (const t of f.tiles) expect(hits.get(t)?.build, "no ruin to rebuild").toBeUndefined(); // … and none is destroyed
    }
    for (const l of LANGS) expect(DICT[l].items["firehouse"]![1], l).not.toBe("");
    expect(de["firehouse"]![1]).toContain("kein Haus wird mehr zerstört");
  });
});
