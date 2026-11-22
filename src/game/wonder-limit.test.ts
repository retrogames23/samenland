import { describe, it, expect } from "vitest";
import { nextWonderAt, WONDER_LIMIT, type WonderFind } from "./wonders";
import { PRINCELY } from "./lang/princely";

// claim_wonder allows 3 finds in a rolling 24 h. The note used to promise "tomorrow" — wrong after evening finds.
const H = 3.6e6,
  now = Date.parse("2026-11-22T10:00:00Z");
const row = (seed: string, hAgo: number, i: number): WonderFind => ({
  id: `w${i}`,
  seed_id: seed,
  site: `oak:${i}:1`,
  realm: "europe",
  first: false,
  reward: 50,
  created_at: new Date(now - hAgo * H).toISOString(),
});

describe("wonder limit: rolling 24 hours", () => {
  it("is free below the limit", () => {
    expect(WONDER_LIMIT).toBe(3);
    expect(
      nextWonderAt([row("me", 1, 1), row("me", 2, 2), row("other", 3, 3)], "me", now),
    ).toBeNull();
  });
  it("three finds yesterday evening still block this morning, until the third-newest is a day old", () => {
    const rows = [row("me", 15, 1), row("me", 14, 2), row("me", 13, 3), row("me", 30, 4)];
    expect(nextWonderAt(rows, "me", now)).toBe(now - 15 * H + 24 * H); // free again in 9 h, not "tomorrow"
  });
  it("with four recent finds the third-newest decides", () => {
    const rows = [row("me", 20, 1), row("me", 10, 2), row("me", 5, 3), row("me", 1, 4)];
    expect(nextWonderAt(rows, "me", now)).toBe(now - 10 * H + 24 * H);
  });
  it("no language promises 'tomorrow' any more; the time is named", () => {
    for (const [lang, p] of Object.entries(PRINCELY)) {
      expect(p.tired("19:00"), lang).toContain("19:00");
      expect(p.tired(null), lang).not.toContain("null");
      expect(p.tired(null), lang).toContain("24");
    }
    expect(PRINCELY.de.tired("19:00")).not.toMatch(/morgen|heute/i);
    expect(PRINCELY.en.tired("19:00")).not.toMatch(/tomorrow|today/i);
  });
});
