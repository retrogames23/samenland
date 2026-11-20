import { describe, expect, it } from "vitest";
import { VORHABEN, VORHABEN_KEYS, vorhabenPrice, nextVorhaben, vorhabenReady, vorhabenOf, bauhuetteDone, lastDayTax } from "./vorhaben";
import { workClock, workDone } from "./time";

const H = 3.6e6, D = 864e5;
const T0 = Date.parse("2026-11-02T00:00:00Z");
const seed = (...at: number[]) => ({ bought: at.map((a, i) => ({ item: `bauhuette${i + 1}`, at: a })) });

describe("Bauhütte anwerben", () => {
  it("is the only community work, from Weiler, 48 h, 5-day pause", () => {
    expect(VORHABEN_KEYS).toEqual(["bauhuette"]);
    expect(VORHABEN.bauhuette.rank).toBe(1);
    expect(VORHABEN.bauhuette.len).toBe(48 * H);
    expect(VORHABEN.bauhuette.gap).toBe(5 * D);
    for (const k of ["armen1", "fest1", "pflaster1"]) expect(vorhabenOf(k)).toBeNull();
  });
  it("costs one daily tax, at least 50 Mark, nothing below Weiler", () => {
    expect(vorhabenPrice("bauhuette", 0, 1000)).toBe(0);
    expect(vorhabenPrice("bauhuette", 1, 0)).toBe(50);
    expect(vorhabenPrice("bauhuette", 1, 30)).toBe(50);
    expect(vorhabenPrice("bauhuette", 3, 1004)).toBe(1000);
    expect(lastDayTax({ 3: 100, 5: 240 })).toBe(240);
  });
  it("numbering and pause", () => {
    expect(nextVorhaben("bauhuette", ["bauhuette1", "freimarkt1"])).toBe("bauhuette2");
    expect(vorhabenReady(seed(T0), "bauhuette")).toBe(T0 + 5 * D);
  });
  const work = (a: number, b: number) => workClock(b) - workClock(a);
  it("a running build gets exactly 50 % extra work inside the window, never instant", () => {
    const at = T0 - 2 * D, done = workDone(at, 6 * D), w = T0;
    const got = bauhuetteDone(seed(w), at, done);
    // work before window + 1.5 × work in window up to finish equals the build's work
    expect(work(at, w) + 1.5 * work(w, Math.min(got, w + 48 * H)) + Math.max(0, work(w + 48 * H, got))).toBeCloseTo(6 * D, -3);
    expect(got).toBeLessThan(done);
    expect(got).toBeGreaterThan(w);
    expect(done - got).toBeCloseTo(work(w, w + 48 * H) / 2 * 1, -6); // 48 h of work → 24 h saved on the work clock (approx in real time)
  });
  it("a build started inside the window also benefits; untouched outside", () => {
    const w = T0, at = T0 + 10 * H, done = workDone(at, 10 * H);
    const got = bauhuetteDone(seed(w), at, done);
    expect(work(at, got)).toBeCloseTo((10 * H) / 1.5, -3);
    const late = T0 + 3 * D, dl = workDone(late, 10 * H);
    expect(bauhuetteDone(seed(w), late, dl)).toBe(dl);
    const early = T0 - 5 * D, de = workDone(early, 1 * D);
    expect(bauhuetteDone(seed(w), early, de)).toBe(de);
  });
  it("each window counts once — applying the rule twice changes nothing more than once", () => {
    const at = T0 - D, done = workDone(at, 4 * D), s = seed(T0);
    const once = bauhuetteDone(s, at, done);
    expect(bauhuetteDone(seed(T0, T0 + 5 * D), at, done)).toBe(once); // later lodge after finish: no effect
  });
});
