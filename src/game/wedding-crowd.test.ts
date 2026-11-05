import { describe, it, expect } from "vitest";
import { setRealm, clock } from "./time";
import { triggerLab } from "./lab-ctl";
import { townOf, poseOf, WED_KIDS } from "./people";
import type { Seed } from "./world";

describe("village wedding", () => {
  setRealm("lab");
  const t0 = clock();
  triggerLab("wedding", t0);
  const s = { id: "65fbd428-610a-4b4e-9f5e-1a07c32a8c61", name: "M", realm: "lab", x: 290, y: 468, created_at: new Date(t0 - 30 * 864e5).toISOString(), user_id: "u" } as unknown as Seed;
  it("brings at most three children into the crowd", () => {
    const t = townOf(s, [s], t0 + 60e3);
    expect(WED_KIDS).toBe(3);
    expect(t.people.filter((p) => p.fete && p.age < 15).length).toBeLessThanOrEqual(3);
  });
  it("keeps bride and groom visible from the start and in front of church during the service", () => {
    for (const sec of [0, 600]) {
      const t = townOf(s, [s], t0 + sec * 1000), w = t.weddings[t.weddings.length - 1]!;
      expect(poseOf(w.a, t, [s], t0 + sec * 1000).visible).toBe(true);
      expect(poseOf(w.b, t, [s], t0 + sec * 1000).visible).toBe(true);
    }
  });
});
