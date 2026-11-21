import { describe, it, expect, afterEach } from "vitest";
import { monumentChain, stepsDone, guildtowerDone, specialDone, monumentProgress, chainMemoCfg, MONUMENT_KEYS } from "../world";
import { residentTax } from "../resident-tax";
import { setRealm, type Realm } from "../time";
import { HEAVY, C0, DAY, H, both } from "../__ref/monument-fixtures";

/**
 * Testebene 3 (slow): monument-chain memo against the plain computation for the heaviest town — all seven general
 * monuments, Zunftturm and every build-speed modifier (the reference path needs ~5 s per stepsDone, minutes per
 * residentTax). Fast scenarios: src/game/monument-chain-identity.test.ts.
 */
afterEach(() => { chainMemoCfg.on = true; setRealm("europe"); });

describe("monument chain memo, heaviest town", () => {
  const seeds = HEAVY.seeds(), s = seeds[0]!;
  // before the monuments, inside the first build days (Zunftturm/Bauhütte/Freimarkt overlap), around the DST switch, long after
  const ts = [C0 + 150.2 * DAY, C0 + 152 * DAY + 5 * H, Date.parse("2026-03-29T03:00:00Z"), Date.parse("2026-10-27T12:00:00Z"), C0 + 420 * DAY];
  for (const realm of ["europe", "us-west", "asia"] as Realm[]) {
    it(`${realm}: chains, stepsDone, monumentProgress, guildtowerDone, specialDone at historical times`, () => {
      setRealm(realm);
      const r = both(() => [...ts, ts[1]!, ts[0]!].map((t) => ({ gt: guildtowerDone(s, t), sd: specialDone(s, [s], t),
        m: MONUMENT_KEYS.map((k) => [monumentChain(s, k, t), stepsDone(s, k, t), monumentProgress(s, t, k)]) })));
      expect(r.memo).toEqual(r.ref);
    });
  }
  it("europe: residentTax after all monuments", () => {
    const r = both(() => residentTax(s, [...seeds], C0 + 420 * DAY));
    expect(r.memo).toEqual(r.ref);
  });
});
