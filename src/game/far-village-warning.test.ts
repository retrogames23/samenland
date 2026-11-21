import { describe, expect, it } from "vitest";
import { DICT, LANGS } from "./i18n";
import { TRADE_DIST } from "./world";

describe("far village warning (Gründungs-Pergament)", () => {
  for (const l of LANGS) it(`${l} names the road reach and does not block`, () => {
    const msg = DICT[l].plantAsk.farOff(TRADE_DIST);
    expect(msg).toContain(String(TRADE_DIST));
    expect(msg.length).toBeGreaterThan(40);
    expect(msg).not.toBe(DICT[l].plantAsk.isle);
  });
  it("uses the agreed German wording", () => {
    expect(DICT.de.plantAsk.farOff(TRADE_DIST)).toContain("Weite Wildnis");
    expect(DICT.de.plantAsk.farOff(TRADE_DIST)).toContain("Ihr dürft trotzdem hier gründen.");
  });
});
