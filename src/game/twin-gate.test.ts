import { describe, it, expect } from "vitest";
import {
  links, twinSince, isTwin, pactOf, effAge, sinceStats, hash, radiusOf, __twinTestHooks,
  type Seed, type Link, type PactKind,
} from "./world";

// ---------------------------------------------------------------------------
// Independent pre-P.8d reference (P.8d.2). Never uses twinSiteAt, isTwin, pactOf,
// workOf or twinHours from world.ts; only the unchanged reference twinSince.
// Constants are pinned literally so later changes to world.ts cannot silently
// move the reference along with the code under test.
// ---------------------------------------------------------------------------
const R = {
  PACTS: ["trade", "shield", "culture"] as PactKind[],
  PACT_WAIT: 7 * 864e5, WORK_BUILD: 48 * 3.6e6, TWIN_BONUS: 0.1, WORK_BONUS: 0.05,
  PACT_GROWTH: { trade: 0.1, shield: 0, culture: 0.05 } as Record<PactKind, number>,
  BLESS_MS: 24 * 3.6e6, BLESS_BONUS: 0.1,
};
const rPairHash = (l: Link) => hash(l.a.x + l.b.x, l.a.y + l.b.y, 21);
const rFestivalDay = (l: Link, at: number) => new Date(at).getUTCDate() === 1 + Math.floor(rPairHash(l) * 28);
const rUtcDay = (t: number) => Math.floor(t / 864e5);
const rLatest = <T extends { partner: string; at: number }>(xs: T[] | undefined, id: string, now: number) =>
  (xs ?? []).filter((v) => v.partner === id && v.at <= now).sort((a, b) => b.at - a.at)[0];
const rLink = (s: Seed, o: Seed, seeds: Seed[]) =>
  links(seeds).find((k) => (k.a.id === s.id && k.b.id === o.id) || (k.a.id === o.id && k.b.id === s.id));

const refIsTwin = (l: Link, seeds: Seed[], now: number) => { const t = twinSince(l, seeds); return t !== null && now >= t; };

function refPactOf(s: Seed, o: Seed, seeds: Seed[], now: number): { kind: PactKind; at: number } | null {
  const l = rLink(s, o, seeds);
  if (!l) return null;
  const ts = twinSince(l, seeds); if (ts === null || now < ts) return null;
  const mine = rLatest(s.votes, o.id, now), theirs = rLatest(o.votes, s.id, now);
  let r: { kind: PactKind; at: number } | null = null;
  if (!s.user_id && !o.user_id) r = { kind: R.PACTS[Math.floor(rPairHash(l) * 3) % 3]!, at: ts };
  else if (!o.user_id || !s.user_id) { const v = mine ?? theirs; r = v ? { kind: v.pact, at: v.at } : null; }
  else if (mine && theirs) {
    if (mine.pact === theirs.pact) r = { kind: mine.pact, at: Math.max(mine.at, theirs.at) };
    else { const nw = mine.at > theirs.at ? mine : theirs; r = { kind: nw.pact, at: nw.at + R.PACT_WAIT }; }
  } else { const v = mine ?? theirs; r = v ? { kind: v.pact, at: v.at + R.PACT_WAIT } : null; }
  return r && r.at <= now ? r : null;
}
function refWorkDone(s: Seed, o: Seed, now: number) {
  const a = rLatest(s.works, o.id, now), b = rLatest(o.works, s.id, now) ?? (a && !o.user_id ? { ...a } : undefined);
  return a && b ? Math.max(a.at, b.at) + R.WORK_BUILD : null;
}
function refTwinHours(s: Seed, seeds: Seed[], now: number) {
  let h = 0;
  for (const l of links(seeds)) {
    if (l.a.id !== s.id && l.b.id !== s.id) continue;
    const ts = twinSince(l, seeds); if (ts === null || now < ts) continue;
    const o = l.a.id === s.id ? l.b : l.a;
    h += R.TWIN_BONUS * (now - ts) / 3.6e6;
    const p = refPactOf(s, o, seeds, now);
    if (p) h += R.PACT_GROWTH[p.kind] * (now - p.at) / 3.6e6;
    const done = refWorkDone(s, o, now);
    if (done !== null && now > done) h += R.WORK_BONUS * (now - done) / 3.6e6;
    for (const b of s.blessed ?? []) {
      if (b < ts || b > now || !rFestivalDay(l, b)) continue;
      if ((o.blessed ?? []).some((x) => rUtcDay(x) === rUtcDay(b)) || !o.user_id) h += Math.min(now - b, R.BLESS_MS) / 3.6e6 * R.BLESS_BONUS;
    }
  }
  return h;
}

// ---------------------------------------------------------------------------
// Fixed, reproducible constellations (no randomness).
// ---------------------------------------------------------------------------
const T0 = Date.parse("2026-01-01T00:00:00Z"), DAY = 864e5, Y3 = 3 * 365 * DAY;
const mk = (id: string, x: number, partner: string, extra: Partial<Seed> = {}): Seed => ({
  id, name: id, owner: id, x, y: 400, hue: 0, created_at: new Date(T0).toISOString(), user_id: `u-${id}`,
  bought: ["fisher", "hunter", "granary", "herbs", "healer"].map((item) => ({ item, at: 0 })),
  roads: [{ target: partner, at: T0 }], ...extra,
});
const pair = (dist: number, a: Partial<Seed> = {}, b: Partial<Seed> = {}) => {
  const seeds = [mk("a", 300, "b", a), mk("b", 300 + dist, "a", b)];
  return { seeds, sA: seeds[0]!, sB: seeds[1]!, l: links(seeds)[0]! };
};
/** Edge times: before/at founding, around ts (±1 ms, ±1/30/61/120 s), long after, 3-year edge, future. */
function times(ts: number | null, extra: number[] = []) {
  const t = [T0 - DAY, T0, T0 + 1, T0 + Y3 - 1, T0 + Y3, T0 + Y3 + 1, T0 + 5 * 365 * DAY, ...extra];
  for (let d = 0; d <= 1100; d += 50) t.push(T0 + d * DAY);
  if (ts !== null) {
    for (const k of [-120e3, -61e3, -60e3, -30e3, -1e3, -1, 0, 1, 1e3, 30e3, 60e3, 61e3, 120e3]) t.push(ts + k);
    for (const d of [1, 7, 7.5, 8, 30, 365]) t.push(ts + d * DAY);
  }
  return t;
}
const iso = (t: number | null) => (t === null ? "null" : new Date(t).toISOString());
const DISTS = [28, 40, 55, 75, 100];

// Pact scenarios: votes relative to T0 so most fall before/around the touch.
const vote = (partner: string, pact: PactKind, at: number) => ({ partner, pact, at });
const SCEN: { name: string; a: Partial<Seed>; b: Partial<Seed>; extra?: (ts: number) => number[] }[] = [
  { name: "übereinstimmend", a: { votes: [vote("b", "trade", T0 + DAY)] }, b: { votes: [vote("a", "trade", T0 + 2 * DAY)] } },
  { name: "abweichend", a: { votes: [vote("b", "trade", T0 + DAY)] }, b: { votes: [vote("a", "culture", T0 + 3 * DAY)] } },
  { name: "einseitig (7 Tage)", a: { votes: [vote("b", "shield", T0 + DAY)] }, b: {} },
  { name: "Mustersiedlung", a: { votes: [vote("b", "culture", T0 + DAY)] }, b: { user_id: null } },
  { name: "zwei Mustersiedlungen", a: { user_id: null }, b: { user_id: null } },
];
const lateVote = (ts: number) => ({ a: { votes: [vote("b", "trade", ts + 2 * DAY)] }, b: { votes: [vote("a", "culture", ts + 3 * DAY)] } });

describe("P.8d regression: isTwin equals pre-P.8d reference", () => {
  for (const dist of DISTS) it(`d=${dist}`, () => {
    const { seeds, l } = pair(dist);
    const ts = twinSince(l, seeds);
    for (const t of times(ts)) {
      const got = isTwin(l, seeds, t), want = refIsTwin(l, seeds, t);
      if (got !== want) throw new Error(`isTwin d=${dist} now=${iso(t)} ts=${iso(ts)}: got ${got}, ref ${want}`);
    }
  });
  it("covers both a touching and a never-touching pair", () => {
    expect(DISTS.some((d) => { const p = pair(d); return twinSince(p.l, p.seeds) !== null; })).toBe(true);
    const far = pair(110); expect(twinSince(far.l, far.seeds)).toBeNull();
  });
});

describe("P.8d regression: pactOf equals pre-P.8d reference (kind and at)", () => {
  for (const dist of DISTS) for (const sc of SCEN) it(`d=${dist} ${sc.name}`, () => {
    const { seeds, sA, sB, l } = pair(dist, sc.a, sc.b);
    const ts = twinSince(l, seeds);
    const extra = sc.a.votes?.flatMap((v) => [v.at + R.PACT_WAIT - 1, v.at + R.PACT_WAIT, v.at + R.PACT_WAIT + 1]) ?? [];
    for (const t of times(ts, extra)) for (const [s, o] of [[sA, sB], [sB, sA]] as const) {
      const got = pactOf(s, o, seeds, t), want = refPactOf(s, o, seeds, t);
      if (JSON.stringify(got) !== JSON.stringify(want))
        throw new Error(`pactOf d=${dist} ${sc.name} ${s.id}->${o.id} now=${iso(t)} ts=${iso(ts)}: got ${JSON.stringify(got)}, ref ${JSON.stringify(want)}`);
    }
  });
  it("votes cast after the touch (incl. differing wait) match the reference", () => {
    const base = pair(40); const ts = twinSince(base.l, base.seeds)!;
    expect(ts).not.toBeNull();
    const sc = lateVote(ts); const { seeds, sA, sB } = pair(40, sc.a, sc.b);
    for (const t of times(ts, [ts + 3 * DAY + R.PACT_WAIT, ts + 3 * DAY + R.PACT_WAIT - 1]))
      expect(pactOf(sA, sB, seeds, t)).toEqual(refPactOf(sA, sB, seeds, t));
  });
  it("positive pacts actually occur in the scenarios", () => {
    let positive = 0;
    for (const sc of SCEN) { const { seeds, sA, sB, l } = pair(40, sc.a, sc.b); const ts = twinSince(l, seeds)!; if (pactOf(sA, sB, seeds, ts + 30 * DAY)) positive++; }
    expect(positive).toBeGreaterThanOrEqual(4);
  });
});

describe("P.8d regression: twinHours equals pre-P.8d reference (all bonus parts)", () => {
  // Pact + joint work + daily blessings on both sides for ~3 years ⇒ every festival day after ts is hit.
  const bless = Array.from({ length: 1100 }, (_, i) => T0 + (i + 1) * DAY + 3600e3);
  const full = (who: "a" | "b"): Partial<Seed> => ({
    votes: [vote(who === "a" ? "b" : "a", "trade", T0 + DAY)],
    works: [{ partner: who === "a" ? "b" : "a", work: "hall", cost: 0, at: T0 + (who === "a" ? 10 : 12) * DAY }],
    blessed: bless,
  });
  const { twinHours, effAgeBase } = __twinTestHooks;
  for (const dist of DISTS) it(`d=${dist}`, () => {
    const { seeds, sA, sB, l } = pair(dist, full("a"), full("b"));
    const ts = twinSince(l, seeds);
    for (const t of times(ts, bless.slice(0, 40))) for (const s of [sA, sB]) {
      const got = twinHours(s, seeds, t), want = refTwinHours(s, seeds, t);
      if (!Object.is(got, want)) throw new Error(`twinHours d=${dist} ${s.id} now=${iso(t)} ts=${iso(ts)}: got ${got}, ref ${want}`);
    }
    // Full growth age as the game reads it: effAge = base + twinHours * GROWTH_PACE (0.35).
    if (ts !== null) for (const t of [ts, ts + DAY, ts + 365 * DAY])
      expect(effAge(sA, seeds, t)).toBe(effAgeBase(sA, seeds, t) + refTwinHours(sA, seeds, t) * 0.35);
  });
  it("every bonus part is exercised (twin, pact, work, blessing)", () => {
    const { seeds, sA, l } = pair(40, full("a"), full("b"));
    const ts = twinSince(l, seeds)!; const t = ts + 120 * DAY;
    const twinOnly = R.TWIN_BONUS * (t - ts) / 3.6e6;
    const p = refPactOf(sA, seeds[1]!, seeds, t)!; const done = refWorkDone(sA, seeds[1]!, t)!;
    expect(p).not.toBeNull(); expect(done).not.toBeNull();
    const noBless = twinOnly + R.PACT_GROWTH[p.kind] * (t - p.at) / 3.6e6 + R.WORK_BONUS * (t - done) / 3.6e6;
    expect(refTwinHours(sA, seeds, t)).toBeGreaterThan(noBless); // blessing share present
    expect(twinHours(sA, seeds, t)).toBe(refTwinHours(sA, seeds, t));
  });
});

describe("P.8d invariant: a twin relation never ends (real growth + radius functions)", () => {
  const { effAgeBase } = __twinTestHooks;
  for (const dist of DISTS) it(`d=${dist}`, () => {
    const { seeds, l } = pair(dist);
    const ts = twinSince(l, seeds);
    if (ts === null) return;
    const reach = (t: number) => radiusOf(effAgeBase(l.a, seeds, t)) + radiusOf(effAgeBase(l.b, seeds, t));
    let prev = -Infinity;
    const grid = [ts, ts + 1, ts + 60e3, ...Array.from({ length: 60 }, (_, i) => ts + (i + 1) * 30 * DAY), T0 + Y3, T0 + 6 * 365 * DAY];
    for (const t of grid.sort((x, y) => x - y)) {
      const r = reach(t);
      if (r < prev) throw new Error(`reach shrank d=${dist} at ${iso(t)}: ${r} < ${prev}`);
      prev = r;
      expect(r).toBeGreaterThanOrEqual(l.d);
      expect(isTwin(l, seeds, t)).toBe(true);
    }
  });
});

describe("P.8d performance guard", () => {
  it("untouched pair triggers no twinSince call (no bisection)", () => {
    const seeds = [mk("c", 300, "d"), mk("d", 410, "c")];
    const l = links(seeds)[0]!;
    const before = sinceStats.calls;
    expect(isTwin(l, seeds, T0 + 10 * DAY)).toBe(false);
    expect(pactOf(seeds[0]!, seeds[1]!, seeds, T0 + 10 * DAY)).toBeNull();
    effAge(seeds[0]!, seeds, T0 + 10 * DAY + 7);
    expect(sinceStats.calls).toBe(before);
  });
});
