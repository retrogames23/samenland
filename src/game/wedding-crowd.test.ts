import { describe, it, expect } from "vitest";
import { setRealm, clock } from "./time";
import { triggerLab } from "./lab-ctl";
import { townOf, poseOf, weddingFocus, besideOf, SERVICE_SECS, WED_FETE_SECS, HONEY_H } from "./people";
import { clearLabEvent } from "./lab-ctl";
import type { Seed } from "./world";

describe("village wedding", () => {
  setRealm("lab");
  const t0 = clock();
  triggerLab("wedding", t0);
  const s = { id: "65fbd428-610a-4b4e-9f5e-1a07c32a8c61", name: "M", realm: "lab", x: 290, y: 468, created_at: new Date(t0 - 30 * 864e5).toISOString(), user_id: "u" } as unknown as Seed;
  it("keeps bride and groom visible from the start and in front of church during the service", () => {
    for (const sec of [0, 600]) {
      const t = townOf(s, [s], t0 + sec * 1000), w = t.weddings[t.weddings.length - 1]!;
      expect(poseOf(w.a, t, [s], t0 + sec * 1000).visible).toBe(true);
      expect(poseOf(w.b, t, [s], t0 + sec * 1000).visible).toBe(true);
    }
  });

  it("sees a desk wedding immediately, even when the town was cached just before", () => {
    clearLabEvent("wedding");
    const before = townOf(s, [s], t0 - 1000).weddings.length;
    triggerLab("wedding", t0);
    expect(townOf(s, [s], t0 + 500).weddings.at(-1)!.at).toBe(t0);
    expect(before).toBeGreaterThanOrEqual(0);
  });
  it("lets a priest take part, the service lasts 4 minutes and the church crowd 20", () => {
    const t = townOf(s, [s], t0);
    expect(SERVICE_SECS).toBe(240);
    expect(WED_FETE_SECS).toBe(1200);
    if (t.people.some((p) => p.job === "priest")) expect(t.people.some((p) => p.proc?.role === "priest")).toBe(true);
  });
  it("keeps the couple at home for 8 hours after the wedding", () => {
    expect(HONEY_H).toBe(8);
    const at = t0 + 6 * 3600e3, t = townOf(s, [s], at), g = t.people.find((p) => p.proc?.role === "groom")!;
    const q = poseOf(g, t, [s], at);
    expect(q.visible).toBe(false);
    expect(q.act).toBe("home");
  });
  it("follows the groom with the camera focus", () => {
    const t = townOf(s, [s], t0);
    expect(weddingFocus(t, t0, [s], t0)).not.toBeNull();
  });
  it("puts the bride beside, not ahead of, the groom", () => {
    const [ox, oy] = besideOf([1, 0], 0.3);
    expect(ox).toBeCloseTo(0);
    expect(Math.abs(oy)).toBeCloseTo(0.3);
  });
});
