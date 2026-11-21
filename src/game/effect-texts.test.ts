import { describe, it, expect } from "vitest";
import { DICT, LANGS } from "./i18n";
import { needRankOf } from "./economy";
import { BOOK } from "./lang/book";

// AGENTS.md "Gegenwert": every announced effect must actually occur.
// - Buildings count as civic works in prosperityAt (never "+N Wohlstand"); rank/title/charter wealth only raises
//   civicWealth, i.e. dowries (weddings.ts dowryAt) — texts say "höhere Mitgift", never "+N Wohlstand".
// - The rank named in a build-menu text must be the rank the purchase guard asks for (needRankOf).
const WEALTH: Record<string, RegExp> = {
  de: /\+\s?\d+ Wohlstand/,
  en: /\+\s?\d+ prosperity/,
  fr: /\+\s?\d+ prospérité/,
  es: /\+\s?\d+ (de )?prosperidad/,
  ar: /\+\s?\d+ (رخاء|ازدهار)/,
  hi: /\+\s?\d+ समृद्धि/,
  zh: /\+\s?\d+繁荣|繁荣\+\s?\d+/,
  ja: /繁栄\+\s?\d+/,
};
type D = {
  items: Record<string, [string, string]>;
  rank: { perks: Record<string, string[]> };
  charter: { bonus: Record<string, string>; paths: Record<string, string[]> };
  stages: string[];
};
const d = (l: string) => DICT[l as keyof typeof DICT] as unknown as D;

describe("effect texts promise no HUD prosperity points", () => {
  it("build menu, guild ranks and charters in all eight languages", () => {
    for (const l of LANGS) {
      const t = d(l),
        re = WEALTH[l]!;
      const texts = [
        ...Object.entries(t.items).map(([k, v]) => [`items.${k}`, v[1]] as const),
        ...Object.entries(t.rank.perks).flatMap(([p, v]) =>
          v.map((s, i) => [`rank.${p}[${i}]`, s] as const),
        ),
        ...Object.entries(t.charter.bonus).map(([p, s]) => [`charter.bonus.${p}`, s] as const),
        ...Object.entries(t.charter.paths).map(
          ([p, v]) => [`charter.paths.${p}`, v.join(" ")] as const,
        ),
      ];
      for (const [k, s] of texts) expect(s, `${l} ${k}`).not.toMatch(re);
    }
  });
});

describe("rank named in build-menu texts matches the purchase guard", () => {
  // explicit prefixes per language ("Ab Dorf:", "Nur für …, ab Kleinstadt:"), longest stage name first
  const lead: Record<string, (s: string) => RegExp> = {
    de: (s) => new RegExp(`(^|, )[Aa]b ${s}:`),
    en: (s) => new RegExp(`(^|, )[Ff]rom ${s.toLowerCase()}:`, "i"),
  };
  for (const l of ["de", "en"]) {
    it(l, () => {
      const t = d(l);
      const order = t.stages
        .map((s, i) => [s, i] as const)
        .sort((a, b) => b[0].length - a[0].length);
      let checked = 0;
      for (const [k, v] of Object.entries(t.items)) {
        const hit = order.find(([s]) => lead[l]!(s).test(v[1]));
        if (!hit) continue;
        checked++;
        expect(hit[1], `${l} items.${k}: ${v[1]}`).toBe(needRankOf(k));
      }
      expect(checked).toBe(7);
    });
  }
});

describe("guide promises only real effects", () => {
  const de = JSON.stringify(BOOK.de);
  it("no free bake day through the bakehouse, no healthier well-fed citizens, no well water against sickness", () => {
    expect(de).not.toMatch(/Backtag wird frei/);
    expect(de).not.toMatch(/Satte Bürger bleiben/);
    expect(de).not.toMatch(/Brunnenwasser/);
    expect(de).not.toMatch(/Badestube \(ab Kleinstadt/);
  });
  it("every language still has the same number of guide sections", () => {
    const n = (l: string) => JSON.stringify(BOOK[l as keyof typeof BOOK]).split('","').length;
    for (const l of LANGS) expect(n(l), l).toBe(n("de"));
  });
});
