import { describe, it, expect } from "vitest";
import { courtCenter, COURT_GUARD } from "./court";
import { canPlant } from "./world";

describe("prince's seat", () => {
  it("blocks founding a village next to the castle", () => {
    const c = courtCenter();
    expect(canPlant(Math.round(c.x), Math.round(c.y), [])).toBe("court");
  });
  it("keeps the guard ring at 30 tiles", () => expect(COURT_GUARD).toBe(30));
});
