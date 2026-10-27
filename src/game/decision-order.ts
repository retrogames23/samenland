/** Which decision the mayor faces now, in fixed order: first road, then charter, then a twin-town pact, then the day's visitor. */
export type DecisionKind = "road" | "charter" | "pact" | "encounter";
export function pickDecision(o: { road: boolean; charter: boolean; pact?: boolean; encounter: boolean }, snoozed: (k: DecisionKind) => boolean) {
  const due = (["road", "charter", "pact", "encounter"] as const).filter((k) => o[k]);
  return { due, open: due.find((k) => !snoozed(k)) ?? null };
}
