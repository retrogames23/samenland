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
  roadReach,
  type Seed,
} from "./world";
import { roadsFor, rankOf, RANK_NEED } from "./rank";
import {
  foundingCheck,
  foundingIsolated,
  foundingReach,
  foundingRoadCandidates,
  FOUNDING_PROBE,
} from "./founding-roads";
import { DICT, LANGS } from "./i18n";

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
        expect(foundingReach(x, y, realm, seeds, "u-me"), `reach ${realm} ${x},${y}`).toBe(
          roadReach(me, world),
        );
        // the parchment's single computation gives the same two answers
        expect(foundingCheck(x, y, realm, seeds, "u-me"), `check ${realm} ${x},${y}`).toEqual({
          isolated: probe.length === 0,
          reach: roadReach(me, world),
        });
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

describe("reach named in the warning (P5a)", () => {
  // The warning names the reach roadCandidates really applies (roadReach), not always TRADE_DIST.
  const warn = (reach: number) =>
    LANGS.map((l) => DICT[l].plantAsk.farOff(reach, DICT[l].stages[3]!, DICT[l].stages[4]!));
  it(`two towns within ${NEAR_ROAD_DIST} across the water: isolated at reach ${NEAR_ROAD_DIST}, the warning says ${NEAR_ROAD_DIST}`, () => {
    // us-west 247,224: the towns at 65 and 78 tiles lie only across the water; the one at 95 is reachable by land
    setRealm("us-west");
    const n1 = mk("n1", 260, 288, "us-west"),
      n2 = mk("n2", 217, 296, "us-west"),
      land = mk("land", 342, 224, "us-west");
    expect(foundingIsolated(247, 224, "us-west", [n1, n2, land], "u-me")).toBe(true);
    expect(foundingReach(247, 224, "us-west", [n1, n2, land], "u-me")).toBe(NEAR_ROAD_DIST);
    expect(foundingCheck(247, 224, "us-west", [n1, n2, land], "u-me")).toEqual({
      isolated: true,
      reach: NEAR_ROAD_DIST,
    });
    const me = founded("me-real-id", 247, 224, "us-west");
    expect(roadReach(me, [n1, n2, land, me])).toBe(NEAR_ROAD_DIST);
    for (const msg of warn(foundingReach(247, 224, "us-west", [n1, n2, land], "u-me"))) {
      expect(msg).toContain(String(NEAR_ROAD_DIST));
      expect(msg).not.toContain(String(TRADE_DIST));
    }
    expect(warn(NEAR_ROAD_DIST)[0]).toContain("höchstens 80 Felder entfernt");
    // with full reach the land village would be a partner — the 80 is what isolates this spot
    expect(foundingReach(247, 224, "us-west", [land], "u-me")).toBe(TRADE_DIST);
    expect(foundingIsolated(247, 224, "us-west", [land], "u-me")).toBe(false);
  });
  it(`lone far neighbour: isolated at reach ${TRADE_DIST}, the warning still says ${TRADE_DIST}`, () => {
    const far = [mk("a", 300 + TRADE_DIST + 1, 400)];
    expect(foundingIsolated(300, 400, "europe", far, "u-me")).toBe(true);
    expect(foundingReach(300, 400, "europe", far, "u-me")).toBe(TRADE_DIST);
    expect(foundingReach(300, 400, "europe", [], "u-me")).toBe(TRADE_DIST);
    for (const msg of warn(foundingReach(300, 400, "europe", far, "u-me")))
      expect(msg).toContain(String(TRADE_DIST));
    expect(warn(TRADE_DIST)[0]).toContain("höchstens 120 Felder entfernt");
  });
  it("one town within 80 keeps the full reach, other maps never shrink it", () => {
    expect(foundingReach(300, 400, "europe", [mk("n1", 360, 400)], "u-me")).toBe(TRADE_DIST);
    expect(
      foundingReach(
        300,
        400,
        "europe",
        [mk("n1", 360, 400, "europe-2"), mk("n2", 300, 460, "europe-2")],
        "u-me",
      ),
    ).toBe(TRADE_DIST);
    expect(
      foundingReach(300, 400, "europe", [mk("n1", 360, 400), mk("n2", 300, 460)], "u-me"),
    ).toBe(NEAR_ROAD_DIST);
  });
});

describe("why the warning matters (rank rule, unchanged)", () => {
  it("without any road or sea way a village stops at Kleinstadt (rank 3), however large", () => {
    const top = RANK_NEED[RANK_NEED.length - 1]!;
    expect(rankOf({ citizens: top[0] * 10, homes: top[1] * 10, roads: 0 })).toBe(3);
    expect(rankOf({ citizens: top[0], homes: top[1], roads: 1 })).toBe(4);
  });
});
