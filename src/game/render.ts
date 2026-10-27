import { worldHour } from "./time";
import { houseLit, candleFlicker } from "./night";
import { setArtTime } from "./season-art";
import { seasonKey } from "./season";
import { drawBuildingSprite, drawBuildingNight, hasNightSprite, spriteBox, setSpriteTime } from "./building-sprites";
import { texture, drawNature, texSample, allTexturesReady, natureReady, setNatureTime, boatImage, sheepImage, cartImage, planksPattern, type Tex } from "./nature-sprites";
import { townPoses, type Pose } from "./people";
import { hash, vnoise, structureAt, terrain, resourceAt, isWater, MAP, FLAT, links, roadProgress, isTwin, railReady, acreOf, ageHours, effAge, radiusOf, isBlessed, signTile, type Signpost, type Planting, type Seed, type Structure, type Kind } from "./world";

export const TW = 32, TH = 16;
export const iso = (x: number, y: number) => [(x - y) * (TW / 2), (x + y) * (TH / 2)] as const;
export const toTile = (ix: number, iy: number) => {
  const a = ix / (TW / 2), b = iy / (TH / 2);
  return [Math.round((a + b) / 2), Math.round((b - a) / 2)] as const;
};
export type Camera = { x: number; y: number; zoom: number };
type C = CanvasRenderingContext2D;
type Pt = [number, number];

const INK = "rgba(34,26,18,0.72)";
const TEX_OF: Record<string, Tex> = { deep: "water", water: "water", sand: "sand", grass: "grass", meadow: "meadow", forest: "forest", hill: "grass", fertile: "fertile", mountain: "rock" };
const TERRAIN: Record<string, [number, number, number]> = {
  deep: [205, 38, 62], water: [198, 40, 70], sand: [42, 52, 80], grass: [88, 30, 66],
  meadow: [76, 36, 70], forest: [100, 24, 58], hill: [70, 22, 62],
  fertile: [72, 38, 54], mountain: [30, 10, 60],
};
const hsl = (h: number, s: number, l: number, a = 1) => `hsla(${h} ${s}% ${l}% / ${a})`;

// ---------- hand-drawn helpers ----------
function jit(p: Pt, sd: number, i: number, amt = 0.08): Pt {
  return [p[0] + (hash(sd, i, 71) - 0.5) * amt, p[1] + (hash(sd, i, 72) - 0.5) * amt];
}
function shape(c: C, pts: Pt[], sd: number, fill: string | null, ink = true, close = true) {
  c.beginPath();
  pts.forEach((p, i) => { const q = jit(p, sd, i); if (i) c.lineTo(q[0], q[1]); else c.moveTo(q[0], q[1]); });
  if (close) c.closePath();
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (ink) { c.strokeStyle = INK; c.lineWidth = 0.55; c.lineJoin = "round"; c.lineCap = "round"; c.stroke(); }
}
function line(c: C, a: Pt, b: Pt, sd: number, w = 0.45, col = INK) {
  const p = jit(a, sd, 1, 0.3), q = jit(b, sd, 2, 0.3);
  c.beginPath(); c.moveTo(p[0], p[1]); c.quadraticCurveTo((p[0] + q[0]) / 2 + (hash(sd, 3, 7) - 0.5) * 0.6, (p[1] + q[1]) / 2, q[0], q[1]);
  c.strokeStyle = col; c.lineWidth = w; c.stroke();
}
function blob(c: C, x: number, y: number, r: number, fill: string, sd: number, ink = true) {
  c.beginPath();
  const n = 9;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2, rr = r * (0.88 + hash(sd, i % n, 81) * 0.24);
    const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr * 0.8;
    if (i) c.lineTo(px, py); else c.moveTo(px, py);
  }
  c.closePath(); c.fillStyle = fill; c.fill();
  if (ink) { c.strokeStyle = INK; c.lineWidth = 0.5; c.stroke(); }
}

// point inside tile at (u,v) in tile units (−0.5..0.5) with height h px
const P = (cx: number, cy: number) => (u: number, v: number, h = 0): Pt => [cx + (u - v) * (TW / 2), cy + (u + v) * (TH / 2) - h];

type Pal = { wall: string; wallD: string; roof: string; roofD: string };
function gable(c: C, cx: number, cy: number, a: number, b: number, H: number, R: number, ridgeX: boolean, pal: Pal, sd: number) {
  const base = P(cx, cy);
  const p = (u: number, v: number, h = 0) => (ridgeX ? base(u, v, h) : base(v, u, h));
  const [A, B] = ridgeX ? [a, b] : [b, a];
  void A; void B;
  const oa = a * 1.08, ob = b * 1.15;
  shape(c, [p(-oa, -ob, H - 1), p(oa, -ob, H - 1), p(oa, 0, H + R), p(-oa, 0, H + R)], sd + 1, pal.roofD);
  shape(c, [p(a, -b, 0), p(a, b, 0), p(a, b, H), p(a, 0, H + R), p(a, -b, H)], sd + 2, ridgeX ? pal.wallD : pal.wall);
  shape(c, [p(-a, b, 0), p(a, b, 0), p(a, b, H), p(-a, b, H)], sd + 3, ridgeX ? pal.wall : pal.wallD);
  shape(c, [p(-oa, ob, H - 1), p(oa, ob, H - 1), p(oa, 0, H + R), p(-oa, 0, H + R)], sd + 4, pal.roof);
  // roof hatching
  c.globalAlpha = 0.45;
  const n = Math.max(3, Math.round(a * 14));
  for (let i = 1; i < n; i++) { const u = -oa + (2 * oa * i) / n; line(c, p(u, ob * 0.92, H - 0.6), p(u, 0.03, H + R - 0.4), sd + 10 + i, 0.35); }
  c.globalAlpha = 1;
  return p;
}
function box(c: C, cx: number, cy: number, a: number, b: number, H: number, wall: string, wallD: string, top: string, sd: number) {
  const p = P(cx, cy);
  shape(c, [p(a, -b, 0), p(a, b, 0), p(a, b, H), p(a, -b, H)], sd + 2, wallD);
  shape(c, [p(-a, b, 0), p(a, b, 0), p(a, b, H), p(-a, b, H)], sd + 3, wall);
  shape(c, [p(-a, -b, H), p(a, -b, H), p(a, b, H), p(-a, b, H)], sd + 4, top);
  return p;
}
function windowV(c: C, p: ReturnType<typeof P>, u: number, v: number, h: number, sd: number, lights: Light[], w = 0.05, hh = 2.2) {
  shape(c, [p(u - w, v, h), p(u + w, v, h), p(u + w, v, h + hh), p(u - w, v, h + hh)], sd, "#3e4a52");
  const q = p(u, v, h + hh / 2); lights.push({ x: q[0], y: q[1], r: 3 });
}
function doorV(c: C, p: ReturnType<typeof P>, u: number, v: number, sd: number, w = 0.06, hh = 3.4, col = "#6b4a32") {
  shape(c, [p(u - w, v, 0), p(u + w, v, 0), p(u + w, v, hh), p(u - w, v, hh)], sd, col);
}

function tree(c: C, x: number, y: number, s: number, t: number, v: number, sd: number, conifer = 0.5) {
  const sway = Math.sin(t / 1300 + v * 10) * 0.6;
  const k = v < conifer ? "fir" : v > 0.82 ? "birch" : "oak";
  if (drawNature(c, k, x, y, s, sway, hash(sd, 5, 5) > 0.5)) return;
  blob(c, x, y - 7 * s, 4 * s, hsl(100, 30, 40), sd, false);
}
/** Soft drifting smoke haze: feathered puffs with no hard edge, fading as they rise. */
function smoke(c: C, x: number, y: number, t: number, sd: number, big = 1) {
  for (let i = 0; i < 5; i++) {
    const ph = (t / (3600 * big) + hash(sd, 1, 1) + i / 5) % 1;
    const px = x + ph * 6 * big + Math.sin(ph * 5 + sd) * 1.2, py = y - ph * 16 * big, r = (1.6 + ph * 4.5) * big;
    const a = 0.22 * Math.sin(Math.PI * Math.min(1, ph * 1.3));
    const g = c.createRadialGradient(px, py, 0, px, py, r);
    g.addColorStop(0, `rgba(214,210,202,${a})`); g.addColorStop(1, "rgba(214,210,202,0)");
    c.fillStyle = g; c.fillRect(px - r, py - r, r * 2, r * 2);
  }
}

/** win: a small window pane (rendered as a warm rectangle), otherwise an open flame/forge. */
export type Light = { x: number; y: number; r: number; building?: { kind: Kind; variant: number; seed: number } };

/** Local clock hour, cached per second (house lights depend on it). */
let hrCache = { at: 0, hr: 12 };
const localHour = () => { const n = Date.now(); if (n - hrCache.at > 1000) { const d = new Date(n); hrCache = { at: n, hr: worldHour(n) }; void d; } return hrCache.hr; };
/** Hovered / selected villager ids, set by the UI so the canvas can highlight them. */
export const peopleFocus: { hover: string | null; sel: string | null } = { hover: null, sel: null };

/** Small shaded sheep (~hip height of a villager). Walking adds a trotting bob and nod; standing grazes. */
function drawSheep(c: C, x: number, y: number, flip: boolean, t: number, walking: boolean, graze: boolean) {
  const im = sheepImage(graze && !walking); if (!im) return;
  const w = 5.2, h = (w * im.naturalHeight) / im.naturalWidth;
  const step = walking ? t / 1000 * Math.PI * 2 * 2.2 : 0;
  const bob = walking ? Math.abs(Math.sin(step)) * 0.35 : Math.sin(t / 1700) * 0.04;
  const tilt = walking ? Math.sin(step) * 0.05 : 0;
  c.fillStyle = "rgba(30,36,22,0.3)"; c.beginPath(); c.ellipse(x, y, 2.4 - bob, 0.8, 0, 0, 7); c.fill();
  c.save(); c.translate(x, y - bob); if (flip) c.scale(-1, 1); c.rotate(tilt);
  c.imageSmoothingEnabled = true; c.imageSmoothingQuality = "high";
  c.drawImage(im, -w / 2, -h * 0.95, w, h);
  c.restore();
}
/** Grazing rhythm: long stands at one tuft, then a short 2–3 s trot to the next. Pure clock function. */
function sheepAt(sd: number, k: number, t: number): { dx: number; dy: number; walking: boolean; flip: boolean; graze: boolean } {
  const CYC = 18000 + hash(sd, k, 5) * 14000, WALK_MS = 2200 + hash(sd, k, 6) * 900;
  const tt = t + hash(sd, k, 7) * CYC, i = Math.floor(tt / CYC), u = tt - i * CYC;
  const spot = (j: number): [number, number] => [(hash(sd, k * 31 + j, 8) - 0.5) * 10, (hash(sd, k * 31 + j, 9) - 0.5) * 4];
  const a = spot(i), b = spot(i + 1);
  const into = u - (CYC - WALK_MS);
  if (into > 0) {
    const f = into / WALK_MS, e = f * f * (3 - 2 * f);
    return { dx: a[0] + (b[0] - a[0]) * e, dy: a[1] + (b[1] - a[1]) * e, walking: true, flip: b[0] < a[0], graze: false };
  }
  const prev = spot(i - 1);
  // mostly head down; looks up briefly now and then
  const look = Math.sin(u / 2300 + k) > 0.82;
  return { dx: a[0], dy: a[1], walking: false, flip: a[0] < prev[0], graze: !look };
}

/** Weathered, half-buried boulder: rounded, lit from the top-left, settled into the ground. */
function rock(c: C, x: number, y: number, s: number, lit: string, mid: string, dark: string, glint: boolean) {
  c.fillStyle = "rgba(30,26,20,0.28)"; c.beginPath(); c.ellipse(x + 0.35 * s, y + 0.15 * s, 1.35 * s, 0.45 * s, 0, 0, 7); c.fill();
  const g = c.createRadialGradient(x - 0.45 * s, y - 0.75 * s, 0.1 * s, x, y - 0.3 * s, 1.4 * s);
  g.addColorStop(0, lit); g.addColorStop(0.55, mid); g.addColorStop(1, dark);
  c.fillStyle = g; c.beginPath();
  c.moveTo(x - 1.15 * s, y);
  c.bezierCurveTo(x - 1.2 * s, y - 0.6 * s, x - 0.5 * s, y - 1.05 * s, x + 0.1 * s, y - 0.95 * s);
  c.bezierCurveTo(x + 0.8 * s, y - 0.85 * s, x + 1.2 * s, y - 0.4 * s, x + 1.1 * s, y);
  c.bezierCurveTo(x + 0.7 * s, y + 0.3 * s, x - 0.7 * s, y + 0.3 * s, x - 1.15 * s, y);
  c.fill();
  c.strokeStyle = "rgba(25,20,16,0.35)"; c.lineWidth = 0.2; c.stroke();
  // grass creeping over the foot so it sits in the ground
  c.fillStyle = "rgba(70,88,40,0.45)"; c.beginPath(); c.ellipse(x, y + 0.12 * s, 1.15 * s, 0.22 * s, 0, 0, Math.PI); c.fill();
  if (glint) { c.fillStyle = "rgba(217,138,74,0.8)"; c.beginPath(); c.ellipse(x - 0.2 * s, y - 0.5 * s, 0.25 * s, 0.12 * s, -0.4, 0, 7); c.fill(); }
}
const roofHue = (s: Structure, slate = false) => slate ? [215, 12, 46] : [12 + s.v * 18 + (s.seed.hue % 20) - 10, 48, 50];


/** Construction site: staked plot with materials → rising walls in a timber scaffold → finished. */
function drawSite(c: C, s: Structure, cx: number, cy: number, t: number, detail: boolean) {
  const p = s.build ?? 1, sd = Math.floor(s.v * 9973);
  const box = spriteBox(s.kind, s.v);
  const w = Math.min(30, (box?.w ?? 24) * 0.75), hw = w / 2, hh = w / 4;
  // trodden, dug-up ground
  c.save();
  c.beginPath(); c.moveTo(cx, cy - hh); c.lineTo(cx + hw, cy); c.lineTo(cx, cy + hh); c.lineTo(cx - hw, cy); c.closePath();
  c.fillStyle = "rgba(112,86,58,0.55)"; c.fill();
  // foundation stones
  if (p > 0.15) {
    const f = Math.min(1, (p - 0.15) / 0.2), k = 0.78;
    c.beginPath(); c.moveTo(cx, cy - hh * k); c.lineTo(cx + hw * k, cy); c.lineTo(cx, cy + hh * k); c.lineTo(cx - hw * k, cy); c.closePath();
    c.strokeStyle = `rgba(150,140,125,${f})`; c.lineWidth = 1.6; c.stroke();
    c.strokeStyle = `rgba(60,52,44,${0.6 * f})`; c.lineWidth = 0.35; c.stroke();
  }
  // walls rise from the ground up
  if (p > 0.35 && box) {
    c.globalAlpha = 0.95;
    drawBuildingSprite(c, s.kind, cx, cy, s.v, Math.min(1, 0.12 + (p - 0.35) / 0.65 * 0.95));
    c.globalAlpha = 1;
  }
  c.restore();
  if (!detail) return;
  // scaffold poles and planks around the rising house
  if (p > 0.25 && p < 0.97) {
    const top = Math.min(box ? box.h * 0.8 : 18, 6 + p * (box ? box.h * 0.8 : 18));
    const posts: Pt[] = [[cx - hw * 0.85, cy], [cx, cy + hh * 0.85], [cx + hw * 0.85, cy], [cx, cy - hh * 0.85]];
    for (const [px, py] of posts) {
      c.strokeStyle = "#6e5236"; c.lineWidth = 0.7; c.beginPath(); c.moveTo(px, py); c.lineTo(px, py - top); c.stroke();
      c.strokeStyle = "rgba(25,16,8,0.6)"; c.lineWidth = 0.25; c.stroke();
    }
    for (let lv = 0.45; lv < 1; lv += 0.5) {
      c.strokeStyle = "#9a7a52"; c.lineWidth = 0.9; c.beginPath();
      c.moveTo(posts[0]![0], posts[0]![1] - top * lv); c.lineTo(posts[1]![0], posts[1]![1] - top * lv); c.lineTo(posts[2]![0], posts[2]![1] - top * lv); c.stroke();
      c.strokeStyle = "rgba(25,16,8,0.55)"; c.lineWidth = 0.25; c.stroke();
    }
    // diagonal brace
    c.strokeStyle = "#7d5f3f"; c.lineWidth = 0.45; c.beginPath(); c.moveTo(posts[0]![0], posts[0]![1]); c.lineTo(posts[1]![0], posts[1]![1] - top * 0.9); c.stroke();
  }
  // stakes and string while the plot is still being marked out
  if (p < 0.3) {
    for (const [px, py] of [[cx - hw, cy], [cx, cy + hh], [cx + hw, cy], [cx, cy - hh]] as Pt[]) {
      c.strokeStyle = "#7a5a3a"; c.lineWidth = 0.55; c.beginPath(); c.moveTo(px, py); c.lineTo(px, py - 2.6); c.stroke();
    }
    c.strokeStyle = "rgba(235,225,200,0.75)"; c.lineWidth = 0.2; c.beginPath();
    c.moveTo(cx - hw, cy - 2.2); c.lineTo(cx, cy + hh - 2.2); c.lineTo(cx + hw, cy - 2.2); c.lineTo(cx, cy - hh - 2.2); c.closePath(); c.stroke();
  }
  // material piles: timber stack and stone blocks, used up as the house grows
  const left = Math.max(0, 1 - p);
  const bx = cx + hw * 0.95, by = cy + hh * 0.55;
  const logs = Math.ceil(4 * left);
  for (let i = 0; i < logs; i++) {
    const ly = by - i * 0.85, lx = bx + (i % 2) * 0.4;
    c.strokeStyle = "#5a4028"; c.lineWidth = 1.05; c.beginPath(); c.moveTo(lx - 3, ly - 1.2); c.lineTo(lx + 2.6, ly + 1.2); c.stroke();
    c.strokeStyle = "#a07850"; c.lineWidth = 0.7; c.stroke();
    c.fillStyle = "#d8b98a"; c.beginPath(); c.arc(lx + 2.6, ly + 1.2, 0.42, 0, 7); c.fill();
  }
  const stones = Math.ceil(5 * left);
  for (let i = 0; i < stones; i++) {
    const sx = cx - hw * 0.95 + (i % 3) * 1.5 - 0.5, sy = cy + hh * 0.5 - Math.floor(i / 3) * 0.9 + (i % 3) * 0.4;
    c.fillStyle = hsl(30, 6, 62 + hash(sd, i, 1) * 10); c.fillRect(sx - 0.7, sy - 0.7, 1.4, 0.9);
    c.fillStyle = "rgba(40,32,24,0.45)"; c.fillRect(sx - 0.7, sy + 0.1, 1.4, 0.25);
  }
  // fresh sawdust / dust puff from hammering
  if (p > 0.25 && p < 0.97 && Math.sin(t / 300 + sd) > 0.7) {
    c.fillStyle = "rgba(210,190,150,0.35)"; c.beginPath(); c.ellipse(cx + Math.sin(sd) * hw * 0.4, cy - 4 - p * 6, 1.6, 0.8, 0, 0, 7); c.fill();
  }
}
function drawStructure(c: C, s: Structure, cx: number, cy: number, x: number, y: number, t: number, L: Light[]) {
  const sd = x * 1000 + y;
  if (SOUND_KINDS.has(s.kind) && lastSources.length < 200) lastSources.push({ x: cx, y: cy, k: s.build !== undefined ? "site" : s.kind });
  else if (s.build !== undefined && lastSources.length < 200) lastSources.push({ x: cx, y: cy, k: "site" });
  if (s.build !== undefined) { drawSite(c, s, cx, cy, t, true); return; }
  if (drawBuildingSprite(c, s.kind, cx, cy, s.v)) {
    if (s.kind === "campfire") {
      L.push({x:cx,y:cy-3,r:7}); smoke(c,cx,cy-6,t,sd,0.25);
    }
    if (hasNightSprite(s.kind) && houseLit(s.kind, sd, localHour())) {
      L.push({ x: cx, y: cy, r: 32, building: { kind: s.kind, variant: s.v, seed: sd } });
    }
    if (["factory", "manufactory", "steamworks", "smithy", "bakery", "inn"].includes(s.kind)) {
      smoke(c, cx + 4, cy - (s.kind === "factory" ? 24 : 18), t, sd, s.kind === "factory" ? 1.5 : 0.6);
    }
    return;
  }
  const v = s.v;
  if (s.kind === "pasture") {
      const p = P(cx, cy);
      c.globalAlpha = 0.85;
      line(c, p(-0.48, 0.48, 1.5), p(0.48, 0.48, 1.5), sd, 0.5, "#6b4a32");
      line(c, p(0.48, -0.48, 1.5), p(0.48, 0.48, 1.5), sd + 1, 0.5, "#6b4a32");
      c.globalAlpha = 1;
      if (v > 0.35) {
        const n = v > 0.7 ? 3 : 2;
        for (let k = 0; k < n; k++) {
          const m = sheepAt(sd, k, t);
          drawSheep(c, cx + m.dx + (k - 1) * 3, cy + m.dy + (k % 2) * 1.5, m.flip, t + k * 1700, m.walking, m.graze);
        }
      }
  }

}

const LAYER: Record<string, number> = { deep: 0, water: 0, sand: 1, fertile: 2, meadow: 3, grass: 4, hill: 5, forest: 6, mountain: 7 };
const LAYER_T = ["water", "sand", "fertile", "meadow", "grass", "hill", "forest", "mountain"];
const NB8: [number, number][] = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]];
const PATHLIKE: ReadonlySet<Kind> = new Set(["path", "street", "square", "well", "market", "road", "bridge", "avenue", "rail"]);

/** Whole map fits ~1000px wide at this zoom. */
export const MIN_ZOOM = 0.025;
const OVERVIEW_BELOW = 0.45;
/** Between this zoom and OVERVIEW_BELOW the overview uses the baked ground chunks. */
const CHUNKS_BELOW_OVERVIEW = 0.18;
const smoothCache = new WeakMap<object, Pt[]>();
/** Road tiles are 4-connected (stair steps); travellers follow a smoothed curve through them. */
function smoothRoad(l: { tiles: [number, number][] }): Pt[] {
  const hit = smoothCache.get(l); if (hit) return hit;
  const raw = l.tiles.map(([x, y]) => iso(x, y) as unknown as Pt);
  const R = 3;
  const out = raw.map((_, i) => {
    let sx = 0, sy = 0, c = 0;
    for (let j = Math.max(0, i - R); j <= Math.min(raw.length - 1, i + R); j++) { sx += raw[j]![0]; sy += raw[j]![1]; c++; }
    return [sx / c, sy / c] as Pt;
  });
  smoothCache.set(l, out); return out;
}

/** Painted ox cart, facing the travel direction (screen-space dx). */
function drawCart(c: C, x: number, y: number, dx: number, _dy: number, bob: number, _sd: number, _cover: string, _t: number) {
  const im = cartImage(); if (!im) return;
  const w = 15, h = (w * im.naturalHeight) / im.naturalWidth;
  c.fillStyle = "rgba(20,15,10,0.28)"; c.beginPath(); c.ellipse(x, y, 6.5, 1.6, 0, 0, 7); c.fill();
  c.save(); c.translate(x, y - bob * 0.3); if (dx < 0) c.scale(-1, 1);
  c.imageSmoothingEnabled = true; c.imageSmoothingQuality = "high";
  c.drawImage(im, -w / 2, -h * 0.92, w, h);
  c.restore();
}

// ---------------- villagers ----------------
// Muted, earthy period palette (Commandos-like): no saturated toy colours.
const SKIN = ["#e2bf9f", "#d3a985", "#bf9068", "#9c6d4a", "#74492f"];
const HAIR = ["#2a1e16", "#4a3222", "#6e4a2c", "#a07a45", "#bfa36a", "#7f3c25"];
const CLOTH = ["#6b7552", "#8a4a38", "#4e5d6c", "#9c8150", "#6a5a66", "#5a6e66", "#8a6650", "#525a40", "#a07a62", "#cfc3a5"];
const PANTS = ["#3e362f", "#4b4e55", "#5a4736", "#363d47"];
/** Villagers are drawn at this fraction of their modelled size so they match doors, fences and fields. */
const PERSON_SCALE = 0.55;
/** Screen-space people currently drawn (for clicking). */
export const lastPeople: { x: number; y: number; q: Pose }[] = [];
/** Sound-emitting structures drawn this frame (world-screen coords), read by the audio mixer. */
export const lastSources: { x: number; y: number; k: string }[] = [];
const SOUND_KINDS = new Set(["campfire", "mill", "watermill", "smithy", "pasture", "church", "sawmill", "factory", "steamworks"]);
function limb(c: C, pts: Pt[], col: string, w: number) {
  c.lineCap = "round"; c.lineJoin = "round";
  c.beginPath(); c.moveTo(pts[0]![0], pts[0]![1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i]![0], pts[i]![1]);
  c.strokeStyle = "rgba(22,16,10,0.85)"; c.lineWidth = w + 0.45; c.stroke();
  c.strokeStyle = col; c.lineWidth = w; c.stroke();
  // soft top-left light, like painted sprite shading
  c.strokeStyle = "rgba(255,235,200,0.16)"; c.lineWidth = w * 0.35; c.stroke();
}
function bubble(c: C, x: number, y: number, icon: number) {
  c.beginPath(); c.ellipse(x, y, 2.6, 1.9, 0, 0, 7);
  c.moveTo(x - 0.6, y + 1.6); c.lineTo(x - 1.4, y + 3); c.lineTo(x + 0.3, y + 1.8);
  c.fillStyle = "#fbf6ea"; c.fill(); c.strokeStyle = INK; c.lineWidth = 0.3; c.stroke();
  c.lineWidth = 0.3;
  if (icon === 0) { c.fillStyle = "#c0504a"; c.beginPath(); c.arc(x - 0.45, y - 0.3, 0.55, 0, 7); c.arc(x + 0.45, y - 0.3, 0.55, 0, 7); c.fill(); c.beginPath(); c.moveTo(x - 1, y - 0.1); c.lineTo(x, y + 1); c.lineTo(x + 1, y - 0.1); c.fill(); }
  else if (icon === 1) { c.fillStyle = "#c8914f"; c.beginPath(); c.ellipse(x, y, 1.4, 0.8, 0, 0, 7); c.fill(); c.stroke(); for (const k of [-0.5, 0, 0.5]) { c.beginPath(); c.moveTo(x + k - 0.2, y - 0.5); c.lineTo(x + k + 0.2, y + 0.3); c.stroke(); } }
  else if (icon === 2) { c.fillStyle = "#f0c24f"; c.beginPath(); c.arc(x, y, 0.75, 0, 7); c.fill(); c.strokeStyle = "#d9a53a"; for (let k = 0; k < 6; k++) { const a = k * 1.047; c.beginPath(); c.moveTo(x + Math.cos(a) * 1.05, y + Math.sin(a) * 1.05); c.lineTo(x + Math.cos(a) * 1.45, y + Math.sin(a) * 1.45); c.stroke(); } }
  else if (icon === 3) { c.fillStyle = "#b8c4cf"; c.beginPath(); c.arc(x - 0.5, y - 0.2, 0.7, 0, 7); c.arc(x + 0.5, y - 0.3, 0.8, 0, 7); c.fill(); c.strokeStyle = "#5a86b0"; for (const k of [-0.6, 0.1, 0.8]) { c.beginPath(); c.moveTo(x + k, y + 0.7); c.lineTo(x + k - 0.2, y + 1.2); c.stroke(); } }
  else if (icon === 4) { c.fillStyle = INK; for (const k of [-0.9, 0, 0.9]) { c.beginPath(); c.arc(x + k, y, 0.28, 0, 7); c.fill(); } }
  else { c.fillStyle = INK; c.beginPath(); c.ellipse(x - 0.4, y + 0.6, 0.45, 0.35, -0.4, 0, 7); c.fill(); c.strokeStyle = INK; c.beginPath(); c.moveTo(x - 0.0, y + 0.6); c.lineTo(x, y - 1); c.quadraticCurveTo(x + 0.8, y - 0.7, x + 0.9, y - 0.2); c.stroke(); }
}
function drawPerson(c: C, X: number, Y: number, q: Pose, t: number, simple: boolean) {
  c.save(); c.translate(X, Y); c.scale(PERSON_SCALE, PERSON_SCALE); c.translate(-X, -Y);
  const head = personBody(c, X, Y, q, t, simple);
  c.restore();
  if (head && q.talk !== null && q.talkTurn) bubble(c, X + (head[0] - X) * PERSON_SCALE + 1.8, Y + (head[1] - Y) * PERSON_SCALE - 2.6, q.talk);
}
function personBody(c: C, X: number, Y: number, q: Pose, t: number, simple: boolean): Pt | null {
  const p = q.p, L = p.looks;
  const kid = p.age < 15, old = p.age >= 65;
  const s = kid ? 0.52 + p.age * 0.03 : 1;
  const sdx = (q.dir[0] - q.dir[1]), sdy = (q.dir[0] + q.dir[1]) * 0.5;
  const dl = Math.hypot(sdx, sdy) || 1;
  const fx = sdx / dl, fy = sdy / dl;
  const face = fx >= 0 ? 1 : -1, side = 0.35 + 0.65 * Math.abs(fx), away = fy < -0.35;
  const skin = SKIN[Math.floor(L.skin * SKIN.length)]!, shirt = CLOTH[Math.floor(L.shirt * CLOTH.length)]!;
  const pants = PANTS[Math.floor(L.pants * PANTS.length)]!;
  const hair = L.hair < 0 ? "#d8d4cc" : HAIR[Math.floor(L.hair * HAIR.length)]!;
  const ph = q.phase + p.id;
  const walk = q.walking ? 1 : 0;
  const bounce = walk * Math.abs(Math.cos(ph)) * 0.12 * s + (kid && q.act === "play" ? Math.max(0, Math.sin(ph * 0.5)) * 0.5 : 0);
  // shadow
  // grounded: soft ambient shadow cast to the lower right + dark contact patch under the feet
  c.fillStyle = "rgba(25,20,10,0.18)"; c.beginPath(); c.ellipse(X + 1.1 * s, Y + 0.25, 2.3 * s, 0.85 * s, 0.15, 0, 7); c.fill();
  c.fillStyle = "rgba(20,15,8,0.38)"; c.beginPath(); c.ellipse(X, Y, 1.05 * s, 0.42 * s, 0, 0, 7); c.fill();
  if (simple) {
    // Cheap but proportioned figure for mid zoom: two striding legs, tapered torso, arms, hair/hat.
    const sw = Math.sin(ph) * 0.9 * walk * s * Math.abs(fx), swy = Math.sin(ph) * 0.45 * walk * s * fy, hipY = Y - 3.5 * s - bounce, shY = hipY - 2.5 * s;
    const fem = p.sex === "f" && !kid;
    const lc = fem ? skin : pants;
    limb(c, [[X - 0.3 * s, hipY], [X - 0.3 * s - sw * face, Y - 0.2 - swy]], lc, 0.75 * s);
    limb(c, [[X + 0.3 * s, hipY], [X + 0.3 * s + sw * face, Y - 0.2 + swy]], lc, 0.75 * s);
    limb(c, [[X - 0.85 * s, shY + 0.3], [X - 0.95 * s + sw * 0.5 * face, hipY + 0.3]], shirt, 0.6 * s);
    c.beginPath(); c.moveTo(X - 0.85 * s, shY); c.lineTo(X + 0.85 * s, shY);
    if (fem) { c.lineTo(X + 1.3 * s, hipY + 2.2 * s); c.lineTo(X - 1.3 * s, hipY + 2.2 * s); }
    else { c.lineTo(X + 0.7 * s, hipY + 0.2); c.lineTo(X - 0.7 * s, hipY + 0.2); }
    c.closePath(); c.fillStyle = fem ? CLOTH[(Math.floor(L.shirt * CLOTH.length) + 3) % CLOTH.length]! : shirt; c.fill();
    c.strokeStyle = "rgba(22,16,10,0.85)"; c.lineWidth = 0.45; c.stroke();
    if (fem) { c.beginPath(); c.moveTo(X - 0.85 * s, shY); c.lineTo(X + 0.85 * s, shY); c.lineTo(X + 0.75 * s, hipY); c.lineTo(X - 0.75 * s, hipY); c.closePath(); c.fillStyle = shirt; c.fill(); }
    limb(c, [[X + 0.85 * s, shY + 0.3], [X + 0.95 * s - sw * 0.5 * face, hipY + 0.3]], shirt, 0.6 * s);
    const hr = (kid ? 1.1 : 0.9) * s, hy = shY - hr - 0.2 * s;
    c.beginPath(); c.arc(X, hy, hr, 0, 7); c.fillStyle = skin; c.fill(); c.strokeStyle = "rgba(22,16,10,0.85)"; c.lineWidth = 0.4; c.stroke();
    c.fillStyle = hair; c.beginPath(); c.arc(X, hy - 0.1 * hr, hr * 1.02, Math.PI * 1.02, Math.PI * 1.98); c.fill();
    if (L.hat && !kid) {
      c.fillStyle = p.job === "farmer" ? "#b89a5e" : "#3e3028";
      c.beginPath(); c.ellipse(X, hy - hr * 0.55, hr * 1.5, hr * 0.36, 0, 0, 7); c.fill(); c.stroke();
      c.beginPath(); c.ellipse(X, hy - hr * 0.9, hr * 0.8, hr * 0.5, 0, Math.PI, 0); c.fill();
    }
    return [X, hy];
  }
  const leg = (old ? 1.65 : 1.8) * s;
  const hip: Pt = [X, Y - leg * 2 - bounce];
  const stoop = old ? 0.45 * face : 0;
  const sh: Pt = [X + stoop, hip[1] - 2.5 * s];
  const legPts = (l: number): Pt[] => {
    const lp = ph + (l > 0 ? 0 : Math.PI);
    const a = Math.sin(lp) * 0.5 * walk;
    // knee bends only while the leg swings forward (cos>0); stance leg stays straight
    const bend = walk * Math.max(0, Math.cos(lp)) * 0.8;
    // swing along the real screen direction: sideways part for left/right, depth part for up/down
    const kx = Math.sin(a) * leg * fx, ky = Math.sin(a) * leg * fy * 0.5;
    const knee: Pt = [hip[0] + kx, hip[1] + Math.cos(a) * leg + ky];
    const fa = a - bend;
    const foot: Pt = [knee[0] + Math.sin(fa) * leg * fx, knee[1] + Math.cos(fa) * leg + Math.sin(fa) * leg * fy * 0.5 - walk * Math.max(0, Math.cos(lp)) * 0.35 * s];
    return [[hip[0] + l * 0.28 * s * (1 - side * 0.6), hip[1]], knee, foot];
  };
  const dress = p.sex === "f" && !kid ? true : p.sex === "f" && L.pants > 0.4;
  const legCol = dress ? skin : pants;
  // back leg & arm
  limb(c, legPts(-1), legCol, 0.75 * s);
  const armPts = (l: number): Pt[] => {
    const o: Pt = [sh[0] + l * 0.25 * s * (1 - side * 0.6), sh[1] + 0.3 * s];
    if (q.working && (p.job === "farmer" || p.job === "homemaker")) {
      const sw = Math.sin(t / 420 + p.id) * 0.6;
      return [o, [o[0] + face * 1.0 * s, o[1] + 0.9 * s + sw * 0.4], [o[0] + face * 1.9 * s, o[1] + 0.6 * s + sw]];
    }
    if (q.talk !== null && q.talkTurn && l > 0) {
      const g = Math.sin(t / 260 + p.id) * 0.3;
      return [o, [o[0] + face * 0.9 * s, o[1] + 0.9 * s], [o[0] + face * 1.7 * s, o[1] + 0.2 * s + g]];
    }
    const a = Math.sin(ph + (l > 0 ? Math.PI : 0)) * 0.5 * walk;
    const el: Pt = [o[0] + Math.sin(a) * 1.3 * s * side * face, o[1] + Math.cos(a) * 1.3 * s];
    return [o, el, [el[0] + Math.sin(a + 0.3 * walk) * 1.2 * s * side * face, el[1] + Math.cos(a + 0.3) * 1.2 * s]];
  };
  limb(c, armPts(-1), shirt, 0.62 * s);
  // torso
  c.beginPath();
  c.moveTo(sh[0] - 0.85 * s, sh[1]); c.lineTo(sh[0] + 0.85 * s, sh[1]);
  c.lineTo(hip[0] + 0.75 * s, hip[1] + 0.2); c.lineTo(hip[0] - 0.75 * s, hip[1] + 0.2); c.closePath();
  c.fillStyle = shirt; c.fill();
  { const g = c.createLinearGradient(sh[0] - 0.85 * s, 0, sh[0] + 0.85 * s, 0); g.addColorStop(0, "rgba(255,240,210,0.18)"); g.addColorStop(1, "rgba(20,12,5,0.28)"); c.fillStyle = g; c.fill(); }
  c.strokeStyle = "rgba(22,16,10,0.85)"; c.lineWidth = 0.45; c.stroke();
  if (p.job === "mayor") {
    // chain of office with a medallion
    c.strokeStyle = "#d8b24a"; c.lineWidth = 0.32 * s; c.beginPath();
    c.moveTo(sh[0] - 0.7 * s, sh[1] + 0.1); c.quadraticCurveTo(sh[0], sh[1] + 1.6 * s, sh[0] + 0.7 * s, sh[1] + 0.1); c.stroke();
    c.fillStyle = "#f0cf68"; c.beginPath(); c.arc(sh[0], sh[1] + 0.95 * s, 0.32 * s, 0, 7); c.fill();
  }
  if (dress) {
    const sk = CLOTH[(Math.floor(L.shirt * CLOTH.length) + 3) % CLOTH.length]!;
    const fl = walk * Math.sin(ph) * 0.25;
    c.beginPath(); c.moveTo(hip[0] - 0.8 * s, hip[1] - 0.3); c.lineTo(hip[0] + 0.8 * s, hip[1] - 0.3);
    c.lineTo(hip[0] + 1.35 * s + fl, hip[1] + leg * 1.25); c.quadraticCurveTo(hip[0], hip[1] + leg * 1.4, hip[0] - 1.35 * s + fl, hip[1] + leg * 1.25); c.closePath();
    c.fillStyle = sk; c.fill(); c.stroke();
  }
  limb(c, legPts(1), legCol, 0.75 * s);
  if (dress) { /* front leg peeks out under the skirt */ }
  // head
  const hr = (kid ? 1.15 : 0.95) * s;
  const hc: Pt = [sh[0] + face * 0.1 * s + stoop * 0.6, sh[1] - hr - 0.25 * s];
  limb(c, [[sh[0], sh[1]], [hc[0], hc[1] + hr * 0.6]], skin, 0.5 * s);
  c.beginPath(); c.arc(hc[0], hc[1], hr, 0, 7); c.fillStyle = skin; c.fill(); c.strokeStyle = "rgba(22,16,10,0.85)"; c.lineWidth = 0.4; c.stroke();
  { const g = c.createRadialGradient(hc[0] - hr * 0.4, hc[1] - hr * 0.4, 0, hc[0], hc[1], hr * 1.1); g.addColorStop(0, "rgba(255,235,205,0.25)"); g.addColorStop(1, "rgba(40,20,10,0.3)"); c.fillStyle = g; c.fill(); }
  // hair
  c.fillStyle = hair; c.beginPath();
  if (away) c.arc(hc[0], hc[1], hr * 1.02, 0, 7);
  else c.arc(hc[0] - face * 0.15 * hr, hc[1] - 0.1 * hr, hr * 1.02, Math.PI * 1.05, Math.PI * 1.95 + face * 0.2);
  c.fill();
  if (p.sex === "f" && L.hair >= 0) { c.beginPath(); c.ellipse(hc[0] - face * hr * 0.75, hc[1] + hr * 0.6, hr * 0.35, hr * 0.9, 0, 0, 7); c.fill(); }
  if (!away) { c.fillStyle = "rgba(30,20,12,0.55)"; c.beginPath(); c.arc(hc[0] + face * hr * 0.45, hc[1] - hr * 0.05, 0.12 * s, 0, 7); c.fill(); }
  if (L.hat && !kid) {
    c.fillStyle = p.job === "farmer" ? "#d9bf7a" : "#4a3a30";
    c.beginPath(); c.ellipse(hc[0], hc[1] - hr * 0.55, hr * 1.55, hr * 0.38, 0, 0, 7); c.fill(); c.stroke();
    c.beginPath(); c.ellipse(hc[0], hc[1] - hr * 0.9, hr * 0.85, hr * 0.55, 0, Math.PI, 0); c.fill(); c.stroke();
  }
  // front arm with tool / stick
  const ap = armPts(1);
  limb(c, ap, shirt, 0.62 * s);
  const hand = ap[2]!;
  c.fillStyle = skin; c.beginPath(); c.arc(hand[0], hand[1], 0.32 * s, 0, 7); c.fill();
  if (q.working && (p.job === "builder" || p.job === "woodcutter" || p.job === "mason")) {
    // hammer / axe / pick swinging down in a steady rhythm
    const sw = Math.max(0, Math.sin(t / 230 + p.id)) * 1.3;
    const tip: Pt = [hand[0] + face * (1.4 - sw * 0.4) * s, hand[1] - (1.6 - sw * 1.8) * s];
    line(c, hand, tip, p.id, 0.38, "#6f533b");
    c.fillStyle = p.job === "builder" ? "#4a4440" : "#8a8f94";
    c.beginPath(); c.ellipse(tip[0], tip[1], (p.job === "builder" ? 0.45 : 0.75) * s, 0.35 * s, face * 0.6, 0, 7); c.fill();
    c.strokeStyle = "rgba(22,16,10,0.8)"; c.lineWidth = 0.25; c.stroke();
    if (sw < 0.15 && p.job !== "builder") { c.fillStyle = p.job === "mason" ? "rgba(220,215,205,0.8)" : "rgba(200,160,100,0.8)"; for (let i = 0; i < 3; i++) c.fillRect(tip[0] + (hash(p.id, i, Math.floor(t / 230)) - 0.5) * 3, tip[1] - hash(i, p.id, 7) * 2, 0.4, 0.4); }
  }
  if (q.carry) {
    // the carried good, recognisable at a glance
    const shp: Pt = [sh[0], sh[1] - 0.2 * s];
    const ink = "rgba(22,16,10,0.8)";
    c.lineWidth = 0.25;
    if (q.carry === "log") {
      c.strokeStyle = "#5e4229"; c.lineWidth = 1.15 * s; c.lineCap = "round";
      c.beginPath(); c.moveTo(shp[0] - 2.6 * s * face, shp[1] + 0.4 * s); c.lineTo(shp[0] + 2.4 * s * face, shp[1] - 0.6 * s); c.stroke();
      c.fillStyle = "#c9a26b"; c.beginPath(); c.ellipse(shp[0] + 2.4 * s * face, shp[1] - 0.6 * s, 0.45 * s, 0.55 * s, 0, 0, 7); c.fill();
      c.lineCap = "butt";
    } else if (q.carry === "stone") {
      c.fillStyle = "#a9a49c"; c.fillRect(hand[0] - 0.9 * s, hand[1] - 1.1 * s, 1.8 * s, 1.2 * s);
      c.fillStyle = "rgba(255,255,255,0.18)"; c.fillRect(hand[0] - 0.9 * s, hand[1] - 1.1 * s, 1.8 * s, 0.35 * s);
      c.strokeStyle = ink; c.strokeRect(hand[0] - 0.9 * s, hand[1] - 1.1 * s, 1.8 * s, 1.2 * s);
    } else if (q.carry === "planks") {
      for (let i = 0; i < 3; i++) {
        const o = -i * 0.35 * s;
        c.strokeStyle = i % 2 ? "#c49a62" : "#b08a5a"; c.lineWidth = 0.4 * s;
        c.beginPath(); c.moveTo(shp[0] - 3 * s * face, shp[1] + 0.5 * s + o); c.lineTo(shp[0] + 2.8 * s * face, shp[1] - 0.5 * s + o); c.stroke();
      }
    } else if (q.carry === "grain" || q.carry === "bundle") {
      const g: Pt = [shp[0] - face * 0.6 * s, shp[1] - 0.6 * s];
      c.fillStyle = q.carry === "bundle" ? "#8a6f52" : "#d4b25c"; c.beginPath(); c.ellipse(g[0], g[1], 0.8 * s, 1.7 * s, face * 0.5, 0, 7); c.fill(); c.strokeStyle = ink; c.stroke();
      c.strokeStyle = "#8a6a2a"; c.lineWidth = 0.3 * s; c.beginPath(); c.moveTo(g[0] - 0.7 * s, g[1] + 0.2 * s); c.lineTo(g[0] + 0.7 * s, g[1]); c.stroke();
    } else if (q.carry === "flour") {
      const g: Pt = [shp[0] - face * 0.3 * s, shp[1] - 0.5 * s];
      c.fillStyle = "#e6dcc4"; c.beginPath(); c.ellipse(g[0], g[1], 1.3 * s, 0.9 * s, face * 0.25, 0, 7); c.fill();
      c.fillStyle = "rgba(90,70,40,0.25)"; c.beginPath(); c.ellipse(g[0], g[1] + 0.3 * s, 1.1 * s, 0.45 * s, 0, 0, Math.PI); c.fill();
      c.strokeStyle = ink; c.beginPath(); c.ellipse(g[0], g[1], 1.3 * s, 0.9 * s, face * 0.25, 0, 7); c.stroke();
    } else if (q.carry === "bread") {
      const g: Pt = [hand[0] + face * 0.4 * s, hand[1] - 0.2 * s];
      c.fillStyle = "#c79a5a"; c.beginPath(); c.moveTo(g[0] - 1.1 * s, g[1] - 0.4 * s); c.lineTo(g[0] + 1.1 * s, g[1] - 0.4 * s); c.lineTo(g[0] + 0.8 * s, g[1] + 0.5 * s); c.lineTo(g[0] - 0.8 * s, g[1] + 0.5 * s); c.closePath(); c.fill(); c.strokeStyle = ink; c.stroke();
      c.fillStyle = "#9a5a26"; for (const dx of [-0.45, 0.4]) { c.beginPath(); c.ellipse(g[0] + dx * s, g[1] - 0.55 * s, 0.45 * s, 0.28 * s, 0, 0, 7); c.fill(); }
    }
  }
  if (q.working && p.job === "farmer") line(c, [hand[0] - face * 1.2, hand[1] - 1.2], [hand[0] + face * 1.4, hand[1] + 2.6 + Math.sin(t / 420 + p.id) * 0.5], p.id, 0.4, "#7a5a3c");
  if (L.stick) line(c, hand, [hand[0] + face * 0.5, Y], p.id + 1, 0.35, "#6f533b");
  return hc;
}

let overview: HTMLCanvasElement | null = null;
let overviewSeason = "";
let renderNow = 0;
/** Cached map picture at 1/16 iso scale, coloured from the real ground textures (terrain is static). */
function overviewMap() {
  const sk = seasonKey(renderNow);
  if (overview && overviewSeason === sk) return overview;
  const ready = allTexturesReady();
  // never rebuild every frame while textures load: keep the last picture (or a cheap one) until ready
  if (!ready && overview) return overview;
  overviewSeason = sk;
  const S = 16, W = (MAP * TW) / S, H = (MAP * TH) / S;
  const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
  const g = cv.getContext("2d")!; const img = g.createImageData(W, H);
  const rgb = new Map<string, [number, number, number]>();
  const tmp = document.createElement("canvas").getContext("2d")!;
  for (const [k, [h, s, l]] of Object.entries(TERRAIN)) { tmp.fillStyle = hsl(h, s, l); tmp.fillRect(0, 0, 1, 1); const d = tmp.getImageData(0, 0, 1, 1).data; rgb.set(k, [d[0]!, d[1]!, d[2]!]); }
  for (let py = 0; py < H; py++) for (let px = 0; px < W; px++) {
    const ix = px * S - (MAP * TW) / 2, iy = py * S;
    // jitter the lookup so terrain borders read as soft, organic lines instead of stair steps
    const jx = (hash(px, py, 7) - 0.5) * TW * 0.9, jy = (hash(px, py, 8) - 0.5) * TH * 0.9;
    const fx = (ix + jx) / TW + (iy + jy) / TH, fy = (iy + jy) / TH - (ix + jx) / TW;
    const tx = Math.floor(fx), ty = Math.floor(fy);
    const o = (py * W + px) * 4;
    if (tx < 0 || ty < 0 || tx >= MAP || ty >= MAP) continue;
    const tr = terrain(tx, ty);
    let r: number, gg: number, b: number;
    const sm = ready ? texSample(TEX_OF[tr]!) : null;
    if (sm) { const q = ((py % sm.n) * sm.n + (px % sm.n)) * 4; r = sm.d[q]!; gg = sm.d[q + 1]!; b = sm.d[q + 2]!; }
    else { const c0 = rgb.get(tr)!; r = c0[0]; gg = c0[1]; b = c0[2]; }
    if (tr === "deep") { r *= 0.6; gg *= 0.7; b *= 0.8; }
    if (tr === "forest") { r = r * 0.8 + 18; gg = gg * 0.85 + 34; b = b * 0.8 + 12; }
    if (tr === "mountain") { const m = 0.9 + hash(tx, ty, 3) * 0.2; r *= m; gg *= m; b *= m; }
    img.data[o] = r; img.data[o + 1] = gg; img.data[o + 2] = b; img.data[o + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  // soften once more so coasts and rivers look painted, not pixelated
  const out = document.createElement("canvas"); out.width = W; out.height = H;
  const og = out.getContext("2d")!; og.filter = "blur(0.8px)"; og.drawImage(cv, 0, 0);
  overview = out;
  if (!ready) overviewSeason = "";
  return out;
}

/** Builds the overview picture in idle time so zooming out never stalls. */
export function prewarmOverview() {
  if (typeof window === "undefined") return;
  const go = () => { renderNow = renderNow || Date.now(); if (!allTexturesReady()) return void setTimeout(go, 400); overviewMap(); };
  const ric = (window as Window & { requestIdleCallback?: (f: () => void) => void }).requestIdleCallback;
  ric ? ric(go) : setTimeout(go, 800);
}

function drawOverview(c: C, w: number, h: number, dpr: number, cam: Camera, seeds: Seed[], now: number) {
  const z = cam.zoom * dpr;
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.fillStyle = "#1f4f63"; c.fillRect(0, 0, w, h);
  c.setTransform(z, 0, 0, z, w / 2 - cam.x * z, h / 2 - cam.y * z);
  c.imageSmoothingEnabled = true; c.imageSmoothingQuality = "high";
  if (cam.zoom >= CHUNKS_BELOW_OVERVIEW) {
    // painted ground chunks keep the real textures sharp; the coarse bitmap is only for the far view
    const inv = (sx: number, sy: number) => toTile((sx - w / 2) / z + cam.x, (sy - h / 2) / z + cam.y);
    const cs = [inv(0, 0), inv(w, 0), inv(0, h), inv(w, h)];
    const x0 = Math.max(0, Math.min(...cs.map((p) => p[0])) - 2), x1 = Math.min(MAP - 1, Math.max(...cs.map((p) => p[0])) + 2);
    const y0 = Math.max(0, Math.min(...cs.map((p) => p[1])) - 2), y1 = Math.min(MAP - 1, Math.max(...cs.map((p) => p[1])) + 5);
    c.drawImage(overviewMap(), -(MAP * TW) / 2, 0, MAP * TW, MAP * TH); // under not-yet-baked chunks
    drawGroundChunks(c, x0, x1, y0, y1, z, cam.x - w / 2 / z, cam.x + w / 2 / z, cam.y - h / 2 / z, cam.y + h / 2 / z, true);
  } else c.drawImage(overviewMap(), -(MAP * TW) / 2, 0, MAP * TW, MAP * TH);
  const px = 1 / z;
  c.lineJoin = "round"; c.lineCap = "round";
  for (const l of links(seeds)) {
    const p = roadProgress(l, now); if (p <= 0) continue;
    const pts = smoothRoad(l);
    c.beginPath();
    pts.forEach(([x, y], i) => { const [a, b] = iso(x, y); i ? c.lineTo(a, b) : c.moveTo(a, b); });
    c.globalAlpha = 0.35 + 0.55 * p;
    c.strokeStyle = "rgba(60,40,20,0.5)"; c.lineWidth = Math.max(3.5 * dpr * px, 5); c.stroke();
    c.strokeStyle = texture(c, "dirt") ?? "#b89468"; c.lineWidth = Math.max(2.2 * dpr * px, 3.5); c.stroke();
    c.globalAlpha = 1;
    if (railReady(l,seeds,now)) drawRails(c,l,seeds,now);
  }
  const vx0 = cam.x - w / 2 / z, vx1 = cam.x + w / 2 / z, vy0 = cam.y - h / 2 / z, vy1 = cam.y + h / 2 / z;
  for (const s of seeds) {
    const [ix, iy] = iso(s.x, s.y);
    const R = radiusOf(effAge(s, seeds, now));
    const rr = Math.max(R * TW * 0.5, 3 * dpr * px);
    if (ix + rr < vx0 || ix - rr > vx1 || iy + rr < vy0 || iy - rr > vy1) continue;
    // settled ground under the town
    c.beginPath(); c.ellipse(ix, iy, rr * 1.05, rr * 0.55, 0, 0, 7);
    c.fillStyle = "rgba(70,55,35,0.25)"; c.fill();
    // the real buildings, at true scale, back to front
    const Ri = Math.ceil(R) + 1, step = cam.zoom < 0.12 && Ri > 14 ? 2 : 1;
    for (let d = -2 * Ri; d <= 2 * Ri; d++) for (let x = s.x - Ri; x <= s.x + Ri; x += step) {
      const y = s.x + s.y + d - x; if (y < s.y - Ri || y > s.y + Ri) continue;
      const st = structureAt(x, y, seeds, now); if (!st) continue;
      const [cx, cy] = iso(x, y);
      if (st.kind === "field") { c.fillStyle = texture(c, acreOf(x, y, st.seed).ripe ? "wheat" : "crops") ?? "#c9b46a"; diamond(c, cx, cy, step); c.fill(); }
      else if (PATHLIKE.has(st.kind) || st.kind === "square") { c.fillStyle = texture(c, st.kind === "street" || st.kind === "square" ? "cobble" : "dirt") ?? "#bfa47a"; diamond(c, cx, cy, step * 0.8); c.fill(); }
      else if (st.build !== undefined) drawSite(c, st, cx, cy, 0, false);
      else if (!FLAT.has(st.kind)) drawBuildingSprite(c, st.kind, cx, cy, st.v);
    }
  }
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.font = `700 ${Math.round(18 * dpr)}px Georgia, 'Times New Roman', serif`; c.textAlign = "center";
  const placed: [number, number][] = [];
  const order = [...seeds].sort((a, b) => effAge(b, seeds, now) - effAge(a, seeds, now));
  for (const s of order) {
    const [ix, iy] = iso(s.x, s.y);
    const R = radiusOf(effAge(s, seeds, now)) * TH * 0.5 * z;
    const sx = (ix - cam.x) * z + w / 2, sy = (iy - cam.y) * z + h / 2 - R - 12 * dpr;
    const tw = c.measureText(s.name).width;
    if (placed.some(([px2, py2]) => Math.abs(px2 - sx) < tw && Math.abs(py2 - sy) < 22 * dpr)) continue; // biggest town keeps its name
    placed.push([sx, sy]);
    c.lineWidth = 4 * dpr; c.strokeStyle = "rgba(246,238,220,0.9)"; c.strokeText(s.name, sx, sy);
    c.fillStyle = INK; c.fillText(s.name, sx, sy);
  }
}
function diamond(c: C, cx: number, cy: number, k: number) {
  c.beginPath(); c.moveTo(cx, cy - TH / 2 * k); c.lineTo(cx + TW / 2 * k, cy); c.lineTo(cx, cy + TH / 2 * k); c.lineTo(cx - TW / 2 * k, cy); c.closePath();
}

/** Painted rowing-boat sprite (~4 m long, villagers are ~5 px tall), bobbing with a soft water shadow. */
function drawBoat(c: C, x: number, y: number, flip: boolean, t: number, sd: number) {
  const im = boatImage(); if (!im) return;
  const w = 11, h = (w * im.naturalHeight) / im.naturalWidth;
  const bob = Math.sin(t / 900 + sd) * 0.25, roll = Math.sin(t / 1300 + sd) * 0.02;
  c.save(); c.translate(x, y);
  c.fillStyle = "rgba(8,22,22,0.35)"; c.beginPath(); c.ellipse(0.6, 1.2, w * 0.46, h * 0.28, flip ? 0.45 : -0.45, 0, 7); c.fill();
  c.strokeStyle = `rgba(205,220,210,${0.16 + 0.06 * Math.sin(t / 700 + sd)})`; c.lineWidth = 0.3;
  c.beginPath(); c.ellipse(0, 0.6, w * 0.55, h * 0.36, flip ? 0.45 : -0.45, 0, 7); c.stroke();
  c.rotate(roll); if (flip) c.scale(-1, 1);
  c.imageSmoothingEnabled = true; c.imageSmoothingQuality = "high";
  c.drawImage(im, -w / 2, -h / 2 + bob - 0.6, w, h);
  c.restore();
}

/** Traveller on the open road: a real villager figure with stick and hat, striding along the road. */
const travellers = new Map<number, Pose["p"]>();
function drawWanderer(c: C, x: number, y: number, dx: number, dy: number, t: number, sd: number) {
  let p = travellers.get(sd);
  if (!p) {
    p = {
      id: sd, seed: null as never, first: "", last: "", sex: hash(sd, 1, 11) < 0.35 ? "f" : "m", age: 25 + Math.floor(hash(sd, 2, 11) * 35), job: "carter",
      home: [0, 0], work: null, workIndoor: false, speed: 0.3,
      looks: { skin: hash(sd, 3, 11), hair: hash(sd, 4, 11), shirt: hash(sd, 5, 11), pants: hash(sd, 6, 11), hat: true, stick: true }, haul: null,
    };
    travellers.set(sd, p);
  }
  // screen direction → tile direction (inverse of the iso projection used by the figure)
  const d0 = (dx + 2 * dy) / 2, d1 = (2 * dy - dx) / 2;
  const q: Pose = {
    p, x: 0, y: 0, visible: true, walking: true, dir: [d0, d1], phase: (t / 1000) * Math.PI * 2 * 0.95,
    act: "work", working: false, talk: null, talkTurn: false, carry: null, dest: null,
  };
  drawPerson(c, x, y, q, t, false);
}

/** Road crew at the growing end of a trade road: stakes ahead, a log pile, gravel, two diggers. */
function drawRoadWorks(c: C, x: number, y: number, dx: number, dy: number, t: number, sd: number) {
  const dl = Math.hypot(dx, dy) || 1; dx /= dl; dy /= dl;
  const nx = -dy, ny = dx;
  // survey stakes marking where the road will go next
  for (let s = 1; s <= 3; s++) {
    const px = x + dx * s * 9, py = y + dy * s * 9;
    for (const side of [-1, 1]) {
      const sx = px + nx * 3.4 * side, sy = py + ny * 1.7 * side;
      c.strokeStyle = "#5a4330"; c.lineWidth = 0.35; c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx, sy - 2.2); c.stroke();
      c.fillStyle = "#c9b48a"; c.fillRect(sx - 0.25, sy - 2.3, 0.5, 0.45);
    }
  }
  // freshly dug earth and gravel heap
  c.fillStyle = "rgba(92,70,48,0.85)"; c.beginPath(); c.ellipse(x + dx * 3, y + dy * 3, 4.2, 1.8, 0, 0, 7); c.fill();
  const gx = x - nx * 5, gy = y - ny * 2.5;
  const gg = c.createRadialGradient(gx - 0.6, gy - 1.2, 0.2, gx, gy, 2.6);
  gg.addColorStop(0, "#b6ab98"); gg.addColorStop(1, "#6e6556");
  c.fillStyle = gg; c.beginPath(); c.moveTo(gx - 2.6, gy); c.quadraticCurveTo(gx, gy - 3, gx + 2.6, gy); c.closePath(); c.fill();
  // log pile
  const lx = x + nx * 5.5, ly = y + ny * 2.8;
  c.fillStyle = "rgba(20,15,10,0.3)"; c.beginPath(); c.ellipse(lx, ly + 0.3, 3.4, 1, 0, 0, 7); c.fill();
  for (const [ox, oy] of [[-1.2, 0], [1.2, 0], [0, -1.1]] as const) {
    c.strokeStyle = "#6b4a2e"; c.lineWidth = 1.1; c.lineCap = "round";
    c.beginPath(); c.moveTo(lx + ox - 2, ly + oy - 0.4); c.lineTo(lx + ox + 2, ly + oy + 0.4); c.stroke();
    c.fillStyle = "#c79a64"; c.beginPath(); c.arc(lx + ox + 2, ly + oy + 0.4, 0.5, 0, 7); c.fill();
  }
  // two workers swinging spades
  for (let w = 0; w < 2; w++) {
    const wx = x + dx * (2 + w * 3) + nx * (w ? -1.5 : 1.5), wy = y + dy * (2 + w * 3) + ny * (w ? -0.8 : 0.8);
    const sw = Math.sin(t / 420 + sd + w * 2.1), dip = Math.max(0, sw) * 0.5;
    const dir = (dx >= 0 ? 1 : -1) * (w ? -1 : 1);
    c.save(); c.translate(wx, wy); c.scale(dir * 0.9, 0.9);
    c.fillStyle = "rgba(20,15,10,0.3)"; c.beginPath(); c.ellipse(0, 0, 1.4, 0.45, 0, 0, 7); c.fill();
    c.strokeStyle = "#3a3026"; c.lineWidth = 0.45; c.lineCap = "round";
    c.beginPath(); c.moveTo(0, -2.1); c.lineTo(0.5, 0); c.moveTo(0, -2.1); c.lineTo(-0.5, 0); c.stroke();
    c.save(); c.translate(0, -2.1 + dip); c.rotate(0.25 + dip * 0.6);
    c.fillStyle = w ? "#5d5244" : "#6a4e3a"; c.beginPath(); c.moveTo(-0.7, -2.3); c.lineTo(0.7, -2.3); c.lineTo(0.8, 0); c.lineTo(-0.8, 0); c.closePath(); c.fill();
    c.fillStyle = "#d4ae88"; c.beginPath(); c.arc(0.15, -2.9, 0.5, 0, 7); c.fill();
    c.fillStyle = "#7a6a4a"; c.beginPath(); c.ellipse(0.15, -3.25, 0.75, 0.22, 0, 0, 7); c.fill();
    // spade
    const a = 0.9 + sw * 0.45;
    c.strokeStyle = "#5c4430"; c.lineWidth = 0.25; c.beginPath(); c.moveTo(0.6, -1.6); c.lineTo(0.6 + Math.sin(a) * 3, -1.6 + Math.cos(a) * 3); c.stroke();
    c.fillStyle = "#77787a"; c.beginPath(); c.arc(0.6 + Math.sin(a) * 3.2, -1.6 + Math.cos(a) * 3.2, 0.45, 0, 7); c.fill();
    c.restore(); c.restore();
  }
}

/**
 * Straight timber bridge from bank A to bank B (≈3 m wide deck, 1 m railing): it rests on stone
 * abutments, rises slightly, and is carried by trestles on the riverbed. A rowing boat lies moored
 * at one bank beside the bridge, never crossing its piles.
 */
function drawBridgeSpan(c: C, A: Pt, B: Pt, sd: number, t: number) {
  const dx = B[0] - A[0], dy = B[1] - A[1], len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len;
  // unit perpendicular on the iso ground plane
  let nx = -uy * 2, ny = ux * 0.5; const nl = Math.hypot(nx, ny) || 1; nx /= nl; ny /= nl;
  const HW = 3.2; // deck half width in px
  const rise = Math.min(1.8, 0.4 + len * 0.012);
  const H = (f: number) => 1 + rise * Math.sin(Math.PI * f);
  const ground = (f: number, s: number): Pt => [A[0] + dx * f + nx * HW * s, A[1] + dy * f + ny * HW * s];
  const at = (f: number, s: number): Pt => { const g = ground(f, s); return [g[0], g[1] - H(f)]; };
  const path = (pts: Pt[]) => { c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); };
  const S = 20, fs = Array.from({ length: S + 1 }, (_, i) => i / S), rev = fs.slice().reverse();
  // moored boat behind the bridge (upper screen side) so it is drawn before the deck
  const back = ny > 0 ? -1 : 1;
  {
    const f = 0.22 + hash(sd, 3, 9) * 0.1, off = HW + 7;
    const bx = A[0] + dx * f + nx * off * back, by = A[1] + dy * f + ny * off * back;
    const [tx, ty] = toTile(bx, by);
    if (isWater(terrain(tx, ty))) drawBoat(c, bx, by, nx * back > 0, t, sd);
  }
  c.save(); c.lineCap = "butt"; c.lineJoin = "round";
  // shadow on the water
  path([...fs.map((f) => { const g = ground(f, 1.3); return [g[0] + 1.5, g[1] + 2] as Pt; }), ...rev.map((f) => { const g = ground(f, -1.3); return [g[0] + 1.5, g[1] + 2] as Pt; })]);
  c.fillStyle = "rgba(8,22,22,0.32)"; c.fill();
  // dressed-stone abutments on both banks
  for (const f of [0, 1]) {
    const q = [ground(f - 0.06 * (f ? -1 : 1), -1.25), ground(f + 0.04 * (f ? -1 : 1), -1.25), ground(f + 0.04 * (f ? -1 : 1), 1.25), ground(f - 0.06 * (f ? -1 : 1), 1.25)];
    path(q); c.fillStyle = texture(c, "rock") ?? "#837b6d"; c.fill();
    c.fillStyle = "rgba(30,26,20,0.35)"; c.fill();
    path(q.map(([a, b]) => [a, b - 1] as Pt)); c.fillStyle = texture(c, "rock") ?? "#9a9284"; c.fill();
  }
  // trestles: pile pairs with cross braces
  const piles = Math.max(1, Math.round(len / 16));
  for (let k = 1; k <= piles; k++) {
    const f = k / (piles + 1);
    const a = ground(f, -0.85), b = ground(f, 0.85), at0 = at(f, -0.85), at1 = at(f, 0.85);
    for (const [g, top] of [[a, at0], [b, at1]] as [Pt, Pt][]) {
      const gr = c.createLinearGradient(g[0] - 0.6, 0, g[0] + 0.6, 0); gr.addColorStop(0, "#4a3624"); gr.addColorStop(1, "#24190f");
      c.fillStyle = gr; c.fillRect(g[0] - 0.55, top[1], 1.1, g[1] - top[1] + 1.6);
      c.fillStyle = "rgba(20,40,38,0.5)"; c.fillRect(g[0] - 0.55, g[1] + 0.6, 1.1, 1); // wet waterline
      c.strokeStyle = `rgba(200,215,205,${0.14 + 0.06 * Math.sin(t / 800 + k)})`; c.lineWidth = 0.25;
      c.beginPath(); c.ellipse(g[0], g[1] + 1.6, 1.3, 0.35, 0, 0, 7); c.stroke();
    }
    c.strokeStyle = "#2e2116"; c.lineWidth = 0.35;
    c.beginPath(); c.moveTo(at0[0], at0[1] + 0.6); c.lineTo(b[0], b[1] + 0.6); c.moveTo(at1[0], at1[1] + 0.6); c.lineTo(a[0], a[1] + 0.6); c.stroke();
  }
  // stringer beam visible on the near side
  const near = -back;
  path([...fs.map((f) => at(f, near)), ...rev.map((f) => { const p = at(f, near); return [p[0], p[1] + 1] as Pt; })]);
  const sg = c.createLinearGradient(0, -1, 0, 1); sg.addColorStop(0, "#4e3925"); sg.addColorStop(1, "#2a1d12");
  c.fillStyle = sg; c.fill();
  // deck: real plank texture, planks laid across the direction of travel
  path([...fs.map((f) => at(f, -1)), ...rev.map((f) => at(f, 1))]);
  const pat = planksPattern(c);
  if (pat) {
    const ang = Math.atan2(ny, nx), s = 1.1 / 64;
    pat.setTransform(new DOMMatrix().translate(A[0], A[1]).rotate((ang * 180) / Math.PI).scale(s, s));
    c.fillStyle = pat; c.fill();
  } else { c.fillStyle = "#6e5a44"; c.fill(); }
  // light from above-left: fade the deck slightly towards the far rail
  c.fillStyle = "rgba(255,235,200,0.06)"; c.fill();
  c.strokeStyle = "rgba(25,18,10,0.55)"; c.lineWidth = 0.25; c.stroke();
  // railings: square posts + top rail + middle rail
  for (const sgn of [back, near]) {
    const posts = Math.max(3, Math.round(len / 8));
    for (let k = 0; k <= posts; k++) {
      const p = at(k / posts, sgn);
      c.fillStyle = "#2f2216"; c.fillRect(p[0] - 0.3, p[1] - 2.9, 0.6, 2.9);
      c.fillStyle = "rgba(190,160,120,0.35)"; c.fillRect(p[0] - 0.3, p[1] - 2.9, 0.22, 2.9);
    }
    for (const [hgt, w, col] of [[2.8, 0.5, "#6a4e34"], [1.5, 0.3, "#4d3824"]] as const) {
      c.strokeStyle = col; c.lineWidth = w; c.beginPath();
      fs.forEach((f, i) => { const p = at(f, sgn); i ? c.lineTo(p[0], p[1] - hgt) : c.moveTo(p[0], p[1] - hgt); }); c.stroke();
    }
  }
  c.restore();
}

function drawRails(c: C, l: ReturnType<typeof links>[number], seeds: Seed[], now: number) {
  c.save(); c.lineCap = "butt";
  for (let i=1;i<l.tiles.length;i++) {
    const a=l.tiles[i-1], b=l.tiles[i]; if (!a || !b) continue;
    const st=structureAt(b[0],b[1],seeds,now); if (st && st.kind!=="road" && st.kind!=="bridge" && st.kind!=="rail") continue;
    const [ax,ay]=iso(a[0],a[1]), [bx,by]=iso(b[0],b[1]);
    const dx=bx-ax,dy=by-ay,len=Math.hypot(dx,dy)||1,nx=-dy/len,ny=dx/len;
    c.strokeStyle="#6a5340"; c.lineWidth=1.4;
    for(let j=0;j<4;j++){const f=j/4,x=ax+dx*f,y=ay+dy*f;c.beginPath();c.moveTo(x-nx*2.4,y-ny*2.4);c.lineTo(x+nx*2.4,y+ny*2.4);c.stroke();}
    c.strokeStyle="#b6b8af";c.lineWidth=0.75;
    for(const sign of [-1,1]){c.beginPath();c.moveTo(ax+nx*sign*1.6,ay+ny*sign*1.6);c.lineTo(bx+nx*sign*1.6,by+ny*sign*1.6);c.stroke();}
  }
  c.restore();
}

type GroundEdge = { x: number; y: number; cx: number; cy: number; tr: string; r: number; coast: boolean };
/** Water + layered land for a tile range; returns border tiles for frayed edges. */
function drawGround(c: C, x0: number, x1: number, y0: number, y1: number, t: number, detail: boolean): GroundEdge[] {
  // ---- pass 0: one continuous water surface under everything (no tile seams) ----
  // Two slow, counter-drifting layers that breathe back and forth: calm, never a conveyor belt.
  // Also laid under shore tiles, so the land outline may curve freely over it.
  const wA = Math.sin(t / 9000) * 40 + t / 30000, wB = Math.cos(t / 7000) * 30 - t / 45000;
  const nearWater = (x: number, y: number) => { if (isWater(terrain(x, y))) return true; for (const [dx, dy] of NB8) if (isWater(terrain(x + dx, y + dy))) return true; return false; };
  for (let pass = 0; pass < 2; pass++) {
    const wp = texture(c, "water", pass ? wB : wA);
    c.globalAlpha = pass ? 0.35 + 0.1 * Math.sin(t / 5000) : 1;
    c.beginPath();
    for (let s = x0 + y0; s <= x1 + y1; s++) for (let x = Math.max(x0, s - y1); x <= Math.min(x1, s - y0); x++) {
      const y = s - x; if (!nearWater(x, y)) continue;
      const [cx, cy] = iso(x, y);
      c.moveTo(cx, cy - TH / 2 - 1); c.lineTo(cx + TW / 2 + 1, cy); c.lineTo(cx, cy + TH / 2 + 1); c.lineTo(cx - TW / 2 - 1, cy); c.closePath();
    }
    c.fillStyle = wp ?? hsl(190, 30, 32); c.fill();
  }
  c.globalAlpha = 1;
  for (let s = x0 + y0; s <= x1 + y1; s++) for (let x = Math.max(x0, s - y1); x <= Math.min(x1, s - y0); x++) {
    const y = s - x; if (terrain(x, y) !== "deep") continue;
    const [cx, cy] = iso(x, y);
    c.fillStyle = "rgba(8,30,40,0.14)"; c.beginPath(); c.ellipse(cx, cy, TW * 0.8, TH * 0.8, 0, 0, 7); c.fill();
  }
  // ---- pass 1: land as stacked layers (sand < fields < meadow < grass < hill < forest < rock).
  // Each layer is one marching-squares region with noise-shifted crossings, filled as a single
  // path: borders run continuously across tiles, with no per-tile discs, rings or diamond corners.
  const edges: GroundEdge[] = [];
  const gx0 = x0 - 1, gy0 = y0 - 1, GW = x1 - x0 + 3, GH = y1 - y0 + 3;
  const lay = new Int8Array(GW * GH);
  for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) lay[j * GW + i] = LAYER[terrain(gx0 + i, gy0 + j)]!;
  const L_ = (x: number, y: number) => lay[(y - gy0) * GW + (x - gx0)]!;
  for (let s = x0 + y0; s <= x1 + y1; s++) for (let x = Math.max(x0, s - y1); x <= Math.min(x1, s - y0); x++) {
    const y = s - x, r = L_(x, y); if (r === 0) continue;
    let low = r, coast = false;
    for (const [dx, dy] of NB8) { const o = terrain(x + dx, y + dy); const q = LAYER[o]!; if (q < low) low = q; if (isWater(o)) coast = true; }
    if (low < r) { const [cx, cy] = iso(x, y); edges.push({ x, y, cx, cy, tr: terrain(x, y), r, coast }); }
  }
  const cross = (ax: number, ay: number, bx: number, by: number, L: number): Pt => {
    // a = inside tile, b = outside tile; position depends only on the edge, so neighbours agree
    const mx = (ax + bx) / 2, my = (ay + by) / 2;
    const n = vnoise(mx * 0.9, my * 0.9, 71 + L) * 0.6 + vnoise(mx * 2.3, my * 2.3, 83 + L) * 0.4;
    const f = 0.5 + (n - 0.5) * 0.8;
    const p = iso(ax + (bx - ax) * f, ay + (by - ay) * f); return [p[0], p[1]];
  };
  const shore: [Pt, Pt][] = [];
  for (let L = 1; L <= 7; L++) {
    c.beginPath();
    let any = false;
    for (let y = gy0; y < gy0 + GH - 1; y++) for (let x = gx0; x < gx0 + GW - 1; x++) {
      const cs: [number, number][] = [[x, y], [x + 1, y], [x + 1, y + 1], [x, y + 1]];
      const v = cs.map(([a, b]) => L_(a, b));
      const mn = Math.min(...v), mx = Math.max(...v);
      if (mx < L || mn > L) continue; // empty, or fully covered by the next layer
      const pts: Pt[] = [], xs: Pt[] = [];
      for (let k = 0; k < 4; k++) {
        const [ax, ay] = cs[k]!, [bx, by] = cs[(k + 1) & 3]!;
        const ia = v[k]! >= L, ib = v[(k + 1) & 3]! >= L;
        if (ia) { const p = iso(ax, ay); pts.push([p[0], p[1]]); }
        if (ia !== ib) { const q = ia ? cross(ax, ay, bx, by, L) : cross(bx, by, ax, ay, L); pts.push(q); xs.push(q); }
      }
      if (pts.length < 3) continue;
      any = true;
      c.moveTo(pts[0]![0], pts[0]![1]); for (let k = 1; k < pts.length; k++) c.lineTo(pts[k]![0], pts[k]![1]); c.closePath();
      if (L === 1 && mn === 0) for (let k = 0; k + 1 < xs.length; k += 2) shore.push([xs[k]!, xs[k + 1]!]);
    }
    if (!any) continue;
    c.fillStyle = texture(c, TEX_OF[LAYER_T[L]!]!) ?? "#7a8a50"; c.fill();
  }
  // shoreline: soft dark wet band with a faint breathing glint, drawn only along the real water line
  if (shore.length) {
    c.lineCap = "round";
    const stroke = (w: number, col: string) => { c.beginPath(); for (const [p, q] of shore) { c.moveTo(p[0], p[1]); c.lineTo(q[0], q[1]); } c.strokeStyle = col; c.lineWidth = w; c.stroke(); };
    stroke(4, "rgba(30,40,32,0.12)");
    stroke(1.6, "rgba(30,36,28,0.2)");
    if (detail) stroke(2.4, `rgba(235,240,230,${0.05 + 0.04 * Math.sin(t / 1400)})`);
  }
  return edges;
}

// ---- mid-zoom ground cache: static terrain (+ forests, crags) baked per 32x32-tile chunk ----
const CH = 32, PAD_TOP = 40;
const chunkCache = new Map<string, HTMLCanvasElement>();
function groundChunk(ix: number, iy: number, q: number, sk: string): HTMLCanvasElement | null {
  const key = `${ix},${iy},${q},${sk}`;
  const hit = chunkCache.get(key);
  if (hit) { chunkCache.delete(key); chunkCache.set(key, hit); return hit; }
  const X0 = ix * CH, Y0 = iy * CH, X1 = Math.min(MAP - 1, X0 + CH - 1), Y1 = Math.min(MAP - 1, Y0 + CH - 1);
  // bounding box of the chunk diamond in world pixels
  const left = iso(X0, Y1)[0] - TW, right = iso(X1, Y0)[0] + TW, top = iso(X0, Y0)[1] - TH - PAD_TOP, bottom = iso(X1, Y1)[1] + TH;
  const cv = document.createElement("canvas");
  cv.width = Math.ceil((right - left) * q); cv.height = Math.ceil((bottom - top) * q);
  const g = cv.getContext("2d")!;
  g.setTransform(q, 0, 0, q, -left * q, -top * q);
  // fill only this chunk's diamond so neighbouring chunks never double-paint
  g.save();
  const a = iso(X0 - 0.5, Y0 - 0.5), b = iso(X1 + 0.5, Y0 - 0.5), d = iso(X1 + 0.5, Y1 + 0.5), e = iso(X0 - 0.5, Y1 + 0.5);
  g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.lineTo(d[0], d[1]); g.lineTo(e[0], e[1]); g.closePath(); g.clip();
  drawGround(g, X0, X1, Y0, Y1, 0, false);
  g.restore();
  let missing = false;
  for (let s = X0 + Y0; s <= X1 + Y1; s++) for (let x = Math.max(X0, s - Y1); x <= Math.min(X1, s - Y0); x++) {
    const y = s - x, tr = terrain(x, y);
    const [cx, cy] = iso(x, y);
    if (tr === "forest" && hash(x, y, 19) > 0.25) tree(g, cx, cy + 2, 0.9 + hash(x, y, 20) * 0.3, 0, hash(x, y, 21), x * 13 + y, 0.6);
    else if (tr === "mountain" && hash(x, y, 26) > 0.6) drawNature(g, "crag", cx, cy + 4, 0.6 + hash(x, y, 27) * 0.4, 0, hash(x, y, 29) > 0.5);
  }
  if (!allTexturesReady() || !natureReady()) missing = true;
  (cv as HTMLCanvasElement & { ox?: number; oy?: number }).ox = left;
  (cv as HTMLCanvasElement & { ox?: number; oy?: number }).oy = top;
  if (missing) return cv; // not cached: re-bake once images have loaded
  chunkCache.set(key, cv);
  while (chunkCache.size > 140) chunkCache.delete(chunkCache.keys().next().value!);
  return cv;
}
function drawGroundChunks(c: C, x0: number, x1: number, y0: number, y1: number, z: number, vx0: number, vx1: number, vy0: number, vy1: number, far = false) {
  const q = z > 1.6 ? 2 : z > 0.6 ? 1 : 0.5, sk = seasonKey(renderNow);
  let baked = 0;
  const cx0 = Math.floor(x0 / CH), cx1 = Math.floor(x1 / CH), cy0 = Math.floor(y0 / CH), cy1 = Math.floor(y1 / CH);
  for (let s = cx0 + cy0; s <= cx1 + cy1; s++) for (let ix = Math.max(cx0, s - cy1); ix <= Math.min(cx1, s - cy0); ix++) {
    const iy = s - ix;
    const X0 = ix * CH, Y0 = iy * CH, X1 = X0 + CH - 1, Y1 = Y0 + CH - 1;
    if (iso(X1, Y0)[0] + TW < vx0 || iso(X0, Y1)[0] - TW > vx1 || iso(X1, Y1)[1] + TH < vy0 || iso(X0, Y0)[1] - TH - PAD_TOP > vy1) continue;
    const cached = chunkCache.has(`${ix},${iy},${q},${sk}`);
    if (!cached && baked >= 3) { // spread baking over frames; fall back to another cached quality if any
      const oq = [2, 1, 0.5].find((o) => o !== q && chunkCache.has(`${ix},${iy},${o},${sk}`));
      const lo = oq ? chunkCache.get(`${ix},${iy},${oq},${sk}`) as (HTMLCanvasElement & { ox: number; oy: number }) : undefined;
      if (lo && oq) c.drawImage(lo, lo.ox, lo.oy, lo.width / oq, lo.height / oq);
      else if (far) { /* overview bitmap already underneath */ }
      else { const [a, b] = iso(X0 + CH / 2, Y0 + CH / 2); c.fillStyle = "#7a8a50"; c.beginPath(); c.moveTo(a, b - CH * TH / 2); c.lineTo(a + CH * TW / 2, b); c.lineTo(a, b + CH * TH / 2); c.lineTo(a - CH * TW / 2, b); c.fill(); }
      continue;
    }
    if (!cached) baked++;
    const cv = groundChunk(ix, iy, q, sk) as (HTMLCanvasElement & { ox: number; oy: number }) | null;
    if (cv) c.drawImage(cv, cv.ox, cv.oy, cv.width / q, cv.height / q);
  }
}

// ---------------- player rituals: festive garlands and signposts ----------------
let signSrc: Signpost[] = [], signKey = "";
const signMap = new Map<number, Signpost>();
export function setSignposts(list: Signpost[]) { signSrc = list; }
/** Tile key → signpost, rebuilt only when the posts or the seed set change. */
export function signpostMap(seeds: Seed[]) {
  const k = signSrc.map((p) => p.id + p.message).join("|") + "#" + seeds.length;
  if (k !== signKey) {
    signKey = k; signMap.clear();
    for (const p of signSrc) { const tl = signTile(seeds, p.seed_id, p.target_id); if (tl) signMap.set(tl[1] * MAP + tl[0], p); }
  }
  return signMap;
}
/** Bunting strung across the village centre with little lanterns, swaying in the breeze. */
function drawFestive(c: C, cx: number, cy: number, t: number, sd: number, L: Light[]) {
  const cols = ["#c8553d", "#e8b04a", "#5d8a4e", "#3f6f9a", "#e9dcc0"];
  const poles: Pt[] = [[cx - 14, cy - 3], [cx, cy - 9], [cx + 14, cy - 3], [cx, cy + 6]];
  for (const [px, py] of poles) {
    line(c, [px, py], [px, py - 13], sd, 0.6, "#5a3f2a");
  }
  for (let i = 0; i < poles.length; i++) {
    const A = poles[i]!, B = poles[(i + 1) % poles.length]!;
    const a: Pt = [A[0], A[1] - 13], b: Pt = [B[0], B[1] - 13];
    const sag = 3 + Math.sin(t / 1400 + i + sd) * 0.6;
    const at = (u: number): Pt => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u + Math.sin(u * Math.PI) * sag];
    c.strokeStyle = "rgba(60,44,30,0.8)"; c.lineWidth = 0.25; c.beginPath();
    for (let k = 0; k <= 10; k++) { const p = at(k / 10); k ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); }
    c.stroke();
    for (let k = 1; k < 8; k++) {
      const p = at(k / 8), sw = Math.sin(t / 500 + k * 1.3 + i) * 0.35;
      c.fillStyle = cols[(k + i) % cols.length]!;
      c.beginPath(); c.moveTo(p[0] - 0.8, p[1]); c.lineTo(p[0] + 0.8, p[1]); c.lineTo(p[0] + sw, p[1] + 2.2); c.closePath(); c.fill();
    }
    const m = at(0.5); L.push({ x: m[0], y: m[1] + 1, r: 2.2 });
    c.fillStyle = "#ffd98a"; c.beginPath(); c.arc(m[0], m[1] + 1, 0.55, 0, 7); c.fill();
  }
}
/** Carved wooden waymark standing beside the road at the village edge. */
function drawSignpost(c: C, cx: number, cy: number, sd: number) {
  const x = cx + 5, y = cy + 1;
  c.fillStyle = "rgba(25,18,10,0.25)"; c.beginPath(); c.ellipse(x + 1, y + 0.3, 2, 0.7, 0, 0, 7); c.fill();
  line(c, [x, y], [x, y - 10], sd, 0.8, "#5a3f2a");
  c.fillStyle = "#9c7a52"; c.strokeStyle = "rgba(40,28,16,0.9)"; c.lineWidth = 0.35;
  c.beginPath(); c.moveTo(x - 4, y - 9.6); c.lineTo(x + 3, y - 9.6); c.lineTo(x + 4.6, y - 8.4); c.lineTo(x + 3, y - 7.2); c.lineTo(x - 4, y - 7.2); c.closePath(); c.fill(); c.stroke();
  c.strokeStyle = "rgba(60,40,22,0.6)"; c.beginPath(); c.moveTo(x - 3, y - 8.4); c.lineTo(x + 2.4, y - 8.4); c.stroke();
}

export function draw(
  c: C, w: number, h: number, dpr: number, cam: Camera, seeds: Seed[], plantings: Map<string, Planting>,
  now: number, hover: [number, number] | null, ghostOk: boolean | null,
) {
  renderNow = now; setArtTime(now); setNatureTime(now);
  lastPeople.length = 0; lastSources.length = 0;
  signpostMap(seeds);
  if (cam.zoom < OVERVIEW_BELOW) return drawOverview(c, w, h, dpr, cam, seeds, now);
  const t = performance.now(); setSpriteTime(t);
  const z = cam.zoom * dpr;
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.fillStyle = hsl(205, 30, 58); c.fillRect(0, 0, w, h);
  c.setTransform(z, 0, 0, z, w / 2 - cam.x * z, h / 2 - cam.y * z);

  const inv = (sx: number, sy: number) => toTile((sx - w / 2) / z + cam.x, (sy - h / 2) / z + cam.y);
  const cs = [inv(0, 0), inv(w, 0), inv(0, h), inv(w, h)];
  const x0 = Math.max(0, Math.min(...cs.map((p) => p[0])) - 2), x1 = Math.min(MAP - 1, Math.max(...cs.map((p) => p[0])) + 2);
  const y0 = Math.max(0, Math.min(...cs.map((p) => p[1])) - 2), y1 = Math.min(MAP - 1, Math.max(...cs.map((p) => p[1])) + 5);
  const detail = cam.zoom >= 1.3;
  const cs0x = cam.x - w / 2 / z, cs1x = cam.x + w / 2 / z, cs0y = cam.y - h / 2 / z, cs1y = cam.y + h / 2 / z;
  const L: Light[] = [];
  const tiles: { x: number; y: number; cx: number; cy: number; st: Structure | null }[] = [];

  let edges: GroundEdge[] = [];
  if (detail) edges = drawGround(c, x0, x1, y0, y1, t, true);
  else drawGroundChunks(c, x0, x1, y0, y1, z, cs0x, cs1x, cs0y, cs1y);
  // frayed edges: a few grass tufts and pebbles breaking up the borderline
  if (detail) {
    for (const e of edges) {
      const n = hash(e.x, e.y, 401) < 0.5 ? 1 : 2;
      for (let i = 0; i < n; i++) {
        const a = hash(e.x, e.y, 410 + i) * Math.PI * 2;
        const px = e.cx + Math.cos(a) * TW * 0.42, py = e.cy + Math.sin(a) * TH * 0.42;
        if (e.r >= 2) {
          c.strokeStyle = "rgba(78,96,46,0.45)"; c.lineWidth = 0.35; c.beginPath();
          for (let b = -1; b <= 1; b++) { c.moveTo(px + b * 0.4, py); c.lineTo(px + b * 0.8, py - 1.2 - hash(e.x, i, b + 5) * 0.6); }
          c.stroke();
        } else {
          // fine, varied gravel instead of grey marbles
          for (let g = 0; g < 4; g++) {
            const gx = px + (hash(e.x, e.y, 420 + g + i * 4) - 0.5) * 3, gy = py + (hash(e.x, e.y, 430 + g + i * 4) - 0.5) * 1.4;
            const l = 38 + hash(e.x, g, 440 + i) * 22;
            c.fillStyle = `hsla(32,14%,${l}%,0.55)`; c.beginPath(); c.ellipse(gx, gy, 0.35 + hash(g, e.y, 450) * 0.3, 0.22, 0, 0, 7); c.fill();
          }
        }
      }
    }
  }

  // ---- pass 1c: flat things on the ground ----
  for (let s = x0 + y0; s <= x1 + y1; s++) {
    for (let x = Math.max(x0, s - y1); x <= Math.min(x1, s - y0); x++) {
      const y = s - x;
      const [cx, cy] = iso(x, y);
      const tr = terrain(x, y);
      const st = structureAt(x, y, seeds, now);
      tiles.push({ x, y, cx, cy, st });
      if (!detail) {
        c.beginPath(); c.moveTo(cx, cy - TH / 2); c.lineTo(cx + TW / 2, cy); c.lineTo(cx, cy + TH / 2); c.lineTo(cx - TW / 2, cy); c.closePath();
        if (st && !FLAT.has(st.kind)) { /* drawn in pass 2 */ }
        else if (st?.kind === "field") { c.fillStyle = texture(c, acreOf(x, y, st.seed).ripe ? "wheat" : "crops") ?? hsl(44, 45, 66); c.fill(); }
        else if (st && (PATHLIKE.has(st.kind) || st.kind === "square")) { c.fillStyle = texture(c, st.kind === "street" || st.kind === "square" ? "cobble" : "dirt") ?? "#cdb084"; diamond(c, cx, cy, 0.85); c.fill(); }
        continue;
      }
      if (tr === "hill" || tr === "mountain") {
        const rs = resourceAt(x, y);
        if (rs) {
          const n = rs === "stone" ? 2 : 4;
          const [lit, mid, dark] = rs === "ore" ? ["#b98a6a", "#8a5a3e", "#4e3426"] : rs === "coal" ? ["#5a544e", "#36312d", "#1d1a18"] : ["#b8b2a6", "#8c8679", "#57524a"];
          for (let i = 0; i < n; i++) rock(c, cx + (hash(x, y, 90 + i) - 0.5) * 14, cy + (hash(x, y, 95 + i) - 0.5) * 6, (rs === "stone" ? 2.6 : 1.4) * (0.7 + hash(x, y, 99 + i) * 0.6), lit, mid, dark, rs === "ore" && i === 0);
        }
      }

      if (!st) continue;
      const sd = x * 1000 + y;
      const pp = P(cx, cy);
      if (st.kind === "bridge") {
        /* drawn as one continuous span per crossing (see drawBridgeSpan) */
      } else if (st.kind === "path" || st.kind === "street" || st.kind === "road" || st.kind === "avenue" || st.kind === "rail") {
        const street = st.kind === "street" || st.kind === "avenue";
        const col = texture(c, street ? "cobble" : "dirt") ?? (street ? "#b3aa98" : "#c49e6c");
        const wBase = street ? 7 : 4.6;
        const isP = (i: number, j: number) => { const o = structureAt(x + i, y + j, seeds, now); return !!o && PATHLIKE.has(o.kind); };
        // Connect orthogonal neighbours; a diagonal only when no orthogonal step already links them,
        // so adjacent path tiles never form a lattice of crossing strokes.
        const con: [number, number][] = [];
        for (const [i, j] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as [number, number][]) if (isP(i, j)) con.push([i, j]);
        for (const [i, j] of [[1, 1], [-1, -1], [1, -1], [-1, 1]] as [number, number][]) if (isP(i, j) && !isP(i, 0) && !isP(0, j)) con.push([i, j]);
        c.lineCap = "round"; c.lineJoin = "round"; c.strokeStyle = col;
        for (const [i, j] of con) {
          const m = pp(i * 0.5, j * 0.5);
          c.lineWidth = wBase * (0.92 + hash(x + i, y + j, 300) * 0.16);
          c.beginPath(); c.moveTo(cx, cy); c.lineTo(m[0], m[1]); c.stroke();
        }
        if (con.length === 1) {
          // dead end: the track tapers out into the grass instead of stopping abruptly
          const [i, j] = con[0]!; const e = pp(-i * 0.3, -j * 0.3);
          c.globalAlpha = 0.6; c.lineWidth = wBase * 0.55; c.beginPath(); c.moveTo(cx, cy); c.lineTo(e[0], e[1]); c.stroke(); c.globalAlpha = 1;
        } else {
          c.fillStyle = col; c.beginPath(); c.ellipse(cx, cy, wBase * 0.5, wBase * 0.32, 0, 0, 7); c.fill();
        }
        if (!street && hash(x, y, 34) > 0.6) { c.fillStyle = "rgba(60,45,28,0.12)"; c.beginPath(); c.ellipse(cx + (hash(x, y, 33) - 0.5) * 3, cy, 1.3, 0.5, 0, 0, 7); c.fill(); }
      } else if (st.kind === "square" || st.kind === "market" || st.kind === "well") {
        c.beginPath(); c.ellipse(cx, cy, TW * (0.56 + hash(x, y, 71) * 0.1), TH * (0.56 + hash(x, y, 72) * 0.1), 0, 0, 7);
        c.fillStyle = texture(c, "cobble") ?? "#d3cab6"; c.fill();
      } else if (st.kind === "field" || st.kind === "garden") {
        // Neighbouring plots merge into one acre: fill slightly past the tile, edge only towards non-fields.
        const ac = acreOf(x, y, st.seed), ripe = st.kind === "field" && ac.ripe;
        const q = [pp(-0.52, -0.52), pp(0.52, -0.52), pp(0.52, 0.52), pp(-0.52, 0.52)];
        c.beginPath(); q.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath();
        c.fillStyle = texture(c, ripe ? "wheat" : "crops") ?? hsl(ripe ? 44 : 80, 50, 60); c.fill();
        const same = (i: number, j: number) => { const o = structureAt(x + i, y + j, seeds, now); return !!o && o.kind === st.kind && acreOf(x + i, y + j, o.seed).id === ac.id; };
        if (st.kind === "field") {
          // furrows run the full length of the acre, continuing seamlessly across its tiles
          c.save(); c.clip(); c.strokeStyle = ripe ? "rgba(120,88,40,0.22)" : "rgba(50,70,30,0.25)"; c.lineWidth = 0.6;
          for (let k = -2; k <= 2; k++) {
            const f = k / 4;
            const [a0, a1] = ac.along ? [pp(-0.6, f), pp(0.6, f)] : [pp(f, -0.6), pp(f, 0.6)];
            c.beginPath(); c.moveTo(a0[0], a0[1]); c.lineTo(a1[0], a1[1]); c.stroke();
          }
          c.restore();
        }
        c.strokeStyle = "rgba(70,52,30,0.4)"; c.lineWidth = 0.9; c.lineCap = "round";
        const sides: [number, number, number, number][] = [[0, -1, 0, 1], [1, 0, 1, 2], [0, 1, 2, 3], [-1, 0, 3, 0]];
        for (const [i, j, a, b] of sides) if (!same(i, j)) { c.beginPath(); c.moveTo(q[a]![0], q[a]![1]); c.lineTo(q[b]![0], q[b]![1]); c.stroke(); }
      } else if (st.kind === "pasture") {
        c.beginPath(); c.moveTo(cx, cy - TH / 2); c.lineTo(cx + TW / 2, cy); c.lineTo(cx, cy + TH / 2); c.lineTo(cx - TW / 2, cy); c.closePath();
        c.fillStyle = texture(c, "meadow") ?? hsl(84, 34, 70, 0.6); c.fill();
      }
    }
  }

  // ---- villagers, bucketed by tile for depth sorting ----
  const folk = new Map<number, Pose[]>();
  lastPeople.length = 0;
  if (detail) for (const sd of seeds) {
    const r = radiusOf(effAge(sd, seeds, now)) + 2;
    if (sd.x + r < x0 || sd.x - r > x1 || sd.y + r < y0 || sd.y - r > y1) continue;
    for (const q of townPoses(sd, seeds, now)) {
      const k = Math.round(q.y) * MAP + Math.round(q.x);
      if (!folk.has(k)) folk.set(k, []);
      folk.get(k)!.push(q);
    }
  }
  const simpleFolk = cam.zoom < 2.2;

  // ---- bridges: one straight span per water crossing, abutment to abutment ----
  if (detail) for (const l of links(seeds)) {
    const n = l.tiles.length;
    for (let i = 0; i < n; i++) {
      if (!l.water[i]) continue;
      let j = i; while (j + 1 < n && l.water[j + 1]) j++;
      const s0 = Math.max(0, i - 1), s1 = Math.min(n - 1, j + 1);
      const A = l.tiles[s0]!, B = l.tiles[s1]!;
      const built = [s0, s1].every((k) => { const st = structureAt(l.tiles[k]![0], l.tiles[k]![1], seeds, now); return !!st && PATHLIKE.has(st.kind); })
        && structureAt(l.tiles[i]![0], l.tiles[i]![1], seeds, now)?.kind === "bridge";
      if (built) {
        const [ax, ay] = iso(A[0], A[1]), [bx, by] = iso(B[0], B[1]);
        if (Math.max(ax, bx) > cs0x - 60 && Math.min(ax, bx) < cs1x + 60 && Math.max(ay, by) > cs0y - 60 && Math.min(ay, by) < cs1y + 60)
          drawBridgeSpan(c, [ax, ay], [bx, by], A[0] * 31 + A[1], t);
      }
      i = j;
    }
  }

  // ---- pass 2: standing objects in depth order ----
  for (const { x, y, cx, cy, st } of tiles) {
    const tr = terrain(x, y);
    if (st?.kind === "avenue" && hash(x,y,92)>0.5) drawNature(c,"oak",cx+9,cy+2,0.22);
    if (!detail) {
      if (st?.build !== undefined) drawSite(c, st, cx, cy, t, false);
      else if (st && !FLAT.has(st.kind)) drawBuildingSprite(c, st.kind, cx, cy, st.v);
      continue; // forests and crags are baked into the ground chunks
    }
    if (tr === "mountain" && hash(x, y, 26) > 0.55) {
      const sc = 0.55 + hash(x, y, 27) * 0.5;
      drawNature(c, "crag", cx + (hash(x, y, 28) - 0.5) * 6, cy + 4, sc, 0, hash(x, y, 29) > 0.5);
    }
    if (tr === "forest" && !st) {
      if (hash(x, y, 19) > 0.35) tree(c, cx + 6, cy - 1, 0.75 + hash(x, y, 20) * 0.3, t, hash(x, y, 21), x * 17 + y, 0.6);
      tree(c, cx - 5, cy + 3, 0.85 + hash(x, y, 17) * 0.35, t, hash(x, y, 18), x * 13 + y, 0.6);
    } else if ((tr === "grass" || tr === "meadow" || tr === "hill") && !st) {
      if (hash(x, y, 22) > 0.95) tree(c, cx, cy + 1, 0.9, t, hash(x, y, 23), x * 19 + y, 0.2);
      else if (hash(x, y, 22) > 0.9) drawNature(c, "bush", cx + (hash(x, y, 24) - 0.5) * 12, cy + 2, 0.8 + hash(x, y, 25) * 0.5);
    }
    if (st) drawStructure(c, st, cx, cy, x, y, t, L);
    if (st && (x === st.seed.x && y === st.seed.y) && isBlessed(st.seed, now)) drawFestive(c, cx, cy, t, x * 7 + y, L);
    if (signMap.has(y * MAP + x)) drawSignpost(c, cx, cy, x * 13 + y);
    const fk = folk.get(y * MAP + x);
    if (fk) {
      fk.sort((a, b) => a.x + a.y - b.x - b.y);
      for (const q of fk) {
        const [px, py] = iso(q.x, q.y);
        const pk = `${q.p.seed.id}:${q.p.id}`, sel = peopleFocus.sel === pk, hov = peopleFocus.hover === pk;
        if (sel || hov) {
          const pulse = 0.5 + Math.sin(t / 300) * 0.15;
          c.fillStyle = `rgba(255,214,140,${sel ? 0.35 : pulse * 0.4})`; c.beginPath(); c.ellipse(px, py, 4, 2, 0, 0, 7); c.fill();
          c.strokeStyle = sel ? "rgba(255,226,160,0.95)" : "rgba(255,236,190,0.7)"; c.lineWidth = sel ? 0.8 : 0.6; c.stroke();
        }
        drawPerson(c, px, py, q, t, simpleFolk); lastPeople.push({ x: px, y: py, q });
        if (hov && !sel) {
          c.font = "600 4px system-ui, sans-serif"; c.textAlign = "center";
          const w = c.measureText(q.p.first).width + 3;
          c.fillStyle = "rgba(40,32,24,0.75)"; c.fillRect(px - w / 2, py - 11, w, 5);
          c.fillStyle = "#f6ecd6"; c.fillText(q.p.first, px, py - 7.3);
        }
      }
    }
    if (hover && hover[0] === x && hover[1] === y) {
      c.beginPath(); c.moveTo(cx, cy - TH / 2); c.lineTo(cx + TW / 2, cy); c.lineTo(cx, cy + TH / 2); c.lineTo(cx - TW / 2, cy); c.closePath();
      c.fillStyle = ghostOk === false ? "rgba(180,80,60,0.18)" : "rgba(255,240,200,0.14)"; c.fill();
    }
  }

  for (const l of links(seeds)) if (railReady(l,seeds,now)) drawRails(c,l,seeds,now);

  // ---- life on the trade roads ----
  if (detail) for (const l of links(seeds)) {
    const prog = roadProgress(l, now);
    if (prog <= 0) continue;
    if (prog < 1) {
      // road under construction: a work crew at each growing end
      const pts = smoothRoad(l), n = pts.length, k = Math.min(n - 2, Math.floor(prog * n / 2));
      const sn = l.a.x * 7 + l.b.y * 13;
      for (const [i, j] of [[k, k + 1], [n - 1 - k, n - 2 - k]] as const) {
        const [ax, ay] = pts[i]!, [bx, by] = pts[Math.max(0, Math.min(n - 1, j))]!;
        if (ax < cs0x - 40 || ax > cs1x + 40 || ay < cs0y - 40 || ay > cs1y + 40) continue;
        drawRoadWorks(c, ax, ay, bx - ax, by - ay, t, sn + i);
      }
      continue;
    }
    const pts = smoothRoad(l);
    const n = pts.length;
    const mature = Math.min(1, Math.min(ageHours(l.a, now), ageHours(l.b, now)) / 240);
    const count = 1 + Math.round(mature * 3);
    const sn = l.a.x * 7 + l.b.y * 13;
    for (let k = 0; k < count; k++) {
      const secsPerTile = hash(sn, k, 3) < 0.55 ? 1.6 + hash(sn, k, 1) * 1.2 : 3.2 + hash(sn, k, 1) * 1.2;
      const ph = ((t / 1000 / secsPerTile + hash(sn, k, 2) * n * 2) % (n * 2));
      const fwd = ph < n;
      const f = fwd ? ph : n * 2 - ph;
      const i = Math.min(n - 2, Math.floor(f)), u = f - i;
      // travellers only show on open road – inside towns they are "between the houses"
      const [tx, ty] = l.tiles[i]!;
      const st = structureAt(tx, ty, seeds, now);
      if (!st || (st.kind !== "road" && st.kind !== "bridge")) continue;
      const [ax, ay] = pts[i]!, [bx, by] = pts[i + 1]!;
      const x = ax + (bx - ax) * u, y = ay + (by - ay) * u;
      if (x < cs0x - 40 || x > cs1x + 40 || y < cs0y - 40 || y > cs1y + 40) continue;
      const bob = Math.sin(t / 180 + k) * 0.4;
      let dx = (bx - ax) * (fwd ? 1 : -1), dy = (by - ay) * (fwd ? 1 : -1);
      const dl = Math.hypot(dx, dy) || 1; dx /= dl; dy /= dl;
      if (hash(sn, k, 3) < 0.55) drawCart(c, x, y, dx, dy, bob, sn + k, hsl(35 + hash(sn, k, 4) * 20, 35, 82), t);
      else {
        drawWanderer(c, x, y, dx, dy, t, sn + k);
      }
    }
  }

  // ---- paper, light, labels (screen space) ----
  c.setTransform(1, 0, 0, 1, 0, 0);
  const vg = c.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75);
  vg.addColorStop(0, "rgba(20,15,10,0)"); vg.addColorStop(1, "rgba(20,15,10,0.32)");
  c.fillStyle = vg; c.fillRect(0, 0, w, h);

  const hr = worldHour(Date.now());
  // darkness: 0 by day, ramps through dusk (18–21:30) and dawn (5–7:30), full at night
  const sm = (a: number, b: number, x: number) => { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
  const night = hr >= 12 ? sm(18, 21.5, hr) : 1 - sm(5, 7.5, hr);
  const dusk = Math.max(0, 1 - Math.abs(hr - 19) / 1.8) + Math.max(0, 1 - Math.abs(hr - 6.5) / 1.3);
  if (dusk > 0) { c.fillStyle = `rgba(240,140,80,${dusk * 0.14})`; c.fillRect(0, 0, w, h); }
  if (night > 0.02) {
    // deep indigo multiply keeps the painting legible but truly dark
    c.globalCompositeOperation = "multiply";
    c.fillStyle = `rgba(${Math.round(255 - night * 205)},${Math.round(255 - night * 195)},${Math.round(255 - night * 140)},1)`;
    c.fillRect(0, 0, w, h);
    c.globalCompositeOperation = "source-over";
    c.fillStyle = `rgba(14,18,44,${night * 0.25})`; c.fillRect(0, 0, w, h);
    // cool moonlight sheen from the upper right
    const mg = c.createRadialGradient(w * 0.85, -h * 0.1, 0, w * 0.85, -h * 0.1, Math.max(w, h));
    mg.addColorStop(0, `rgba(150,170,230,${0.12 * night})`); mg.addColorStop(1, "rgba(150,170,230,0)");
    c.fillStyle = mg; c.fillRect(0, 0, w, h);
    c.globalCompositeOperation = "lighter";
    for (let i = 0; i < L.length; i++) {
      const l = L[i];
      if (!l) continue;
      const sx = (l.x - cam.x) * z + w / 2, sy = (l.y - cam.y) * z + h / 2;
      const r = l.r * z * 2.2;
      if (sx < -r || sy < -r || sx > w + r || sy > h + r) continue;
      // Window light is painted from the actual image, never guessed wall coordinates.
      const fl = candleFlicker(t, l.building?.seed ?? l.x * 7 + l.y * 13);
      if (l.building) {
        c.save();
        c.setTransform(z, 0, 0, z, w / 2 - cam.x * z, h / 2 - cam.y * z);
        drawBuildingNight(c, l.building.kind, l.x, l.y, l.building.variant, night * fl);
        c.restore();
        continue;
      }
      const g = c.createRadialGradient(sx, sy, 0, sx, sy, r);
      g.addColorStop(0, `rgba(255,190,100,${0.7 * night * fl})`);
      g.addColorStop(0.25, `rgba(255,150,60,${0.32 * night * fl})`);
      g.addColorStop(1, "rgba(255,130,50,0)");
      c.fillStyle = g; c.fillRect(sx - r, sy - r, r * 2, r * 2);
    }
    c.globalCompositeOperation = "source-over";
  }

  c.font = `700 ${Math.round(22 * dpr)}px Georgia, 'Times New Roman', serif`; c.textAlign = "center";
  c.lineJoin = "round";
  for (const sd of seeds) {
    const [ix, iy] = iso(sd.x, sd.y);
    const sx = (ix - cam.x) * z + w / 2, sy = (iy - cam.y) * z + h / 2 - 22 * z - 8 * dpr;
    c.lineWidth = 4 * dpr; c.strokeStyle = "rgba(246,238,220,0.9)"; c.strokeText(sd.name, sx, sy);
    c.fillStyle = INK; c.fillText(sd.name, sx, sy);
  }
  // twin towns get a joint ribbon label between them
  c.font = `600 ${Math.round(17 * dpr)}px Georgia, 'Times New Roman', serif`;
  for (const l of links(seeds)) {
    if (!isTwin(l, seeds, now)) continue;
    const [ix, iy] = iso((l.a.x + l.b.x) / 2, (l.a.y + l.b.y) / 2);
    const sx = (ix - cam.x) * z + w / 2, sy = (iy - cam.y) * z + h / 2;
    const txt = `${l.a.name} ∞ ${l.b.name}`;
    c.lineWidth = 4 * dpr; c.strokeStyle = "rgba(246,238,220,0.9)"; c.strokeText(txt, sx, sy);
    c.fillStyle = hsl(20, 45, 38); c.fillText(txt, sx, sy);
  }
}
