/** Owner-chosen village names: the database enforces the same seven-day wait. */
export const RENAME_WAIT = 7 * 864e5;

/** Real timestamp when the owner may rename again; zero for villages never renamed. */
export function renameReadyAt(renamedAt?: string | null): number {
  const at = renamedAt ? Date.parse(renamedAt) : NaN;
  return Number.isFinite(at) ? at + RENAME_WAIT : 0;
}

/** Whole-day count shown to the player, rounded up so the wait never appears over early. */
export function renameDaysLeft(readyAt: number, now: number): number {
  return Math.max(0, Math.ceil((readyAt - now) / 864e5));
}
