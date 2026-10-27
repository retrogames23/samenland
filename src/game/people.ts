// Villagers: a pure, deterministic function of the seed, its buildings and the clock.
// Nothing is stored — every client computes the same people at the same spot.
import { hash, vnoise, structureAt, effAge, radiusOf, terrain, buildable, FLAT, type Seed, type Kind } from "./world";

export type Sex = "f" | "m";
export type Job =
  | "farmer" | "baker" | "smith" | "innkeeper" | "miller" | "crafter" | "worker"
  | "sawyer" | "merchant" | "priest" | "carter" | "homemaker" | "retired" | "child";
export type Activity = "sleep" | "work" | "lunch" | "leisure" | "home" | "school" | "play";
type Tile = [number, number];
export type Person = {
  id: number; seed: Seed; first: string; last: string; sex: Sex; age: number; job: Job;
  home: Tile; work: Tile | null; workIndoor: boolean; speed: number;
  looks: { skin: number; hair: number; shirt: number; pants: number; hat: boolean; stick: boolean };
};
export type Pose = {
  p: Person; x: number; y: number; visible: boolean; walking: boolean;
  dir: [number, number]; phase: number; act: Activity; working: boolean;
  talk: number | null; talkTurn: boolean;
};

const F = ["Greta", "Ida", "Frieda", "Lotte", "Marie", "Anna", "Clara", "Hedwig", "Emma", "Rosa", "Lina", "Mathilda", "Elsa", "Paula", "Wilma", "Martha", "Johanna", "Thea", "Ella", "Luise"];
const M = ["Otto", "Karl", "Emil", "Fritz", "Hans", "Paul", "Anton", "Jakob", "Franz", "Ludwig", "Willi", "Bruno", "Gustav", "Oskar", "Theo", "Konrad", "Max", "Albert", "Heinrich", "Leo"];
const S = ["Hollmann", "Brandt", "Weber", "Müller", "Becker", "Lindner", "Kraus", "Vogt", "Seidel", "Hartmann", "Ebert", "Moosbauer", "Winter", "Sommer", "Fink", "Haas", "Kessler", "Roth", "Albers", "Pfeiffer", "Graf", "Kühn"];
const pick = <T,>(a: readonly T[], h: number) => a[Math.floor(h * a.length) % a.length]!;

const HOMES: Partial<Record<Kind, [number, number]>> = { farmhouse: [2, 4], cottage: [2, 3], townhouse: [2, 4], inn: [2, 2], bakery: [2, 2] };
const SLOTS: Partial<Record<Kind, [Job, number]>> = {
  bakery: ["baker", 2], smithy: ["smith", 2], inn: ["innkeeper", 2], mill: ["miller", 1], workshop: ["crafter", 2],
  factory: ["worker", 6], sawmill: ["sawyer", 3], market: ["merchant", 2], church: ["priest", 1], warehouse: ["carter", 2],
};
const OUTDOOR_WORK: ReadonlySet<Job> = new Set(["farmer", "merchant", "carter"]);
const WALK: ReadonlySet<Kind> = new Set(["path", "street", "square", "well", "market", "road", "bridge"]);

export type Town = {
  seed: Seed; people: Person[]; well: Tile; meet: Tile; meets: Tile[]; plays: Tile[]; school: Tile | null; play: Tile;
  x0: number; y0: number; x1: number; y1: number; routes: Map<string, Tile[]>; now: number;
  freeC: Map<number, boolean>; doors: Map<number, Tile>;
};

const towns = new Map<string, Town>();
export function townOf(s: Seed, seeds: Seed[], now: number): Town {
  const key = `${s.id}|${Math.floor(now / 60000)}|${seeds.length}`;
  const hit = towns.get(key);
  if (hit) return hit;
  for (const k of towns.keys()) if (k.startsWith(s.id + "|")) towns.delete(k);
  const t = buildTown(s, seeds, now);
  towns.set(key, t);
  return t;
}

function buildTown(s: Seed, seeds: Seed[], now: number): Town {
  const r = radiusOf(effAge(s, seeds, now));
  const x0 = Math.floor(s.x - r - 2), x1 = Math.ceil(s.x + r + 2), y0 = Math.floor(s.y - r - 2), y1 = Math.ceil(s.y + r + 2);
  const byKind = new Map<Kind, Tile[]>();
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const st = structureAt(x, y, seeds, now);
    if (!st || st.seed.id !== s.id) continue;
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
  const front = (tl: Tile): Tile | null => { for (const [dx, dy] of [[1, 0], [0, 1], [-1, 0], [0, -1]] as const) if (open(tl[0] + dx, tl[1] + dy)) return [tl[0] + dx, tl[1] + dy]; return null; };
  const meets: Tile[] = [];
  for (const k of ["inn", "church", "bakery"] as Kind[]) for (const tl of byKind.get(k) ?? []) { const f = front(tl); if (f) meets.push(f); }
  meets.push(...(byKind.get("market") ?? []), ...(byKind.get("square") ?? []).slice(0, 6));
  if (!meets.length) meets.push([s.x + 1, s.y + 1]);
  const school = byKind.get("church")?.[0] ?? null;
  const meet = meets[0]!;
  const plays: Tile[] = [...(byKind.get("pasture") ?? []), ...(byKind.get("square") ?? [])].slice(0, 8);
  if (!plays.length) plays.push([s.x + 1, s.y - 2]);
  const play = plays[0]!;

  const slots: { job: Job; at: Tile }[] = [];
  for (const [k, sl] of Object.entries(SLOTS) as [Kind, [Job, number]][])
    for (const at of byKind.get(k) ?? []) for (let i = 0; i < sl[1]; i++) slots.push({ job: sl[0], at });
  slots.sort((a, b) => hash(a.at[0] * 7 + a.job.length, a.at[1], 501) - hash(b.at[0] * 7 + b.job.length, b.at[1], 501));

  const homes: Tile[] = [];
  for (const k of Object.keys(HOMES) as Kind[]) homes.push(...(byKind.get(k) ?? []));
  homes.sort((a, b) => Math.hypot(a[0] - s.x, a[1] - s.y) - Math.hypot(b[0] - s.x, b[1] - s.y) || a[0] - b[0] || a[1] - b[1]);

  const people: Person[] = [];
  const created = Date.parse(s.created_at);
  for (const home of homes) {
    const kind = structureAt(home[0], home[1], seeds, now)!.kind;
    const [lo, hi] = HOMES[kind]!;
    const hh = (i: number) => hash(home[0], home[1], 400 + i);
    const size = lo + Math.floor(hh(0) * (hi - lo + 1));
    const last = pick(S, hh(1));
    const pa = 24 + Math.floor(hh(2) * 30);
    const yrs = (now - created) / 3.15576e10;
    for (let m = 0; m < size; m++) {
      const id = (home[0] * 1024 + home[1]) * 8 + m;
      const h = (i: number) => hash(id, 77, i);
      let age: number, sex: Sex;
      if (m === 0) { age = pa; sex = h(1) < 0.5 ? "f" : "m"; }
      else if (m === 1 && h(9) < 0.85) { age = Math.max(20, pa + Math.floor((h(2) - 0.5) * 8)); sex = people[people.length - 1]!.sex === "f" ? "m" : "f"; }
      else if (m === size - 1 && size >= 4 && h(3) < 0.4) { age = Math.max(pa + 22, 64 + Math.floor(h(2) * 20)); sex = h(1) < 0.55 ? "f" : "m"; }
      else { age = Math.max(1, Math.min(pa - 19, 1 + Math.floor(h(2) * 14))); sex = h(1) < 0.5 ? "f" : "m"; }
      age += Math.floor(yrs);
      let job: Job = "child", work: Tile | null = null;
      if (age >= 66) job = "retired";
      else if (age >= 16) {
        const slot = h(5) < 0.82 ? slots.shift() : undefined;
        if (slot) { job = slot.job; work = slot.at; }
        else if (byKind.get("field")?.length && h(6) < 0.8) { job = "farmer"; work = near(byKind.get("field"), home, h(7)); }
        else { job = "homemaker"; work = near(byKind.get("garden"), home, h(7)) ?? home; }
        if (job === "merchant" || job === "carter") work = [work![0], work![1]];
      }
      const kid = age < 14, old = age >= 65;
      people.push({
        id, seed: s, first: pick(sex === "f" ? F : M, h(10)), last, sex, age, job, home, work,
        workIndoor: !OUTDOOR_WORK.has(job) && job !== "homemaker",
        speed: (kid ? 0.8 : old ? 0.36 : 0.55) * (0.85 + h(11) * 0.3),
        looks: { skin: h(12), hair: old ? -1 : h(13), shirt: h(14), pants: h(15), hat: h(16) < (job === "farmer" ? 0.7 : 0.25), stick: old && h(17) < 0.6 },
      });
    }
  }
  return { seed: s, people, well, meet, meets, plays, school, play, x0, y0, x1, y1, routes: new Map(), now, freeC: new Map(), doors: new Map() };
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
    if (!free(t, x, y, seeds)) return buildable(terrain(x, y)) ? 40 : Infinity;
    const st = structureAt(x, y, seeds, t.now);
    if (st && WALK.has(st.kind)) return 1;
    if (st && !FLAT.has(st.kind) && st.kind !== "hay") return 40; // through a building only as a last resort – hidden there (back door / courtyard)
    if (!buildable(terrain(x, y))) return Infinity;
    return 2.4;
  };
  const dist = new Float32Array(W * H).fill(Infinity), prev = new Int32Array(W * H).fill(-1);
  const heap: [number, number][] = [];
  const push = (d: number, i: number) => { heap.push([d, i]); let k = heap.length - 1; while (k > 0) { const p = (k - 1) >> 1; if (heap[p]![0] <= heap[k]![0]) break; [heap[p], heap[k]] = [heap[k]!, heap[p]!]; k = p; } };
  const pop = () => { const top = heap[0]!; const last = heap.pop()!; if (heap.length) { heap[0] = last; let k = 0; for (;;) { const l = k * 2 + 1, r = l + 1; let m = k; if (l < heap.length && heap[l]![0] < heap[m]![0]) m = l; if (r < heap.length && heap[r]![0] < heap[m]![0]) m = r; if (m === k) break; [heap[m], heap[k]] = [heap[k]!, heap[m]!]; k = m; } } return top; };
  let out: Tile[] = [a, b];
  if (inside(a[0], a[1]) && inside(b[0], b[1])) {
    const si = idx(a[0], a[1]), gi = idx(b[0], b[1]);
    dist[si] = 0; push(0, si);
    while (heap.length) {
      const [d, i] = pop();
      if (i === gi) break;
      if (d > dist[i]!) continue;
      const x = t.x0 + (i % W), y = t.y0 + Math.floor(i / W);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
        const nx = x + dx, ny = y + dy;
        if (!inside(nx, ny)) continue;
        const c = cost(nx, ny);
        if (c === Infinity) continue;
        const ni = idx(nx, ny), nd = d + c;
        if (nd < dist[ni]!) { dist[ni] = nd; prev[ni] = i; push(nd, ni); }
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
const spot = (p: Person, t: Town, i: number): Tile => add(t.meets[Math.floor(hash(p.id, i, 605) * t.meets.length)]!, off(p, i, 0.42));

export function planOf(p: Person, t: Town): Entry[] {
  const j = (i: number) => (hash(p.id, i, 700) - 0.5) * 0.8; // ± 24 min jitter
  const H = p.home;
  const E = (at: number, act: Activity, place: Tile, indoor: boolean): Entry => ({ at, act, place, indoor });
  if (p.job === "child") {
    if (p.age < 4) return [E(0, "sleep", H, true), E(10 + j(1), "play", add(H, [0.6, 0.6]), false), E(12 + j(2), "home", H, true), E(15.5 + j(3), "play", add(H, [0.6, 0.6]), false), E(18 + j(4), "home", H, true), E(19.5, "sleep", H, true)];
    const school = p.age >= 6 && t.school;
    return [
      E(0, "sleep", H, true),
      E(7.6 + j(1) * 0.3, school ? "school" : "play", school ? t.school! : add(t.plays[Math.floor(hash(p.home[0], p.home[1], 608) * t.plays.length)]!, off(p, 1, 0.5)), !!school),
      E(12.8 + j(2) * 0.3, "home", H, true),
      E(14.3 + j(3), "play", add(t.plays[Math.floor(hash(p.home[0], p.home[1], 609) * t.plays.length)]!, off(p, 2, 0.5)), false),
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
  return [
    E(0, "sleep", H, true),
    E(6.5 + j(1), "work", wp, p.workIndoor),
    hash(p.id, 4, 607) < 0.4 ? E(12 + j(2) * 0.3, "lunch", hash(p.id, 4, 606) < 0.5 ? ring(p, 4, t.well) : spot(p, t, 4), false) : E(12 + j(2) * 0.3, "work", wp, p.workIndoor),
    E(13 + j(3) * 0.3, "work", wp, p.workIndoor),
    hash(p.id, 5, 607) < 0.4 ? E(17.2 + j(4), "leisure", spot(p, t, 5), false) : E(17.2 + j(4), "home", H, true),
    E(19.6 + j(5), "home", H, true),
    E(21.8 + j(6), "sleep", H, true),
  ];
}

export const hourOf = (now: number) => { const d = new Date(now); return d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600 + d.getMilliseconds() / 3.6e6; };

export function poseOf(p: Person, t: Town, seeds: Seed[], now: number): Pose {
  const hr = hourOf(now);
  const pl = planOf(p, t);
  let i = pl.length - 1;
  while (i > 0 && pl[i]!.at > hr) i--;
  const e = pl[i]!, prev = pl[(i - 1 + pl.length) % pl.length]!;
  const base: Pose = { p, x: e.place[0], y: e.place[1], visible: !e.indoor, walking: false, dir: [0, 1], phase: 0, act: e.act, working: false, talk: null, talkTurn: false };
  const secs = (hr - e.at) * 3600;
  // indoor places are entered through their door; outdoor spots on a roof/rock move to the nearest open tile
  const at = (en: Entry): Tile => en.indoor || !freeAt(t, en.place[0], en.place[1], seeds) ? doorOf(t, en.place, seeds) : en.place;
  const pa = at(prev), pb = at(e);
  const ra: Tile = [Math.round(pa[0]), Math.round(pa[1])], rb: Tile = [Math.round(pb[0]), Math.round(pb[1])];
  if (ra[0] !== rb[0] || ra[1] !== rb[1] || pa[0] !== pb[0] || pa[1] !== pb[1]) {
    const pts = [pa, ...route(t, ra, rb, seeds).slice(1, -1), pb];
    let len = 0; const seg: number[] = [];
    for (let k = 1; k < pts.length; k++) { const d = Math.hypot(pts[k]![0] - pts[k - 1]![0], pts[k]![1] - pts[k - 1]![1]); seg.push(d); len += d; }
    let dd = secs * p.speed;
    if (dd < len) {
      for (let k = 0; k < seg.length; k++) {
        if (dd <= seg[k]! || k === seg.length - 1) {
          const a = pts[k]!, b = pts[k + 1]!, u = seg[k]! ? dd / seg[k]! : 0;
          const dl = seg[k]! || 1;
          const x = a[0] + (b[0] - a[0]) * u, y = a[1] + (b[1] - a[1]) * u;
          return { ...base, x, y, visible: freeAt(t, x, y, seeds), walking: true, dir: [(b[0] - a[0]) / dl, (b[1] - a[1]) / dl], phase: (secs * p.speed) / 0.32 };
        }
        dd -= seg[k]!;
      }
    }
  }
  if (e.indoor) return base;
  const tt = now / 1000;
  const c0 = pb;
  base.x = c0[0]; base.y = c0[1];
  if (e.act === "play") {
    // children run little loops – shrunk until the whole loop stays on open ground
    let r = 0.5 + hash(p.id, 1, 810) * 0.4;
    const w = 0.35 * (hash(p.id, 2, 810) < 0.5 ? 1 : -1), a = tt * w + p.id;
    while (r > 0.05 && ![0, 1.57, 3.14, 4.71].every((q) => freeAt(t, c0[0] + Math.cos(q) * r, c0[1] + Math.sin(q) * r, seeds))) r -= 0.15;
    if (r <= 0.05) return { ...base, dir: [1, 0.3] };
    return { ...base, x: c0[0] + Math.cos(a) * r, y: c0[1] + Math.sin(a) * r, walking: true, dir: [-Math.sin(a) * Math.sign(w), Math.cos(a) * Math.sign(w)], phase: tt * 0.8 / 0.32 * Math.abs(w) * 1.6 };
  }
  const wx = (vnoise(tt / 40, p.id % 997, 811) - 0.5) * 0.25, wy = (vnoise(tt / 40, p.id % 991, 812) - 0.5) * 0.25;
  const face = hash(p.id, Math.floor(tt / 30), 813) < 0.5 ? 1 : -1;
  const ok = freeAt(t, c0[0] + wx, c0[1] + wy, seeds);
  return { ...base, x: c0[0] + (ok ? wx : 0), y: c0[1] + (ok ? wy : 0), dir: [face, 0.3], working: e.act === "work" };
}

/** All visible villagers of a town right now, with conversations paired deterministically. */
export function townPoses(s: Seed, seeds: Seed[], now: number): Pose[] {
  const t = townOf(s, seeds, now);
  const out = t.people.map((p) => poseOf(p, t, seeds, now)).filter((q) => q.visible);
  const slot = Math.floor(now / 180000); // conversations change every 3 minutes
  const idle = out.filter((q) => !q.walking && (q.act === "leisure" || q.act === "lunch"));
  idle.sort((a, b) => hash(a.p.id, slot, 900) - hash(b.p.id, slot, 900));
  for (let k = 0; k + 1 < idle.length; k += 2) {
    const a = idle[k]!, b = idle[k + 1]!;
    if (Math.hypot(a.x - b.x, a.y - b.y) > 1.6 || hash(a.p.id, slot, 901) > 0.75) continue;
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    if (!freeAt(t, mx, my, seeds)) continue;
    a.x = mx - 0.22; a.y = my; b.x = mx + 0.22; b.y = my;
    a.dir = [1, -1]; b.dir = [-1, 1];
    const icon = Math.floor(hash(a.p.id, slot, 902) * 6);
    a.talk = icon; b.talk = Math.floor(hash(b.p.id, slot, 903) * 6);
    const turn = Math.floor(now / 2600) % 2 === 0;
    a.talkTurn = turn; b.talkTurn = !turn;
  }
  return out;
}
