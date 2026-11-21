import type { Lang } from "./i18n";
import { SEEN } from "./lang/seen";

/** Beyond this many days the hint only says "not seen for weeks". */
export const SEEN_WEEKS_AFTER = 14;
export type SeenBucket = { kind: "today" } | { kind: "yesterday" } | { kind: "days"; n: number } | { kind: "weeks" };

/** Calendar days since the mayor last visited (server-side day count) → hint bucket; null when unknown. */
export function seenBucket(days: number | null | undefined): SeenBucket | null {
  if (days == null || !Number.isFinite(days) || days < 0) return null;
  const d = Math.floor(days);
  if (d === 0) return { kind: "today" };
  if (d === 1) return { kind: "yesterday" };
  return d > SEEN_WEEKS_AFTER ? { kind: "weeks" } : { kind: "days", n: d };
}
/** "Zuletzt im Ort: gestern", or null when nothing is known (the hint is then left out). */
export function seenText(lang: Lang, days: number | null | undefined): string | null {
  const b = seenBucket(days), t = SEEN[lang];
  if (!b) return null;
  const when = b.kind === "today" ? t.today : b.kind === "yesterday" ? t.yesterday : b.kind === "days" ? t.days(b.n) : t.weeks;
  return `${t.label}: ${when}`;
}
