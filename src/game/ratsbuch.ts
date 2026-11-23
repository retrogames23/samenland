/**
 * Ratsbuch (M1 Paket 2b): which answers a council-book request offers. Pure and shared by the trusted server
 * (ratsbuch.server.ts builds the book with it) and the tests; the database encounter_guard enforces the same rules
 * on every booking, so the client only shows what the server sent and asks.
 */
import { BOON_LIMIT, ENCOUNTERS, type EventKey } from "./encounters";

export type RequestKind = "journeyman" | "orphan" | "widow" | "monk" | "ruin" | "surveyor";
export type RequestChoice = { choice: string; cost: number; growth: number; hours: number };

/**
 * The answers that can still take effect: the growth answers of that visitor while fewer than BOON_LIMIT boons are
 * active, and the orphan's apprenticeship (visible, free, no guest place) at any time. The narrative counter-answers
 * have no effect and are the "decline" of the book. Never an answer whose promised effect could not happen.
 */
export function requestChoices(kind: RequestKind, active: number): RequestChoice[] {
  const out: RequestChoice[] = [];
  for (const [choice, c] of Object.entries(ENCOUNTERS[kind as EventKey]) as [
    string,
    { cost: number; fx: { h?: number; growth?: number } },
  ][]) {
    if (c.fx.growth && c.fx.h) {
      if (active < BOON_LIMIT)
        out.push({ choice, cost: c.cost, growth: c.fx.growth, hours: c.fx.h });
    } else if (kind === "orphan" && choice === "apprentice")
      out.push({ choice, cost: c.cost, growth: 0, hours: c.fx.h ?? 0 });
  }
  return out;
}
