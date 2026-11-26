import { describe, it, expect, afterEach } from "vitest";
import { setRealm, REALMS, type Realm } from "./time";
import {
  canPlant,
  roadCandidates,
  roadHours,
  MAP,
  MAX_BRIDGE,
  roadBridge,
  TRADE_DIST,
  NEAR_ROAD_DIST,
  type Seed,
} from "./world";
import { roadsFor, rankOf, RANK_NEED } from "./rank";
import { foundingIsolated, foundingRoadCandidates, FOUNDING_PROBE } from "./founding-roads";

// P5 Gründungswarnung: the founding parchment warns when foundingRoadCandidates is empty. It must be the road
// menu's own check (roadCandidates) and agree with what the rank certificate (roadsFor) later counts.
const H = 3.6e6,
  D = 864e5,
  t0 = Date.UTC(2026, 10, 1);
const mk = (
  id: string,
  x: number,
  y: number,
  realm: Realm = "europe",
  extra: Partial<Seed> = {},
): Seed =>
  ({
    id,
    name: id,
    owner: id,
    x,
    y,
    hue: 0,
    realm,
    user_id: `u-${id}`,
    created_at: new Date(t0).toISOString(),
    roads: [],
    ...extra,
  }) as Seed;
/** The village as the database would store it after founding at (x, y): real-looking id, created later. */
const founded = (id: string, x: number, y: number, realm: Realm, at = t0 + D) =>
  mk(id, x, y, realm, { created_at: new Date(at).toISOString() });
const ids = (xs: Seed[]) => xs.map((s) => s.id);
afterEach(() => setRealm("europe"));

describe("isolated site (warning shown)", () => {
  // Eschental (europe-3, 402,498) sits on a sand islet; Birkenbach is 98 tiles away but only across a 25-tile sea bridge.
  it("no road partner → isolated, and the road menu after founding agrees", () => {
    setRealm("europe-3");
    const birk = mk("birk", 353, 413, "europe-3");
    expect(roadBridge(mk("x", 402, 498, "europe-3"), birk)).toBeGreaterThan(MAX_BRIDGE);
    expect(foundingIsolated(402, 498, "europe-3", [birk], "u-me")).toBe(true);
    const me = founded("esch-real-id", 402, 498, "europe-3");
    expect(roadCandidates(me, [birk, me])).toEqual([]);
    expect(roadsFor(me, [birk, me], t0 + 30 * D)).toBe(0);
  });
  it("an empty map is isolated", () => {
    expect(foundingIsolated(300, 400, "europe", [], "u-me")).toBe(true);
  });
  it("other maps never count", () => {
    expect(foundingIsolated(300, 400, "europe", [mk("other", 360, 400, "europe-2")], "u-me")).toBe(
      true,
    );
  });
});

describe("site with a possible trade road (no warning)", () => {
  it("offers the neighbour, and the decided road counts in the rank certificate", () => {
    const a = mk("a", 360, 400);
    expect(ids(foundingRoadCandidates(300, 400, "europe", [a], "u-me"))).toEqual(["a"]);
    expect(foundingIsolated(300, 400, "europe", [a], "u-me")).toBe(false);
    const decided = t0 + 2 * D;
    const me = founded("me-real-id", 300, 400, "europe", t0 + D);
    expect(ids(roadCandidates(me, [a, me]))).toEqual(["a"]);
    const built = { ...me, roads: [{ target: "a", at: decided }] };
    // roadsFor counts a link from its start (Link.since = the decision), as certifyRank does today — unchanged by P5
    expect(roadsFor(built, [a, built], decided - 1)).toBe(0);
    expect(roadsFor(built, [a, built], decided)).toBe(1);
    expect(roadsFor(built, [a, built], decided + roadHours(me, a) * H)).toBe(1);
  });
  it("an unowned sample village is a partner too (the founder is always a player)", () => {
    const sample = { ...mk("sample", 360, 400), user_id: null };
    expect(ids(foundingRoadCandidates(300, 400, "europe", [sample], null))).toEqual(["sample"]);
    expect(ids(foundingRoadCandidates(300, 400, "europe", [sample], "u-me"))).toEqual(["sample"]);
  });
  it("a stale probe in the list is ignored", () => {
    const a = mk("a", 360, 400),
      stale = mk(FOUNDING_PROBE, 300, 401);
    expect(ids(foundingRoadCandidates(300, 400, "europe", [a, stale], "u-me"))).toEqual(["a"]);
  });
});

describe("site next to an existing trade road", () => {
  it("a road between two neighbours neither connects the site nor blocks it", () => {
    const a = mk("a", 360, 400),
      b = mk("b", 420, 400, "europe", { roads: [{ target: "a", at: t0 }] });
    const plain = [a, mk("b", 420, 400)];
    expect(ids(foundingRoadCandidates(300, 400, "europe", [a, b], "u-me"))).toEqual(
      ids(foundingRoadCandidates(300, 400, "europe", plain, "u-me")),
    );
    expect(ids(foundingRoadCandidates(300, 400, "europe", [a, b], "u-me"))).toContain("a");
    // far side: only the road's far end in reach of nothing → still isolated, a road elsewhere is no connection
    expect(
      foundingIsolated(
        300,
        400,
        "europe",
        [
          mk("c", 300 + TRADE_DIST + 1, 400),
          mk("d", 300 + TRADE_DIST + 60, 400, "europe", { roads: [{ target: "c", at: t0 }] }),
        ],
        "u-me",
      ),
    ).toBe(true);
  });
  it("after founding and building, the partner leaves the menu and is counted by the rank certificate", () => {
    const a = mk("a", 360, 400),
      me = founded("me-real-id", 300, 400, "europe");
    const built = { ...me, roads: [{ target: "a", at: t0 + 2 * D }] };
    expect(roadCandidates(built, [a, built])).toEqual([]);
    expect(roadsFor(built, [a, built], t0 + 30 * D)).toBe(
      foundingRoadCandidates(300, 400, "europe", [a], "u-me").length,
    );
  });
});

describe("reach edges", () => {
  it(`lone neighbour: ${TRADE_DIST} tiles is in reach, ${TRADE_DIST + 1} is isolated`, () => {
    expect(foundingIsolated(300, 400, "europe", [mk("a", 300 + TRADE_DIST, 400)], "u-me")).toBe(
      false,
    );
    expect(foundingIsolated(300, 400, "europe", [mk("a", 300 + TRADE_DIST + 1, 400)], "u-me")).toBe(
      true,
    );
  });
  it(`two towns within ${NEAR_ROAD_DIST}: reach shrinks to ${NEAR_ROAD_DIST} exactly as in the road menu`, () => {
    const n1 = mk("n1", 360, 400),
      n2 = mk("n2", 300 + NEAR_ROAD_DIST, 400),
      far = mk("far", 300 + NEAR_ROAD_DIST + 1, 400);
    const got = ids(foundingRoadCandidates(300, 400, "europe", [n1, n2, far], "u-me"));
    expect(got).toEqual(["n1", "n2"]);
    const me = founded("me-real-id", 300, 400, "europe");
    expect(ids(roadCandidates(me, [n1, n2, far, me]))).toEqual(got);
  });
});

describe("agreement with the road menu and the rank certificate on real terrain", () => {
  // Deterministic sample on every map: the probe verdict equals the founded village's road menu, and every
  // offered partner, once decided, adds exactly one road to roadsFor (the rank certificate input).
  let r = 20261126;
  const rnd = () => (r = (r * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  const uuid = () =>
    "xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx".replace(/x/g, () => Math.floor(rnd() * 16).toString(16));
  it("all maps", () => {
    let sites = 0,
      isolated = 0,
      offered = 0;
    for (const realm of REALMS) {
      setRealm(realm);
      const seeds: Seed[] = [];
      for (let g = 0; seeds.length < 40 && g < 20000; g++) {
        const x = Math.floor(rnd() * MAP),
          y = Math.floor(rnd() * MAP);
        if (canPlant(x, y, seeds) === null) seeds.push(mk(`s${seeds.length}`, x, y, realm));
      }
      for (let k = 0, g = 0; k < 10 && g < 5000; g++) {
        const x = Math.floor(rnd() * MAP),
          y = Math.floor(rnd() * MAP);
        if (canPlant(x, y, seeds) !== null) continue;
        k++;
        sites++;
        const probe = ids(foundingRoadCandidates(x, y, realm, seeds, "u-me"));
        const me = founded(uuid(), x, y, realm),
          world = [...seeds, me];
        expect(ids(roadCandidates(me, world)), `${realm} ${x},${y}`).toEqual(probe);
        if (!probe.length) {
          isolated++;
          expect(roadsFor(me, world, t0 + 60 * D)).toBe(0);
        }
        for (const o of probe) {
          offered++;
          const built = { ...me, roads: [{ target: o, at: t0 + 2 * D }] };
          expect(
            roadsFor(built, [...seeds, built], t0 + 2 * D + TRADE_DIST * H),
            `${realm} ${x},${y} → ${o}`,
          ).toBe(1);
        }
      }
    }
    expect(sites).toBeGreaterThan(50);
    expect(isolated).toBeGreaterThan(0);
    expect(offered).toBeGreaterThan(50);
  }, 120_000);
});

describe("why the warning matters (rank rule, unchanged)", () => {
  it("without any road or sea way a village stops at Kleinstadt (rank 3), however large", () => {
    const top = RANK_NEED[RANK_NEED.length - 1]!;
    expect(rankOf({ citizens: top[0] * 10, homes: top[1] * 10, roads: 0 })).toBe(3);
    expect(rankOf({ citizens: top[0], homes: top[1], roads: 1 })).toBe(4);
  });
});
