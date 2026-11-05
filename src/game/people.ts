import { NAMES_F, NAMES_M, SURNAMES } from "./names";
import { setChosenTraits } from "./traits";
import { cacheTick } from "./time";
import { feastOn, isRestDay, realmDate, FEASTS, type FeastCode } from "./feasts";
import { civicWealth, estateAt, CULTURE_SICK, BEGINEN_SICK, type Estate } from "./prosperity";
import { weddingDates, weddingJoy } from "./weddings";
import { hasTrait } from "./traits";
import { pathHeading } from "./motion";
import { courtSolid } from "./court";
import { HOME_SIZES, townTiles, occupiedHomes } from "./households";
import { dwellingKey, dwellingTile } from "./density";
export { foodCapacity, FEED_BASE, WILD_MAX, FEED_FIELD, FEED_GARDEN, FEED_PASTURE, FEED_FOOD_ITEM, FEED_HEALTH_ITEM, FEED_WINTER } from "./households";
import { fires } from "./disasters";
import { guestNow, maypoleUp, cowsOf } from "./encounters";
import { mastOn, oakSpot, bakeGathering, stegOf, stegSpot } from "./commons";
import { WORK_START, WORK_END } from "./time";
import { worldHour } from "./time";
const worldHourOf = worldHour;
import { seasonAt } from "./season";
import { fieldLook, farmTask } from "./rotation";
// Villagers: a pure, deterministic function of the seed, its buildings and the clock.
// Nothing is stored — every client computes the same people at the same spot.
import { geoKey, MAP, hash, structureAt, soloSeeds, acreOf, effAge, radiusOf, reachOf, terrain, buildable, isWater, bornAt, speedOf, seedsKey, FLAT, tradePartners, LANDMARKS, landmarkSpots, SPECIAL_KIND, MONUMENT_DEFS, monumentOf, monumentDone, specialDone, specialTile, type TradeGood, type Seed, type Kind } from "./world";

export type Sex = "f" | "m";
export type Job =
  | "farmer" | "baker" | "smith" | "innkeeper" | "miller" | "crafter" | "worker"
  | "sawyer" | "builder" | "woodcutter" | "mason" | "merchant" | "priest" | "carter" | "mayor" | "fisher" | "healer" | "teacher" | "firewarden" | "watchman" | "hunter" | "herbalist" | "homemaker" | "retired" | "child";
export type Activity = "sleep" | "work" | "lunch" | "leisure" | "home" | "school" | "play" | "sick" | "care" | "church" | "visit" | "stroll" | "wedding" | "fete" | "fire" | "guest";
type Tile = [number, number];
export type Person = {
  id: number; seed: Seed; first: string; last: string; sex: Sex; age: number; job: Job;
  home: Tile; work: Tile | null; workIndoor: boolean; speed: number;
  looks: { skin: number; hair: number; shirt: number; pants: number; hat: boolean; stick: boolean };
  haul: Haul | null;
  estate?: Estate;
  /** Newly moved-in household: walks in from the village edge with a bundle (real ms start). */
  arrive?: { from: Tile; t0: number } | null;
  /** Household role in the family home (birth household; hh = that home's tile key). */
  role?: Role; hh?: number;
  /** Marriage (derived from the wedding calendar): spouse id, wedding time, maiden name, craft alliance. */
  spouse?: number; wedAt?: number; maiden?: string; alliance?: boolean;
  /** Birth household of a local couple that founded a new home (their parents live there). */
  origin?: number;
  /** Sick at home today (derived), or caring for the sick housemate with this id. */
  sick?: boolean; carer?: number;
  /** A beguine's sick call today: the home she nurses (derived from the Beginenhof and sickness calendar). */
  nurse?: Tile;
  /** Wedding procession: birth home → church → new home, starting at `at` (world ms); lag = seconds behind the couple. */
  proc?: { at: number; from: Tile; to: Tile; lag: number; role: "bride" | "groom" | "guest" };
  /** Inauguration of a just-finished landmark: walk there at `at` (+lag s) and gather at `spot` facing `face`. */
  fete?: { at: number; spot: Tile; face: Tile; lag: number; dur?: number; fire?: boolean; work?: boolean };
  /** A travelling visitor of the day's encounter: walks in from the edge at `at`, waits at `spot`, gone after `until`. */
  guest?: { at: number; until: number; from: Tile; spot: Tile; face: Tile; event: string };
};
export type Role = "head" | "spouse" | "child" | "elder" | "lodger" | "mayor" | "guest";
/** Single source of truth for "who lives here": everyone born into an occupied household (occupiedHomes),
 * never the mayor's avatar or travelling guests. HUD, roll, chronicle and larder all count this. */
export const isCitizen = (p: Person) => p.role !== "mayor" && p.role !== "guest";
export const citizensOf = (t: Town) => t.people.filter(isCitizen);
/** Who appears for each visitor encounter: [job, sex, age, dx, dy] around the well. */
const GUESTS: Record<string, [Job, Sex, number, number, number][]> = {
  journeyman: [["builder", "m", 22, 0, 0]], merchant: [["merchant", "m", 46, 0, 0]], healer: [["healer", "f", 52, 0, 0]],
  minstrel: [["innkeeper", "m", 30, 0, 0]], widow: [["homemaker", "f", 34, 0, 0], ["child", "m", 9, 0.5, 0.3], ["child", "f", 7, -0.3, 0.5], ["child", "m", 5, 0.6, -0.4]],
  monk: [["priest", "m", 58, 0, 0]], surveyor: [["mason", "m", 41, 0, 0]], pilgrims: [["retired", "m", 60, 0, 0], ["homemaker", "f", 44, 0.6, 0.2], ["worker", "m", 36, -0.4, 0.6]],
  orphan: [["child", "m", 11, 0, 0]], tinker: [["smith", "m", 50, 0, 0]], painter: [["crafter", "m", 35, 0, 0]], nursery: [["herbalist", "m", 47, 0, 0]],
  werber: [["watchman", "m", 38, 0, 0], ["watchman", "m", 24, 0.6, 0.3]], weser: [["carter", "m", 42, 0, 0]],
  sund: [["merchant", "m", 51, 0, 0], ["fisher", "m", 33, 0.5, 0.4]], ablass: [["priest", "m", 55, 0, 0], ["priest", "m", 28, 0.5, 0.3], ["child", "m", 12, -0.4, 0.5]],
};
export type Wedding = { at: number; a: Person; b: Person; alliance: boolean; dowry: number; grand: boolean; town: boolean };
/** Families whose trades form an alliance when their children marry. */
const CRAFT: ReadonlySet<Job> = new Set(["baker", "miller", "smith", "crafter", "sawyer", "innkeeper", "fisher", "mason", "merchant", "farmer"] as Job[]);
/** Goods carried along the supply chains (wood → sawmill → site, grain → mill → bakery → inn). */
export type Good = "log" | "stone" | "planks" | "grain" | "flour" | "bread" | "bundle";
export type Dest = "sawmill" | "site" | "store" | "mill" | "bakery" | "inn" | "market" | "home";
export type Haul = { from: Tile; to: Tile; fromIn: boolean; toIn: boolean; good: Good; dest: Dest };
export type Pose = {
  p: Person; x: number; y: number; visible: boolean; walking: boolean;
  dir: [number, number]; phase: number; act: Activity; working: boolean;
  talk: number | null; talkTurn: boolean;
  carry: Good | null; dest: Dest | null;
  festive?: "bride" | "groom" | undefined;
  /** Knight on his riding horse (own strolling mayor only, local). */
  mounted?: boolean;
  /** Fighting a fire: carries a sloshing water bucket. */
  bucket?: boolean | undefined;
};

const F = NAMES_F, M = NAMES_M, S = SURNAMES;
/** First name unique within a town while the pool lasts: hash pick, then step on (linear probe) past names already taken. */
const pickFree = (a: readonly string[], h: number, used: Set<string>) => {
  const i0 = Math.floor(h * a.length) % a.length;
  for (let k = 0; k < a.length; k++) { const n = a[(i0 + k) % a.length]!; if (!used.has(n)) { used.add(n); return n; } }
  return a[i0]!;
};
const pick = <T,>(a: readonly T[], h: number) => a[Math.floor(h * a.length) % a.length]!;

/** Kinds people live in. */
export const isHomeKind = (k: string) => k in HOME_SIZES && k !== "inn" && k !== "bakery";
const SLOTS: Partial<Record<Kind, [Job, number]>> = {
  belfry: ["watchman", 1], theater: ["crafter", 2], opera: ["crafter", 2], university: ["teacher", 2], exchange: ["merchant", 3], orangery: ["herbalist", 2], harvesthall: ["farmer", 2], guildtower: ["mason", 2], lighthouse: ["watchman", 1],
  watermill: ["miller", 2], chapel: ["priest", 1], manufactory: ["crafter", 4], steamworks: ["smith", 3], station: ["merchant", 2], stall: ["merchant", 2], harbor: ["carter", 2], townhall: ["crafter", 2], seat3: ["crafter", 1],
  bakery: ["baker", 2], smithy: ["smith", 2], inn: ["innkeeper", 2], mill: ["miller", 1], workshop: ["crafter", 2],
  factory: ["priest", 2], sawmill: ["sawyer", 3], market: ["merchant", 2], church: ["priest", 1], warehouse: ["carter", 2],
  fishery: ["fisher", 1], infirmary: ["healer", 1], school: ["teacher", 1], granary: ["carter", 1], markethall: ["merchant", 2], guildhall: ["crafter", 2], library: ["teacher", 1], dairy: ["farmer", 2], firehouse: ["firewarden", 2], guardhouse: ["watchman", 3], lodge: ["hunter", 1], herbhut: ["herbalist", 1], woodcamp: ["woodcutter", 2],
  backhaus: ["baker", 1], herberge: ["innkeeper", 1], beginenhof: ["herbalist", 3],
  bigstore: ["carter", 2], millrow: ["miller", 2], stonemason: ["mason", 2], hammerworks: ["smith", 2], smokehouse: ["fisher", 2], saltquay: ["merchant", 2],
};
// healers tend the sick inside the infirmary, so big towns don't crowd its doorstep
const OUTDOOR_WORK: ReadonlySet<Job> = new Set(["mayor", "farmer", "merchant", "carter", "builder", "woodcutter", "mason", "fisher", "smith", "watchman", "hunter", "herbalist"]);
const WALK: ReadonlySet<Kind> = new Set(["path", "street", "square", "market", "road", "bridge", "avenue"]);

export type Town = {
  seed: Seed; people: Person[]; well: Tile; meet: Tile; meets: Tile[]; plays: Tile[]; school: Tile | null; play: Tile;
  x0: number; y0: number; x1: number; y1: number; routes: Map<string, Tile[]>; now: number;
  freeC: Map<number, boolean>; costC: Map<number, number>; doors: Map<number, Tile>;
  weddings: Wedding[]; church: Tile | null;
  /** Encounter props on the square: a raised maypole and the village's cows (derived from decisions). */
  maypole: Tile | null; cows: Tile[];
  /** Feast kept today (feasts.ts) and the bonfire spot of a fire feast (Easter / St John's), both derived from the realm clock. */
  feast: FeastCode | null; bonfire: Tile | null;
  /** Allmende traces: pigs masting under the oaks, the footbridge over the mill stream (both banks, finish time). */
  pigs: Tile[]; steg: { a: Tile; b: Tile; done: number } | null;
};

/** Service buildings whose staff grows with the town (radius), so big towns get more bakers, innkeepers, priests. */
const SERVICE: ReadonlySet<Kind> = new Set(["bakery", "inn", "mill", "watermill", "church", "chapel", "market", "infirmary", "school"] as Kind[]);
/** Share of unemployed adults who farm: high in villages, low in cities. */
export const farmShare = (r: number) => (r < 15 ? 0.8 : r < 30 ? 0.45 : 0.25);
const towns = new Map<string, Town>();
export function townOf(s: Seed, seeds: Seed[], now: number): Town {
  const key = `${s.id}|${cacheTick(now)}|${seedsKey(seeds)}`;
  const hit = towns.get(key);
  if (hit) return hit;
  for (const k of towns.keys()) if (k.startsWith(s.id + "|")) towns.delete(k);
  const t = buildTown(s, seeds, now);
  towns.set(key, t);
  return t;
}

function buildTown(s: Seed, seeds: Seed[], now: number): Town {
  const { r, x0, x1, y0, y1, byKind, sites } = townTiles(s, seeds, now);
  const near = (list: Tile[] | undefined, from: Tile, h: number): Tile | null => {
    if (!list?.length) return null;
    // nearest of a few hashed candidates → people don't all share one spot
    let best = list[Math.floor(h * list.length)]!, bd = Infinity;
    for (let i = 0; i < Math.min(4, list.length); i++) {
      const c = list[Math.floor(hash(from[0], from[1], 300 + i + Math.floor(h * 97)) * list.length)]!;
      const d = Math.hypot(c[0] - from[0], c[1] - from[1]);
      if (d < bd) { bd = d; best = c; }
    }
    return best;
  };
  const well: Tile = [s.x, s.y];
  // gathering spots sit in front of the inn / on market and squares, never on a roof
  const open = (x: number, y: number) => { const st = structureAt(x, y, seeds, now); return buildable(terrain(x, y)) && (!st || FLAT.has(st.kind)); };
  const front = (tl: Tile): Tile | null => { for (const [dx, dy] of [[1, 0], [0, 1], [-1, 0], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]] as const) if (open(tl[0] + dx, tl[1] + dy)) return [tl[0] + dx, tl[1] + dy]; return null; };
  const meets: Tile[] = [];
  for (const k of ["inn", "church", "chapel", "townhall", "seat2", "seat3", "stall", "bakery"] as Kind[]) for (const tl of byKind.get(k) ?? []) { const f = front(tl); if (f) meets.push(f); }
  meets.push(...(byKind.get("market") ?? []), ...(byKind.get("square") ?? []).slice(0, 6));
  if (!meets.length) meets.push([s.x + 1, s.y + 1]);
  const school = byKind.get("school")?.[0] ?? byKind.get("church")?.[0] ?? byKind.get("chapel")?.[0] ?? null;
  const meet = meets[0]!;
  const plays: Tile[] = [...(byKind.get("pasture") ?? []), ...(byKind.get("square") ?? [])].slice(0, 8);
  if (!plays.length) plays.push([s.x + 1, s.y - 2]);
  const play = plays[0]!;

  const slots: { job: Job; at: Tile }[] = [];
  for (const [k, sl] of Object.entries(SLOTS) as [Kind, [Job, number]][])
    for (const at of byKind.get(k) ?? []) for (let i = 0; i < sl[1] * (SERVICE.has(k) ? 1 + Math.floor(r / 12) : 1); i++) slots.push({ job: sl[0], at });
  slots.sort((a, b) => hash(a.at[0] * 7 + a.job.length, a.at[1], 501) - hash(b.at[0] * 7 + b.job.length, b.at[1], 501));
  // raw materials first: a woodcutter at the nearest forest edge, a mason at the nearest rocks
  const age = effAge(s, seeds, now);
  const [wood, rock] = resourceSpots(s, r);
  if (rock && age >= 24) slots.unshift({ job: "mason", at: rock });
  if (wood) for (let i = 0; i < 1 + Math.floor(r / 8); i++) slots.unshift({ job: "woodcutter", at: wood });
  if (rock) for (let i = 0; i < Math.floor(r / 15); i++) slots.unshift({ job: "mason", at: rock });
  // every construction site gets builders before anyone else is hired
  sites.sort((a, b) => Math.hypot(a[0] - s.x, a[1] - s.y) - Math.hypot(b[0] - s.x, b[1] - s.y));
  for (const at of sites.slice(0, 4 + Math.floor(r / 8)).reverse()) { const fr = front(at) ?? at; slots.unshift({ job: "builder", at: fr }, { job: "builder", at: fr }); }

  const shore = (from: Tile): Tile => {
    let b = from, bd = Infinity;
    for (let j = -4; j <= 4; j++) for (let i = -4; i <= 4; i++) {
      const x = from[0] + i, y = from[1] + j;
      if (!open(x, y) || !isWater(terrain(x + 1, y)) && !isWater(terrain(x, y + 1)) && !isWater(terrain(x - 1, y)) && !isWater(terrain(x, y - 1))) continue;
      const d = Math.hypot(i, j); if (d < bd) { bd = d; b = [x, y]; }
    }
    return b;
  };
  for (const sl of slots) {
    if (sl.job === "fisher") sl.at = shore(sl.at);
    else if ((sl.job === "hunter" || sl.job === "herbalist" || sl.job === "woodcutter") && wood && Math.hypot(wood[0] - sl.at[0], wood[1] - sl.at[1]) < 16) sl.at = wood;
    else if (sl.job === "healer" && wood && Math.hypot(wood[0] - sl.at[0], wood[1] - sl.at[1]) < 12) sl.at = wood;
  }
  const households = occupiedHomes(s, seeds, now, byKind);
  const homes = households.map(h => h.home);

  const workTiles = (["workshop", "warehouse", "market", "markethall", "manufactory", "guildhall", "smithy", "sawmill"] as Kind[]).flatMap((k) => byKind.get(k) ?? []);
  const people: Person[] = [];
  const anvils = new Set<string>();
  const anvilOut = (w: Tile) => { const k = `${w[0]},${w[1]}`; if (anvils.has(k)) return false; anvils.add(k); return true; };
  const created = Date.parse(s.created_at);
  const taken = new Set<string>();
  for (const { home, size, unit = 0 } of households) {
    const key = dwellingKey(home[0], home[1], unit);
    const hh = (i: number) => hash(home[0], home[1], 400 + i + unit * 40);
    const last = pick(S, hh(1));
    // household founders cluster young (median ~30), older heads are the exception
    const pa = 22 + Math.floor(hh(2) ** 1.8 * 30);
    const yrs = (now - created) / 3.15576e10;
    const since = age - bornAt(home[0], home[1], s);
    let arrive: Person["arrive"] = null;
    if (since >= 0 && since < 1 && Math.hypot(home[0] - s.x, home[1] - s.y) > 1.5) {
      // a new family comes in from the village edge on the side facing their house
      const a = Math.atan2(home[1] - s.y, home[0] - s.x) + (hh(30) - 0.5) * 0.8;
      let from: Tile = [Math.round(s.x + Math.cos(a) * (r + 1.5)), Math.round(s.y + Math.sin(a) * (r + 1.5))];
      if (!open(from[0], from[1])) from = [Math.round(s.x + Math.cos(a) * r), Math.round(s.y + Math.sin(a) * r)];
      arrive = { from, t0: now - (since / Math.max(0.1, speedOf(s, seeds, now))) * 3600000 };
    }
    for (let m = 0; m < size; m++) {
      const id = key * 8 + m;
      const h = (i: number) => hash(id, 77, i);
      let age: number, sex: Sex, role: Role;
      if (m === 0) { age = pa; sex = h(1) < 0.5 ? "f" : "m"; role = "head"; }
      else if (m === 1 && h(9) < 0.85) { age = Math.max(20, pa + Math.floor((h(2) - 0.5) * 8)); sex = people[people.length - 1]!.sex === "f" ? "m" : "f"; role = "spouse"; }
      // c. 1500: few reach 70 — elders sit mostly at 56–65, the very old are rare
      else if (m === size - 1 && size >= 4 && h(3) < 0.15) { age = Math.min(82, Math.max(pa + 20, 56 + Math.floor(h(2) ** 2 * 24))); sex = h(1) < 0.55 ? "f" : "m"; role = "elder"; }
      else if (m >= 3 && h(4) < 0.5) { age = 16 + Math.floor(h(2) ** 1.5 * 20); sex = h(1) < 0.5 ? "f" : "m"; role = "lodger"; } // farmhand, journeyman, maid
      else { age = Math.max(1, Math.min(pa - 18, 1 + Math.floor(h(2) * 17))); sex = h(1) < 0.5 ? "f" : "m"; role = "child"; }
      age += Math.floor(yrs);
      let job: Job = "child", work: Tile | null = null;
      if (age >= 66) job = "retired";
      else if (age >= 16) {
        const slot = h(5) < 0.82 ? slots.shift() : undefined;
        if (slot) { job = slot.job; work = slot.at; }
        else if ((byKind.get("field")?.length || byKind.get("garden")?.length || byKind.get("pasture")?.length) && h(6) < farmShare(r)) {
          job = "farmer";
          const farms = [...(byKind.get("field") ?? []), ...(byKind.get("garden") ?? []), ...(byKind.get("pasture") ?? [])];
          work = near(farms, home, h(7));
        }
        else if (r >= 18 && h(8) < 0.6) { job = "worker"; work = near(workTiles, home, h(7)) ?? home; }
        else { job = "homemaker"; work = near(byKind.get("garden"), home, h(7)) ?? home; }
        if (job === "merchant" || job === "carter") work = [work![0], work![1]];
      }
      const kid = age < 14, old = age >= 65;
      people.push({
        id, seed: s, first: "", last, sex, age, job, home, work,
        // only one smith per forge hammers outside at the anvil; the journeymen work at the indoor hearth
        workIndoor: job === "smith" && work ? !anvilOut(work) : !OUTDOOR_WORK.has(job) && job !== "homemaker",
        speed: (kid ? 0.3 : old ? 0.15 : 0.22) * (0.85 + h(11) * 0.3),
        looks: { skin: h(12), hair: old ? -1 : h(13), shirt: h(14), pants: h(15), hat: h(16) < (job === "farmer" ? 0.7 : 0.25), stick: old && h(17) < 0.6 },
        haul: null,
        arrive: arrive ? { from: arrive.from, t0: arrive.t0 + m * 2500 } : null,
        role, hh: key,
      });
    }
  }
  // first names go out in founding order (oldest house first, then id), so a newly built house never shifts an existing resident's name
  const order = people.map((p) => ({ p, b: bornAt(p.home[0], p.home[1], s) })).sort((a, b) => a.b - b.b || a.p.id - b.p.id);
  for (const { p } of order) p.first = pickFree(p.sex === "f" ? F : M, hash(p.id, 77, 10), taken);
  const weddings = marry(s, people, seeds, now);
  const wealth = civicWealth(s, now);
  for (const p of people) p.estate = estateAt(wealth, p.home[0], p.home[1]);
  falls(s, people, now, byKind.get("beginenhof")?.[0] ?? null);
  const chT = byKind.get("church")?.[0] ?? byKind.get("chapel")?.[0] ?? null;
  const church: Tile | null = chT ? (front(chT) ?? null) : null;
  processions(weddings, people, church ?? meet, now);
  // the mayor's answer to the real wedding: the feast also gathers the village at church (the couple's procession runs anyway)
  // in a village a wedding is a great day: everyone gathers at church after the service; in a town only the mayor's feast does that
  const wd = (s.decisions ?? []).filter((d) => d.event === "wedding" && d.choice === "feast" && now >= d.at && now - d.at < 3 * 3600e3).pop();
  const live = weddings.filter((w) => now >= w.at && now - w.at < 3 * 3600e3).pop();
  const gatherAt = wd && weddings.some((w) => w.at <= wd.at && wd.at - w.at < 3 * 3600e3) ? wd.at : live && !live.town ? live.at + SERVICE_SECS * 1000 : null;
  // crowds stay a readable size: in big towns only a share comes, and the ring widens with the number gathered
  const CROWD = 24, share = (base: number) => Math.min(base, CROWD / Math.max(1, people.length));
  const widen = (base: number) => Math.max(1, Math.sqrt(Math.min(CROWD, people.length * base) / 12));
  if (gatherAt != null && now >= gatherAt) {
    const wdAt = gatherAt;
    const c = church ?? meet;
    for (const q of people) {
      if (q.proc || q.sick || q.carer != null || q.arrive || hash(q.id, 43, 720) >= share(0.8)) continue;
      const a = hash(q.id, 44, 720) * Math.PI * 2, rr = (1 + hash(q.id, 45, 720) * 1.8) * widen(0.8);
      q.fete = { at: wdAt, spot: [c[0] + Math.cos(a) * rr, c[1] + Math.sin(a) * rr], face: c, lag: hash(q.id, 46, 720) * 180 };
    }
  }
  const ina = inauguration(s, seeds, now);
  if (ina) {
    const fr = front(ina.tile) ?? ina.tile;
    for (const q of people) {
      if (q.proc || q.sick || q.carer != null || q.arrive || hash(q.id, 31, 720) >= share(0.88)) continue;
      const a = hash(q.id, 32, 720) * Math.PI * 2, rr = (0.6 + hash(q.id, 33, 720) * 1.6) * widen(0.88);
      q.fete = { at: ina.at, spot: [fr[0] + Math.cos(a) * rr, fr[1] + Math.sin(a) * rr], face: ina.tile, lag: hash(q.id, 34, 720) * 240 };
    }
  }
  // ---- encounter scenes: what the parchment tells is also seen on the square ----
  const decs = s.decisions ?? [];
  const nearFree = (c: Tile, k: number): Tile => {
    for (let i = 0; i < 12; i++) { const a = hash(k, i, 1401) * Math.PI * 2, d = 1 + hash(k, i, 1402) * 1.6, x = Math.round(c[0] + Math.cos(a) * d), y = Math.round(c[1] + Math.sin(a) * d); if (open(x, y)) return [x, y]; }
    return c;
  };
  const feast = feastOn(now);
  // Whitsun: the birch "Pfingstbaum" stands on the green just like the encounter maypole
  const maypole: Tile | null = maypoleUp(decs, now) || feast === "pentecost" ? nearFree(meet, s.x * 7 + s.y) : null;
  // Easter / St John's fire: on the meadow at the edge of the village, else beside the square
  const bonfire: Tile | null = feast && FEASTS[feast].scene === "fire" ? nearFree(plays.length ? plays[Math.floor(hash(s.x, s.y, 1411) * plays.length)]! : meet, s.x * 11 + s.y * 3) : null;
  const cows: Tile[] = [];
  for (let i = 0, n = cowsOf(decs, now); i < n && i < 3; i++) {
    // pastures belong to the sheep: the cow grazes on free ground beside one, never inside the fence
    const pas = byKind.get("pasture") ?? [];
    cows.push(nearFree(pas.length ? pas[i % pas.length]! : meet, s.x * 13 + s.y + i * 101));
  }
  // raising the maypole / maypole games: half the village gathers on the square for an hour
  const mp = decs.filter((d) => d.event === "maypole" && now >= d.at && now - d.at < 2 * 3600e3).pop();
  if (mp) {
    const c = maypole ?? meet;
    for (const q of people) {
      if (q.proc || q.sick || q.carer != null || q.arrive || hash(q.id, 47, 720) >= share(0.5)) continue;
      const a = hash(q.id, 48, 720) * Math.PI * 2, rr = (1.2 + hash(q.id, 49, 720) * 1.6) * widen(0.5);
      q.fete = { at: mp.at, spot: [c[0] + Math.cos(a) * rr, c[1] + Math.sin(a) * rr], face: c, lag: hash(q.id, 50, 720) * 120 };
    }
  }
  // ---- Allmende: what the village decided is seen on the map ----
  const pigs: Tile[] = [];
  const oak = mastOn(decs, now) ? oakSpot(s) : null;
  if (oak) for (let i = 0; i < 4; i++) pigs.push(nearFree(oak, s.x * 17 + s.y + i * 37));
  // bake day: neighbours queue with baskets at the common oven for an hour
  const bake = bakeGathering(decs, now), oven = byKind.get("backhaus")?.[0] ?? byKind.get("bakery")?.[0];
  if (bake != null && oven) {
    const c = front(oven) ?? oven;
    for (const q of people) {
      if (q.fete || q.proc || q.sick || q.carer != null || q.arrive || q.age < 14 || hash(q.id, 51, 720) >= share(0.3)) continue;
      const a = hash(q.id, 52, 720) * Math.PI * 2, rr = (1 + hash(q.id, 53, 720) * 1.2) * widen(0.3);
      q.fete = { at: bake, spot: [c[0] + Math.cos(a) * rr, c[1] + Math.sin(a) * rr], face: c, lag: hash(q.id, 54, 720) * 300 };
    }
  }
  // footbridge: the crew works on the bank during working hours until it stands
  const sg = stegOf(decs), banks = sg ? stegSpot(s) : null;
  const steg = sg && banks ? { a: banks[0], b: banks[1], done: sg.done } : null;
  if (sg && banks && now >= sg.at && now < sg.done) {
    const h = worldHourOf(now), day0 = now - h * 3.6e6;
    const from = Math.max(sg.at, day0 + WORK_START * 3.6e6), to = Math.min(sg.done, day0 + WORK_END * 3.6e6);
    if (now >= from && now < to) {
      let n = 0;
      for (const q of people) {
        if (q.fete || q.proc || q.sick || q.carer != null || q.arrive || q.age < 16 || q.age > 62) continue;
        const crew = sg.together ? hash(q.id, 55, 720) < 0.35 && n < 8 : q.job === "builder" || q.job === "sawyer" || (n < 2 && hash(q.id, 55, 720) < 0.1);
        if (!crew) continue;
        n++;
        const side = n % 2 ? banks[0] : banks[1], a = hash(q.id, 56, 720) * Math.PI * 2, rr = 0.5 + hash(q.id, 57, 720) * 0.7;
        q.fete = { at: from, spot: [side[0] + Math.cos(a) * rr, side[1] + Math.sin(a) * rr], face: [(banks[0][0] + banks[1][0]) / 2, (banks[0][1] + banks[1][1]) / 2], lag: hash(q.id, 58, 720) * 200, dur: (to - from) / 1000, work: true };
      }
    }
  }
  // fire: the fire wardens and watch run to the blaze, and neighbours join the bucket chain until it is out
  for (const f of fires(s, now)) {
    if (now < f.at || now >= f.end) continue;
    let n = 0;
    for (const q of people) {
      if (q.proc || q.sick || q.arrive || q.age < 16 || q.age > 64) continue;
      const crew = q.job === "firewarden" || q.job === "watchman";
      if (!crew && (n >= 10 || hash(q.id, f.at % 9973, 1410) > 0.4 || Math.hypot(q.home[0] - f.x, q.home[1] - f.y) > 8)) continue;
      n++;
      let spot: Tile = [f.x + 2, f.y];
      for (let i = 0; i < 8; i++) { const a = hash(q.id, i, 1411) * Math.PI * 2, d = 1.8 + hash(q.id, i, 1412) * 0.9, x = f.x + Math.cos(a) * d, y = f.y + Math.sin(a) * d; if (open(Math.round(x), Math.round(y))) { spot = [x, y]; break; } }
      q.fete = { at: f.at, spot, face: [f.x, f.y], lag: crew ? 20 : 60 + hash(q.id, 1, 1413) * 240, dur: (f.end - f.at) / 1000, fire: true };
    }
  }
  // the day's travelling visitor stands at the well/square while the mayor decides, and a while after a welcome
  const gn = guestNow(s, decs, now);
  if (gn) {
    const cast = GUESTS[gn.event] ?? [];
    const k0 = Math.floor(gn.at / 60000);
    let from: Tile = [Math.round(s.x + r), s.y];
    for (let i = 0; i < 16; i++) { const a = hash(k0, i, 1420) * Math.PI * 2, x = Math.round(s.x + Math.cos(a) * (r + 1)), y = Math.round(s.y + Math.sin(a) * (r + 1)); if (open(x, y)) { from = [x, y]; break; } }
    const fc = well ?? meet;
    // stand on a free tile near the well, never inside a house
    const guestSpot = (c: Tile, dx: number, dy: number): Tile => {
      const want: Tile = [c[0] + 1.1 + dx, c[1] + 0.4 + dy];
      if (open(Math.round(want[0]), Math.round(want[1]))) return want;
      for (let d = 1; d <= 3; d++) for (let a = 0; a < 8; a++) { const x = want[0] + Math.round(Math.cos(a * Math.PI / 4) * d), y = want[1] + Math.round(Math.sin(a * Math.PI / 4) * d); if (open(Math.round(x), Math.round(y))) return [x, y]; }
      return want;
    };
    cast.forEach(([job, sex, age, dx, dy], i) => {
      const h = (j: number) => hash(k0, i, 1430 + j);
      people.push({
        id: -(5e6 + (s.x * 1024 + s.y) * 8 + i), seed: s, first: pick(sex === "f" ? F : M, h(0)), last: "", sex, age, job,
        home: from, work: null, workIndoor: false, speed: age < 14 ? 0.3 : 0.22,
        looks: { skin: h(1), hair: age >= 65 ? -1 : h(2), shirt: h(3), pants: h(4), hat: job !== "priest", stick: gn.event === "pilgrims" || job === "healer" },
        haul: null, role: "guest",
        guest: { at: gn.at + i * 4000, until: gn.until, from, spot: guestSpot(fc, dx, dy), face: fc, event: gn.event },
      });
    });
  }
  // the player's own figure: the village mayor (Dorfschulze), walking between well, sites and meeting spots
  if (s.user_id) {
    const hall = (["townhall", "seat3", "seat2", "seat1"] as Kind[]).map((k) => byKind.get(k)?.[0]).find(Boolean);
    const h = (i: number) => hash(s.x, s.y, 880 + i);
    const g = s.mayor_gender;
    const sex: Sex = g === "w" ? "f" : g === "m" ? "m" : h(0) < 0.5 ? "f" : "m";
    const nm = (s.owner ?? "").trim().split(/\s+/).filter(Boolean);
    const first = nm.length > 1 ? nm.slice(0, -1).join(" ") : nm[0] ?? pick(sex === "f" ? F : M, h(1));
    const last = nm.length > 1 ? nm[nm.length - 1]! : nm.length ? "" : pick(S, h(2));
    const mid = -(s.x * 1024 + s.y) - 1;
    setChosenTraits(mid, s.mayor_traits);
    people.push({
      id: mid, seed: s, first, last, sex, age: s.mayor_age && s.mayor_age >= 20 && s.mayor_age <= 70 ? s.mayor_age : 46 + Math.floor(h(3) * 14), job: "mayor",
      home: hall ?? homes[0] ?? [s.x + 1, s.y + 1], work: hall ? (front(hall) ?? meet) : meet, workIndoor: false, speed: 0.2,
      looks: { skin: h(4), hair: h(5), shirt: 0.99, pants: h(6), hat: true, stick: false }, haul: null, role: "mayor",
    });
  }
  assignHauls(people, byKind, sites, front, well, tradePartners(s, seeds, now).flatMap((q) => q.buy));
  for (const q of people) if (q.guest) q.haul = null;
  return { seed: s, people, well, meet, meets, plays, school, play, x0, y0, x1, y1, routes: new Map(), now, freeC: new Map(), costC: new Map(), doors: new Map(), weddings, church, maypole, cows, feast, bonfire, pigs, steg };
}

/**
 * Weddings from the village calendar: each one pairs two unmarried young adults (grown children,
 * journeymen, maids) from different households whose homes already stood that day. The bride moves
 * into the groom's family home and takes his name; her parents' house stays with the rest of her family.
 */
function marry(s: Seed, people: Person[], seeds: Seed[], now: number): Wedding[] {
  const out: Wedding[] = [];
  const heads = new Map<number, Person>();
  for (const p of people) if (p.role === "head") heads.set(p.hh!, p);
  weddingDates(s, now).forEach(({ at, k, dowry, grand, town }) => {
    const ageK = effAge(s, seeds, at);
    const free = people.filter((p) => (p.role === "child" || p.role === "lodger") && p.age >= 17 && p.age <= 45 && p.spouse == null && bornAt(p.home[0], p.home[1], s) <= ageK);
    const men = free.filter((p) => p.sex === "m"), women = free.filter((p) => p.sex === "f");
    const g = men.length ? men[Math.floor(hash(k, s.x, 990) * men.length)]! : null;
    const bs = g ? women.filter((w) => w.hh !== g.hh && w.last !== g.last) : [];
    if (g && bs.length) {
      const b = bs[Math.floor(hash(k, s.y, 991) * bs.length)]!;
      const fa = heads.get(g.hh!), fb = heads.get(b.hh!);
      const alliance = !!fa && !!fb && CRAFT.has(fa.job) && CRAFT.has(fb.job);
      g.spouse = b.id; b.spouse = g.id; g.wedAt = b.wedAt = at; g.alliance = b.alliance = alliance;
      b.maiden = b.last; b.last = g.last; b.home = g.home;
      out.push({ at, a: g, b, alliance, dowry, grand, town });
      return;
    }
    // no singles yet: the young couple of the newest home are children of two older village families
    const homes = [...heads.values()].filter((h) => h.age <= 40 && h.wedAt == null && bornAt(h.home[0], h.home[1], s) <= ageK)
      .sort((p, q) => bornAt(q.home[0], q.home[1], s) - bornAt(p.home[0], p.home[1], s));
    for (const h of homes) {
      const sp = people.find((q) => q.hh === h.hh && q.role === "spouse");
      const older = [...heads.values()].filter((o) => o.hh !== h.hh && o.age >= h.age + 18 && bornAt(o.home[0], o.home[1], s) < bornAt(h.home[0], h.home[1], s));
      if (!sp || !older.length) continue;
      const pa = older[Math.floor(hash(k, s.x, 992) * older.length)]!, pbList = older.filter((o) => o.last !== pa.last);
      if (!pbList.length) continue;
      const pb = pbList[Math.floor(hash(k, s.y, 993) * pbList.length)]!;
      const [m, f] = h.sex === "m" ? [h, sp] : [sp, h];
      m.origin = pa.hh!; f.origin = pb.hh!; f.maiden = pb.last; m.last = pa.last; f.last = pa.last;
      for (const q of people) if (q.hh === h.hh) q.last = pa.last;
      const alliance = CRAFT.has(pa.job) && CRAFT.has(pb.job);
      m.spouse = f.id; f.spouse = m.id; m.wedAt = f.wedAt = at; m.alliance = f.alliance = alliance;
      out.push({ at, a: m, b: f, alliance, dowry, grand, town });
      return;
    }
  });
  return out;
}

/** Days a sickness lasts; each household rolls once per such window. */
export const SICK_DAYS = 3;
/** Chance a household has a sick member in a window: higher in winter, lower with herb hut and healer, none during wedding joy. */
export function sickRate(s: Seed, now: number): number {
  if (weddingJoy(s, now)) return 0;
  const own = (i: string) => s.bought?.some((b) => b.item === i && b.at <= now);
  const healer = own("healer") || own("infirmary");
  return Math.max(0.01, 0.06 + 0.03 * seasonAt(now).winter - (own("herbs") ? 0.015 : 0) - (healer ? 0.035 : 0) - (s.charter?.path === "culture" && s.charter.at <= now ? CULTURE_SICK : 0) - (own("beginen") ? BEGINEN_SICK : 0));
}
/** Does the household at home key `hh` (x*1024+y) nurse a sick member right now? Pure in seed, home and time. */
export const sickHome = (s: Seed, hh: number, now: number) => hash(hh, Math.floor(now / (SICK_DAYS * 864e5)), 1301) < sickRate(s, now);
const hhTile = dwellingTile;
/** Mark the sick villager of each affected home and the housemate who stays in to care for them. */
function falls(s: Seed, people: Person[], now: number, hof: Tile | null = null) {
  // beguines of a finished Beginenhof walk out to nurse the sick, so the housemate can go to work
  const begs = hof && s.bought?.some((b) => b.item === "beginen" && b.at <= now)
    ? people.filter((q) => q.job === "herbalist" && q.work && Math.abs(q.work[0] - hof[0]) + Math.abs(q.work[1] - hof[1]) <= 3) : [];
  let bi = 0;
  const homes = new Map<number, Person[]>();
  for (const p of people) {
    if (p.role === "mayor") continue;
    const k = p.hh ?? p.home[0] * 1024 + p.home[1], group = homes.get(k) ?? [];
    group.push(p); homes.set(k, group);
  }
  for (const [k, ms] of homes) {
    if (ms.length < 2 || !sickHome(s, k, now)) continue;
    const w = Math.floor(now / (SICK_DAYS * 864e5));
    const ill = ms[Math.floor(hash(k, w, 1302) * ms.length)]!;
    const by = ms.filter((q) => q !== ill && q.age >= 16);
    if (!by.length) continue;
    const cr = by.find((q) => q.id === ill.spouse) ?? by.find((q) => q.role === "head" || q.role === "spouse") ?? by[0]!;
    ill.sick = true;
    const b = begs[bi];
    if (b) { bi++; b.nurse = ill.home; } else cr.carer = ill.id;
  }
}
/** Seconds of the wedding service inside the church. */
export const SERVICE_SECS = 20 * 60;
/** The couple walks from their birth homes to church and home together; their parents follow as guests. */
function processions(ws: Wedding[], people: Person[], church: Tile, now: number) {
  for (const w of ws) {
    if (now < w.at || now - w.at > 3 * 3600e3) continue;
    const birth = (p: Person) => p.origin ?? p.hh!;
    const [g, b] = w.a.sex === "m" ? [w.a, w.b] : [w.b, w.a];
    const to = g.home;
    g.proc = { at: w.at, from: hhTile(birth(g)), to, lag: 0, role: "groom" };
    b.proc = { at: w.at, from: hhTile(birth(b)), to, lag: 0, role: "bride" };
    let k = 0;
    for (const q of people) if (!q.proc && (q.role === "head" || q.role === "spouse") && (q.hh === birth(g) || q.hh === birth(b)) && q.spouse !== g.id && q.spouse !== b.id && q !== g && q !== b)
      q.proc = { at: w.at, from: q.home, to, lag: 6 + 5 * k++, role: "guest" };
    void church;
  }
}

/** Real seconds the village gathers in front of a newly finished landmark. */
export const FETE_SECS = 3600;
const FETE_WIN = 2.5 * 3600e3;
/** The latest landmark finished within the last FETE_WIN ms, with the moment it was finished (pure). */
export function inauguration(s: Seed, seeds: Seed[], now: number): { at: number; tile: Tile; kind: Kind } | null {
  const a1 = effAge(s, seeds, now), a0 = effAge(s, seeds, now - FETE_WIN);
  let li = -1;
  for (let i = 0; i < LANDMARKS.length; i++) { const l = LANDMARKS[i]!; if (l.at > a0 && l.at <= a1 && (li < 0 || l.at > LANDMARKS[li]!.at)) li = i; }
  // bought buildings finished within the window are inaugurated just like landmarks
  let bb: { at: number; tile: Tile; kind: Kind } | null = null;
  for (const b of s.bought ?? []) {
    const mk = monumentOf(b.item);
    if (mk && b.item !== `${mk}${MONUMENT_DEFS[mk].n}`) continue;
    const kind = mk ? MONUMENT_DEFS[mk].kind : SPECIAL_KIND[b.item]; if (!kind) continue;
    const done = mk ? monumentDone(s, seeds, mk) : specialDone(s, seeds, b.at); if (done == null || done <= now - FETE_WIN || done > now || (bb && bb.at >= done)) continue;
    const tl = specialTile(s, kind); if (tl) bb = { at: done, tile: tl, kind };
  }
  if (li < 0) return bb;
  let tile: Tile | null = null;
  for (const [k, list] of landmarkSpots(s)) if (list.includes(li) && !list.some((j) => j !== li && LANDMARKS[j]!.at > LANDMARKS[li]!.at && LANDMARKS[j]!.at - 96 <= a1)) { const [dx, dy] = k.split(",").map(Number); tile = [s.x + dx!, s.y + dy!]; break; }
  if (!tile) return bb;
  let lo = now - FETE_WIN, hi = now;
  for (let n = 0; n < 16; n++) { const m = (lo + hi) / 2; if (effAge(s, seeds, m) >= LANDMARKS[li]!.at) hi = m; else lo = m; }
  return bb && bb.at > hi ? bb : { at: hi, tile, kind: LANDMARKS[li]!.kind };
}
function fetePose(p: Person, t: Town, seeds: Seed[], now: number, base: Pose): Pose | null {
  const f = p.fete!, secs = (now - f.at) / 1000 - f.lag;
  if (secs < 0) return null;
  const a = doorOf(t, p.home, seeds), b: Tile = [Math.round(f.spot[0]), Math.round(f.spot[1])];
  const pts = [a, ...route(t, [Math.round(a[0]), Math.round(a[1])], b, seeds).slice(1, -1), f.spot];
  const len = lenOf(pts), sp = Math.max(0.15, p.speed) * (f.fire ? 2.4 : 1), tw = len / sp;
  const act: Activity = f.fire ? "fire" : "fete", bucket = f.fire || undefined;
  if (secs < tw) { const q = along(pts, secs * sp); if (q) return { ...base, ...q, visible: freeAt(t, q.x, q.y, seeds), walking: true, act, bucket, phase: (secs * sp) / STRIDE }; }
  if (secs < tw + (f.dur ?? FETE_SECS)) {
    const dx = f.face[0] - f.spot[0], dy = f.face[1] - f.spot[1], m = Math.hypot(dx, dy) || 1;
    // bucket chain: helpers swing their pails toward the flames in a steady rhythm
    const swing = f.fire ? Math.max(0, Math.sin(now / 420 + p.id)) * 0.12 : 0;
    return { ...base, x: f.spot[0] + (dx / m) * swing, y: f.spot[1] + (dy / m) * swing, visible: freeAt(t, f.spot[0], f.spot[1], seeds), walking: false, act: f.work ? "work" : act, working: !!f.work || base.working, bucket, dir: [dx / m, dy / m] };
  }
  return null;
}

function guestPose(p: Person, t: Town, seeds: Seed[], now: number, base: Pose): Pose {
  const g = p.guest!;
  // travellers take a room for the night (22-6 world time) instead of waiting in the dark
  const hr = worldHour(now);
  if (now < g.at || now >= g.until || hr >= 22 || hr < 6) return { ...base, visible: false };
  const pts = [g.from, ...route(t, g.from, [Math.round(g.spot[0]), Math.round(g.spot[1])], seeds).slice(1, -1), g.spot];
  const len = lenOf(pts), dd = ((now - g.at) / 1000) * p.speed;
  if (dd < len) { const q = along(pts, dd); if (q) return { ...base, ...q, visible: true, walking: true, act: "guest", phase: dd / STRIDE }; }
  const dx = g.face[0] - g.spot[0], dy = g.face[1] - g.spot[1], m = Math.hypot(dx, dy) || 1;
  const look = hash(p.id, Math.floor(now / 25000), 817) < 0.3 ? -1 : 1;
  return { ...base, x: g.spot[0], y: g.spot[1], visible: true, walking: false, act: "guest", talk: null, dir: [(dx / m) * look, (dy / m) * look] };
}

/** Relatives of a person within the town: spouse, parents, children, siblings (all derived). */
export function kinOf(p: Person, t: Town) {
  const by = new Map(t.people.map((q) => [q.id, q]));
  const spouse = p.spouse != null ? by.get(p.spouse) ?? null : t.people.find((q) => q !== p && q.hh === p.hh && ((p.role === "head" && q.role === "spouse") || (p.role === "spouse" && q.role === "head"))) ?? null;
  const parent = (q: Person) => q.role === "head" || q.role === "spouse";
  const birth = p.role === "child" ? p.hh : p.origin;
  const parents = birth != null ? t.people.filter((q) => q.hh === birth && parent(q)) : [];
  const children = parent(p) ? t.people.filter((q) => (q.hh === p.hh && q.role === "child" && q.origin == null) || q.origin === p.hh) : [];
  const siblings = birth != null ? t.people.filter((q) => q !== p && ((q.hh === birth && q.role === "child") || (q.origin === birth && q.origin !== undefined))) : [];
  return { spouse, parents, children, siblings };
}

/** Imported trade good → what it looks like when carried, which buildings take it in. */
const IMPORT_TO: Record<TradeGood, [Good, Kind[], Dest]> = {
  grain: ["grain", ["mill", "watermill", "granary"], "mill"], wood: ["log", ["sawmill", "warehouse"], "sawmill"], timber: ["planks", [], "site"],
  ore: ["stone", ["smithy", "steamworks"], "store"], stone: ["stone", [], "site"], fish: ["bundle", ["inn", "market"], "inn"], salt: ["flour", ["inn", "bakery"], "inn"],
  wool: ["bundle", ["manufactory", "workshop"], "store"], hides: ["bundle", ["workshop", "market"], "store"], cloth: ["bundle", ["market", "markethall"], "market"],
  ironware: ["bundle", ["market", "warehouse"], "market"], beer: ["bread", ["inn"], "inn"],
};
/** Deterministic supply chains: who carries which good from where to where during work hours. */
function assignHauls(people: Person[], byKind: Map<Kind, Tile[]>, sites: Tile[], front: (t: Tile) => Tile | null, well: Tile, imports: TradeGood[] = []) {
  const d = (a: Tile, b: Tile) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  const nearest = (from: Tile, list: Tile[]) => list.reduce<Tile | null>((b, c) => (!b || d(from, c) < d(from, b) ? c : b), null);
  const kinds = (...k: Kind[]) => k.flatMap((x) => byKind.get(x) ?? []);
  const siteFront = (from: Tile) => { const st = nearest(from, sites); return st ? (front(st) ?? st) : null; };
  const used = new Set<string>();
  for (const p of people) {
    if (!p.work) continue;
    const w = p.work, h = hash(p.id, 3, 950);
    let haul: Haul | null = null;
    const go = (to: Tile | null, toIn: boolean, good: Good, dest: Dest, fromIn = p.workIndoor) => {
      if (to && d(w, to) > 1.5 && d(w, to) < 45) haul = { from: w, to, fromIn, toIn, good, dest };
    };
    const at = (k: Kind) => (byKind.get(k) ?? []).some((x) => x[0] === w[0] && x[1] === w[1]);
    // way buildings send their own goods into town: grain sacks, smoked fish, ironware, salt
    if (p.job === "carter" && at("bigstore")) go(nearest(w, kinds("bakery", "mill", "inn")), true, "grain", "mill");
    else if (p.job === "fisher" && at("smokehouse")) go(nearest(w, kinds("inn", "market")), true, "bundle", "inn");
    else if (p.job === "smith" && at("hammerworks")) { const st = siteFront(w), mk = nearest(w, kinds("market", "warehouse")); if (mk) go(mk, true, "bundle", "market"); else if (st) go(st, false, "bundle", "site"); }
    else if (p.job === "merchant" && at("saltquay")) go(nearest(w, kinds("bakery", "inn", "market")), true, "flour", "inn");
    else if (p.job === "woodcutter") {
      const mill = nearest(w, kinds("sawmill"));
      if (mill) go(mill, true, "log", "sawmill"); else { const st = siteFront(w); go(st ?? well, false, "log", st ? "site" : "store"); }
    } else if (p.job === "mason") {
      const st = siteFront(w); go(st ?? well, false, "stone", st ? "site" : "store");
    } else if (p.job === "sawyer" && !used.has(`saw${w}`)) {
      used.add(`saw${w}`);
      const st = siteFront(w), store = nearest(w, kinds("warehouse", "market"));
      if (st) go(st, false, "planks", "site"); else if (store) go(store, true, "planks", "store");
    } else if (p.job === "farmer" && h < 0.5) {
      const m = nearest(w, kinds("mill", "watermill")); go(m, true, "grain", "mill", false);
    } else if (p.job === "miller" && !used.has(`mil${w}`)) {
      used.add(`mil${w}`); go(nearest(w, kinds("bakery")), true, "flour", "bakery");
    } else if (p.job === "baker" && !used.has(`bak${w}`)) {
      used.add(`bak${w}`);
      const inn = nearest(w, kinds("inn")), mk = nearest(w, kinds("market"));
      if (inn) go(inn, true, "bread", "inn"); else if (mk) go(mk, false, "bread", "market");
    }
    else if ((p.job === "carter" || p.job === "merchant") && imports.length && h < 0.7) {
      // unload goods brought in by traders: from market / kontor to the workshop that needs them
      const g = imports[Math.floor(hash(p.id, 4, 950) * imports.length)]!, [vis, ks, dest] = IMPORT_TO[g];
      const to = ks.length ? nearest(w, kinds(...ks)) : siteFront(w);
      go(to ?? siteFront(w), !!to, vis, to ? dest : "site");
    }
    p.haul = haul;
  }
}

/** Nearest open forest-edge tile (woodcutting) and open tile beside hills/rocks (quarry). */
const spotCache = new Map<string, [Tile | null, Tile | null]>();
let spotGeo = "";
export function resourceSpots(s: Seed, r: number): [Tile | null, Tile | null] {
  const R = Math.ceil(r + 10), key = `${s.id}:${s.x}:${s.y}:${R}`;
  if (spotGeo !== geoKey()) { spotGeo = geoKey(); spotCache.clear(); }
  const hit = spotCache.get(key); if (hit) return hit;
  let wood: Tile | null = null, rock: Tile | null = null, wd = Infinity, rd = Infinity;
  for (let y = s.y - R; y <= s.y + R; y++) for (let x = s.x - R; x <= s.x + R; x++) {
    const d = Math.hypot(x - s.x, y - s.y);
    if (d < r * 0.6 + 2 || d > R) continue;
    const t = terrain(x, y);
    if (t === "forest" && d < wd) {
      let open = false;
      for (const [i, j] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) { const n = terrain(x + i, y + j); if (n !== "forest" && buildable(n)) open = true; }
      if (open) { wd = d; wood = [x, y]; }
    }
    if (buildable(t) && t !== "forest" && d < rd) {
      for (const [i, j] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) { const n = terrain(x + i, y + j); if (n === "hill" || n === "mountain") { rd = d; rock = [x, y]; break; } }
    }
  }
  const out: [Tile | null, Tile | null] = [wood, rock];
  if (spotCache.size > 64) spotCache.clear();
  spotCache.set(key, out);
  return out;
}

// ---------------- collision ----------------
/** Walkable ground: open buildable land or a flat structure (paths, squares, fields…). */
function free(t: Town, x: number, y: number, seeds: Seed[]): boolean {
  const k = x * 4096 + y;
  const hit = t.freeC.get(k);
  if (hit !== undefined) return hit;
  const st = structureAt(x, y, seeds, t.now);
  const ok = !courtSolid(x, y) && (st ? WALK.has(st.kind) || (FLAT.has(st.kind) && st.kind !== "hay") : buildable(terrain(x, y)));
  t.freeC.set(k, ok);
  return ok;
}
const freeAt = (t: Town, x: number, y: number, seeds: Seed[]) => free(t, Math.round(x), Math.round(y), seeds);
/** The tile in front of a building where people step in and out (never through the walls). */
function doorOf(t: Town, tl: Tile, seeds: Seed[]): Tile {
  const tx = Math.round(tl[0]), ty = Math.round(tl[1]);
  if (free(t, tx, ty, seeds)) return [tx, ty];
  const k = tx * 4096 + ty;
  const hit = t.doors.get(k); if (hit) return hit;
  let best: Tile = [tx, ty], bs = Infinity;
  for (const [dx, dy, pr] of [[0, 1, 0], [1, 0, 0.1], [-1, 0, 0.2], [0, -1, 0.3], [1, 1, 1], [-1, 1, 1.1], [1, -1, 1.2], [-1, -1, 1.3]] as const) {
    const nx = tx + dx, ny = ty + dy;
    if (!free(t, nx, ny, seeds)) continue;
    const st = structureAt(nx, ny, seeds, t.now);
    const sc = pr + (st && WALK.has(st.kind) ? 0 : 0.5);
    if (sc < bs) { bs = sc; best = [nx, ny]; }
  }
  t.doors.set(k, best);
  return best;
}


// ---------------- routing ----------------
function route(t: Town, a: Tile, b: Tile, seeds: Seed[]): Tile[] {
  const key = `${a[0]},${a[1]}>${b[0]},${b[1]}`;
  const hit = t.routes.get(key);
  if (hit) return hit;
  const W = t.x1 - t.x0 + 1, H = t.y1 - t.y0 + 1;
  const idx = (x: number, y: number) => (y - t.y0) * W + (x - t.x0);
  const inside = (x: number, y: number) => x >= t.x0 && x <= t.x1 && y >= t.y0 && y <= t.y1;
  const cost = (x: number, y: number) => {
    if ((x === b[0] && y === b[1]) || (x === a[0] && y === a[1])) return 1;
    const k = x * 4096 + y;
    const hit = t.costC.get(k); if (hit !== undefined) return hit;
    const st = structureAt(x, y, seeds, t.now);
    const v = !free(t, x, y, seeds) ? (buildable(terrain(x, y)) ? 40 : Infinity) : st && WALK.has(st.kind) ? 1 : 2.4;
    t.costC.set(k, v);
    return v; // 40 = through a building only as a last resort (hidden there: courtyard / back door)
  };
  const dist = new Float64Array(W * H).fill(Infinity), prev = new Int32Array(W * H).fill(-1);
  const heap: [number, number][] = [];
  const push = (d: number, i: number) => { heap.push([d, i]); let k = heap.length - 1; while (k > 0) { const p = (k - 1) >> 1; if (heap[p]![0] <= heap[k]![0]) break; [heap[p], heap[k]] = [heap[k]!, heap[p]!]; k = p; } };
  const pop = () => { const top = heap[0]!; const last = heap.pop()!; if (heap.length) { heap[0] = last; let k = 0; for (;;) { const l = k * 2 + 1, r = l + 1; let m = k; if (l < heap.length && heap[l]![0] < heap[m]![0]) m = l; if (r < heap.length && heap[r]![0] < heap[m]![0]) m = r; if (m === k) break; [heap[m], heap[k]] = [heap[k]!, heap[m]!]; k = m; } } return top; };
  let out: Tile[] = [a, b];
  if (inside(a[0], a[1]) && inside(b[0], b[1])) {
    const si = idx(a[0], a[1]), gi = idx(b[0], b[1]);
    // A*: manhattan distance is admissible (cheapest step costs 1) and keeps the search tiny
    const hh = (i: number) => Math.abs(t.x0 + (i % W) - b[0]) + Math.abs(t.y0 + Math.floor(i / W) - b[1]);
    dist[si] = 0; push(hh(si), si);
    while (heap.length) {
      const [f, i] = pop();
      if (i === gi) break;
      if (f - hh(i) > dist[i]!) continue;
      const d = dist[i]!;
      const x = t.x0 + (i % W), y = t.y0 + Math.floor(i / W);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
        const nx = x + dx, ny = y + dy;
        if (!inside(nx, ny)) continue;
        const c = cost(nx, ny);
        if (c === Infinity) continue;
        const ni = idx(nx, ny), nd = d + c;
        if (nd < dist[ni]!) { dist[ni] = nd; prev[ni] = i; push(nd + hh(ni), ni); }
      }
    }
    if (prev[gi] !== -1) {
      const path: Tile[] = [];
      for (let i = gi; i !== -1; i = prev[i]!) path.push([t.x0 + (i % W), t.y0 + Math.floor(i / W)]);
      out = path.reverse();
    }
  }
  // gentle curve through the tile centres (endpoints kept)
  const sm = out.map((p, i) => {
    if (i === 0 || i === out.length - 1) return p;
    const q = out[i - 1]!, n = out[i + 1]!;
    return [(q[0] + p[0] * 4 + n[0]) / 6, (q[1] + p[1] * 4 + n[1]) / 6] as Tile;
  });
  t.routes.set(key, sm);
  return sm;
}

// ---------------- daily schedule ----------------
type Entry = { at: number; act: Activity; place: Tile; indoor: boolean };
const off = (p: Person, i: number, amt = 0.38): Tile => [(hash(p.id, i, 601) - 0.5) * amt * 2, (hash(p.id, i, 602) - 0.5) * amt * 2];
const add = (a: Tile, b: Tile): Tile => [a[0] + b[0], a[1] + b[1]];
const ring = (p: Person, i: number, c: Tile): Tile => { const a = hash(p.id, i, 603) * Math.PI * 2, r = 0.75 + hash(p.id, i, 604) * 0.5; return [c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r]; };
/** Where a child plays: mostly right outside its own home; only a few households' kids meet on the shared meadows/squares. */
const kidSpot = (p: Person, t: Town, i: number): Tile => {
  const out = hash(p.home[0], p.home[1], 606 + i) < 0.12 + (p.age >= 8 ? 0.08 : 0);
  return out ? add(t.plays[Math.floor(hash(p.home[0], p.home[1], 608 + i) * t.plays.length)]!, off(p, i, 0.9)) : p.home; // resolves to the free tile in front of the door
};
const spot = (p: Person, t: Town, i: number): Tile => add(t.meets[Math.floor(hash(p.id, i, 605) * t.meets.length)]!, off(p, i, t.meets.length < 3 ? 0.42 : 0.7));

/** Jobs that carry on on Sundays (bread, inn, herds, the sick, the service itself). */
const SUNDAY_WORK: ReadonlySet<Job> = new Set(["baker", "innkeeper", "priest", "healer", "mayor"] as Job[]);
export function planOf(p: Person, t: Town): Entry[] {
  const j = (i: number) => (hash(p.id, i, 700) - 0.5) * 0.8; // ± 24 min jitter
  const H = p.home;
  const E = (at: number, act: Activity, place: Tile, indoor: boolean): Entry => ({ at, act, place, indoor });
  if (p.sick) return [E(0, "sick", H, true)];
  if (p.carer != null) return [E(0, "sleep", H, true), E(7, "care", H, true), E(22, "sleep", H, true)];
  if (p.nurse && p.work) return [E(0, "sleep", H, true), E(7.5 + j(1) * 0.3, "work", p.work, p.workIndoor), E(9 + j(2) * 0.3, "care", p.nurse, true), E(12.5 + j(3) * 0.3, "work", p.work, p.workIndoor), E(15 + j(4) * 0.3, "care", p.nurse, true), E(18 + j(5) * 0.3, "home", H, true), E(21.5, "sleep", H, true)];
  if (isRestDay(t.now) && !SUNDAY_WORK.has(p.job) && !(p.job === "child" && p.age < 4)) return sundayOf(p, t, E, j);
  // Shrovetide: work until mid-afternoon, then masks, fat cakes and noise on the square until late
  if (t.feast === "shrovetide" && p.job !== "child" && hash(p.id, 41, 710) < 0.75) {
    const H = p.home;
    return [E(0, "sleep", H, true), E(6.8 + j(1), "work", p.work ?? H, p.workIndoor), E(15.6 + j(2) * 0.4, "leisure", spot(p, t, 41), false), E(22.2 + j(3) * 0.3, "home", H, true), E(23.2, "sleep", H, true)];
  }
  if (p.job === "child") {
    if (p.age < 4) return [E(0, "sleep", H, true), E(10 + j(1), "play", add(H, [0.6, 0.6]), false), E(12 + j(2), "home", H, true), E(15.5 + j(3), "play", add(H, [0.6, 0.6]), false), E(18 + j(4), "home", H, true), E(19.5, "sleep", H, true)];
    const school = p.age >= 6 && t.school;
    return [
      E(0, "sleep", H, true),
      E(7.6 + j(1) * 0.3, school ? "school" : "play", school ? t.school! : kidSpot(p, t, 1), !!school),
      E(12.8 + j(2) * 0.3, "home", H, true),
      p.age >= 11 && hash(p.id, 31, 700) < 0.45 ? E(14.3 + j(3), "home", H, true) : E(14.3 + j(3), "play", kidSpot(p, t, 2), false),
      E(18.4 + j(4), "home", H, true),
      E(20.3 + j(5) * 0.5, "sleep", H, true),
    ];
  }
  if (p.job === "retired") return [
    E(0, "sleep", H, true), E(8, "home", H, true), E(10 + j(1), "leisure", ring(p, 1, t.well), false),
    E(12, "home", H, true), E(15 + j(2), "leisure", spot(p, t, 2), false), E(18 + j(3), "home", H, true), E(21, "sleep", H, true),
  ];
  let W = p.work ?? H, indoor = p.workIndoor;
  // three-field rhythm: on stubble or fallow there is nothing to do out on the acre — the farmer threshes,
  // slaughters and splits wood at home; only ripe or tilled acres call him out
  if (p.job === "farmer" && p.work) { const st = structureAt(p.work[0], p.work[1], soloSeeds(p.seed), t.now); if (st?.kind === "field" && farmTask(fieldLook(acreOf(p.work[0], p.work[1], p.seed).id, t.now)) === "yard") { W = H; indoor = true; } }
  const wp: Tile = indoor ? W : add(W, off(p, 3, 0.3));
  const early = hasTrait(p.id, "early") ? -0.8 : hasTrait(p.id, "owl") ? 0.5 : 0;
  const late = hasTrait(p.id, "owl") ? 1.1 : hasTrait(p.id, "early") ? -0.6 : 0;
  const out = hasTrait(p.id, "sociable") ? 0.75 : hasTrait(p.id, "homebody") ? 0.15 : 0.4;
  return [
    E(0, "sleep", H, true),
    E(6.5 + early + j(1), "work", wp, indoor),
    hash(p.id, 4, 607) < 0.4 ? E(12 + j(2) * 0.3, "lunch", hash(p.id, 4, 606) < 0.5 ? ring(p, 4, t.well) : spot(p, t, 4), false) : E(12 + j(2) * 0.3, "work", wp, indoor),
    E(13 + j(3) * 0.3, "work", wp, indoor),
    hash(p.id, 5, 607) < out ? E(17.2 + j(4), "leisure", spot(p, t, 5), false) : E(17.2 + j(4), "home", H, true),
    E(19.6 + j(5) + Math.max(0, late * 0.5), "home", H, true),
    E(21.8 + late + j(6), "sleep", H, true),
  ];
}

/** Sunday: church at ten, a walk or a family visit in the afternoon, no fieldwork or building. */
function sundayOf(p: Person, t: Town, E: (at: number, act: Activity, place: Tile, indoor: boolean) => Entry, j: (i: number) => number): Entry[] {
  const H = p.home;
  const ch = t.church;
  const wake = hasTrait(p.id, "early") ? 7 : hasTrait(p.id, "owl") ? 9 : 8;
  const go = hasTrait(p.id, "pious") || hash(p.id, 21, 710) < 0.85;
  const service = go ? (ch ? E(9.6 + j(1) * 0.2, "church", ch, false) : E(9.6 + j(1) * 0.2, "church", ring(p, 21, t.meet), false)) : E(9.6, "home", H, true);
  const nature = hasTrait(p.id, "nature");
  const pm: Entry = p.job === "child"
    ? E(14 + j(3), "play", kidSpot(p, t, 2), false)
    : p.origin != null && hash(p.id, 22, 710) < 0.6 ? E(14.5 + j(3), "visit", hhTile(p.origin), true)
    : hasTrait(p.id, "homebody") ? E(14.5, "home", H, true)
    : E(14 + j(3), nature ? "stroll" : "leisure", nature ? add(t.plays[Math.floor(hash(p.id, 23, 710) * t.plays.length)]!, off(p, 4, 0.6)) : spot(p, t, 6), false);
  const f = t.feast, sc = f ? FEASTS[f].scene : null, at = (c: Tile, k: number, d = 0.9): Tile => add(c, off(p, k, d));
  const nightOut = (p.job === "child" ? 20 : 21.8) + j(6);
  if (sc === "quiet") return [E(0, "sleep", H, true), E(wake + j(2) * 0.3, "home", H, true), service, E(11.6 + j(4) * 0.4, "home", H, true), E(21 + j(6), "sleep", H, true)];
  if (f === "christmas") {
    // midnight mass: the whole village walks to church by torchlight on the eve, then the quiet day
    const eve = realmDate(t.now)[2] === 24;
    return eve
      ? [E(0, "sleep", H, true), E(20, "home", H, true), E(22.7 + j(1) * 0.15, "church", ch ?? ring(p, 21, t.meet), false)]
      : [E(0, "church", ch ?? ring(p, 21, t.meet), false), E(1.2 + j(2) * 0.1, "sleep", H, true), E(wake + 1 + j(2) * 0.3, "home", H, true), service, E(11.2 + j(4) * 0.4, "home", H, true), E(20.5 + j(6), "sleep", H, true)];
  }
  const early = f === "candlemas" ? E(8 + j(1) * 0.2, "church", ch ?? ring(p, 21, t.meet), false) : service;
  const after: Entry[] = sc === "procession"
    // procession / beating the bounds: from the church across the green and back
    ? [E(10.9 + j(4) * 0.1, "stroll", at(t.plays[Math.floor(hash(p.id, 24, 710) * t.plays.length)] ?? t.meet, 5, 0.6), false), E(12.4 + j(4) * 0.3, "home", H, true), pm, E(17.4 + j(5), "home", H, true), E(nightOut, "sleep", H, true)]
    : sc === "fire" ? [E(11.2 + j(4) * 0.4, "home", H, true), pm, E(17.4 + j(5), "home", H, true), E(19.4 + j(5) * 0.4, "leisure", at(t.bonfire ?? t.meet, 42, 1.5), false), E(23 + j(6) * 0.3, "home", H, true), E(23.4, "sleep", H, true)]
    : sc === "green" || sc === "fete" ? [E(11.2 + j(4) * 0.4, "home", H, true), E(14 + j(3), "leisure", hash(p.id, 25, 710) < 0.8 ? at(t.maypole ?? t.meet, 43, 1.4) : spot(p, t, 6), false), E(19.5 + j(5), "home", H, true), E(nightOut, "sleep", H, true)]
    : [];
  if (after.length) return [E(0, "sleep", H, true), E(wake + j(2) * 0.3, "home", H, true), early, ...after];
  return [
    E(0, "sleep", H, true), E(wake + j(2) * 0.3, "home", H, true), early,
    E(11.2 + j(4) * 0.4, "home", H, true), pm,
    E((nature ? 18.6 : 17.4) + j(5), "home", H, true),
    E((p.job === "child" ? 20 : 21.8) + j(6), "sleep", H, true),
  ];
}

export const hourOf = (now: number) => worldHour(now);

// 0.34 tiles per full gait cycle (two steps of ~3 px for a 5.2 px figure): ~1.3 steps/s at village pace
// instead of the former 0.18-tile tripping; phase is distance-driven, so cadence always matches ground speed
const STRIDE = 0.34 / (2 * Math.PI);
/** Distance covered after `secs` on a path of `len`, easing in and out over the first/last few tenths of a tile. */
function travelled(secs: number, len: number, v: number): number {
  const r = Math.min(0.25, len / 2), tr = (2 * r) / v; // ramp distance and time (avg half speed)
  if (secs <= 0) return 0;
  if (secs < tr) { const u = secs / tr; return r * u * u; }
  const cruise = (len - 2 * r) / v;
  if (secs < tr + cruise) return r + (secs - tr) * v;
  const u = Math.min(1, (secs - tr - cruise) / tr);
  return len - r * (1 - u) * (1 - u);
}
const travelTime = (len: number, v: number) => { const r = Math.min(0.25, len / 2); return (len - 2 * r) / v + (4 * r) / v; };

export function poseOf(p: Person, t: Town, seeds: Seed[], now: number): Pose {
  if (p.guest) return guestPose(p, t, seeds, now, { p, x: p.guest.spot[0], y: p.guest.spot[1], visible: false, walking: false, dir: [0, 1], phase: 0, act: "guest", working: false, talk: null, talkTurn: false, carry: null, dest: null });
  const hr = hourOf(now);
  const pl = planOf(p, t);
  let i = pl.length - 1;
  while (i > 0 && pl[i]!.at > hr) i--;
  const e = pl[i]!, prev = pl[(i - 1 + pl.length) % pl.length]!;
  const base: Pose = { p, x: e.place[0], y: e.place[1], visible: !e.indoor, walking: false, dir: [0, 1], phase: 0, act: e.act, working: false, talk: null, talkTurn: false, carry: null, dest: null };
  const secs = (hr - e.at) * 3600;
  if (p.role === "mayor") { const mp = orderPose(p, t, seeds, now, base); if (mp) return mp; }
  if (p.proc) { const pr = procPose(p, t, seeds, now, base); if (pr) return pr; }
  if (p.fete) { const fp = fetePose(p, t, seeds, now, base); if (fp) return fp; }
  if (p.arrive && now >= p.arrive.t0) {
    const A = p.arrive.from, B = doorOf(t, p.home, seeds);
    const pts = [A, ...route(t, A, [Math.round(B[0]), Math.round(B[1])], seeds).slice(1, -1), B];
    let dd = ((now - p.arrive.t0) / 1000) * ARRIVE_SPEED;
    for (let k = 1; k < pts.length; k++) {
      const a = pts[k - 1]!, b = pts[k]!, sl = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (dd <= sl) {
        const u = sl ? dd / sl : 0, x = a[0] + (b[0] - a[0]) * u, y = a[1] + (b[1] - a[1]) * u;
        return { ...base, x, y, visible: true, walking: true, act: "home", dir: pathHeading(pts, k - 1 + u, true, 0.5), phase: (((now - p.arrive.t0) / 1000) * ARRIVE_SPEED) / STRIDE, carry: p.age >= 12 ? "bundle" : null, dest: "home" };
      }
      dd -= sl;
    }
  }
  // fast path: already settled indoors (asleep, working inside) — skip doors and A* entirely
  if (e.indoor && !(e.act === "work" && p.haul)) {
    const crow = Math.abs(prev.place[0] - e.place[0]) + Math.abs(prev.place[1] - e.place[1]);
    if (crow === 0 || secs > travelTime(crow * 3 + 6, p.speed)) return base;
  }
  // indoor places are entered through their door; outdoor spots on a roof/rock move to the nearest open tile
  const at = (en: Entry): Tile => en.indoor || !freeAt(t, en.place[0], en.place[1], seeds) ? doorOf(t, en.place, seeds) : en.place;
  const pa = at(prev), pb = at(e);
  const ra: Tile = [Math.round(pa[0]), Math.round(pa[1])], rb: Tile = [Math.round(pb[0]), Math.round(pb[1])];
  let arrive = 0;
  if (ra[0] !== rb[0] || ra[1] !== rb[1] || pa[0] !== pb[0] || pa[1] !== pb[1]) {
    const pts = [pa, ...route(t, ra, rb, seeds).slice(1, -1), pb];
    let len = 0; const seg: number[] = [];
    for (let k = 1; k < pts.length; k++) { const d = Math.hypot(pts[k]![0] - pts[k - 1]![0], pts[k]![1] - pts[k - 1]![1]); seg.push(d); len += d; }
    let dd = travelled(secs, len, p.speed);
    arrive = travelTime(len, p.speed);
    const ph = dd / STRIDE;
    if (dd < len) {
      for (let k = 0; k < seg.length; k++) {
        if (dd <= seg[k]! || k === seg.length - 1) {
          const a = pts[k]!, b = pts[k + 1]!, u = seg[k]! ? dd / seg[k]! : 0;
          const x = a[0] + (b[0] - a[0]) * u, y = a[1] + (b[1] - a[1]) * u;
          return { ...base, x, y, visible: freeAt(t, x, y, seeds), walking: true, dir: pathHeading(pts, k + u, true, 0.5), phase: ph };
        }
        dd -= seg[k]!;
      }
    }
  }
  if (e.act === "work" && p.haul) { const hq = haulPose(p, t, seeds, secs - arrive, base); if (hq) return hq; }
  if (e.indoor) return base;
  // during the service (10–11) churchgoers are inside; they gather in front before and after
  if (e.act === "church" && t.church && hr >= 10 && hr < 11 + (hash(p.id, 24, 710) * 0.15)) return { ...base, visible: false };
  const tt = now / 1000;
  const c0 = pb;
  base.x = c0[0]; base.y = c0[1];
  // never show anyone standing on water (shore tiles whose only exits are wet)
  if (!freeAt(t, c0[0], c0[1], seeds)) return { ...base, visible: false };
  if (e.act === "play" || e.act === "stroll") {
    // children run little loops – shrunk until the whole loop stays on open ground
    let r = 0.5 + hash(p.id, 1, 810) * 0.4;
    const w = (e.act === "stroll" ? 0.14 : 0.16) * (hash(p.id, 2, 810) < 0.5 ? 1 : -1);
    // children dawdle: run a bit, then stand and watch for a while (per-child rhythm)
    const cyc = 18 + hash(p.id, 4, 810) * 14, u = ((tt + p.id * 3.1) % cyc) / cyc, moveFrac = e.act === "stroll" ? 1 : 0.45;
    const pausing = u > moveFrac;
    const tm = Math.floor((tt + p.id * 3.1) / cyc) * cyc * moveFrac + Math.min(u, moveFrac) * cyc;
    const a = tm * w + p.id;
    const ok = (rr: number) => Array.from({ length: 24 }, (_, k) => k * 0.2618).every((q) => freeAt(t, c0[0] + Math.cos(q) * rr, c0[1] + Math.sin(q) * rr, seeds));
    while (r > 0.12 && !ok(r)) r -= 0.08;
    if (r <= 0.12) return { ...base, dir: [1, 0.3] };
    const lx = c0[0] + Math.cos(a) * r, ly = c0[1] + Math.sin(a) * r;
    if (!freeAt(t, lx, ly, seeds)) return { ...base, dir: [1, 0.3] };
    return { ...base, x: lx, y: ly, walking: !pausing, dir: [-Math.sin(a) * Math.sign(w), Math.cos(a) * Math.sign(w)], phase: tt * Math.abs(w) * r / STRIDE };
  }
  // standing still: no drifting – only turning to look around now and then (per-person rhythm)
  const look = 20 + hash(p.id, 3, 813) * 25;
  const face = hash(p.id, Math.floor((tt + p.id * 7.3) / look), 813) < 0.5 ? 1 : -1;
  return { ...base, dir: [face, 0.3], working: e.act === "work" };
}

// ---------------- the player's own mayor ----------------
/** Walking pace of the player's mayor when sent somewhere (tiles/s). */
export const ORDER_SPEED = 0.34;
/** Seconds the mayor waits at the goal before returning to the daily routine. */
export const ORDER_IDLE = 50;
type Order = { id: number; sid: string; from: Tile; to: Tile; at: number; v: number; pts: Tile[] };
/** Stroll mode: tap orders don't expire and use the brisk stroll pace. Local-only. */
let hold = false;
export const setStrollHold = (on: boolean) => { hold = on; };
/** Where the player's steered mayor is (or heads), so the renderer never culls him. */
export function steeredMayor(): { sid: string; x: number; y: number } | null {
  if (drive) return { sid: drive.sid, x: drive.x, y: drive.y };
  return order ? { sid: order.sid, x: order.to[0], y: order.to[1] } : null;
}
let order: Order | null = null;
/** Max tiles searched around start/goal for the mayor's tap route. */
const MAYOR_PAD = 24, MAYOR_SPAN = 220;
const FARMLAND: ReadonlySet<Kind> = new Set(["field", "garden", "pasture"] as Kind[]);
/**
 * Tap route for the player's mayor: A* over a box spanning start and goal, with buildings,
 * mountains, water and court walls strictly blocked (same rule as joystick steering). Returns the
 * tile path to the goal, or to the reachable tile nearest it when the goal is cut off.
 */
export function mayorRoute(t: Town, a: Tile, b: Tile, seeds: Seed[]): Tile[] {
  const x0 = Math.max(1, Math.min(a[0], b[0]) - MAYOR_PAD), y0 = Math.max(1, Math.min(a[1], b[1]) - MAYOR_PAD);
  const x1 = Math.min(MAP - 2, Math.max(a[0], b[0]) + MAYOR_PAD), y1 = Math.min(MAP - 2, Math.max(a[1], b[1]) + MAYOR_PAD);
  const W = x1 - x0 + 1, H = y1 - y0 + 1;
  const idx = (x: number, y: number) => (y - y0) * W + (x - x0);
  const dist = new Float64Array(W * H).fill(Infinity), prev = new Int32Array(W * H).fill(-1);
  const heap: [number, number][] = [];
  const push = (d: number, i: number) => { heap.push([d, i]); let k = heap.length - 1; while (k > 0) { const p = (k - 1) >> 1; if (heap[p]![0] <= heap[k]![0]) break; [heap[p], heap[k]] = [heap[k]!, heap[p]!]; k = p; } };
  const pop = () => { const top = heap[0]!; const last = heap.pop()!; if (heap.length) { heap[0] = last; let k = 0; for (;;) { const l = k * 2 + 1, r = l + 1; let m = k; if (l < heap.length && heap[l]![0] < heap[m]![0]) m = l; if (r < heap.length && heap[r]![0] < heap[m]![0]) m = r; if (m === k) break; [heap[m], heap[k]] = [heap[k]!, heap[m]!]; k = m; } } return top; };
  const hh = (x: number, y: number) => Math.abs(x - b[0]) + Math.abs(y - b[1]);
  const si = idx(a[0], a[1]), gi = idx(b[0], b[1]);
  let best = si, bestH = hh(a[0], a[1]);
  dist[si] = 0; push(bestH, si);
  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]] as const;
  const ok = (x: number, y: number) => free(t, x, y, seeds);
  while (heap.length) {
    const [f, i] = pop();
    const x = x0 + (i % W), y = y0 + Math.floor(i / W);
    if (f - hh(x, y) > dist[i]! + 1e-9) continue;
    const h = hh(x, y); if (h < bestH) { bestH = h; best = i; }
    if (i === gi) break;
    for (const [dx, dy] of DIRS) {
      const nx = x + dx, ny = y + dy;
      if (nx < x0 || nx > x1 || ny < y0 || ny > y1 || !ok(nx, ny)) continue;
      // diagonal steps between free tiles are allowed: dense villages place houses corner to corner,
      // and a strict corner rule walled the mayor into a handful of tiles
      const st = structureAt(nx, ny, seeds, t.now);
      // roads are the network; open grass is a detour, and a mayor spares his farmers' acres
      const c = (st && WALK.has(st.kind) ? 1 : st && FARMLAND.has(st.kind) ? 7 : 3.5) * (dx && dy ? Math.SQRT2 : 1);
      const ni = idx(nx, ny), nd = dist[i]! + c;
      if (nd < dist[ni]!) { dist[ni] = nd; prev[ni] = i; push(nd + hh(nx, ny), ni); }
    }
  }
  const end = prev[gi] !== -1 || gi === si ? gi : best;
  const path: Tile[] = [];
  for (let i = end; i !== -1; i = prev[i]!) path.push([x0 + (i % W), y0 + Math.floor(i / W)]);
  return path.reverse();
}
/** Local-only steering of the player's own figure; never stored, other clients keep seeing the routine. */
export function commandMayor(p: Person, t: Town, seeds: Seed[], now: number, to: Tile): boolean {
  const g: Tile = [Math.round(to[0]), Math.round(to[1])];
  if (p.role !== "mayor" || !free(t, g[0], g[1], seeds)) return false;
  const q = poseOf(p, t, seeds, now);
  const from: Tile = q.visible ? [q.x, q.y] : doorOf(t, p.home, seeds);
  const a: Tile = [Math.round(from[0]), Math.round(from[1])];
  if (Math.abs(a[0] - g[0]) > MAYOR_SPAN || Math.abs(a[1] - g[1]) > MAYOR_SPAN) return false;
  const tiles = mayorRoute(t, a, g, seeds);
  const last = tiles[tiles.length - 1] ?? a;
  if (Math.abs(last[0] - g[0]) + Math.abs(last[1] - g[1]) > 0 && tiles.length <= 1) return false;
  const to2: Tile = last[0] === g[0] && last[1] === g[1] ? g : last;
  const pts: Tile[] = [from, ...tiles.slice(1, -1), to2];
  order = { id: p.id, sid: p.seed.id, from, to: to2, at: now, v: hold ? DRIVE_SPEED : ORDER_SPEED, pts }; drive = null;
  return true;
}
/** Current goal of the steered mayor, or null when idle (for the marker). */
export function mayorGoal(now: number): Tile | null {
  if (!order) return null;
  return now - order.at < 600000 ? order.to : null;
}
export const clearMayorOrder = () => { order = null; drive = null; };
/** Leaving stroll mode: the mayor stays where he is (local-only), instead of snapping back to his routine. */
export function parkMayor(p: Person, t: Town, seeds: Seed[], now: number) {
  if (p.role !== "mayor") return;
  if (drive && drive.id === p.id) { drive.moving = false; return; }
  if (!order || order.id !== p.id) return;
  const q = poseOf(p, t, seeds, now);
  drive = { id: p.id, sid: p.seed.id, x: q.x, y: q.y, dir: q.dir, moving: false, dist: 0 };
  order = null;
}
/** True while the own mayor stands or walks away from his routine (stroll position kept). */
export const mayorAway = () => !!drive || !!order;
/** Walking pace when the player steers the mayor directly (tiles/s). */
export const DRIVE_SPEED = 0.38;
/** Knights ride: speed factor of the riding horse in stroll mode (local-only, from the knighthood row). */
export const KNIGHT_SPEED = 2.2;
/** Extra factor for a mounted knight on road/street tiles. */
export const KNIGHT_ROAD = 1.3;
let mounted = false;
export const setMounted = (v: boolean) => { mounted = v; };
type Drive = { id: number; sid: string; x: number; y: number; dir: [number, number]; moving: boolean; dist: number };
let drive: Drive | null = null;
/** Stroll mode: steer the own mayor directly by a tile-space direction; local-only, never stored. Walls and water block. */
export function driveMayor(p: Person, t: Town, seeds: Seed[], now: number, dx: number, dy: number, dt: number) {
  if (p.role !== "mayor") return;
  if (!drive || drive.id !== p.id) {
    const q = poseOf(p, t, seeds, now);
    const [x, y] = q.visible ? [q.x, q.y] : doorOf(t, p.home, seeds);
    drive = { id: p.id, sid: p.seed.id, x, y, dir: [1, 0.3], moving: false, dist: 0 };
    order = null;
  }
  const len = Math.hypot(dx, dy);
  if (!len) { drive.moving = false; return; }
  // knights gallop faster still on roads and streets
  const onRoad = mounted && (() => { const k = structureAt(Math.round(drive.x), Math.round(drive.y), seeds, now)?.kind; return k === "street" || k === "road" || k === "path" || k === "square" || k === "bridge"; })();
  const v = DRIVE_SPEED * (mounted ? KNIGHT_SPEED * (onRoad ? KNIGHT_ROAD : 1) : 1);
  const s = (v * Math.min(dt, 0.1)) / len, nx = drive.x + dx * s, ny = drive.y + dy * s;
  const ok = (x: number, y: number) => x >= 1 && y >= 1 && x < MAP - 1 && y < MAP - 1 && freeAt(t, x, y, seeds);
  if (ok(nx, ny)) { drive.x = nx; drive.y = ny; }
  else if (ok(nx, drive.y)) drive.x = nx;
  else if (ok(drive.x, ny)) drive.y = ny;
  drive.moving = true; drive.dist += v * Math.min(dt, 0.1);
  drive.dir = [dx / len, dy / len];
}
export const stopDrive = () => { drive = null; };
/** Own steered mayor right now (for the live broadcast), or null when following the routine. */
export function ownStroll(): { sid: string; x: number; y: number; dir: [number, number]; walking: boolean; dist: number } | null {
  if (drive) return { sid: drive.sid, x: drive.x, y: drive.y, dir: drive.dir, walking: drive.moving, dist: drive.dist };
  return null;
}

/** Live positions of other players' strolling mayors (Realtime broadcast, never stored); dist carries the stride phase. */
export type RemoteSample = { x: number; y: number; dir: [number, number]; walking: boolean; mounted: boolean; dist: number; t: number };
const remote = new Map<string, { a: RemoteSample; b: RemoteSample }>();
/** Remote figures stay live this long without a packet, then fall back to their derived routine. */
export const REMOTE_TTL = 8000;
/** Render delay so motion is interpolated between two received samples. */
const REMOTE_LAG = 260;
export function setRemoteMayor(sid: string, s: Omit<RemoteSample, "t"> | null, at = Date.now()) {
  if (!s) { remote.delete(sid); return; }
  const n: RemoteSample = { ...s, t: at }, r = remote.get(sid);
  if (!r || at - r.b.t > 2000 || Math.hypot(n.x - r.b.x, n.y - r.b.y) > 6) remote.set(sid, { a: n, b: n });
  else remote.set(sid, { a: r.b, b: n });
}
export const clearRemoteMayors = () => remote.clear();
/** Interpolated remote pose sample, or null when stale/absent. */
export function remoteMayor(sid: string, wall = Date.now()): RemoteSample | null {
  const r = remote.get(sid);
  if (!r) return null;
  if (wall - r.b.t > REMOTE_TTL) { remote.delete(sid); return null; }
  const rt = wall - REMOTE_LAG, span = r.b.t - r.a.t;
  const u = span > 0 ? Math.max(0, Math.min(1, (rt - r.a.t) / span)) : 1;
  const l = (p: number, q: number) => p + (q - p) * u;
  const walking = r.b.walking && wall - r.b.t < 1200;
  return { x: l(r.a.x, r.b.x), y: l(r.a.y, r.b.y), dir: r.b.dir, walking, mounted: r.b.mounted, dist: l(r.a.dist, r.b.dist), t: r.b.t };
}
function orderPose(p: Person, t: Town, seeds: Seed[], now: number, base: Pose): Pose | null {
  const dv = drive;
  if (dv && dv.id === p.id) return { ...base, x: dv.x, y: dv.y, dir: dv.dir, visible: true, walking: dv.moving, act: "stroll", phase: dv.dist / STRIDE, working: false, mounted };
  if (!dv || dv.sid !== p.seed.id) {
    const rm = remoteMayor(p.seed.id);
    if (rm) return { ...base, x: rm.x, y: rm.y, dir: rm.dir, visible: true, walking: rm.walking, act: "stroll", phase: rm.dist, working: false, mounted: rm.mounted };
  }
  const o = order;
  if (!o || o.id !== p.id) return null;
  const a: Tile = [Math.round(o.from[0]), Math.round(o.from[1])];
  const pts = o.pts;
  const secs = (now - o.at) / 1000, dd = secs * o.v, len = lenOf(pts);
  const q = along(pts, dd);
  if (q && dd < len) return { ...base, ...q, visible: true, walking: true, act: "stroll", phase: dd / STRIDE, working: false };
  if (hold || secs - len / o.v < ORDER_IDLE) return { ...base, x: o.to[0], y: o.to[1], visible: true, walking: false, act: "stroll", dir: [1, 0.3], working: false };
  order = null;
  return null;
}

/** Walk along points: position at distance dd, or null when past the end. */
function along(pts: Tile[], dd: number): { x: number; y: number; dir: [number, number] } | null {
  for (let k = 1; k < pts.length; k++) {
    const a = pts[k - 1]!, b = pts[k]!, sl = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (dd <= sl) { const u = sl ? dd / sl : 0; return { x: a[0] + (b[0] - a[0]) * u, y: a[1] + (b[1] - a[1]) * u, dir: pathHeading(pts, k - 1 + u, true, 0.5) }; }
    dd -= sl;
  }
  return null;
}
const lenOf = (pts: Tile[]) => pts.reduce((a, q, i) => i ? a + Math.hypot(q[0] - pts[i - 1]![0], q[1] - pts[i - 1]![1]) : 0, 0);
/** Wedding procession speed (tiles/s): a slow, festive pace. */
export const PROC_SPEED = 0.12;
/** Where a procession member is: walking to church, inside for the service, walking to the new home, then guests linger. */
function procPose(p: Person, t: Town, seeds: Seed[], now: number, base: Pose): Pose | null {
  const pr = p.proc!, church = t.church ?? t.meet;
  const leg = (A: Tile, B: Tile) => { const a = doorOf(t, A, seeds), b = t.church ? doorOf(t, B, seeds) : B; return [a, ...route(t, [Math.round(a[0]), Math.round(a[1])], [Math.round(b[0]), Math.round(b[1])], seeds).slice(1, -1), b]; };
  const p1 = leg(pr.from, church), l1 = lenOf(p1);
  const ch = p1[p1.length - 1]!;
  const p2 = [ch, ...route(t, [Math.round(ch[0]), Math.round(ch[1])], [Math.round(pr.to[0]), Math.round(pr.to[1])], seeds).slice(1, -1), doorOf(t, pr.to, seeds)], l2 = lenOf(p2);
  const secs = (now - pr.at) / 1000 - pr.lag;
  if (secs < 0) return null;
  const festive = pr.role === "guest" ? undefined : pr.role;
  const walk = (pts: Tile[], dd: number) => { const q = along(pts, dd); return q ? { ...base, ...q, visible: true, walking: true, act: "wedding" as Activity, phase: dd / STRIDE, festive } : null; };
  const t1 = l1 / PROC_SPEED;
  if (secs < t1) return walk(p1, secs * PROC_SPEED);
  if (secs < t1 + SERVICE_SECS) return { ...base, x: ch[0], y: ch[1], visible: !t.church, act: "wedding", festive };
  const s2 = secs - t1 - SERVICE_SECS, t2 = l2 / PROC_SPEED;
  if (s2 < t2) return walk(p2, s2 * PROC_SPEED);
  // guests stand outside the new home for half an hour, the couple has gone in
  if (pr.role === "guest" && s2 < t2 + 1800) { const d = doorOf(t, pr.to, seeds), o = off(p, 9, 0.6); return { ...base, x: d[0] + o[0], y: d[1] + o[1], visible: freeAt(t, d[0] + o[0], d[1] + o[1], seeds), act: "wedding", dir: [-o[0] || 1, -o[1]] }; }
  return null;
}

/** Newcomers walk slowly, laden with their belongings. */
export const ARRIVE_SPEED = 0.16;
const LOAD = 25; // seconds spent loading / unloading at each end
function haulPose(p: Person, t: Town, seeds: Seed[], secs: number, base: Pose): Pose | null {
  const H = p.haul!;
  const end = (tl: Tile, indoor: boolean): Tile => indoor || !freeAt(t, tl[0], tl[1], seeds) ? doorOf(t, tl, seeds) : tl;
  const A = end(H.from, H.fromIn), B = end(H.to, H.toIn);
  const pts = [A, ...route(t, [Math.round(A[0]), Math.round(A[1])], [Math.round(B[0]), Math.round(B[1])], seeds).slice(1, -1), B];
  let len = 0; const seg: number[] = [];
  for (let k = 1; k < pts.length; k++) { const dd = Math.hypot(pts[k]![0] - pts[k - 1]![0], pts[k]![1] - pts[k - 1]![1]); seg.push(dd); len += dd; }
  if (len < 0.5) return null;
  const leg = len / p.speed, cyc = 2 * (leg + LOAD);
  const u = ((secs % cyc) + cyc) % cyc;
  const at = (q: Tile, indoor: boolean, carry: Good | null): Pose =>
    ({ ...base, x: q[0], y: q[1], visible: !indoor, walking: false, working: !indoor, carry, dest: H.dest });
  if (u < LOAD) return at(A, H.fromIn, null);
  if (u >= leg + LOAD && u < leg + 2 * LOAD) return at(B, H.toIn, null);
  const out = u < leg + LOAD;
  let dd = (out ? u - LOAD : u - leg - 2 * LOAD) * p.speed;
  if (!out) dd = len - dd;
  for (let k = 0; k < seg.length; k++) {
    if (dd <= seg[k]! || k === seg.length - 1) {
      const a = pts[k]!, b = pts[k + 1]!, f = seg[k]! ? Math.min(1, dd / seg[k]!) : 0;
      const x = a[0] + (b[0] - a[0]) * f, y = a[1] + (b[1] - a[1]) * f;
      return { ...base, x, y, visible: freeAt(t, x, y, seeds), walking: true, working: false,
        dir: pathHeading(pts, k + f, out, 0.5), phase: dd / STRIDE, carry: out ? H.good : null, dest: H.dest };
    }
    dd -= seg[k]!;
  }
  return null;
}

/** All visible villagers of a town right now, with conversations paired deterministically. */
export function townPoses(s: Seed, seeds: Seed[], now: number): Pose[] {
  const t = townOf(s, seeds, now);
  const out = t.people.map((p) => poseOf(p, t, seeds, now)).filter((q) => q.visible);
  const toff = hash(t.people[0]?.id ?? 0, 7, 899) * 180000;
  const slot = Math.floor((now + toff) / 180000); // pairings change every 3 minutes, offset per town
  const idle = out.filter((q) => !q.walking && (q.act === "leisure" || q.act === "lunch"));
  idle.sort((a, b) => hash(a.p.id, slot, 900) - hash(b.p.id, slot, 900));
  for (let k = 0; k + 1 < idle.length; k += 2) {
    const a = idle[k]!, b = idle[k + 1]!;
    if (Math.hypot(a.x - b.x, a.y - b.y) > 1.6 || hash(a.p.id, slot, 901) > 0.75) continue;
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    if (!freeAt(t, mx - 0.22, my, seeds) || !freeAt(t, mx + 0.22, my, seeds)) continue;
    a.x = mx - 0.22; a.y = my; b.x = mx + 0.22; b.y = my;
    a.dir = [1, -1]; b.dir = [-1, 1];
    a.talk = b.talk = null;
    const sp = talkState(a.p.id, b.p.id, now);
    if (sp) { const who = sp.a ? a : b; who.talk = sp.icon; who.talkTurn = true; }
  }
  return out;
}

/** Poses are recomputed every POSE_STEP ms and blended in between, so big towns don't rerun every schedule each frame. */
export const POSE_STEP = 100;
const poseMemo = new Map<string, { seeds: Seed[]; b: number; a: Pose[]; n: Pose[]; byId: Map<number, Pose> }>();
/** townPoses at render rate: exact poses at POSE_STEP marks (pure from the clock), linear blend between them. */
export function townPosesSmooth(s: Seed, seeds: Seed[], now: number): Pose[] {
  const b = Math.floor(now / POSE_STEP);
  let m = poseMemo.get(s.id);
  if (!m || m.seeds !== seeds || b < m.b || b > m.b + 1) {
    const a = townPoses(s, seeds, b * POSE_STEP), n = townPoses(s, seeds, (b + 1) * POSE_STEP);
    m = { seeds, b, a, n, byId: new Map(n.map((q) => [q.p.id, q])) }; poseMemo.set(s.id, m);
  } else if (b === m.b + 1) {
    const n = townPoses(s, seeds, (b + 1) * POSE_STEP);
    m.a = m.n; m.n = n; m.b = b; m.byId = new Map(n.map((q) => [q.p.id, q]));
  }
  const u = (now - m.b * POSE_STEP) / POSE_STEP, out: Pose[] = [];
  for (const q of m.a) {
    const r = m.byId.get(q.p.id);
    // vanished (went indoors) or jumped (door, teleport): keep the exact earlier pose instead of sliding
    if (!r || Math.abs(r.x - q.x) + Math.abs(r.y - q.y) > 1) { out.push(q); continue; }
    out.push({ ...q, x: q.x + (r.x - q.x) * u, y: q.y + (r.y - q.y) * u, phase: q.phase + (r.phase - q.phase) * u });
  }
  return out;
}

/** Who is speaking in a pair right now: each pair has its own clock, irregular 3–9 s turns and silent pauses. */
export function talkState(ia: number, ib: number, now: number): { a: boolean; icon: number } | null {
  const k = ia * 31 + ib, sec = now / 1000 + hash(k, 1, 904) * 997;
  const cell = 9, c = Math.floor(sec / cell), within = sec - c * cell;
  const r = hash(k, c, 905);
  if (r < 0.35) return null; // pause – just standing together
  const start = hash(k, c, 906) * 3, len = 3 + hash(k, c, 907) * (6 - start);
  if (within < start || within > start + len) return null;
  return { a: r < 0.675, icon: Math.floor(hash(k, c, 908) * 6) };
}
