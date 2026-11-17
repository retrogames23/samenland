import { describe, expect, it } from "vitest";
import { links, twinSince, isTwin, twinSiteAt, twinSites, MAP, type Seed, type Link } from "./world";
import { householdsOf } from "./households";
import { residentTax } from "./resident-tax";

const T0 = Date.parse("2026-01-01T00:00:00Z"), DAY = 864e5, Y3 = 3 * 365 * DAY;
const mk = (id: string, x: number, y: number, partner: string, extra: Partial<Seed> = {}): Seed => ({ id, name: id, owner: id, x, y, hue: 0, created_at: new Date(T0).toISOString(), user_id: `u-${id}`, bought: ["fisher", "hunter", "granary", "herbs", "healer"].map((item) => ({ item, at: 0 })), roads: [{ target: partner, at: T0 }], ...extra });
const pair = (a: Seed, b: Seed) => { const seeds = [a, b]; return { seeds, l: links(seeds)[0]! }; };
/** Exact (ms) first touch, found on the direct check itself. */
const exactTouch = (l: Link, seeds: Seed[]) => {
  let lo = Math.max(Date.parse(l.a.created_at), Date.parse(l.b.created_at)), hi = lo + Y3;
  while (hi - lo > 1) { const m = Math.floor((lo + hi) / 2); if (twinSiteAt(l, seeds, m)) hi = m; else lo = m; }
  return hi;
};
/** Reference sites: the previous twinSites gate (isTwin), compared on the gate decision per link. */
const refOn = (l: Link, seeds: Seed[], t: number) => l.tiles.length >= 7 && isTwin(l, seeds, t);
const siteOn = (l: Link, seeds: Seed[], t: number) => { const m = Math.floor(l.tiles.length / 2), [x, y] = l.tiles[m]!; return twinSites(seeds, t).has(y * MAP + x); };

describe("twinSites direct point-in-time check", () => {
  const { seeds, l } = pair(mk("a", 306, 420, "b"), mk("b", 343, 439, "a"));
  const ts = twinSince(l, seeds)!, tx = exactTouch(l, seeds);

  it("matches the reference before and after the minute window", () => {
    expect(ts).not.toBeNull();
    for (const t of [T0 + 1000, tx - 60000, tx - 1, ts, ts + 1, ts + 60000, ts + 30 * DAY, T0 + Y3 - 1, T0 + Y3 + 10 * DAY])
      expect(twinSiteAt(l, seeds, t), String(t)).toBe(isTwin(l, seeds, t));
  });
  it("activates up to one minute earlier between exact touch and the rounded twinSince (accepted)", () => {
    expect(ts - tx).toBeGreaterThan(0); expect(ts - tx).toBeLessThanOrEqual(60000);
    expect(isTwin(l, seeds, tx)).toBe(false); expect(twinSiteAt(l, seeds, tx)).toBe(true);
    expect(twinSiteAt(l, seeds, tx - 1)).toBe(false);
  });
  it("never before the younger town is founded", () => {
    const late = T0 + 100 * DAY;
    const p = pair(mk("a", 306, 420, "b"), mk("b", 343, 439, "a", { created_at: new Date(late).toISOString() }));
    for (const t of [T0 + 50 * DAY, late - 1]) { expect(twinSiteAt(p.l, p.seeds, t)).toBe(false); expect(isTwin(p.l, p.seeds, t)).toBe(false); }
    const t2 = twinSince(p.l, p.seeds)!; expect(t2).toBeGreaterThanOrEqual(late);
    expect(twinSiteAt(p.l, p.seeds, t2)).toBe(true);
  });
  it("a pair not touching within three years never becomes a twin later", () => {
    const p = pair(mk("a", 300, 420, "b"), mk("b", 368, 420, "a"));
    if (!p.l) return;
    expect(twinSince(p.l, p.seeds)).toBeNull();
    for (const t of [T0 + Y3, T0 + Y3 + 1, T0 + 5 * 365 * DAY, T0 + 20 * 365 * DAY]) expect(twinSiteAt(p.l, p.seeds, t)).toBe(false);
  });
  it("blessings, charter and purchases shift touch identically", () => {
    const a = mk("a", 306, 420, "b", { blessed: [T0 + 2 * DAY, T0 + 9 * DAY], charter: { path: "farm", at: T0 + 5 * DAY } as Seed["charter"], bought: ["fisher", "hunter", "granary", "herbs", "healer", "markethall"].map((item, i) => ({ item, at: i === 5 ? T0 + 7 * DAY : 0 })) });
    const p = pair(a, mk("b", 343, 439, "a"));
    const t = twinSince(p.l, p.seeds)!; expect(t).toBeLessThanOrEqual(ts);
    const x = exactTouch(p.l, p.seeds);
    for (const q of [x - 1, t, t + DAY]) expect(twinSiteAt(p.l, p.seeds, q)).toBe(isTwin(p.l, p.seeds, q));
  });
  it("several links with different touch times agree with the reference sites", () => {
    const a = mk("a", 306, 420, "b"), b = mk("b", 343, 439, "a", { roads: [{ target: "a", at: T0 }, { target: "c", at: T0 }] }), c = mk("c", 385, 445, "b");
    const s3 = [a, b, c], ls = links(s3); expect(ls.length).toBeGreaterThanOrEqual(2);
    const times = ls.map((k) => twinSince(k, s3)).filter((t): t is number => t !== null);
    for (const base of times) for (const t of [base - 60001, base, base + DAY]) for (const k of ls) expect(siteOn(k, s3, t), `${k.a.id}-${k.b.id}@${t}`).toBe(refOn(k, s3, t));
  });
  it("links shorter than seven tiles never get twin sites", () => {
    const short = { ...l, tiles: l.tiles.slice(0, 6), water: l.water.slice(0, 6) };
    expect(short.tiles.length < 7 && refOn(short, seeds, ts + DAY)).toBe(false);
  });
  it("twin sites hold no taxable homes and tax is identical outside the minute window", () => {
    const t = ts + 60 * DAY, sites = twinSites(seeds, t); expect(sites.size).toBeGreaterThan(0);
    for (const s of seeds) {
      const homes = householdsOf(s, seeds, t);
      for (const h of homes) expect(sites.has(h.home[1] * MAP + h.home[0])).toBe(false);
      expect(residentTax(s, seeds, t)).toEqual(residentTax(s, [...seeds], t));
    }
    // inside the accepted window only gate tiles appear; residents and tax stay unchanged
    for (const s of seeds) expect(residentTax(s, seeds, tx)).toEqual(residentTax(s, seeds, tx - 1));
  });
});
