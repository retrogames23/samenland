/** Visible craft scenes (fisher, smith, miller, baker): pure functions of the world clock — nothing stored. */

/** Workday window for outdoor craft props (world hour). */
export const CRAFT_OPEN = 7, CRAFT_CLOSE = 18;

/** Flour sacks stacked at the mill door: 0 overnight, grows through the workday to 4, stays until dusk. */
export function sacksAt(hour: number, sunday: boolean): number {
  if (sunday || hour < CRAFT_OPEN || hour >= CRAFT_CLOSE + 2) return 0;
  return Math.max(0, Math.min(4, Math.floor(((hour - CRAFT_OPEN) / (CRAFT_CLOSE - CRAFT_OPEN)) * 4) + 1));
}

/** Bread basket by the bakery door: out from morning till evening (bakers work Sundays too). */
/** Oven fire and chimney smoke: the town baker fires up before dawn (3:00) and lets the oven cool by late
 *  afternoon; the communal bakehouse is only heated by day. At night both stay dark (fire order, c. 1500). */
export const OVEN_HOURS: Record<string, [number, number]> = { bakery: [3, 17], backhaus: [6, 15] };
export const ovenLit = (kind: string, hour: number) => { const w = OVEN_HOURS[kind]; return !w || (hour >= w[0] && hour < w[1]); };

export const breadOut = (hour: number) => hour >= 6 && hour < CRAFT_CLOSE + 1;

/** Fishers cast only by day, not on Sundays and not on deep-winter ice. */
export const fishingNow = (hour: number, sunday: boolean, winter: number) =>
  !sunday && winter < 0.6 && hour >= CRAFT_OPEN - 1 && hour < CRAFT_CLOSE + 1;

/** Workshops alternate between a cooper (staves bent over open fire) and a weaving room, by tile hash. */
export const workshopCraft = (sd: number): "cooper" | "loom" => ((Math.imul(sd | 0, 2654435761) >>> 0) % 2 ? "cooper" : "loom");
/** Cooper and weaver work by day, never on Sundays or at night. */
export const workshopOpen = (hour: number, sunday: boolean) => !sunday && hour >= CRAFT_OPEN && hour < CRAFT_CLOSE;
