/** Which decision the mayor faces now, in fixed order: first road, then charter, then the day's visitor. */
export type DecisionKind = "road" | "charter" | "encounter";
export function pickDecision(o: { road: boolean; charter: boolean; encounter: boolean }, snoozed: (k: DecisionKind) => boolean) {
  const due = (["road", "charter", "encounter"] as const).filter((k) => o[k]);
  return { due, open: due.find((k) => !snoozed(k)) ?? null };
}
