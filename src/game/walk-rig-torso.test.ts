import { describe, expect, it } from "vitest";
import { MAN_TORSO } from "./man-torso-data";
import { torsoState } from "./walk-rig";

// P6e experiment: painted upper-body states (scripts/gen-man-torso.py)
describe("painted upper-body states", () => {
  it("four states per painted frame, one walk cycle", () => {
    expect(MAN_TORSO.states).toBe(8 * MAN_TORSO.perFrame);
    expect(MAN_TORSO.cell[0]).toBeGreaterThan(0);
    expect(MAN_TORSO.cell[1]).toBeGreaterThan(0);
  });
  it("follows the walk phase in order and wraps without a jump", () => {
    const n = MAN_TORSO.states;
    let prev = torsoState(0);
    for (let i = 1; i <= 640; i++) {
      const s = torsoState(i / 640);
      const step = (s - prev + n) % n;
      expect(step === 0 || step === 1).toBe(true); // never skips or runs backwards, also across u = 1 → 0
      prev = s;
    }
    expect(torsoState(1)).toBe(torsoState(0));
    expect(torsoState(-0.25)).toBe(torsoState(0.75));
  });
  it("the painted frames sit at their walk phases (frame k at u = k / 8)", () => {
    for (let k = 0; k < 8; k++) expect(torsoState(k / 8)).toBe(k * MAN_TORSO.perFrame);
  });
  it("is drawn above the rig's ground and inside the rig cell", () => {
    const [ox, oy] = MAN_TORSO.origin,
      [cw, ch] = MAN_TORSO.cell;
    expect(oy).toBeGreaterThanOrEqual(0);
    expect(oy + ch).toBeLessThan(170); // upper body only: the legs stay the rig's
    expect(ox + 28).toBeGreaterThanOrEqual(0); // + SHIFT into the 200 px cell
    expect(ox + 28 + cw).toBeLessThanOrEqual(200);
  });
});
