import { describe, it, expect } from "vitest";
import { rebuildProgress, rebuildLeft, activeRuins, FIRE_REBUILD, FLOOD_REBUILD, fires } from "./disasters";
import { helpedProgress, nothilfeItem, isNothilfe, NOTHILFE_PRICE, NOTHILFE_RANK } from "./nothilfe";
import { needRankOf } from "./economy";
import type { Seed } from "./world";

const H = 3.6e6;
const ev = { at: 0, end: 4 * H };
const base = (extra: Partial<Seed> = {}) => ({ id: "00000000-0000-0000-0000-000000000001", x: 500, y: 340, created_at: "2026-01-01T00:00:00Z", bought: [], ...extra }) as unknown as Seed;
const paidAt = (kind: "f" | "w", t: number) => ({ bought: [{ item: nothilfeItem(kind, ev.at), at: t }] });

describe("Zimmerleute-Nothilfe", () => {
  it("costs 80 Mark from Weiler", () => { expect(NOTHILFE_PRICE).toBe(80); expect(NOTHILFE_RANK).toBe(1); expect(needRankOf("nothilfe-f123")).toBe(1); });
  it("fire ruin: remaining time halves exactly", () => {
    const pay = ev.end + 10 * H, s0 = base(), s1 = base(paidAt("f", pay));
    const before = rebuildLeft(s0, "f", ev, pay), after = rebuildLeft(s1, "f", ev, pay + 1);
    expect(before).toBeCloseTo(26 * H, -3);
    expect(after).toBeCloseTo(13 * H - 1, -3);
  });
  it("flood ruin: remaining time halves exactly", () => {
    const pay = ev.end + 8 * H, s1 = base(paidAt("w", pay));
    expect(rebuildLeft(base(), "w", ev, pay)).toBeCloseTo(40 * H, -3);
    expect(rebuildLeft(s1, "w", ev, pay + 1)).toBeCloseTo(20 * H - 1, -3);
  });
  it("craft charter: help halves the already doubled rest once, never ×4 from the start", () => {
    const craft = { charter: { path: "craft", at: 0 } } as Partial<Seed>;
    const pay = ev.end + 6 * H, s = base({ ...craft, ...paidAt("f", pay) });
    expect(rebuildLeft(base(craft), "f", ev, pay)).toBeCloseTo(12 * H, -3); // 36/2 − 6
    expect(rebuildLeft(s, "f", ev, pay + 1)).toBeCloseTo(6 * H - 1, -3);
    expect(rebuildProgress(s, "f", ev, pay)).toBeCloseTo(rebuildProgress(base(craft), "f", ev, pay), 9);
  });
  it("help paid after the rebuild finished changes nothing", () => {
    const raw = (t: number) => (t - ev.end) / FIRE_REBUILD;
    const late = ev.end + FIRE_REBUILD + H;
    expect(helpedProgress(raw, late, ev.end, late + H)).toBe(raw(late + H));
  });
  it("help of another event does not touch this one", () => {
    const s = base({ bought: [{ item: nothilfeItem("f", 999), at: ev.end + H }] } as Partial<Seed>);
    expect(rebuildProgress(s, "f", ev, ev.end + 2 * H)).toBeCloseTo(2 * H / FIRE_REBUILD, 9);
    expect(rebuildProgress(base(paidAt("w", ev.end + H)), "f", ev, ev.end + 2 * H)).toBeCloseTo(2 * H / FIRE_REBUILD, 9);
  });
  it("is pure: same rows and clock give the same progress", () => {
    const s = base(paidAt("w", ev.end + 3 * H));
    expect(rebuildProgress(s, "w", ev, ev.end + 9 * H)).toBe(rebuildProgress(base(paidAt("w", ev.end + 3 * H)), "w", ev, ev.end + 9 * H));
    expect(FLOOD_REBUILD).toBe(48 * H);
  });
  it("item key names one event", () => { expect(nothilfeItem("f", 1234.7)).toBe("nothilfe-f1234"); expect(isNothilfe("nothilfe-w1")).toBe(true); expect(isNothilfe("nothilfe-x1")).toBe(false); });
  it("activeRuins lists only ruins still being rebuilt", () => {
    const s = base(), far = Date.parse("2026-06-01T00:00:00Z");
    const f = fires(s, far).find((x) => !x.guarded)!;
    expect(f).toBeTruthy();
    expect(activeRuins(s, f.end + H).some((r) => r.kind === "f" && r.at === f.at)).toBe(true);
    expect(activeRuins(s, f.end + FIRE_REBUILD + H).some((r) => r.kind === "f" && r.at === f.at)).toBe(false);
  });
});
