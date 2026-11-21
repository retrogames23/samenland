import { describe, it, expect } from "vitest";
import { monumentOf, MONUMENT_DEFS, MONUMENT_KEYS } from "./world";
import { legacyMonumentOf } from "./__ref/monument-legacy";

/** Identity of the monumentOf lookup table with the former pattern test (src/game/__ref/monument-legacy.ts). */
describe("monumentOf lookup is identical to the former pattern test", () => {
  it("every step of all ten monuments, and every digit beyond", () => {
    expect(MONUMENT_KEYS.length).toBe(10);
    for (const k of MONUMENT_KEYS) for (let d = 0; d <= 9; d++) {
      const item = `${k}${d}`;
      expect(monumentOf(item)).toBe(legacyMonumentOf(item));
      expect(monumentOf(item)).toBe(d >= 1 && d <= MONUMENT_DEFS[k].n ? k : null);
    }
  });
  it("invalid and look-alike items", () => {
    const items = ["", "1", "belfry", "belfry10", "belfry01", "Belfry1", "belfry1 ", " belfry1", "belfry-1", "belfry１", "bauhuette1", "freimarkt3", "rank2", "title1", "chest2",
      "constructor1", "tostring1", "hasownproperty1", "valueof1", "__proto__1", "proto1", "cathedral", "cathedral6", "factory1", "guildtower4", "lighthouse0", "opera5", "harvest3\n", "école1"];
    for (const k of MONUMENT_KEYS) items.push(k.toUpperCase() + "1", `${k}1x`, `x${k}1`, `${k}${k}1`, `${k}1.0`);
    for (const i of items) expect(monumentOf(i)).toBe(legacyMonumentOf(i));
    for (const i of [undefined, null] as unknown as string[]) expect(monumentOf(i)).toBe(legacyMonumentOf(i));
  });
  it("all short lowercase+digit strings of the shape [a-z]{1,3}[0-9]", () => {
    const a = "abcdefghijklmnopqrstuvwxyz";
    for (const x of a) for (const y of ["", ...a]) for (let d = 0; d <= 9; d++) { const i = `${x}${y}${d}`; expect(monumentOf(i)).toBe(legacyMonumentOf(i)); }
  });
});
