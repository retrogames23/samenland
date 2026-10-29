import { cacheTick, isSunday } from "./time";
import { weddingTimes, weddingJoy } from "./weddings";
import { hasTrait } from "./traits";
import { pathHeading } from "./motion";
import { leaversOf } from "./wander";
import { fires } from "./disasters";
import { guestNow, maypoleUp, cowsOf } from "./encounters";
import { worldHour } from "./time";
// Villagers: a pure, deterministic function of the seed, its buildings and the clock.
// Nothing is stored — every client computes the same people at the same spot.
import { MAP, hash, structureAt, effAge, radiusOf, reachOf, terrain, buildable, isWater, bornAt, speedOf, seedsKey, FLAT, tradePartners, LANDMARKS, landmarkSpots, type TradeGood, type Seed, type Kind } from "./world";

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
  /** Wedding procession: birth home → church → new home, starting at `at` (world ms); lag = seconds behind the couple. */
  proc?: { at: number; from: Tile; to: Tile; lag: number; role: "bride" | "groom" | "guest" };
  /** Inauguration of a just-finished landmark: walk there at `at` (+lag s) and gather at `spot` facing `face`. */
  fete?: { at: number; spot: Tile; face: Tile; lag: number; dur?: number; fire?: boolean };
  /** A travelling visitor of the day's encounter: walks in from the edge at `at`, waits at `spot`, gone after `until`. */
  guest?: { at: number; until: number; from: Tile; spot: Tile; face: Tile; event: string };
};
export type Role = "head" | "spouse" | "child" | "elder" | "lodger" | "mayor" | "guest";
/** Who appears for each visitor encounter: [job, sex, age, dx, dy] around the well. */
const GUESTS: Record<string, [Job, Sex, number, number, number][]> = {
  journeyman: [["builder", "m", 22, 0, 0]], merchant: [["merchant", "m", 46, 0, 0]], healer: [["healer", "f", 52, 0, 0]],
  minstrel: [["innkeeper", "m", 30, 0, 0]], widow: [["homemaker", "f", 34, 0, 0], ["child", "m", 9, 0.5, 0.3], ["child", "f", 7, -0.3, 0.5], ["child", "m", 5, 0.6, -0.4]],
  monk: [["priest", "m", 58, 0, 0]], surveyor: [["mason", "m", 41, 0, 0]], pilgrims: [["retired", "m", 60, 0, 0], ["homemaker", "f", 44, 0.6, 0.2], ["worker", "m", 36, -0.4, 0.6]],
  orphan: [["child", "m", 11, 0, 0]], tinker: [["smith", "m", 50, 0, 0]], painter: [["crafter", "m", 35, 0, 0]], nursery: [["herbalist", "m", 47, 0, 0]],
};
export type Wedding = { at: number; a: Person; b: Person; alliance: boolean };
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
  /** Fighting a fire: carries a sloshing water bucket. */
  bucket?: boolean;
};

const F = ["Greta", "Ida", "Frieda", "Lotte", "Marie", "Anna", "Clara", "Hedwig", "Emma", "Rosa", "Lina", "Mathilda", "Elsa", "Paula", "Wilma", "Martha", "Johanna", "Thea", "Ella", "Luise"];
const M = ["Otto", "Karl", "Emil", "Fritz", "Hans", "Paul", "Anton", "Jakob", "Franz", "Ludwig", "Willi", "Bruno", "Gustav", "Oskar", "Theo", "Konrad", "Max", "Albert", "Heinrich", "Leo"];
const S = ["Hollmann", "Brandt", "Weber", "Müller", "Becker", "Lindner", "Kraus", "Vogt", "Seidel", "Hartmann", "Ebert", "Moosbauer", "Winter", "Sommer", "Fink", "Haas", "Kessler", "Roth", "Albers", "Pfeiffer", "Graf", "Kühn"];
const pick = <T,>(a: readonly T[], h: number) => a[Math.floor(h * a.length) % a.length]!;

const HOMES: Partial<Record<Kind, [number, number]>> = { hut: [2, 2], suburb: [2, 4], farmhouse: [2, 4], cottage: [2, 3], townhouse: [2, 4], townhouse2: [2, 4], fachwerk: [2, 5], steinhaus: [2, 5], handwerker: [2, 4], patrician: [2, 5], villa: [2, 4], tenement: [4, 8], inn: [2, 2], bakery: [2, 2] };
/** Kinds people live in. */
export const isHomeKind = (k: string) => k in HOMES && k !== "inn" && k !== "bakery";
const SLOTS: Partial<Record<Kind, [Job, number]>> = {
  belfry: ["watchman", 1], theater: ["crafter", 2], opera: ["crafter", 2], university: ["teacher", 2], exchange: ["merchant", 3], orangery: ["herbalist", 2],
  watermill: ["miller", 2], chapel: ["priest", 1], manufactory: ["crafter", 4], steamworks: ["smith", 3], station: ["merchant", 2], stall: ["merchant", 2], harbor: ["carter", 2], townhall: ["crafter", 2], seat3: ["crafter", 1],
  bakery: ["baker", 2], smithy: ["smith", 2], inn: ["innkeeper", 2], mill: ["miller", 1], workshop: ["crafter", 2],
  factory: ["priest", 2], sawmill: ["sawyer", 3], market: ["merchant", 2], church: ["priest", 1], warehouse: ["carter", 2],
  fishery: ["fisher", 1], infirmary: ["healer", 1], school: ["teacher", 1], granary: ["carter", 1], markethall: ["merchant", 2], guildhall: ["crafter", 2], library: ["teacher", 1], dairy: ["farmer", 2], firehouse: ["firewarden", 2], guardhouse: ["watchman", 3], lodge: ["hunter", 1], herbhut: ["herbalist", 1], woodcamp: ["woodcutter", 2],
};
const OUTDOOR_WORK: ReadonlySet<Job> = new Set(["mayor", "farmer", "merchant", "carter", "builder", "woodcutter", "mason", "fisher", "smith", "healer", "watchman", "hunter", "herbalist"]);
const WALK: ReadonlySet<Kind> = new Set(["path", "street", "square", "market", "road", "bridge", "rail", "avenue"]);

export type Town = {
  seed: Seed; people: Person[]; well: Tile; meet: Tile; meets: Tile[]; plays: Tile[]; school: Tile | null; play: Tile;
  x0: number; y0: number; x1: number; y1: number; routes: Map<string, Tile[]>; now: number;
  freeC: Map<number, boolean>; costC: Map<number, number>; doors: Map<number, Tile>;
  weddings: Wedding[]; church: Tile | null;
  /** Encounter props on the square: a raised maypole and the village's cows (derived from decisions). */
  maypole: Tile | null; cows: Tile[];
};

/** Service buildings whose staff grows with the town (radius), so big towns get more bakers, innkeepers, priests. */
const SERVICE: ReadonlySet<Kind> = new Set(["bakery", "inn", "mill", "watermill", "church", "chapel", "market", "smithy", "infirmary", "school"] as Kind[]);
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
  const r = reachOf(s, radiusOf(effAge(s, seeds, now)));
  const x0 = Math.floor(s.x - r - 2), x1 = Math.ceil(s.x + r + 2), y0 = Math.floor(s.y - r - 2), y1 = Math.ceil(s.y + r + 2);
  const byKind = new Map<Kind, Tile[]>();
  const sites: Tile[] = [];
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const st = structureAt(x, y, seeds, now);
    if (!st || st.seed.id !== s.id) continue;
    if (st.build !== undefined) { sites.push([x, y]); continue; }
    if (!byKind.has(st.kind)) byKind.set(st.kind, []);
    byKind.get(st.kind)!.push([x, y]);
  }
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
  const homes: Tile[] = [];
  for (const k of Object.keys(HOMES) as Kind[]) homes.push(...(byKind.get(k) ?? []));
  homes.sort((a, b) => Math.hypot(a[0] - s.x, a[1] - s.y) - Math.hypot(b[0] - s.x, b[1] - s.y) || a[0] - b[0] || a[1] - b[1]);

  const workTiles = (["workshop", "warehouse", "market", "markethall", "manufactory", "guildhall", "smithy", "sawmill"] as Kind[]).flatMap((k) => byKind.get(k) ?? []);
  const people: Person[] = [];
  const created = Date.parse(s.created_at);
  // households that moved to a neighbour: their house stands empty until newcomers arrive (never the oldest core homes)
  const empty = new Set<string>();
  if (homes.length > 6) for (const w of leaversOf(s, seeds, now)) {
    const hm = homes[3 + Math.floor(hash(w.sd, 5, 1508) * (homes.length - 3))]!;
    empty.add(hm.join(","));
  }
  for (const home of homes) {
    if (empty.has(home.join(","))) continue;
    const kind = structureAt(home[0], home[1], seeds, now)!.kind;
    const [lo, hi] = HOMES[kind]!;
    const hh = (i: number) => hash(home[0], home[1], 400 + i);
    const size = lo + Math.floor(hh(0) * (hi - lo + 1));
    const last = pick(S, hh(1));
    const pa = 24 + Math.floor(hh(2) * 30);
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
      const id = (home[0] * 1024 + home[1]) * 8 + m;
      const h = (i: number) => hash(id, 77, i);
      let age: number, sex: Sex, role: Role;
      if (m === 0) { age = pa; sex = h(1) < 0.5 ? "f" : "m"; role = "head"; }
      else if (m === 1 && h(9) < 0.85) { age = Math.max(20, pa + Math.floor((h(2) - 0.5) * 8)); sex = people[people.length - 1]!.sex === "f" ? "m" : "f"; role = "spouse"; }
      else if (m === size - 1 && size >= 4 && h(3) < 0.4) { age = Math.max(pa + 22, 64 + Math.floor(h(2) * 20)); sex = h(1) < 0.55 ? "f" : "m"; role = "elder"; }
      else if (m >= 3 && h(4) < 0.5) { age = 17 + Math.floor(h(2) * 30); sex = h(1) < 0.5 ? "f" : "m"; role = "lodger"; } // lodger, journeyman, maid
      else { age = Math.max(1, Math.min(pa - 19, 1 + Math.floor(h(2) * 14))); sex = h(1) < 0.5 ? "f" : "m"; role = "child"; }
      age += Math.floor(yrs);
      let job: Job = "child", work: Tile | null = null;
      if (age >= 66) job = "retired";
      else if (age >= 16) {
        const slot = h(5) < 0.82 ? slots.shift() : undefined;
        if (slot) { job = slot.job; work = slot.at; }
        else if (byKind.get("field")?.length && h(6) < farmShare(r)) { job = "farmer"; work = near(byKind.get("field"), home, h(7)); }
        else if (r >= 18 && h(8) < 0.6) { job = "worker"; work = near(workTiles, home, h(7)) ?? home; }
        else { job = "homemaker"; work = near(byKind.get("garden"), home, h(7)) ?? home; }
        if (job === "merchant" || job === "carter") work = [work![0], work![1]];
      }
      const kid = age < 14, old = age >= 65;
      people.push({
        id, seed: s, first: pick(sex === "f" ? F : M, h(10)), last, sex, age, job, home, work,
        workIndoor: !OUTDOOR_WORK.has(job) && job !== "homemaker",
        speed: (kid ? 0.3 : old ? 0.15 : 0.22) * (0.85 + h(11) * 0.3),
        looks: { skin: h(12), hair: old ? -1 : h(13), shirt: h(14), pants: h(15), hat: h(16) < (job === "farmer" ? 0.7 : 0.25), stick: old && h(17) < 0.6 },
        haul: null,
        arrive: arrive ? { from: arrive.from, t0: arrive.t0 + m * 2500 } : null,
        role, hh: home[0] * 1024 + home[1],
      });
    }
  }
  const weddings = marry(s, people, seeds, now);
  falls(s, people, now);
  const chT = byKind.get("church")?.[0] ?? byKind.get("chapel")?.[0] ?? null;
  const church: Tile | null = chT ? (front(chT) ?? null) : null;
  processions(weddings, people, church ?? meet, now);
  // the mayor's answer to the real wedding: the feast also gathers the village at church (the couple's procession runs anyway)
  const wd = (s.decisions ?? []).filter((d) => d.event === "wedding" && d.choice === "feast" && now >= d.at && now - d.at < 3 * 3600e3).pop();
  if (wd && weddings.some((w) => w.at <= wd.at && wd.at - w.at < 3 * 3600e3)) {
    const c = church ?? meet;
    for (const q of people) {
      if (q.proc || q.sick || q.carer != null || q.arrive || hash(q.id, 43, 720) < 0.2) continue;
      const a = hash(q.id, 44, 720) * Math.PI * 2, rr = 1 + hash(q.id, 45, 720) * 1.8;
      q.fete = { at: wd.at, spot: [c[0] + Math.cos(a) * rr, c[1] + Math.sin(a) * rr], face: c, lag: hash(q.id, 46, 720) * 180 };
    }
  }
  const ina = inauguration(s, seeds, now);
  if (ina) {
    const fr = front(ina.tile) ?? ina.tile;
    for (const q of people) {
      if (q.proc || q.sick || q.carer != null || q.arrive || hash(q.id, 31, 720) < 0.12) continue;
      const a = hash(q.id, 32, 720) * Math.PI * 2, rr = 0.6 + hash(q.id, 33, 720) * 1.6;
      q.fete = { at: ina.at, spot: [fr[0] + Math.cos(a) * rr, fr[1] + Math.sin(a) * rr], face: ina.tile, lag: hash(q.id, 34, 720) * 240 };
    }
  }
  // ---- encounter scenes: what the parchment tells is also seen on the square ----
  const decs = s.decisions ?? [];
  const open = (x: number, y: number) => { const st = structureAt(x, y, seeds, now); return (!st || st.kind === "road" || st.kind === "path") && !isWater(terrain(x, y)); };
  const nearFree = (c: Tile, k: number): Tile => {
    for (let i = 0; i < 12; i++) { const a = hash(k, i, 1401) * Math.PI * 2, d = 1 + hash(k, i, 1402) * 1.6, x = Math.round(c[0] + Math.cos(a) * d), y = Math.round(c[1] + Math.sin(a) * d); if (open(x, y)) return [x, y]; }
    return c;
  };
  const maypole: Tile | null = maypoleUp(decs, now) ? nearFree(meet, s.x * 7 + s.y) : null;
  const cows: Tile[] = [];
  for (let i = 0, n = cowsOf(decs, now); i < n && i < 3; i++) {
    const pas = byKind.get("pasture") ?? [];
    cows.push(pas.length ? pas[i % pas.length]! : nearFree(meet, s.x * 13 + s.y + i * 101));
  }
  // raising the maypole / maypole games: half the village gathers on the square for an hour
  const mp = decs.filter((d) => d.event === "maypole" && now >= d.at && now - d.at < 2 * 3600e3).pop();
  if (mp) {
    const c = maypole ?? meet;
    for (const q of people) {
      if (q.proc || q.sick || q.carer != null || q.arrive || hash(q.id, 47, 720) < 0.5) continue;
      const a = hash(q.id, 48, 720) * Math.PI * 2, rr = 1.2 + hash(q.id, 49, 720) * 1.6;
      q.fete = { at: mp.at, spot: [c[0] + Math.cos(a) * rr, c[1] + Math.sin(a) * rr], face: c, lag: hash(q.id, 50, 720) * 120 };
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
    cast.forEach(([job, sex, age, dx, dy], i) => {
      const h = (j: number) => hash(k0, i, 1430 + j);
      people.push({
        id: -(5e6 + (s.x * 1024 + s.y) * 8 + i), seed: s, first: pick(sex === "f" ? F : M, h(0)), last: "", sex, age, job,
        home: from, work: null, workIndoor: false, speed: age < 14 ? 0.3 : 0.22,
        looks: { skin: h(1), hair: age >= 65 ? -1 : h(2), shirt: h(3), pants: h(4), hat: job !== "priest", stick: gn.event === "pilgrims" || job === "healer" },
        haul: null, role: "guest",
        guest: { at: gn.at + i * 4000, until: gn.until, from, spot: [fc[0] + 1.1 + dx, fc[1] + 0.4 + dy], face: fc, event: gn.event },
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
    people.push({
      id: -(s.x * 1024 + s.y) - 1, seed: s, first, last, sex, age: 46 + Math.floor(h(3) * 14), job: "mayor",
      home: hall ?? homes[0] ?? [s.x + 1, s.y + 1], work: hall ? (front(hall) ?? meet) : meet, workIndoor: false, speed: 0.2,
      looks: { skin: h(4), hair: h(5), shirt: 0.99, pants: h(6), hat: true, stick: false }, haul: null, role: "mayor",
    });
  }
  assignHauls(people, byKind, sites, front, well, tradePartners(s, seeds, now).flatMap((q) => q.buy));
  for (const q of people) if (q.guest) q.haul = null;
  return { seed: s, people, well, meet, meets, plays, school, play, x0, y0, x1, y1, routes: new Map(), now, freeC: new Map(), costC: new Map(), doors: new Map(), weddings, church, maypole, cows };
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
  weddingTimes(s, now).forEach((at, k) => {
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
      out.push({ at, a: g, b, alliance });
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
      out.push({ at, a: m, b: f, alliance });
      return;
    }
  });
  return out;
}

/** Days a sickness lasts; each household rolls once per such window. */
export const SICK_DAYS = 3;
/** Chance a household has a sick member in a window: lower with a healer, none during wedding joy. */
export function sickRate(s: Seed, now: number): number {
  if (weddingJoy(s, now)) return 0;
  return s.bought?.some((b) => (b.item === "healer" || b.item === "infirmary") && b.at <= now) ? 0.02 : 0.06;
}
/** Does the household at home key `hh` (x*1024+y) nurse a sick member right now? Pure in seed, home and time. */
export const sickHome = (s: Seed, hh: number, now: number) => hash(hh, Math.floor(now / (SICK_DAYS * 864e5)), 1301) < sickRate(s, now);
const hhTile = (hh: number): Tile => [Math.floor(hh / 1024), hh % 1024];
/** Mark the sick villager of each affected home and the housemate who stays in to care for them. */
function falls(s: Seed, people: Person[], now: number) {
  const homes = new Map<number, Person[]>();
  for (const p of people) { if (p.role === "mayor") continue; const k = p.home[0] * 1024 + p.home[1]; (homes.get(k) ?? homes.set(k, []).get(k)!).push(p); }
  for (const [k, ms] of homes) {
    if (ms.length < 2 || !sickHome(s, k, now)) continue;
    const w = Math.floor(now / (SICK_DAYS * 864e5));
    const ill = ms[Math.floor(hash(k, w, 1302) * ms.length)]!;
    const by = ms.filter((q) => q !== ill && q.age >= 16);
    if (!by.length) continue;
    const cr = by.find((q) => q.id === ill.spouse) ?? by.find((q) => q.role === "head" || q.role === "spouse") ?? by[0]!;
    ill.sick = true; cr.carer = ill.id;
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
  if (li < 0) return null;
  let tile: Tile | null = null;
  for (const [k, list] of landmarkSpots(s)) if (list.includes(li) && !list.some((j) => j !== li && LANDMARKS[j]!.at > LANDMARKS[li]!.at && LANDMARKS[j]!.at - 96 <= a1)) { const [dx, dy] = k.split(",").map(Number); tile = [s.x + dx!, s.y + dy!]; break; }
  if (!tile) return null;
  let lo = now - FETE_WIN, hi = now;
  for (let n = 0; n < 16; n++) { const m = (lo + hi) / 2; if (effAge(s, seeds, m) >= LANDMARKS[li]!.at) hi = m; else lo = m; }
  return { at: hi, tile, kind: LANDMARKS[li]!.kind };
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
    return { ...base, x: f.spot[0] + (dx / m) * swing, y: f.spot[1] + (dy / m) * swing, visible: freeAt(t, f.spot[0], f.spot[1], seeds), walking: false, act, bucket, dir: [dx / m, dy / m] };
  }
  return null;
}

function guestPose(p: Person, t: Town, seeds: Seed[], now: number, base: Pose): Pose {
  const g = p.guest!;
  if (now < g.at || now >= g.until) return { ...base, visible: false };
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
    if (p.job === "woodcutter") {
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
export function resourceSpots(s: Seed, r: number): [Tile | null, Tile | null] {
  const R = Math.ceil(r + 10), key = `${s.id}:${s.x}:${s.y}:${R}`;
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
  const ok = st ? WALK.has(st.kind) || (FLAT.has(st.kind) && st.kind !== "hay") : buildable(terrain(x, y));
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
const spot = (p: Person, t: Town, i: number): Tile => add(t.meets[Math.floor(hash(p.id, i, 605) * t.meets.length)]!, off(p, i, 0.42));

/** Jobs that carry on on Sundays (bread, inn, herds, the sick, the service itself). */
const SUNDAY_WORK: ReadonlySet<Job> = new Set(["baker", "innkeeper", "priest", "healer", "mayor"] as Job[]);
export function planOf(p: Person, t: Town): Entry[] {
  const j = (i: number) => (hash(p.id, i, 700) - 0.5) * 0.8; // ± 24 min jitter
  const H = p.home;
  const E = (at: number, act: Activity, place: Tile, indoor: boolean): Entry => ({ at, act, place, indoor });
  if (p.sick) return [E(0, "sick", H, true)];
  if (p.carer != null) return [E(0, "sleep", H, true), E(7, "care", H, true), E(22, "sleep", H, true)];
  if (isSunday(t.now) && !SUNDAY_WORK.has(p.job) && !(p.job === "child" && p.age < 4)) return sundayOf(p, t, E, j);
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
  const W = p.work ?? H;
  const wp: Tile = p.workIndoor ? W : add(W, off(p, 3, 0.3));
  const early = hasTrait(p.id, "early") ? -0.8 : hasTrait(p.id, "owl") ? 0.5 : 0;
  const late = hasTrait(p.id, "owl") ? 1.1 : hasTrait(p.id, "early") ? -0.6 : 0;
  const out = hasTrait(p.id, "sociable") ? 0.75 : hasTrait(p.id, "homebody") ? 0.15 : 0.4;
  return [
    E(0, "sleep", H, true),
    E(6.5 + early + j(1), "work", wp, p.workIndoor),
    hash(p.id, 4, 607) < 0.4 ? E(12 + j(2) * 0.3, "lunch", hash(p.id, 4, 606) < 0.5 ? ring(p, 4, t.well) : spot(p, t, 4), false) : E(12 + j(2) * 0.3, "work", wp, p.workIndoor),
    E(13 + j(3) * 0.3, "work", wp, p.workIndoor),
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
  return [
    E(0, "sleep", H, true), E(wake + j(2) * 0.3, "home", H, true), service,
    E(11.2 + j(4) * 0.4, "home", H, true), pm,
    E((nature ? 18.6 : 17.4) + j(5), "home", H, true),
    E((p.job === "child" ? 20 : 21.8) + j(6), "sleep", H, true),
  ];
}

export const hourOf = (now: number) => worldHour(now);

const STRIDE = 0.18 / (2 * Math.PI); // 0.18 tiles per full gait cycle (two steps), phase in radians
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
export const ORDER_SPEED = 0.55;
/** Seconds the mayor waits at the goal before returning to the daily routine. */
export const ORDER_IDLE = 50;
type Order = { id: number; sid: string; from: Tile; to: Tile; at: number; v: number };
/** Stroll mode: tap orders don't expire and use the brisk stroll pace. Local-only. */
let hold = false;
export const setStrollHold = (on: boolean) => { hold = on; };
/** Where the player's steered mayor is (or heads), so the renderer never culls him. */
export function steeredMayor(): { sid: string; x: number; y: number } | null {
  if (drive) return { sid: drive.sid, x: drive.x, y: drive.y };
  return order ? { sid: order.sid, x: order.to[0], y: order.to[1] } : null;
}
let order: Order | null = null;
/** Local-only steering of the player's own figure; never stored, other clients keep seeing the routine. */
export function commandMayor(p: Person, t: Town, seeds: Seed[], now: number, to: Tile): boolean {
  const g: Tile = [Math.round(to[0]), Math.round(to[1])];
  if (p.role !== "mayor" || !free(t, g[0], g[1], seeds)) return false;
  const q = poseOf(p, t, seeds, now);
  const from: Tile = q.visible ? [q.x, q.y] : doorOf(t, p.home, seeds);
  order = { id: p.id, sid: p.seed.id, from, to: g, at: now, v: hold ? DRIVE_SPEED : ORDER_SPEED }; drive = null;
  return true;
}
/** Current goal of the steered mayor, or null when idle (for the marker). */
export function mayorGoal(now: number): Tile | null {
  if (!order) return null;
  return now - order.at < 600000 ? order.to : null;
}
export const clearMayorOrder = () => { order = null; drive = null; };
/** Walking pace when the player steers the mayor directly (tiles/s). */
export const DRIVE_SPEED = 1.6;
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
  const s = (DRIVE_SPEED * Math.min(dt, 0.1)) / len, nx = drive.x + dx * s, ny = drive.y + dy * s;
  const ok = (x: number, y: number) => x >= 1 && y >= 1 && x < MAP - 1 && y < MAP - 1 && freeAt(t, x, y, seeds);
  if (ok(nx, ny)) { drive.x = nx; drive.y = ny; }
  else if (ok(nx, drive.y)) drive.x = nx;
  else if (ok(drive.x, ny)) drive.y = ny;
  drive.moving = true; drive.dist += DRIVE_SPEED * Math.min(dt, 0.1);
  drive.dir = [dx / len, dy / len];
}
export const stopDrive = () => { drive = null; };
function orderPose(p: Person, t: Town, seeds: Seed[], now: number, base: Pose): Pose | null {
  const dv = drive;
  if (dv && dv.id === p.id) return { ...base, x: dv.x, y: dv.y, dir: dv.dir, visible: true, walking: dv.moving, act: "stroll", phase: dv.dist / STRIDE, working: false };
  const o = order;
  if (!o || o.id !== p.id) return null;
  const a: Tile = [Math.round(o.from[0]), Math.round(o.from[1])];
  const pts = [o.from, ...route(t, a, o.to, seeds).slice(1, -1), o.to];
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
