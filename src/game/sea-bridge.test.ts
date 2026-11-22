import { describe, it, expect, afterEach } from "vitest";
import { setRealm } from "./time";
import { roadBridge, roadCandidates, roadReachable, links, MAX_BRIDGE, type Seed } from "./world";

// Eschental (402,498) sits on a sand islet of Störwerder; Birkenbach (353,413) is 98 tiles away as the crow flies.
// The road path between them needs a 25-tile bridge across open water: such roads are no longer offered,
// already decided roads keep their path (buildLink is unchanged).
const t0 = Date.UTC(2026, 10, 20);
const mk = (id: string, x: number, y: number, roads: Seed["roads"] = []) =>
  ({
    id,
    name: id,
    owner: id,
    x,
    y,
    hue: 0,
    realm: "europe-3",
    user_id: `u-${id}`,
    created_at: new Date(t0).toISOString(),
    roads,
  }) as Seed;
afterEach(() => setRealm("europe"));

describe("no new trade roads across open sea", () => {
  it("Eschental's only neighbour needs a sea bridge and is not offered", () => {
    setRealm("europe-3");
    const birk = mk("birk", 353, 413),
      esch = mk("esch", 402, 498);
    expect(roadBridge(esch, birk)).toBeGreaterThan(MAX_BRIDGE);
    expect(roadReachable(esch, birk)).toBe(false);
    expect(roadCandidates(esch, [birk, esch])).toEqual([]);
  });
  it("an already decided sea road keeps its path (existing roads untouched)", () => {
    setRealm("europe-3");
    const birk = mk("birk", 353, 413),
      esch = mk("esch", 402, 498, [{ target: "birk", at: t0 + 3.6e6 }]);
    const l = links([birk, esch]);
    expect(l).toHaveLength(1);
    expect(l[0]!.water.filter(Boolean).length).toBeGreaterThan(MAX_BRIDGE);
  });
  it("ordinary inland neighbours stay on offer", () => {
    setRealm("europe");
    const a = mk("a", 400, 512),
      b = mk("b", 460, 512);
    expect(roadBridge(a, b)).toBeLessThanOrEqual(MAX_BRIDGE);
    expect(roadCandidates(a, [a, b]).map((s) => s.id)).toEqual(["b"]);
  });
});
