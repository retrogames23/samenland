import { describe, expect, it } from "vitest";
import { DICT, LANGS } from "./i18n";
import { TRADE_DIST } from "./world";

const warn = (l: (typeof LANGS)[number]) =>
  DICT[l].plantAsk.farOff(TRADE_DIST, DICT[l].stages[3]!, DICT[l].stages[4]!);
describe("far village warning (Gründungs-Pergament, P5)", () => {
  for (const l of LANGS)
    it(`${l}: names the road reach, the capped rank and the next rank, and does not block`, () => {
      const msg = warn(l),
        d = DICT[l];
      expect(msg).toContain(String(TRADE_DIST));
      expect(msg).toContain(d.stages[3]!);
      expect(msg).toContain(d.stages[4]!);
      expect(msg).not.toContain("${");
      expect(msg.length).toBeGreaterThan(80);
      expect(msg).not.toBe(d.plantAsk.isle);
      expect(d.plantAsk.elsewhere.trim().length).toBeGreaterThan(1);
      expect(d.plantAsk.okAnyway.trim().length).toBeGreaterThan(1);
      expect(d.plantAsk.elsewhere).not.toBe(d.cancel);
      expect(d.plantAsk.okAnyway).not.toBe(d.plantAsk.ok);
    });
  it("eight languages", () => expect(LANGS).toHaveLength(8));
  it("uses the agreed German wording", () => {
    const de = warn("de");
    expect(de).toContain("Weite Wildnis");
    expect(de).toContain("über Kleinstadt hinaus");
    expect(de).toContain(
      "Für den Rang Handelsstadt braucht ein Dorf eine Handelsstraße oder einen Seeweg",
    );
    expect(de).toContain("Ihr dürft trotzdem hier gründen.");
    expect(DICT.de.plantAsk.elsewhere).toBe("Anderen Ort wählen");
    expect(DICT.de.plantAsk.okAnyway).toBe("Trotzdem hier pflanzen");
  });
});
