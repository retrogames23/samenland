import { describe, expect, it } from "vitest";
import { addressMayor } from "./address";
const neutralMayor = (t: string, l: "de", n: boolean) => addressMayor(t, l, n ? "d" : "m", 0);

describe("neutralMayor", () => {
  it("calls a 'd' village head Dorfoberhaupt in German", () => {
    expect(neutralMayor("Seid gegrüßt, Schulze! Aufgabe des Schulzen", "de", true)).toBe("Seid gegrüßt, Dorfoberhaupt! Aufgabe des Dorfoberhaupts");
  });
  it("keeps Schulze for m/w", () => {
    expect(neutralMayor("Seid gegrüßt, Schulze!", "de", false)).toBe("Seid gegrüßt, Schulze!");
  });
});
