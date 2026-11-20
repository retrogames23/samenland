import { describe, it, expect } from "vitest";
import { FREIMARKT_PRICE, FREIMARKT_RANK, FREIMARKT_GAP, isFreimarkt, nextFreimarkt, freimarktOpen, freimarktReady, marketHelp } from "./freimarkt";
import { needRankOf } from "./economy";

const H = 3.6e6, DAY = 864e5, t0 = Date.UTC(2026, 10, 20, 10);
const seed = (...at: number[]) => ({ bought: at.map((a, i) => ({ item: `freimarkt${i + 1}`, at: a })) });

describe("Freimarkt", () => {
  it("costs 150 Mark and needs rank Dorf", () => {
    expect(FREIMARKT_PRICE).toBe(150);
    expect(FREIMARKT_RANK).toBe(2);
    expect(needRankOf("freimarkt1")).toBe(2);
    expect(needRankOf("freimarkt7")).toBe(2);
  });
  it("numbers each market so a row is never paid twice", () => {
    expect(nextFreimarkt([])).toBe("freimarkt1");
    expect(nextFreimarkt(["herbs", "freimarkt1", "freimarkt2"])).toBe("freimarkt3");
    expect(isFreimarkt("freimarkt0")).toBe(false);
  });
  it("stands for 24 hours, next one a week later", () => {
    const s = seed(t0);
    expect(freimarktOpen(s, t0 + 23 * H)).toBe(true);
    expect(freimarktOpen(s, t0 + 25 * H)).toBe(false);
    expect(freimarktReady(s)).toBe(t0 + 7 * DAY);
    expect(FREIMARKT_GAP).toBe(7 * DAY);
  });
  it("doubles rebuild speed only during market hours", () => {
    const s = seed(t0);
    expect(marketHelp(s, t0 - 10 * H, t0)).toBe(0);
    expect(marketHelp(s, t0 - 10 * H, t0 + 5 * H)).toBe(5 * H);
    expect(marketHelp(s, t0 + 2 * H, t0 + 48 * H)).toBe(22 * H);
    expect(marketHelp({ bought: [] }, 0, t0)).toBe(0);
  });
});

import { marketBoost, MARKET_BOOST } from "./freimarkt";
import { aidFactor } from "./gifts";
describe("Freimarkt carpenters", () => {
  const m = t0 + 10 * H;
  it("shortens a build already running by 12 hours, never before the market", () => {
    expect(MARKET_BOOST).toBe(12 * H);
    expect(marketBoost(seed(m), t0, t0 + 30 * H)).toBe(t0 + 18 * H);
    expect(marketBoost(seed(m), t0, t0 + 15 * H)).toBe(m);
  });
  it("leaves builds started after the market unchanged", () => {
    expect(marketBoost(seed(m), m + 1, m + 30 * H)).toBe(m + 30 * H);
    expect(marketBoost(seed(m), t0, m - 1)).toBe(m - 1);
  });
  it("applies the same market only once", () => {
    expect(marketBoost(seed(m), t0, t0 + 60 * H)).toBe(t0 + 48 * H);
    // two markets a week apart: a long build is helped once by each, never twice by the same
    expect(marketBoost(seed(m, m + 7 * DAY), t0, t0 + 200 * H)).toBe(m + 7 * DAY);
  });
  it("keeps the rebuild help and the weekly lock", () => {
    expect(marketHelp(seed(m), m, m + 24 * H)).toBe(24 * H);
    expect(aidFactor(undefined, m)).toBe(1);
    expect(freimarktReady(seed(t0, t0 + 7 * DAY))).toBe(t0 + 14 * DAY);
  });
});
