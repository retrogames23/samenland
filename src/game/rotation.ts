/**
 * Three-field rotation (Dreifelderwirtschaft, North Germany c. 1500): every acre belongs to one of three
 * Zelgen; each UTC year the roles move on winter rye -> summer oats/barley/peas -> fallow pasture -> winter rye.
 * Pure from acre id + calendar, display only — yields and household capacity stay unchanged.
 */
const DAY = 864e5;
export type Role = "winter" | "summer" | "fallow";
export type Look = "green" | "ripe" | "stubble" | "ploughed" | "fallow";
const ROLES: Role[] = ["winter", "summer", "fallow"];
const doy = (now: number) => { const d = new Date(now); return Math.floor((now - Date.UTC(d.getUTCFullYear(), 0, 1)) / DAY); };

/** Zelge 0–2 of an acre, mixed so neighbouring acres rarely share one. */
export const zelgeOf = (acreId: number) => (((acreId * 2654435761) >>> 0) % 3);
export const roleOf = (acreId: number, now: number): Role => ROLES[(zelgeOf(acreId) + new Date(now).getUTCFullYear()) % 3]!;

/** What the acre looks like today. */
export function fieldLook(acreId: number, now: number): Look {
  const d = doy(now), r = roleOf(acreId, now);
  if (r === "winter") return d < 182 ? "green" : d < 212 ? "ripe" : "stubble"; // rye: sown last autumn, reaped late July
  if (r === "summer") return d < 75 ? "stubble" : d < 110 ? "ploughed" : d < 205 ? "green" : d < 240 ? "ripe" : "stubble"; // oats sown in spring
  // fallow: grazed by the village herd, ploughed in June (Brachsturz), rye sown in late September
  return d < 152 ? "fallow" : d < 175 ? "ploughed" : d < 258 ? "fallow" : d < 285 ? "ploughed" : "green";
}
/** Sheaf stooks stand for four weeks after the reaping of that acre. */
export function sheafDays(acreId: number, now: number): boolean {
  const d = doy(now), r = roleOf(acreId, now);
  return r === "winter" ? d >= 212 && d < 240 : r === "summer" ? d >= 240 && d < 268 : false;
}
