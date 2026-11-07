import { describe, it, expect } from "vitest";
import { dogSleepsOutside } from "./dog";

describe("village dog sleeping place", () => {
  it("sleeps outdoors in July", () => expect(dogSleepsOutside(Date.UTC(2026, 6, 10))).toBe(true));
  it("sleeps indoors in November", () => expect(dogSleepsOutside(Date.UTC(2026, 10, 7))).toBe(false));
  it("sleeps indoors in May", () => expect(dogSleepsOutside(Date.UTC(2026, 4, 31))).toBe(false));
});
