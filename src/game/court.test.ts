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

import { audienceHost, atCourt } from "./court";
describe("audience", () => {
  it("prince receives 9-13, steward by day, closed at night", () => {
    expect(audienceHost(9)).toBe("prince"); expect(audienceHost(12)).toBe("prince");
    expect(audienceHost(13)).toBe("herald"); expect(audienceHost(7)).toBe("herald");
    expect(audienceHost(21)).toBe("closed"); expect(audienceHost(3)).toBe("closed");
  });
  it("reach around the estate centre", () => {
    const c = courtCenter();
    expect(atCourt(c.x + 8, c.y)).toBe(true); expect(atCourt(c.x + 12, c.y)).toBe(false);
  });
});

import { errandNear, courtPoses } from "./court";
describe("court errands", () => {
  it("finds the gardener only while he works and the mayor stands beside him", () => {
    const g = courtPoses(10, 0).find((q) => q.role === "gardener")!;
    expect(errandNear(10, 0, g.x + 0.5, g.y)).toBe("gardener");
    expect(errandNear(10, 0, g.x + 6, g.y + 6)).toBeNull();
    expect(errandNear(22, 0, g.x, g.y)).toBeNull();
  });
  it("skips errands already done", () => {
    const g = courtPoses(10, 0).find((q) => q.role === "gardener")!;
    expect(errandNear(10, 0, g.x, g.y, new Set(["gardener"]))).not.toBe("gardener");
  });
});
