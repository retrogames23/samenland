import { describe, it, expect } from "vitest";
import { treasury, referralClaims, START_TALER, REFERRAL_TALER } from "./economy";
import type { Seed } from "./world";

const seed = (id: string) => ({ id, name: id, owner: "o", x: 0, y: 0, hue: 0, created_at: new Date(0).toISOString() }) as unknown as Seed;
describe("friend invite", () => {
  it("gives inviter and newcomer 50 Taler each", () => {
    const c = referralClaims([{ id: "r", referrer_seed: "a", referee_seed: "b", reward: 50, created_at: "" }]);
    expect(REFERRAL_TALER).toBe(50);
    expect(treasury(seed("a"), [], 0, [], c)).toBe(START_TALER + 50);
    expect(treasury(seed("b"), [], 0, [], c)).toBe(START_TALER + 50);
  });
});
