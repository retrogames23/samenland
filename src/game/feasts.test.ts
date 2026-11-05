import { describe, it, expect, beforeEach } from "vitest";
import { setRealm } from "./time";
import { feastOn, julianEaster, isRestDay, isFeastRest, bonfireLit, christmasNight } from "./feasts";

// noon Berlin time on a real date (game year = real − 526)
const at = (iso: string, h = 12) => Date.parse(`${iso}T${String(h - 1).padStart(2, "0")}:00:00Z`);

describe("church year around 1500", () => {
  beforeEach(() => setRealm("europe"));
  it("Julian Easter 1501 is 11 April and 1502 is 27 March", () => {
    expect(julianEaster(1501)).toEqual([4, 11]);
    expect(julianEaster(1502)).toEqual([3, 27]);
  });
  it("Easter 1501 falls on the map's Sunday 11 April and is a day of rest", () => {
    expect(feastOn(at("2027-04-11"))).toBe("easter");
    expect(isFeastRest(at("2027-04-11"))).toBe(true);
    expect(feastOn(at("2027-04-09"))).toBe("goodfriday");
    expect(feastOn(at("2027-05-30"))).toBe("pentecost");
  });
  it("Christmas begins with the midnight mass on the eve", () => {
    expect(feastOn(at("2026-12-24", 15))).toBeNull();
    expect(feastOn(at("2026-12-24", 21))).toBe("christmas");
    expect(christmasNight(at("2026-12-24", 23))).toBe(true);
    expect(feastOn(at("2026-12-25"))).toBe("christmas");
  });
  it("ordinary weekdays are no feast and no rest", () => {
    expect(feastOn(at("2026-11-05"))).toBeNull();
    expect(isRestDay(at("2026-11-05"))).toBe(false);
    expect(feastOn(at("2026-11-11"))).toBe("martinmas");
  });
  it("Shrovetide is a working day", () => {
    expect(feastOn(at("2027-02-23"))).toBe("shrovetide");
    expect(isRestDay(at("2027-02-23"))).toBe(false);
  });
  it("the Easter fire burns only in the evening", () => {
    expect(bonfireLit(at("2027-04-11", 12))).toBe(false);
    expect(bonfireLit(at("2027-04-11", 21))).toBe(true);
  });
  it("feasts follow the realm clock", () => {
    setRealm("asia");
    expect(feastOn(Date.parse("2026-12-24T16:00:00Z"))).toBe("christmas"); // 01:00 on the 25th in Tokyo
  });
});
