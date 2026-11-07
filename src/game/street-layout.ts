import type { Kind, Structure } from "./world";

type RoadAt = (x: number, y: number) => boolean;
export type StreetFront = { axis: "x" | "y"; line: number; along: number };

/** Pick the straightest adjacent street, including streets behind a house.
 * Only cardinal neighbours count; corner ties use the same axis on both lots. */
export function streetFront(x: number, y: number, isRoad: RoadAt): StreetFront | null {
  let best: StreetFront | null = null, score = -1;
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
    const rx = x + dx, ry = y + dy;
    if (!isRoad(rx, ry)) continue;
    const axis = dx ? "x" : "y";
    const straight = dx
      ? Number(isRoad(rx, ry - 1)) + Number(isRoad(rx, ry + 1))
      : Number(isRoad(rx - 1, ry)) + Number(isRoad(rx + 1, ry));
    if (straight <= score) continue;
    score = straight;
    best = { axis, line: dx ? rx : ry, along: dx ? y : x };
  }
  return best;
}

const RURAL = new Set<Kind>(["hut", "farmhouse", "cottage"]);
const URBAN = new Set<Kind>(["townhouse", "townhouse2", "fachwerk", "steinhaus", "suburb", "handwerker"]);

/** A paint-only street rhythm. Never feed this result into world generation,
 * household/job enumeration, stocks or taxes: the original structure stays intact.
 * Four-lot stretches share a house family, while each tile retains its own painting.
 * Civic upgrades, tenements, purchased buildings and landmarks retain their identity. */
export function streetHouse(s: Structure, x: number, y: number, isRoad: RoadAt): Structure {
  if (s.homeKind || s.kind === "hut" || (!RURAL.has(s.kind) && !URBAN.has(s.kind))) return s;
  const front = streetFront(x, y, isRoad);
  if (!front) return s;
  const block = Math.floor((front.along - (front.axis === "x" ? s.seed.y : s.seed.x)) / 4);
  const line = front.line - (front.axis === "x" ? s.seed.x : s.seed.y);
  const alternate = ((block + line) % 2 + 2) % 2;
  let kind = s.kind;
  if (RURAL.has(kind)) kind = alternate ? "cottage" : "farmhouse";
  else if (URBAN.has(kind)) kind = alternate ? "townhouse2" : "townhouse";
  return kind === s.kind ? s : { ...s, kind, homeKind: s.homeKind ?? s.kind };
}