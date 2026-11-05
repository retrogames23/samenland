import { describe, it, expect } from "vitest";
import { shelters } from "./weather";

describe("rain sends folk indoors (display only)", () => {
  it("nobody shelters when it is dry", () => {
    for (let id = 0; id < 200; id++) expect(shelters("leisure", false, id, 0)).toBe(false);
  });
  it("heavy rain empties the square and the play meadow", () => {
    const n = Array.from({ length: 200 }, (_, id) => shelters("leisure", false, id, 1)).filter(Boolean).length;
    expect(n).toBe(200);
  });
  it("work and indoor plans are never changed by rain", () => {
    for (let id = 0; id < 200; id++) { expect(shelters("work", false, id, 1)).toBe(false); expect(shelters("play", true, id, 1)).toBe(false); }
  });
});
