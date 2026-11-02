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
    for (const l of LANGS) for (const k of ["own_any", "own_child", "foreign_any", "court_prince", "house_own", "house_foreign", "house_empty", "house_night"] as const) expect(BANTER[l][k]?.length ?? 0).toBeGreaterThan(0);
  });
});
