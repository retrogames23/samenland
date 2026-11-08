import { seasonAt } from "./season";
import { townCharacter } from "./character";
import { dwellingSlots } from "./density";
import { leaversOf } from "./wander";
import { hash, structureAt, reachOf, radiusOf, effAge, townDist, specialSites, twinSites, MAP, type Seed, type Kind } from "./world";

export type HomeTile = [number, number];
export const HOME_SIZES: Partial<Record<Kind, readonly [number, number]>> = { hut: [2, 2], suburb: [2, 4], farmhouse: [2, 4], cottage: [2, 3], townhouse: [2, 4], townhouse2: [2, 4], fachwerk: [2, 5], steinhaus: [2, 5], handwerker: [2, 4], patrician: [2, 5], villa: [2, 4], tenement: [4, 8], inn: [2, 2], bakery: [2, 2] };
/** Share of the winter food shortfall a Kornkammer still feels. */
export const GRAIN_WINTER = 0.8;
export const FEED_BASE = 24, WILD_MAX = 32, FEED_FIELD = 0.25, FEED_GARDEN = FEED_FIELD, FEED_PASTURE = FEED_FIELD, FEED_FOOD_ITEM = 0.15, FEED_HEALTH_ITEM = 0.1, FEED_WINTER = 0.25;

/** Farmland a median flat town of the same growth radius would hold; terrain never yields less than this. */
export const FARM_FLOOR_SHARE = 0.56;
export const farmFloor = (r: number) => Math.floor(FARM_FLOOR_SHARE * Math.PI * r * r);
/** The same virtual food catchment for every character; slopes feed it with gardens/dairy,
 * shores with fishing, plains with grain. Existing exceptionally rich farms keep their yield. */
export const foodCatchment = (r: number) => Math.ceil(Math.PI * r * r);
function capacityAt(s: Seed, byKind: Map<Kind, unknown[]>, now: number, r: number, catchment: (r: number) => number) {
  if (!s.user_id) return Infinity;
  const own = new Set((s.bought ?? []).filter(b => b.at <= now).map(b => b.item));
  const food = ["fisher", "hunter", "granary", "dairy", "markethall", "guildhall"].filter(i => own.has(i)).length;
  const health = ["herbs", "healer", "library"].filter(i => own.has(i)).length;
  // Plains store grain: the winter shortfall is a fifth smaller (character strength).
  const w = 1 - FEED_WINTER * (townCharacter(s).main === "grain" ? GRAIN_WINTER : 1) * seasonAt(now).winter;
  // Different farming art must not silently reduce a town's household supply.
  const farm = FEED_FIELD * (byKind.get("field")?.length ?? 0) + FEED_GARDEN * (byKind.get("garden")?.length ?? 0) + FEED_PASTURE * (byKind.get("pasture")?.length ?? 0);
  // Founding terrain is never a penalty: hills, coasts and forests feed as many households as flat land of the same size.
  const land = (8 + Math.max(farm, FEED_FIELD * catchment(r))) * w;
  return Math.max(FEED_BASE, Math.floor(Math.min(WILD_MAX * w, land) + land * (FEED_FOOD_ITEM * food + FEED_HEALTH_ITEM * health)));
}
export const foodCapacity = (s: Seed, byKind: Map<Kind, unknown[]>, now: number, r = 0) => capacityAt(s, byKind, now, r, foodCatchment);

export function townTiles(s: Seed, seeds: Seed[], now: number) {
  const rad = radiusOf(effAge(s, seeds, now)), r = reachOf(s, rad);
  const x0 = Math.floor(s.x - r - 2), x1 = Math.ceil(s.x + r + 2), y0 = Math.floor(s.y - r - 2), y1 = Math.ceil(s.y + r + 2);
  const byKind = new Map<Kind, HomeTile[]>(), sites: HomeTile[] = [];
  // Exact pre-filter: structureAt only gives this town a tile inside townDist <= rad + 0.5,
  // unless the tile is one of its bought sites or a twin-town site — those are always checked.
  const own = specialSites(s), twins = twinSites(seeds, now);
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    if (townDist(x, y, s) > rad + 0.5) { const k = y * MAP + x; if (!own.has(k) && twins.get(k)?.seed.id !== s.id) continue; }
    const st = structureAt(x, y, seeds, now);
    if (!st || st.seed.id !== s.id) continue;
    if (st.build !== undefined) { sites.push([x, y]); continue; }
    const kind = st.homeKind ?? st.kind;
    const tiles = byKind.get(kind) ?? [];
    tiles.push([x, y]); byKind.set(kind, tiles);
  }
  return { r, x0, x1, y0, y1, byKind, sites };
}

/** A farmhouse with its own barn beside it keeps a farmhand or maid (Gesinde). */
export const YARD_HAND = 1;
const hasYardBarn = (h: HomeTile, barns: Set<string>) => {
  for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) if ((i || j) && barns.has(`${h[0] + i},${h[1] + j}`)) return true;
  return false;
};
export type Household = { home: HomeTile; kind: Kind; size: number; unit?: number };
export function occupiedHomes(s: Seed, seeds: Seed[], now: number, byKind: Map<Kind, HomeTile[]>): Household[] {
  const r = radiusOf(effAge(s, seeds, now));
  const homes = Object.keys(HOME_SIZES).flatMap(k => (byKind.get(k as Kind) ?? []).map(home => ({ home, kind: k as Kind })));
  homes.sort((a, b) => Math.hypot(a.home[0] - s.x, a.home[1] - s.y) - Math.hypot(b.home[0] - s.x, b.home[1] - s.y) || a.home[0] - b.home[0] || a.home[1] - b.home[1]);
  const vacant = new Set<string>();
  if (homes.length > 6) for (const w of leaversOf(s, seeds, now)) {
    const h = homes[3 + Math.floor(hash(w.sd, 5, 1508) * (homes.length - 3))];
    if (h) vacant.add(h.home.join(","));
  }
  const cap = foodCapacity(s, byKind, now, r);
  const legacyCap = capacityAt(s, byKind, now, r, farmFloor);
  const roster = homes.filter(h => !vacant.has(h.home.join(",")));
  const barns = new Set((byKind.get("barn") ?? []).map(t => t.join(",")));
  const family = ({ home, kind }: { home: HomeTile; kind: Kind }): Household => {
    const range = HOME_SIZES[kind];
    const size = (range ? range[0] + Math.floor(hash(home[0], home[1], 400) * (range[1] - range[0] + 1)) : 0) + (kind === "farmhouse" && hasYardBarn(home, barns) ? YARD_HAND : 0);
    return { home, kind, size };
  };
  const occupied = homes.slice(0, legacyCap).filter(h => !vacant.has(h.home.join(","))).map(family);
  // Retain every established ground-floor family before filling new apartments.
  // Food is a shared household budget: additional floors never create free meals.
  if (!s.user_id) return occupied;
  const way = townCharacter(s).main;
  const extra: Household[] = [];
  for (let unit = 1; unit < 3; unit++) for (const h of occupied) {
    if (occupied.length + extra.length >= cap) break;
    if (dwellingSlots(way, h.kind, r) <= unit) continue;
    const range = HOME_SIZES[h.kind];
    if (!range) continue;
    const size = range[0] + Math.floor(hash(h.home[0], h.home[1], 400 + unit * 40) * (range[1] - range[0] + 1));
    extra.push({ ...h, size, unit });
  }
  const retained = new Set(occupied.map(h => h.home.join(",")));
  const outskirts = roster.filter(h => !retained.has(h.home.join(","))).slice(0, Math.max(0, cap - occupied.length - extra.length)).map(family);
  return [...occupied, ...extra, ...outskirts];
}

export const householdsOf = (s: Seed, seeds: Seed[], now: number) => occupiedHomes(s, seeds, now, townTiles(s, seeds, now).byKind);