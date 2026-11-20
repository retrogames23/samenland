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
