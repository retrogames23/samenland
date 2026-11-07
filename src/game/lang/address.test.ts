import { describe, it, expect } from "vitest";
import { addressMayor, mayorWord, titleForm } from "./address";

describe("mayor address by gender and settlement rank", () => {
  it("Dorf, m: Schulze", () => expect(mayorWord("de", "m", 2)).toBe("Schulze"));
  it("Kleinstadt, w: Bürgermeisterin", () => expect(mayorWord("de", "w", 3)).toBe("Bürgermeisterin"));
  it("Kleinstadt, d: Stadtoberhaupt", () => expect(mayorWord("de", "d", 3)).toBe("Stadtoberhaupt"));
  it("rewrites German articles for a woman in a town", () =>
    expect(addressMayor("Ah, der Herr Schulze persönlich! Aufgabe des Schulzen", "de", "w", 3)).toBe("Ah, die Frau Bürgermeisterin persönlich! Aufgabe der Bürgermeisterin"));
  it("neutral village head keeps the old wording", () =>
    expect(addressMayor("Seid gegrüßt, Schulze! Aufgabe des Schulzen", "de", "d", 1)).toBe("Seid gegrüßt, Dorfoberhaupt! Aufgabe des Dorfoberhaupts"));
  it("leaves lines about a town's own head untouched", () =>
    expect(addressMayor("Unser Schulze ist netter als du.", "de", "w", 3)).toBe("Unser Schulze ist netter als du."));
  it("works in all eight languages", () => {
    expect(addressMayor("the reeve", "en", "m", 3)).toBe("the mayor");
    expect(addressMayor("le maire", "fr", "w", 1)).toBe("la mairesse");
    expect(addressMayor("el alcalde", "es", "w", 1)).toBe("la alcaldesa");
    expect(addressMayor("عمدة", "ar", "d", 1)).toBe("رأس القرية");
    expect(addressMayor("मुखिया", "hi", "m", 3)).toBe("नगर-प्रमुख");
    expect(addressMayor("村长", "zh", "m", 3)).toBe("市长");
    expect(addressMayor("村長", "ja", "m", 3)).toBe("町長");
  });
  it("female title form, neutral falls back to male", () => {
    expect(titleForm("de", "w", "farm", 0, "Flurvogt")).toBe("Flurvögtin");
    expect(titleForm("de", "d", "farm", 0, "Flurvogt")).toBe("Flurvogt");
  });
});
