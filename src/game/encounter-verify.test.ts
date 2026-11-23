import { describe, it, expect } from "vitest";
import { createHash } from "node:crypto";
import {
  ENCOUNTERS,
  EVENT_WEIGHT,
  EVENT_KEYS,
  eventOf,
  pendingEncounter,
  type Decision,
} from "./encounters";
import { commonsOptions } from "./commons";
import {
  openEncounterAt,
  verifyEncounterChoice,
  EVENT_RANK,
  VERIFY_TOLERANCE,
} from "./encounter-verify";
import { setRealm } from "./time";
import type { Seed } from "./world";

// M1 Paket 1 (P1-Z, P1-W, P1-C, P1-A): the server accepts an answer only for the encounter the shared pure draw opens.
setRealm("europe");
const H = 3.6e6,
  DAY = 864e5,
  C0 = Date.UTC(2026, 3, 1, 6);
const village = (id: string, decisions: Decision[] = [], x = 500, y = 340): Seed =>
  ({
    id,
    name: "Testdorf",
    owner: "o",
    x,
    y,
    hue: 0,
    realm: "europe",
    user_id: "u-" + id,
    created_at: new Date(C0).toISOString(),
    bought: [],
    decisions,
  }) as Seed;
const choices = (e: string) =>
  Object.keys((ENCOUNTERS as Record<string, Record<string, unknown>>)[e]!);

describe("verifyEncounterChoice (server authority)", () => {
  it("accepts exactly the open encounter and rejects every other one as stale", () => {
    const s = village("v-open"),
      now = C0 + 20 * DAY;
    const open = openEncounterAt(s, [s], now)!;
    expect(open).toBeTruthy();
    expect(verifyEncounterChoice(s, [s], now, open, choices(open)[0]!)).toBeNull();
    for (const e of Object.keys(ENCOUNTERS))
      if (e !== open)
        expect(verifyEncounterChoice(s, [s], now, e, choices(e)[0]!), e).toBe("stale");
  });
  it("cow:sell is refused unless the cow was really drawn (the 1.4e money gap)", () => {
    for (let i = 0; i < 40; i++) {
      const s = village(`v-cow-${i}`),
        now = C0 + 20 * DAY,
        open = openEncounterAt(s, [s], now);
      expect(verifyEncounterChoice(s, [s], now, "cow", "sell")).toBe(
        open === "cow" ? null : "stale",
      );
    }
  });
  it("rejects answers that do not exist for the encounter (P1-W)", () => {
    const s = village("v-w"),
      now = C0 + 20 * DAY,
      open = openEncounterAt(s, [s], now)!;
    expect(verifyEncounterChoice(s, [s], now, open, "steal")).toBe("fail");
    expect(verifyEncounterChoice(s, [s], now, "dragon", "slay")).toBe("fail");
    // an answer of another encounter never counts for the open one
    const foreign = Object.keys(ENCOUNTERS)
      .flatMap((e) => (e === open ? [] : choices(e)))
      .find((c) => !choices(open).includes(c))!;
    expect(verifyEncounterChoice(s, [s], now, open, foreign)).toBe("fail");
  });
  it("every visitor kind is accepted when it is the drawn one (P1-Z)", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 3000 && seen.size < EVENT_KEYS.length; i++) {
      // a prior answer at a later age opens the era-gated visitors (painter, surveyor, fair …) and all seasons
      const t1 = C0 + (10 + (i % 180)) * DAY,
        s = village(`v-kind-${i}`, [
          { event: "zaun", choice: "buss", at: t1 - 7 * H, cost: 0 },
          i % 2
            ? { event: "merchant", choice: "pass", at: t1, cost: 0 }
            : { event: "well", choice: "dig", at: t1, cost: 0 },
        ]);
      const now = t1 + 7 * H,
        open = openEncounterAt(s, [s], now);
      if (!open || !(EVENT_KEYS as readonly string[]).includes(open) || seen.has(open)) continue;
      for (const c of choices(open))
        expect(verifyEncounterChoice(s, [s], now, open, c), `${open}:${c}`).toBeNull();
      seen.add(open);
    }
    expect([...seen].sort()).toEqual([...EVENT_KEYS].sort());
  });
  it("respects the 6 h visitor gap: nothing is open right after an answer, the next visitor after the gap", () => {
    const s0 = village("v-gap"),
      t1 = C0 + 20 * DAY,
      e1 = openEncounterAt(s0, [s0], t1)!;
    const s = village("v-gap", [{ event: e1, choice: choices(e1)[0]!, at: t1, cost: 0 }]);
    expect(openEncounterAt(s, [s], t1 + 1 * H)).toBeNull();
    for (const e of Object.keys(ENCOUNTERS))
      expect(verifyEncounterChoice(s, [s], t1 + 1 * H, e, choices(e)[0]!), e).toBe("stale");
    const t2 = t1 + 6 * H + 30e3,
      e2 = openEncounterAt(s, [s], t2)!;
    expect(e2).toBeTruthy();
    // open at now but not yet at now − tolerance: still accepted (either sample suffices)
    expect(openEncounterAt(s, [s], t2 - VERIFY_TOLERANCE)).toBeNull();
    expect(verifyEncounterChoice(s, [s], t2, e2, choices(e2)[0]!)).toBeNull();
  });
  it("commons questions are verified with growth age and rank like the client (P1-C)", () => {
    let checked = 0;
    for (let i = 0; i < 200 && checked < 5; i++) {
      const id = `v-com-${i}`,
        t1 = C0 + 10 * DAY,
        s0 = village(id),
        e1 = openEncounterAt(s0, [s0], t1)!;
      const s = village(id, [{ event: e1, choice: choices(e1)[0]!, at: t1, cost: 0 }]),
        now = t1 + 7 * H;
      const open = openEncounterAt(s, [s], now)!;
      if ((EVENT_KEYS as readonly string[]).includes(open)) continue;
      expect(verifyEncounterChoice(s, [s], now, open, choices(open)[0]!)).toBeNull();
      // the visitor that would have come without the commons question is refused
      const visitor = pendingEncounter(s, s.decisions!, now)!;
      if (visitor !== open)
        expect(verifyEncounterChoice(s, [s], now, visitor, choices(visitor)[0]!)).toBe("stale");
      checked++;
    }
    expect(checked).toBeGreaterThan(0);
  });
  it("town-life questions need the rank EVENT_RANK names, mirroring commonsOptions (P1-R mirror)", () => {
    const s = village("v-rank"),
      at = C0 + 400 * DAY;
    for (const [e, need] of Object.entries(EVENT_RANK)) {
      expect(commonsOptions(s, [], 1e6, at, need - 1), `${e} below rank ${need}`).not.toContain(e);
    }
    for (const e of ["stoerer", "bier", "torschluss", "wache"])
      expect(commonsOptions(s, [], 1e6, at, 3)).toContain(e);
    for (const e of ["gast", "seuche"]) expect(commonsOptions(s, [], 1e6, at, 4)).toContain(e);
    expect(commonsOptions(s, [], 1e6, at, 5)).toContain("hansetag");
    // every town-life key of commonsOptions at the top rank is listed in EVENT_RANK
    const village0 = new Set(commonsOptions(s, [], 1e6, at, 0));
    for (const k of commonsOptions(s, [], 1e6, at, 5))
      if (!village0.has(k)) expect(EVENT_RANK[k], k).toBeGreaterThan(0);
  });
});

describe("atmosphere unchanged (P1-A)", () => {
  const digest = (v: unknown) =>
    createHash("sha256").update(JSON.stringify(v)).digest("hex").slice(0, 16);
  it("encounter table, weights and the first 200 draws of a test village are frozen", () => {
    const draws: string[] = [];
    for (let n = 0; n < 200; n++)
      draws.push(
        eventOf("00000000-0000-0000-0000-00000000a7a7", n, {
          ageH: 24 * (3 + n),
          season: (["spring", "summer", "autumn", "winter"] as const)[n % 4],
          recent: draws.slice(-4),
        }),
      );
    expect({
      table: digest(ENCOUNTERS),
      weights: digest(EVENT_WEIGHT),
      keys: digest(EVENT_KEYS),
      draws: digest(draws),
    }).toMatchInlineSnapshot(`
      {
        "draws": "46624e5ba01e66c4",
        "keys": "1c14596bc6c33ed9",
        "table": "8ddcafaa706ad67b",
        "weights": "9255e9c076e359b5",
      }
    `);
  });
});
