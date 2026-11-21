import { afterEach, describe, expect, it } from "vitest";
import { bauhuetteGrowth, bauhuetteHours } from "./vorhaben";
import { effAge, effAgeBound, speedParts, GROWTH_PACE, type Seed } from "./world";
import { setRealm } from "./time";

const H = 3.6e6, D = 864e5;
const SINCE = bauhuetteGrowth.since, RATE = bauhuetteGrowth.rate;
const rows = (...at: number[]) => ({ bought: at.map((a, i) => ({ item: `bauhuette${i + 1}`, at: a })) });
afterEach(() => { bauhuetteGrowth.since = SINCE; bauhuetteGrowth.rate = RATE; });

describe("Bauhütte growth hours (P0)", () => {
  it("starts at +200 % and has a fixed cutover", () => {
    expect(RATE).toBe(2);
    expect(new Date(SINCE).toISOString()).toBe("2026-12-01T00:00:00.000Z");
  });
  it("accrues rate × hours for exactly 48 h after payment, nothing before or after", () => {
    const a = SINCE + 10 * D;
    expect(bauhuetteHours(rows(a), a - 1)).toBe(0);
    expect(bauhuetteHours(rows(a), a)).toBe(0);
    expect(bauhuetteHours(rows(a), a + 24 * H)).toBeCloseTo(24 * RATE, 9);
    expect(bauhuetteHours(rows(a), a + 48 * H)).toBeCloseTo(48 * RATE, 9);
    expect(bauhuetteHours(rows(a), a + 400 * H)).toBeCloseTo(48 * RATE, 9);
    expect(bauhuetteHours(rows(a, a + 5 * D), a + 20 * D)).toBeCloseTo(96 * RATE, 9);
  });
  it("purchases before the cutover keep their old effect (no growth); the cutover moment itself counts", () => {
    expect(bauhuetteHours(rows(SINCE - 1), SINCE + 30 * D)).toBe(0);
    expect(bauhuetteHours(rows(SINCE), SINCE + 30 * D)).toBeCloseTo(48 * RATE, 9);
    expect(bauhuetteHours(rows(SINCE - 1, SINCE + 10 * D), SINCE + 30 * D)).toBeCloseTo(48 * RATE, 9);
  });
  it("overlapping windows never count twice", () => {
    const a = SINCE + D;
    expect(bauhuetteHours(rows(a, a + 24 * H), a + 10 * D)).toBeCloseTo(72 * RATE, 9);
    expect(bauhuetteHours(rows(a, a), a + 10 * D)).toBeCloseTo(48 * RATE, 9);
  });
  it("ignores other purchases and rate 0 switches it off", () => {
    const s = { bought: [{ item: "freimarkt1", at: SINCE + D }, { item: "bauhuette1", at: SINCE + D }] };
    expect(bauhuetteHours(s, SINCE + 5 * D)).toBeCloseTo(48 * RATE, 9);
    bauhuetteGrowth.rate = 0;
    expect(bauhuetteHours(s, SINCE + 5 * D)).toBe(0);
  });
});

describe("Bauhütte growth in effAge", () => {
  setRealm("europe");
  const c0 = SINCE + 2 * D;
  // Sample towns (no user_id) are never care-gated and connect by themselves, so trade is active here.
  const town = (bought: Seed["bought"]): Seed => ({ id: "aaaa0000-bh", name: "A", owner: "x", x: 300, y: 420, hue: 0, realm: "europe", created_at: new Date(c0).toISOString(),
    charter: { path: "farm", at: c0 + D }, blessed: [c0 + 3 * D], bought });
  const nb: Seed = { id: "bbbb0000-bh", name: "B", owner: "y", x: 345, y: 420, hue: 0, realm: "europe", created_at: new Date(c0 - 90 * D).toISOString() };
  const now = c0 + 60 * D;
  const plain = town([]), hired = town([{ item: "bauhuette1", at: c0 + 5 * D }, { item: "bauhuette2", at: c0 + 10 * D }]);
  it("adds exactly bauhuetteHours × GROWTH_PACE — trade, blessing, farm charter and mentor do not amplify it", () => {
    const sp = speedParts(plain, [plain, nb], now);
    expect(sp.trade).toBeGreaterThan(0); // trade really is in play
    const d = effAge(hired, [hired, nb], now) - effAge(plain, [plain, nb], now);
    expect(d).toBeCloseTo(bauhuetteHours(hired, now) * GROWTH_PACE, 6);
    expect(d).toBeCloseTo(96 * RATE * GROWTH_PACE, 6);
  });
  it("an old (pre-cutover) Bauhütte leaves effAge unchanged", () => {
    const old = town([{ item: "bauhuette1", at: SINCE - D }]);
    expect(effAge(old, [old, nb], now)).toBe(effAge(plain, [plain, nb], now));
  });
  it("effAgeBound stays an upper bound with Bauhütte growth", () => {
    for (const t of [c0 + 6 * D, c0 + 11 * D, now]) expect(effAgeBound(hired, [hired, nb], t)).toBeGreaterThanOrEqual(effAge(hired, [hired, nb], t));
  });
});
