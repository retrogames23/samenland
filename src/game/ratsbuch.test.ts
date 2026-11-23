import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  BOON_LIMIT,
  ENCOUNTERS,
  EVENT_KEYS,
  EVENT_KEYS_RB,
  EVENT_WEIGHT,
  RATSBUCH_GRACE,
  RATSBUCH_KINDS,
  RATSBUCH_SINCE,
  boonHours,
  eventOf,
  eventWeight,
  guestNow,
  pendingEncounter,
  type Decision,
} from "./encounters";
import { commonsDue } from "./commons";
import { requestChoices } from "./ratsbuch";
import { setRealm } from "./time";
import type { Seed } from "./world";

// M1 Paket 2b, engine side: pool switch at the cut-over (P2-P), the 24 h grace (P2-F), Ratsbuch rows outside the
// visitor rhythm (P2-R), the Ratsbuch answers (rule 6) and the constant mirrored by SQL (P2-S). DB rules: ratsbuch.pg.test.ts.
setRealm("europe");
const H = 3.6e6,
  DAY = 864e5;
const SQL = readFileSync(
  new URL("../../drizzle/migrations/0141_ratsbuch.sql", import.meta.url),
  "utf8",
);
const MIG40 = readFileSync(
  new URL("../../drizzle/migrations/0140_boon_effects.sql", import.meta.url),
  "utf8",
);
const village = (id: string, c0: number, decisions: Decision[] = []): Seed =>
  ({
    id,
    name: "Testdorf",
    owner: "o",
    x: 500,
    y: 340,
    hue: 0,
    realm: "europe",
    user_id: "u",
    created_at: new Date(c0).toISOString(),
    bought: [],
    decisions,
  }) as Seed;
const SIX = RATSBUCH_KINDS as readonly string[];
/** A test cut-over, a Monday 00:00 UTC; the real one stays in the far future until Paket 4. */
const SINCE = Date.UTC(2026, 5, 1);

describe("P2-S: the cut-over constant is mirrored by SQL", () => {
  it("RATSBUCH_SINCE equals ratsbuch_since(), lies in the far future and is a Monday 00:00 UTC", () => {
    const m = /SELECT '([0-9-]+ [0-9:]+\+00)'::timestamptz/.exec(SQL);
    expect(m).not.toBeNull();
    expect(Date.parse(m![1]!.replace(" ", "T").replace("+00", "Z"))).toBe(RATSBUCH_SINCE);
    expect(RATSBUCH_SINCE).toBeGreaterThan(Date.UTC(2099, 0, 1));
    expect(new Date(RATSBUCH_SINCE).getUTCDay()).toBe(1);
    expect(RATSBUCH_SINCE % DAY).toBe(0);
    expect(RATSBUCH_GRACE).toBe(24 * H);
    expect(SQL).toContain("now() < since + interval '24 hours'");
  });
  it("the six kinds and their request weights match EVENT_WEIGHT and ratsbuch_kind", () => {
    expect([...RATSBUCH_KINDS].sort()).toEqual([
      "journeyman",
      "monk",
      "orphan",
      "ruin",
      "surveyor",
      "widow",
    ]);
    expect(RATSBUCH_KINDS.map((k) => EVENT_WEIGHT[k])).toEqual([12, 10, 7, 7, 3, 3]);
    expect(SQL).toContain("kind IN ('journeyman','orphan','widow','monk','ruin','surveyor')");
    expect(SQL).toMatch(
      /r := r - 12;[^\n]*'journeyman'[\s\S]*r := r - 10;[^\n]*'orphan'[\s\S]*r := r - 7;[^\n]*'widow'[\s\S]*r := r - 7;[^\n]*'monk'/,
    );
  });
  it("0141 keeps every price of 0139 unchanged (P1-$ stays valid)", () => {
    const g39 = readFileSync(
      new URL("../../drizzle/migrations/0139_encounters_server_only.sql", import.meta.url),
      "utf8",
    );
    const caseOf = (s: string) =>
      s.slice(s.indexOf("  price := CASE"), s.indexOf("    ELSE NULL END;"));
    expect(caseOf(SQL)).toBe(caseOf(g39));
    expect(caseOf(SQL).length).toBeGreaterThan(1000);
  });
});

describe("P2-P: visitor pool from the cut-over", () => {
  it("before the cut-over the draw is bit for bit the old one", () => {
    for (let i = 0; i < 30; i++) {
      const c0 = SINCE - 40 * DAY,
        s = village(`old-${i}`, c0);
      const decs: Decision[] = [];
      for (let n = 0; n < 12; n++) {
        const t = c0 + (n + 1) * 7 * H;
        const a = pendingEncounter(s, decs, t, SINCE),
          b = pendingEncounter(s, decs, t);
        expect(a).toBe(b);
        decs.push({ event: a ?? "merchant", choice: "pass", cost: 0, at: t });
      }
    }
  });
  it("from the cut-over none of the six is drawn; everybody else keeps the absolute weights", () => {
    expect(EVENT_KEYS_RB).toEqual(EVENT_KEYS.filter((k) => !SIX.includes(k)));
    expect(EVENT_KEYS_RB).toHaveLength(17);
    expect(EVENT_KEYS_RB.reduce((s, k) => s + (EVENT_WEIGHT[k] ?? 5), 0)).toBe(115);
    expect(EVENT_KEYS.reduce((s, k) => s + (EVENT_WEIGHT[k] ?? 5), 0)).toBe(157);
    const ctx = { ageH: 1e4, season: "autumn" as const, recent: [] };
    const count = new Map<string, number>();
    const N = 10000;
    for (let n = 0; n < N; n++) {
      const e = eventOf(`d-${n % 97}`, n, ctx, EVENT_KEYS_RB);
      count.set(e, (count.get(e) ?? 0) + 1);
    }
    for (const k of SIX) expect(count.get(k) ?? 0, k).toBe(0);
    // relative shares grow by the same factor for everybody: share ≈ weight × season / total of the new pool
    const total = EVENT_KEYS_RB.reduce((t, k) => t + eventWeight(k, ctx), 0);
    for (const k of EVENT_KEYS_RB)
      expect(Math.abs((count.get(k) ?? 0) / N - eventWeight(k, ctx) / total), k).toBeLessThan(
        0.012,
      );
  });
  it("a window opened from the cut-over on never shows a growth visitor", () => {
    for (let i = 0; i < 200; i++) {
      const s = village(`new-${i}`, SINCE - 30 * DAY);
      const last: Decision = { event: "merchant", choice: "pass", cost: 0, at: SINCE + 3 * H };
      const p = pendingEncounter(s, [last], SINCE + 10 * H, SINCE);
      expect(SIX.includes(p!), `${i}: ${p}`).toBe(false);
    }
  });
});

describe("P2-F: the 24 h grace for windows opened before the cut-over", () => {
  it("shows the old draw until SINCE + 24 h, the new pool after that — same window, same n", () => {
    let graced = 0;
    for (let i = 0; i < 300; i++) {
      const s = village(`g-${i}`, SINCE - 30 * DAY);
      const decs: Decision[] = [{ event: "merchant", choice: "pass", cost: 0, at: SINCE - 8 * H }];
      const old = pendingEncounter(s, decs, SINCE - H);
      expect(pendingEncounter(s, decs, SINCE + 23 * H, SINCE)).toBe(old);
      const after = pendingEncounter(s, decs, SINCE + RATSBUCH_GRACE, SINCE)!;
      expect(SIX.includes(after)).toBe(false);
      if (SIX.includes(old!)) graced++;
    }
    expect(graced).toBeGreaterThan(30);
  });
});

describe("P2-R: Ratsbuch rows stay outside the visitor rhythm", () => {
  it("draw, gap, draw count and commons question are the same with and without Ratsbuch rows", () => {
    for (let i = 0; i < 60; i++) {
      const c0 = SINCE + DAY,
        s = village(`r-${i}`, c0);
      const visit: Decision = { event: "cow", choice: "show", cost: 0, at: c0 + 20 * DAY };
      const rb: Decision[] = [
        { event: "journeyman", choice: "host", cost: 30, at: c0 + 20 * DAY + 3 * H, request: "q1" },
        {
          event: "orphan",
          choice: "apprentice",
          cost: 0,
          at: c0 + 20 * DAY + 5 * H,
          request: "q2",
        },
      ];
      for (const t of [c0 + 20 * DAY + 4 * H, c0 + 20 * DAY + 7 * H, c0 + 22 * DAY]) {
        expect(pendingEncounter(s, [visit, ...rb], t, SINCE)).toBe(
          pendingEncounter(s, [visit], t, SINCE),
        );
        expect(commonsDue(s, [visit, ...rb], 500, 2)).toBe(commonsDue(s, [visit], 500, 2));
      }
    }
  });
  it("an accepted request shows its guest in the village for a while", () => {
    const c0 = SINCE + DAY,
      s = village("guest", c0);
    const visit: Decision = { event: "cow", choice: "show", cost: 0, at: c0 + 20 * DAY };
    const rb: Decision = {
      event: "widow",
      choice: "shelter",
      cost: 40,
      at: c0 + 20 * DAY + H,
      request: "q",
    };
    const g = guestNow(s, [visit, rb], c0 + 20 * DAY + 2 * H);
    expect(g?.event).toBe("widow");
  });
  it("Ratsbuch growth counts in boonHours like any answer, additively (rule 4: no extra cap)", () => {
    const t = Date.UTC(2030, 0, 1);
    const a: Decision = { event: "journeyman", choice: "host", cost: 30, at: t, request: "q1" };
    const b: Decision = { event: "monk", choice: "copy", cost: 45, at: t + H };
    const c: Decision = { event: "wedding", choice: "feast", cost: 60, at: t + 2 * H };
    const now = t + 50 * H;
    expect(boonHours([a, b, c], now)).toBeCloseTo(
      boonHours([a], now) + boonHours([b], now) + boonHours([c], now),
      9,
    );
    expect(boonHours([a], now)).toBeCloseTo(50 * 0.15, 9);
    expect(boonHours([{ ...a, request: null }], now)).toBe(boonHours([a], now));
    // seven boons in parallel add up without any further cap
    const seven = Array.from({ length: 7 }, (_, i): Decision => ({
      event: "ruin",
      choice: "shrine",
      cost: 60,
      at: t + i,
    }));
    expect(boonHours(seven, t + 200 * H)).toBeCloseTo(7 * 120 * 0.1, 6);
  });
});

describe("rule 6/8: Ratsbuch answers and growth classification", () => {
  it("the growth answers are exactly the 11 boon_effects rows, incl. wedding, Lichtstube, Gast frei, Störer dulden", () => {
    const growth = Object.entries(ENCOUNTERS).flatMap(([e, cs]) =>
      Object.entries(cs as Record<string, { fx: { growth?: number; h?: number } }>)
        .filter(([, c]) => c.fx.growth)
        .map(([c, x]) => `${e}:${c}:${x.fx.growth}:${x.fx.h}`),
    );
    const rows = [...MIG40.matchAll(/\('([a-z]+)', '([a-z]+)', ([0-9.]+), ([0-9]+)\)/g)].map(
      (m) => `${m[1]}:${m[2]}:${Number(m[3])}:${m[4]}`,
    );
    expect(rows.sort()).toEqual(growth.sort());
    for (const k of ["wedding:feast", "lichtstube:reigen", "gast:frei", "stoerer:dulden"])
      expect(rows.some((r) => r.startsWith(k + ":"))).toBe(true);
    // the orphan's apprenticeship is visible but no growth boon: it never takes a guest place
    expect(rows.some((r) => r.startsWith("orphan:apprentice"))).toBe(false);
  });
  it("offers only answers that can still take effect", () => {
    for (const k of RATSBUCH_KINDS) {
      const open = requestChoices(k, BOON_LIMIT - 1);
      expect(open.length).toBeGreaterThan(0);
      for (const c of open) if (c.choice !== "apprentice") expect(c.growth).toBeGreaterThan(0);
      const full = requestChoices(k, BOON_LIMIT);
      expect(full.map((c) => c.choice)).toEqual(k === "orphan" ? ["apprentice"] : []);
    }
    expect(requestChoices("journeyman", 0).map((c) => c.choice)).toEqual(["host", "settle"]);
    expect(requestChoices("orphan", 0).map((c) => [c.choice, c.cost])).toEqual([
      ["adopt", 20],
      ["apprentice", 0],
    ]);
    expect(requestChoices("journeyman", 0)[0]).toEqual({
      choice: "host",
      cost: 30,
      growth: 0.15,
      hours: 72,
    });
  });
});

describe("13: narrative encounters stay", () => {
  it("every non-growth visitor and every commons question is unchanged and still drawn", () => {
    for (const k of EVENT_KEYS) if (!SIX.includes(k)) expect(EVENT_KEYS_RB).toContain(k);
    // the six keep their texts and answers for old windows and the history (nothing removed from ENCOUNTERS)
    for (const k of SIX) expect(Object.keys(ENCOUNTERS)).toContain(k);
  });
});
