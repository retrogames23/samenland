import { describe, it, expect } from "vitest";
import { setRemoteMayor, remoteMayor, REMOTE_TTL } from "./people";

describe("live remote mayors", () => {
  const s = (x: number) => ({ x, y: 10, dir: [1, 0] as [number, number], walking: true, mounted: false, dist: x });
  it("interpolates between two received samples", () => {
    setRemoteMayor("r1", s(10), 1000); setRemoteMayor("r1", s(11), 1250);
    const m = remoteMayor("r1", 1250 + 260 - 125)!;
    expect(m.x).toBeCloseTo(10.5, 5);
  });
  it("falls back to the routine after the TTL or a goodbye", () => {
    setRemoteMayor("r2", s(5), 0);
    expect(remoteMayor("r2", REMOTE_TTL + 1)).toBeNull();
    setRemoteMayor("r3", s(5), 0); setRemoteMayor("r3", null);
    expect(remoteMayor("r3", 10)).toBeNull();
  });
});
