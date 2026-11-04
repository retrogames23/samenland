import { describe, it, expect } from "vitest";
import { banter, banterCats } from "./banter";
import { BANTER } from "./lang/banter";
import { LANGS } from "./i18n";

describe("banter", () => {
  it("foreign houses answer from the stranger pool", () => {
    expect(banterCats({ who: "house", own: false, home: true, night: false })).toEqual(["house_foreign"]);
  });
  it("empty houses never pretend someone answers", () => {
    expect(banterCats({ who: "house", own: true, home: false, night: false })).toEqual(["house_empty"]);
  });
  it("does not repeat a line while fresh ones remain", () => {
    const seen = new Set<string>();
    const n = BANTER.de.foreign_any!.length;
    for (let i = 0; i < n; i++) seen.add(banter("de", { who: "foreign", child: false, night: false }, { mayor: "A", town: "B" }));
    expect(seen.size).toBe(n);
  });
  it("every language covers every base category", () => {
    for (const l of LANGS) for (const k of ["own_any", "own_craft", "own_child", "foreign_any", "court_prince", "house_own", "house_foreign", "house_empty", "house_night"] as const) expect(BANTER[l][k]?.length ?? 0).toBeGreaterThan(0);
  });
  it("keeps the old funny lines in the pools", () => {
    expect(BANTER.de.house_own!.some((s) => s.includes("Schuhe"))).toBe(true);
    expect(BANTER.de.own_any!.some((s) => s.includes("Wolken"))).toBe(true);
    // craft lines live in their own pool, so they never crowd out the witty generic ones
    for (const l of LANGS) for (const s of BANTER[l].own_craft!) expect(BANTER[l].own_any!).not.toContain(s);
  });
  it("keeps everyday-craft lines a minority of what villagers say", () => {
    const cats = banterCats({ who: "own", traits: ["early", "cheerful"], child: false, sick: false, night: false });
    const of = (k: string) => cats.filter((x) => x === k).length;
    // the witty generic pool is offered at least as often as the craft pool, in every trait mix
    for (const traits of [[], ["early"], ["early", "cheerful"], ["early", "cheerful", "pious", "curious"]] as const) {
      const c = banterCats({ who: "own", traits: traits as never, child: false, sick: false, night: false });
      expect(c.filter((x) => x === "own_any").length).toBeGreaterThanOrEqual(c.filter((x) => x === "own_craft").length);
    }
    expect(of("own_any")).toBeGreaterThan(0);
    expect(of("own_craft")).toBe(1);
  });
});
