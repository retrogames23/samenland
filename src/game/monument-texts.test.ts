import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

// Monument texts must not promise fixed HUD prosperity points: MONUMENTS.wealth is never applied to the HUD;
// a finished monument counts as two civic works in prosperityAt().
const files = ["i18n.ts", "lang/fr.ts", "lang/es.ts", "lang/ar.ts", "lang/hi.ts"].map((f) => readFileSync(`src/game/${f}`, "utf8"));
const lines = (key: string) => files.flatMap((src) => src.split("\n").filter((l) => new RegExp(`^\\s*${key}:`).test(l)));
const WEALTH = [/\+\d+ Wohlstand/, /\+\d+ prosperity/, /\+\d+ prospérité/, /\+\d+ prosperidad/, /\+\d+ رخاء/, /\+\d+ समृद्धि/, /\+\d+繁荣/, /繁栄\+\d+/];

describe("monument texts", () => {
  for (const k of ["belfry1", "theater1", "cathedral1", "university1", "exchange1", "guildtower1", "lighthouse1", "orangery1", "opera1", "harvest1"]) {
    it(`${k}: all eight languages present, no fixed prosperity points`, () => {
      const ls = lines(k);
      expect(ls).toHaveLength(8);
      for (const l of ls) for (const p of WEALTH) expect(l).not.toMatch(p);
    });
  }
  it("Schütting names all four stage effects in every language", () => {
    for (const l of lines("exchange1")) {
      expect(l).toMatch(/1 –/);
      expect(l).toMatch(/80/); expect(l).toMatch(/85/); expect(l).toMatch(/0[.,]05/);
    }
  });
});
