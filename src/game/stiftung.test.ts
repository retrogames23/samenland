// P4 Stiftungen — rules in TypeScript (Masterplan v6.7 4.1, Implementierungsauftrag Entwurf 2 Abschnitt 2.1 und 5).
// The cases S1–S5 here are the TypeScript half; the database half is src/lib/stiftung.pg.test.ts (same names).
import { describe, it, expect } from "vitest";
import { sickChance, SPITAL_SICK } from "./sickness";
import { kontorQuote, WAAGE_DISCOUNT } from "./resources";
import { chronicleEvents } from "./chronicle";
import { CIVIC_MONEY_RE, countsAsBuilding, isCivicMoney, kontorCost, type CivicRow } from "./civic";
import {
  STIFT_DAYS,
  STIFT_FACTOR,
  STIFT_MAX_DAYS,
  STIFT_MAX_MS,
  STIFT_MS,
  STIFT_NEED,
  STIFT_OPEN_REST_MS,
  STIFT_PAUSE_MS,
  STIFT_SINCE,
  STIFT_SINCE_LAB,
  isStiftRow,
  stiftCloseAllowed,
  stiftDeposit,
  stiftEndowed,
  stiftExtend,
  stiftFreeQuota,
  stiftKontor,
  stiftMarker,
  stiftOpenLock,
  stiftPlan,
  stiftPrice,
  stiftReserved,
  stiftRest,
  stiftRestDays,
  stiftSince,
  stiftSpans,
  stiftUntil,
  stiftVorrang,
  waageFactor,
  type StiftRow,
} from "./stiftung";
import type { Seed } from "./world";

const DAY = 864e5,
  SEC = 1000;
const T0 = Date.UTC(2027, 5, 1, 9, 30);
const seed = (bought: { item: string; at: number }[]): Seed =>
  ({
    id: "stift-test",
    x: 500,
    y: 500,
    created_at: new Date(T0 - 400 * DAY).toISOString(),
    user_id: null,
    bought: [...bought].sort((a, b) => a.at - b.at),
  }) as unknown as Seed;
const base = [
  { item: "spital1", at: T0 - 100 * DAY },
  { item: "waage1", at: T0 - 100 * DAY },
];
const closes = (bau: "spital" | "waage", ...at: number[]) =>
  at.map((t, i) => ({ item: stiftMarker(bau, i + 1), at: t }));

describe("P4 Stiftungen – Grundwerte und Zeilenmuster", () => {
  it("Werte der Entscheidung: 4 Tagessteuern, 30/20, 14/28 Tage, ×0,85, 7 Tage", () => {
    expect(stiftPrice(1375)).toBe(5500);
    expect(STIFT_NEED).toEqual({ wood: 30, stone: 20 });
    expect([STIFT_DAYS, STIFT_MAX_DAYS, STIFT_FACTOR]).toEqual([14, 28, 0.85]);
    expect([STIFT_MS, STIFT_MAX_MS, STIFT_OPEN_REST_MS, STIFT_PAUSE_MS]).toEqual([
      14 * DAY,
      28 * DAY,
      14 * DAY,
      7 * DAY,
    ]);
  });
  it("Schalter (P4 Schritt 2b, 0169): nur lab ist aktiv (28.11.2026 00:00 UTC); jede andere Welt bleibt auf dem Platzhalter 04.01.2100", () => {
    expect(stiftSince("lab")).toBe(Date.parse("2026-11-28T00:00:00Z"));
    expect(STIFT_SINCE_LAB).toBe(Date.parse("2026-11-28T00:00:00Z"));
    // the four public time zones, their overflow maps, anything unknown and no realm at all: off
    for (const r of [
      "europe", "us-west", "us-east", "asia", "europe-2", "europe-3", "us-west-2", "us-east-2", "asia-2",
      "Lab", "LAB", "lab ", "lab-2", "", "unknown", null, undefined,
    ])
      expect(stiftSince(r), String(r)).toBe(Date.UTC(2100, 0, 4));
    expect(STIFT_SINCE).toBe(Date.UTC(2100, 0, 4));
    // the opening rule follows the switch: lab may open now, a public village with the same state may not
    const now = Date.parse("2026-11-28T10:00:00Z");
    const s = seed([{ item: "spital1", at: now - 30 * DAY }]);
    const lock = (realm: string, at = now) =>
      stiftOpenLock({ realm, seed: s, bau: "spital", rows: [], civic: [], civicPaid: 0, lastTax: 500, now: at });
    expect(lock("lab")).toBeNull();
    expect(lock("lab", STIFT_SINCE_LAB)).toBeNull();
    expect(lock("lab", STIFT_SINCE_LAB - 1)).toEqual({ why: "inactive" });
    for (const r of ["europe", "us-west", "us-east", "asia", "europe-2"]) expect(lock(r)).toEqual({ why: "inactive" });
    for (const r of ["europe", "us-west", "us-east", "asia"]) expect(lock(r, Date.UTC(2099, 11, 31))).toEqual({ why: "inactive" });
  });
  it("Stiftungszeilen passen nie auf das Gemeindebau-Muster und zählen nicht als Gebäude (Kriterium 7)", () => {
    const rows = [stiftMarker("spital", 1), stiftDeposit("spital", 12, 3), stiftKontor("waage", 2)];
    expect(rows).toEqual(["stift:spital:1", "stift:spital:12:r3", "stift:waage:2:k"]);
    for (const r of rows) {
      expect(isStiftRow(r)).toBe(true);
      expect(isCivicMoney(r)).toBe(false);
      expect(CIVIC_MONEY_RE.test(r)).toBe(false);
      expect(/^(spital|waage)[1-9][0-9]*(:k[0-9]{8}|:r[1-9][0-9]*)?$/.test(r)).toBe(false);
      expect(countsAsBuilding(r)).toBe(false);
    }
    for (const r of [
      "spital1",
      "waage2",
      "herbs",
      "stift:dom:1",
      "stift:spital:0",
      "stift:spital:1:r0",
      "stift:spital:1:k2",
    ])
      expect(isStiftRow(r)).toBe(false);
    expect(countsAsBuilding("spital1")).toBe(true);
  });
  it("Stiftungszeilen erzeugen keinen Chronik-Eintrag (Kriterium 7)", () => {
    const plain = seed(base),
      s = seed([
        ...base,
        { item: stiftDeposit("spital", 1, 1), at: T0 - 2 * DAY },
        { item: stiftKontor("spital", 1), at: T0 - DAY },
        ...closes("spital", T0 - DAY),
      ]);
    const ev = (x: Seed) =>
      chronicleEvents(x, [x], T0 - 5 * DAY, T0).events.map((e) => `${e.code}@${e.at}`);
    expect(ev(s)).toEqual(ev(plain));
  });
});

describe("P4 Stiftungszeit additiv (Abschnitt 2.1) – TypeScript", () => {
  it("Regel: Ende_neu = max(Abschluss, Ende_alt) + 14 Tage, in Zeitpunkten", () => {
    expect(stiftExtend(T0, null)).toBe(T0 + 14 * DAY);
    expect(stiftExtend(T0, T0 + 10 * DAY)).toBe(T0 + 24 * DAY);
    expect(stiftExtend(T0, T0 - 3 * DAY)).toBe(T0 + 14 * DAY);
  });
  it("S1 Verlängerung bei laufender Stiftungszeit: 10 Tage Rest, Abschluss → 24 Tage Rest, keine zweite Laufzeit", () => {
    const c1 = T0 - 4 * DAY,
      s1 = seed([...base, ...closes("spital", c1)]);
    expect(stiftRest(s1, "spital", T0)).toBe(10 * DAY);
    const s2 = seed([...base, ...closes("spital", c1, T0)]);
    expect(stiftRest(s2, "spital", T0)).toBe(24 * DAY);
    expect(stiftUntil(s2, "spital", T0)).toBe(stiftUntil(s1, "spital", T0)! + 14 * DAY);
    expect(stiftSpans(s2, "spital").map((x) => x.until)).toEqual([c1 + 14 * DAY, c1 + 28 * DAY]);
    // one run to the added end, nothing parallel: endowed up to the end, not after
    expect(stiftEndowed(s2, "spital", c1 + 28 * DAY - 1)).toBe(true);
    expect(stiftEndowed(s2, "spital", c1 + 28 * DAY)).toBe(false);
  });
  it("S2 genau 14 Tage Rest: Öffnen und Abschluss erlaubt, 28 Tage Rest; eine Sekunde mehr: Öffnen abgelehnt", () => {
    // (a public map: its switch is the 2100 placeholder, so the opening rule is tested with instants after it)
    const B = STIFT_SINCE + 50 * DAY;
    const st = [{ item: "spital1", at: B - 100 * DAY }];
    // two closes: the end is B + 25 days; at B + 11 days exactly 14 days are left
    const s = seed([...st, ...closes("spital", B - 3 * DAY, B - 2 * DAY)]);
    expect(stiftUntil(s, "spital", B)).toBe(B + 25 * DAY);
    const lock = (now: number) =>
      stiftOpenLock({
        realm: "europe",
        seed: s,
        bau: "spital",
        rows: [],
        civic: [],
        civicPaid: 0,
        lastTax: 500,
        now,
      });
    const exact = B + 11 * DAY;
    expect(stiftRest(s, "spital", exact)).toBe(14 * DAY);
    expect(lock(exact)).toBeNull(); // exactly 14 days left: may be opened
    expect(stiftCloseAllowed(exact, stiftUntil(s, "spital", exact))).toBe(true);
    expect(stiftExtend(exact, stiftUntil(s, "spital", exact))).toBe(exact + 28 * DAY); // exactly 28 days after the close
    const closed = seed([...st, ...closes("spital", B - 3 * DAY, B - 2 * DAY, exact)]);
    expect(stiftRest(closed, "spital", exact)).toBe(STIFT_MAX_MS);
    // one second earlier 14 days and one second are left: the opening is refused, with the instant from which it works
    expect(stiftRest(s, "spital", exact - SEC)).toBe(14 * DAY + SEC);
    expect(lock(exact - SEC)).toEqual({ why: "full", rest: 14 * DAY + SEC, from: exact });
    expect(lock(exact - 1)).toEqual({ why: "full", rest: 14 * DAY + 1, from: exact }); // one millisecond is enough
    expect(stiftCloseAllowed(exact - SEC, stiftUntil(s, "spital", exact - SEC))).toBe(false); // and the close itself too
  });
  it("S3 Abschluss bei 0 Tagen Rest (abgelaufen oder nie gestiftet): 14 Tage ab dem Abschluss, nichts wird nachgeholt", () => {
    const never = seed([...base, ...closes("spital", T0)]);
    expect(stiftRest(never, "spital", T0)).toBe(14 * DAY);
    const lapsed = seed([...base, ...closes("spital", T0 - 40 * DAY, T0)]);
    expect(stiftEndowed(lapsed, "spital", T0 - 20 * DAY)).toBe(false);
    expect(stiftRest(lapsed, "spital", T0)).toBe(14 * DAY);
    expect(stiftUntil(lapsed, "spital", T0)).toBe(T0 + 14 * DAY);
  });
  it("S4 maximale Laufzeit: in keiner regelgerechten Folge über 28 Tage; ein Abschluss darüber ist nicht erlaubt", () => {
    // greedy player: opens as early as the rules allow (pause 7 d, rest ≤ 14 d) and closes at once
    let now = T0,
      until: number | null = null,
      lastOpen = -Infinity,
      max = 0;
    const at: number[] = [];
    for (let step = 0; step < 2000; step++) {
      const rest = until === null ? 0 : Math.max(0, until - now);
      if (now >= lastOpen + STIFT_PAUSE_MS && rest <= STIFT_OPEN_REST_MS) {
        expect(stiftCloseAllowed(now, until)).toBe(true);
        until = stiftExtend(now, until);
        lastOpen = now;
        at.push(now);
      }
      max = Math.max(max, until === null ? 0 : until - now);
      now += 3 * 3600 * SEC;
    }
    expect(at.length).toBeGreaterThan(15);
    expect(max).toBeLessThanOrEqual(STIFT_MAX_MS);
    expect(max).toBe(STIFT_MAX_MS);
    const s = seed([...base, ...closes("waage", ...at)]);
    for (const sp of stiftSpans(s, "waage"))
      expect(sp.until - sp.at).toBeLessThanOrEqual(STIFT_MAX_MS);
    // second guard: with more than 14 days left the close itself is refused
    expect(stiftCloseAllowed(T0, T0 + 14 * DAY)).toBe(true);
    expect(stiftCloseAllowed(T0, T0 + 14 * DAY + 1)).toBe(false);
    expect(stiftCloseAllowed(T0, T0 + 20 * DAY)).toBe(false);
  });
  it("S5 keine Verstärkung: mit einer und mit zwei Stufen im Vorrat derselbe Faktor ×0,85; nach dem addierten Ende der Grundwert", () => {
    const SUMMER = Date.UTC(2027, 6, 15, 12);
    const plainS = seed(base),
      one = seed([...base, ...closes("spital", SUMMER - DAY)]),
      two = seed([...base, ...closes("spital", SUMMER - 2 * DAY, SUMMER - DAY)]);
    const p = sickChance(plainS, SUMMER);
    expect(p).toBeCloseTo(sickChance(seed([]), SUMMER) * SPITAL_SICK, 12);
    expect(sickChance(one, SUMMER)).toBeCloseTo(p * STIFT_FACTOR, 12);
    expect(sickChance(two, SUMMER)).toBe(sickChance(one, SUMMER));
    // every day up to the added end the factor, afterwards the base value again
    const end = stiftUntil(two, "spital", SUMMER)!;
    expect(end).toBe(SUMMER - 2 * DAY + 28 * DAY);
    let n = 0;
    for (let t = SUMMER; t < end; t += DAY) {
      expect(sickChance(two, t)).toBeCloseTo(sickChance(plainS, t) * STIFT_FACTOR, 12);
      if (sickChance(plainS, t) > 0) n++;
    }
    expect(n).toBeGreaterThan(10);
    expect(sickChance(two, end - 1)).toBeCloseTo(sickChance(plainS, end - 1) * STIFT_FACTOR, 12);
    expect(sickChance(two, end)).toBe(sickChance(plainS, end));
    // Waage: Kontor price, one factor on top of Waage 1
    const w0 = seed(base),
      w1 = seed([...base, ...closes("waage", SUMMER - DAY)]),
      w2 = seed([...base, ...closes("waage", SUMMER - 2 * DAY, SUMMER - DAY)]);
    expect(waageFactor(w0, SUMMER)).toBe(WAAGE_DISCOUNT);
    expect(waageFactor(w1, SUMMER)).toBeCloseTo(WAAGE_DISCOUNT * STIFT_FACTOR, 12);
    expect(waageFactor(w2, SUMMER)).toBe(waageFactor(w1, SUMMER));
    const units = { wood: 30, stone: 20 };
    expect(kontorCost(units, null, waageFactor(w0, SUMMER))).toBe(204);
    expect(kontorCost(units, null, waageFactor(w1, SUMMER))).toBe(173);
    expect(kontorCost(units, null, waageFactor(w2, SUMMER))).toBe(173);
    expect(kontorCost(units, "gateway", waageFactor(w2, SUMMER))).toBe(156);
    expect(kontorCost(units, null, waageFactor(w2, stiftUntil(w2, "waage", SUMMER)!))).toBe(204);
    expect(kontorQuote(units, { wood: 0, stone: 0 }, null, waageFactor(w1, SUMMER)).cost).toBe(173);
    // a Spital endowment never touches the Kontor and the other way round
    expect(waageFactor(one, SUMMER)).toBe(WAAGE_DISCOUNT);
    expect(sickChance(w2, SUMMER)).toBe(sickChance(plainS, SUMMER));
  });
  it("Vergangenheit: ein späterer Abschluss ändert keinen früheren Zeitpunkt (gebuchte Steuertage bleiben)", () => {
    const c1 = T0,
      c2 = T0 + 10 * DAY;
    const before = seed([...base, ...closes("spital", c1)]),
      after = seed([...base, ...closes("spital", c1, c2)]);
    for (let t = c1 - 5 * DAY; t < c2; t += 6 * 3600 * SEC) {
      expect(stiftEndowed(after, "spital", t)).toBe(stiftEndowed(before, "spital", t));
      expect(stiftUntil(after, "spital", t)).toBe(stiftUntil(before, "spital", t));
      expect(sickChance(after, t)).toBe(sickChance(before, t));
    }
    // the bought array is replaced, not mutated: a new marker is seen at once
    expect(stiftUntil(after, "spital", c2)).toBe(c1 + 28 * DAY);
  });
  it("Anzeige rundet die Resttage auf", () => {
    expect([0, 1, DAY, DAY + 1, 13.2 * DAY, 14 * DAY].map(stiftRestDays)).toEqual([
      0, 1, 1, 2, 14, 14,
    ]);
  });
});

describe("P4 Stiftungen – Vorrang, Reservierung, Abschlussplan", () => {
  const civic = (o: Partial<CivicRow>): CivicRow =>
    ({
      item: "spital2",
      price: 18000,
      budget: 0,
      need_wood: 90,
      need_stone: 60,
      wood_got: 0,
      stone_got: 0,
      kontor_spent: 0,
      opened_at: "",
      funded_at: null,
      material_at: null,
      done_at: null,
      ...o,
    }) as CivicRow;
  it("Baustellen-Vorrang (D2): nur eine geöffnete, nicht voll bezahlte Stufe sperrt; endet mit der letzten Rate", () => {
    expect(stiftVorrang([])).toBeNull();
    expect(stiftVorrang([civic({})])?.item).toBe("spital2");
    expect(stiftVorrang([civic({ funded_at: "2027-01-01T00:00:00Z" })])).toBeNull();
    expect(
      stiftVorrang([
        civic({ item: "spital1", funded_at: "x", material_at: "x", done_at: "x" }),
        civic({ item: "waage2" }),
      ])?.item,
    ).toBe("waage2");
  });
  it("Reservierung (D6): der fehlende Materialbedarf bleibt reserviert, bis das Material vollständig ist", () => {
    const open = civic({ funded_at: "x", wood_got: 30, stone_got: 55 });
    expect(stiftReserved([open])).toEqual({ wood: 60, stone: 5 });
    expect(stiftFreeQuota({ wood: 100, stone: 3 }, stiftReserved([open]))).toEqual({
      wood: 40,
      stone: 0,
    });
    expect(
      stiftReserved([civic({ funded_at: "x", material_at: "x", wood_got: 90, stone_got: 60 })]),
    ).toEqual({ wood: 0, stone: 0 });
    expect(stiftFreeQuota(null, { wood: 0, stone: 0 })).toEqual({ wood: 0, stone: 0 });
  });
  it("Abschluss: zuerst Lager über 40/30, der Rest aus dem freien Kontingent zum Kontorpreis; reicht es nicht, nichts", () => {
    expect(stiftPlan({ wood: 100, stone: 80 }, { wood: 0, stone: 0 }, null, 1)).toEqual({
      store: { wood: 30, stone: 20 },
      kontor: { wood: 0, stone: 0 },
      short: { wood: 0, stone: 0 },
      cost: 0,
      ok: true,
    });
    const p = stiftPlan(
      { wood: 50, stone: 30 },
      { wood: 120, stone: 90 },
      "gateway",
      WAAGE_DISCOUNT,
    );
    expect(p).toMatchObject({
      store: { wood: 10, stone: 0 },
      kontor: { wood: 20, stone: 20 },
      ok: true,
      cost: Math.round(200 * 0.9 * 0.85),
    });
    const q = stiftPlan({ wood: 40, stone: 42 }, { wood: 30, stone: 0 }, null, 1);
    expect(q).toMatchObject({
      kontor: { wood: 30, stone: 8 },
      short: { wood: 0, stone: 8 },
      ok: false,
    });
  });
  it("Öffnen: Reihenfolge der Sperrgründe wie in der Datenbank (ohne Schalter geprüft)", () => {
    const rows = (o: Partial<StiftRow>[]): StiftRow[] =>
      o.map(
        (r, i) =>
          ({
            bau: "spital",
            nr: i + 1,
            price: 2000,
            paid: 0,
            opened_at: new Date(T0 - 30 * DAY).toISOString(),
            funded_at: null,
            done_at: "x",
            until_at: null,
            kontor: null,
            ...r,
          }) as StiftRow,
      );
    const NOW = STIFT_SINCE + 50 * DAY,
      shift = NOW - T0;
    const s = seed([...base, ...closes("spital", NOW - DAY)]);
    const lock = (o: Partial<Parameters<typeof stiftOpenLock>[0]>) =>
      stiftOpenLock({
        realm: "europe",
        seed: s,
        bau: "spital",
        rows: [],
        civic: [],
        civicPaid: 0,
        lastTax: 500,
        now: NOW,
        ...o,
      });
    expect(lock({})).toBeNull();
    expect(lock({ now: STIFT_SINCE - 1 })).toEqual({ why: "inactive" });
    expect(lock({ seed: seed([]) })).toEqual({ why: "bau" });
    expect(lock({ civic: [civic({})], civicPaid: 14600 })).toEqual({
      why: "vorrang",
      item: "spital2",
      rest: 3400,
    });
    expect(lock({ rows: rows([{ done_at: null }]) })).toEqual({ why: "open" });
    expect(lock({ rows: rows([{ bau: "waage", done_at: null }]) })).toBeNull();
    const opened = T0 + shift - 3 * DAY;
    expect(lock({ rows: rows([{ opened_at: new Date(opened).toISOString() }]) })).toEqual({
      why: "pause",
      from: opened + 7 * DAY,
    });
    expect(lock({ rows: rows([{ opened_at: new Date(NOW - 7 * DAY).toISOString() }]) })).toBeNull();
    const full = seed([...base, ...closes("spital", NOW - 2 * DAY, NOW - DAY)]);
    expect(lock({ seed: full })).toEqual({ why: "full", rest: 26 * DAY, from: NOW + 12 * DAY });
    expect(lock({ lastTax: null })).toEqual({ why: "tax" });
    expect(lock({ lastTax: 0 })).toEqual({ why: "tax" });
  });
});
