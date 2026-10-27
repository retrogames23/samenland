import { setArtTime } from "./season-art";
import { seasonKey } from "./season";
import { drawBuildingSprite } from "./building-sprites";
import { texture, drawNature, texSample, allTexturesReady, setNatureTime, boatImage, planksPattern, type Tex } from "./nature-sprites";
import { townPoses, type Pose } from "./people";
import { hash, vnoise, structureAt, terrain, resourceAt, isWater, MAP, FLAT, links, roadProgress, isTwin, railReady, ageHours, effAge, radiusOf, type Planting, type Seed, type Structure, type Kind } from "./world";

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
function smoke(c: C, x: number, y: number, t: number, sd: number, big = 1) {
  for (let i = 0; i < 4; i++) {
    const ph = (t / (3200 * big) + hash(sd, 1, 1) + i / 4) % 1;
    c.fillStyle = `rgba(236,232,224,${0.55 * (1 - ph)})`;
    c.beginPath(); c.arc(x + ph * 6 * big + Math.sin(ph * 6 + sd) * 1.2, y - ph * 16 * big, (1 + ph * 3) * big, 0, Math.PI * 2); c.fill();
  }
}

export type Light = { x: number; y: number; r: number };
/** Hovered / selected villager ids, set by the UI so the canvas can highlight them. */
export const peopleFocus: { hover: string | null; sel: string | null } = { hover: null, sel: null };

/** Small shaded sheep (~hip height of a villager), grazing with an occasional head lift. */
function drawSheep(c: C, x: number, y: number, flip: boolean, t: number) {
  const d = flip ? -1 : 1;
  const graze = Math.sin(t / 2600) > -0.3;
  c.fillStyle = "rgba(30,36,22,0.28)"; c.beginPath(); c.ellipse(x, y + 0.3, 2.6, 0.9, 0, 0, 7); c.fill();
  c.strokeStyle = "#2b2420"; c.lineWidth = 0.45; c.lineCap = "round";
  for (const lx of [-1.3, -0.5, 0.6, 1.3]) { c.beginPath(); c.moveTo(x + lx * d, y - 1); c.lineTo(x + lx * d, y + 0.1); c.stroke(); }
  const g = c.createRadialGradient(x - 0.6 * d, y - 2.6, 0.3, x, y - 1.8, 2.6);
  g.addColorStop(0, "#fbf6ea"); g.addColorStop(0.7, "#e2d8c4"); g.addColorStop(1, "#b9ad96");
  c.fillStyle = g; c.beginPath();
  for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2; const r = 0.75 + 0.15 * Math.sin(i * 2.3); c.ellipse(x + Math.cos(a) * 1.3, y - 1.9 + Math.sin(a) * 0.6, r, r * 0.8, 0, 0, 7); }
  c.fill();
  c.strokeStyle = "rgba(70,58,44,0.55)"; c.lineWidth = 0.25; c.stroke();
  const hx = x + 2.3 * d, hy = graze ? y - 1.1 : y - 2.6;
  c.fillStyle = "#3a302a"; c.beginPath(); c.ellipse(hx, hy, 0.7, 0.55, graze ? 0.6 * d : 0, 0, 7); c.fill();
  c.beginPath(); c.ellipse(hx - 0.4 * d, hy - 0.45, 0.35, 0.18, -0.5 * d, 0, 7); c.fill();
}

/** Faceted rock with light, mid and dark faces (ore gets a rusty vein glint). */
function rock(c: C, x: number, y: number, s: number, lit: string, mid: string, dark: string, glint: boolean) {
  c.fillStyle = "rgba(30,26,20,0.3)"; c.beginPath(); c.ellipse(x + 0.3 * s, y + 0.2 * s, 1.3 * s, 0.5 * s, 0, 0, 7); c.fill();
  const top: Pt = [x - 0.2 * s, y - 1.3 * s];
  const face = (pts: Pt[], col: string) => { c.fillStyle = col; c.beginPath(); c.moveTo(...pts[0]!); for (const p of pts.slice(1)) c.lineTo(...p); c.closePath(); c.fill(); };
  face([[x - 1.2 * s, y], top, [x + 0.1 * s, y + 0.3 * s]], lit);
  face([top, [x + 1.1 * s, y - 0.3 * s], [x + 0.1 * s, y + 0.3 * s]], mid);
  face([[x + 1.1 * s, y - 0.3 * s], [x + 1.2 * s, y], [x + 0.1 * s, y + 0.3 * s]], dark);
  c.strokeStyle = "rgba(25,20,16,0.5)"; c.lineWidth = 0.25; c.beginPath(); c.moveTo(x - 1.2 * s, y); c.lineTo(...top); c.lineTo(x + 1.1 * s, y - 0.3 * s); c.lineTo(x + 1.2 * s, y); c.lineTo(x + 0.1 * s, y + 0.3 * s); c.closePath(); c.stroke();
  if (glint) { c.fillStyle = "#d98a4a"; c.fillRect(x - 0.3 * s, y - 0.7 * s, 0.35 * s, 0.25 * s); }
}
const roofHue = (s: Structure, slate = false) => slate ? [215, 12, 46] : [12 + s.v * 18 + (s.seed.hue % 20) - 10, 48, 50];

function drawStructure(c: C, s: Structure, cx: number, cy: number, x: number, y: number, t: number, L: Light[]) {
  const sd = x * 1000 + y;
  if (drawBuildingSprite(c, s.kind, cx, cy, s.v)) {
    if (s.kind === "campfire") {
      c.fillStyle = "rgba(255,183,57,0.7)"; c.beginPath(); c.ellipse(cx,cy-4,1.5,2.4+Math.sin(t/160)*0.5,0,0,7); c.fill();
      L.push({x:cx,y:cy-3,r:7}); smoke(c,cx,cy-6,t,sd,0.25);
    }
    if (["farmhouse", "cottage", "inn", "bakery", "townhouse", "smithy"].includes(s.kind)) {
      L.push({ x: cx - 2, y: cy - 6, r: s.kind === "smithy" ? 5 : 2.5 });
    }
    if (["factory", "manufactory", "steamworks", "smithy", "bakery", "inn"].includes(s.kind)) {
      smoke(c, cx + 4, cy - (s.kind === "factory" ? 24 : 18), t, sd, s.kind === "factory" ? 1.5 : 0.6);
    }
    return;
  }
  const v = s.v, rx = v > 0.5;
  const [rh, rs, rl] = roofHue(s, s.kind === "townhouse" && v > 0.6 || s.kind === "warehouse");
  const pal: Pal = { wall: "#efe3c8", wallD: "#d4c19c", roof: hsl(rh!, rs!, rl!), roofD: hsl(rh!, rs!, rl! - 12) };
  switch (s.kind) {
    case "well": {
      blob(c, cx, cy, 4, "#b9b2a3", sd); blob(c, cx, cy - 0.5, 2.4, "#6f9fb0", sd + 1);
      line(c, [cx - 3.5, cy], [cx - 3.5, cy - 8], sd + 2, 0.7); line(c, [cx + 3.5, cy], [cx + 3.5, cy - 8], sd + 3, 0.7);
      shape(c, [[cx - 5.5, cy - 7], [cx + 5.5, cy - 7], [cx, cy - 12]], sd + 4, hsl(s.seed.hue, 40, 48));
      break;
    }
    case "farmhouse": case "cottage": case "inn": case "bakery": {
      const big = s.kind === "inn" ? 1.15 : s.kind === "cottage" ? 0.85 : 1;
      const p = gable(c, cx, cy, 0.3 * big, 0.22 * big, 6 * big, 6 * big, rx, pal, sd);
      doorV(c, p, -0.1, 0.22 * big, sd + 30);
      windowV(c, p, 0.12, 0.22 * big, 2, sd + 31, L);
      if (s.kind === "inn") { const q = p(0.3, 0.3, 5); line(c, [q[0], q[1]], [q[0] + 3, q[1]], sd + 32, 0.6); shape(c, [[q[0] + 1.5, q[1]], [q[0] + 4, q[1]], [q[0] + 4, q[1] + 2.5], [q[0] + 1.5, q[1] + 2.5]], sd + 33, "#d9a44a"); }
      if (s.kind === "bakery" || s.kind === "inn" || v > 0.6) { const q = p(0.15, 0.02, 6 * big + 6 * big); smoke(c, q[0], q[1], t, sd); }
      break;
    }
    case "barn": {
      const bp: Pal = { wall: "#a8513f", wallD: "#86402f", roof: "#7c6a58", roofD: "#5f5143" };
      const p = gable(c, cx, cy, 0.36, 0.28, 7, 8, rx, bp, sd);
      shape(c, [p(-0.12, 0.28, 0), p(0.12, 0.28, 0), p(0.12, 0.28, 5.5), p(-0.12, 0.28, 5.5)], sd + 40, "#efe3c8");
      line(c, p(-0.12, 0.28, 0), p(0.12, 0.28, 5.5), sd + 41); line(c, p(0.12, 0.28, 0), p(-0.12, 0.28, 5.5), sd + 42);
      break;
    }
    case "hay": {
      blob(c, cx - 3, cy, 3.2, "#e0c070", sd); blob(c, cx + 3, cy + 1.5, 3, "#d8b862", sd + 1); blob(c, cx, cy - 2, 3.4, "#e6c878", sd + 2);
      break;
    }
    case "church": {
      const p = gable(c, cx, cy, 0.34, 0.2, 9, 7, true, { ...pal, wall: "#ece6da", wallD: "#cfc6b4", roof: "#6c7480", roofD: "#555c66" }, sd);
      windowV(c, p, 0.0, 0.2, 3, sd + 50, L, 0.04, 3.4);
      const tp = box(c, ...p(0.42, 0.0, 0), 0.11, 0.11, 18, "#ece6da", "#cfc6b4", "#cfc6b4", sd + 51);
      const top = tp(0, 0, 18);
      shape(c, [tp(-0.11, 0.11, 18), tp(0.11, 0.11, 18), tp(0.11, -0.11, 18), [top[0], top[1] - 10]], sd + 52, "#6c7480");
      line(c, [top[0], top[1] - 10], [top[0], top[1] - 14], sd + 53, 0.6);
      line(c, [top[0] - 1.5, top[1] - 12.5], [top[0] + 1.5, top[1] - 12.5], sd + 54, 0.6);
      break;
    }
    case "mill": {
      const p = P(cx, cy);
      shape(c, [p(-0.16, 0.16, 0), p(0.16, 0.16, 0), p(0.12, 0.12, 14), p(-0.12, 0.12, 14)], sd, "#e7dcc4");
      shape(c, [p(0.16, -0.16, 0), p(0.16, 0.16, 0), p(0.12, 0.12, 14), p(0.12, -0.12, 14)], sd + 1, "#cbb995");
      const hub = p(0.1, 0.1, 16);
      shape(c, [p(-0.14, 0.14, 14), p(0.14, 0.14, 14), p(0.14, -0.14, 14), [hub[0] - 1, hub[1] - 5]], sd + 2, pal.roof);
      const ang = t / 1800;
      for (let k = 0; k < 4; k++) {
        const a = ang + (k * Math.PI) / 2, ex = hub[0] + Math.cos(a) * 11, ey = hub[1] + Math.sin(a) * 8;
        line(c, hub, [ex, ey], sd + 3 + k, 0.6);
        const nx = -Math.sin(a) * 2.2, ny = Math.cos(a) * 1.6;
        shape(c, [[hub[0] + Math.cos(a) * 3, hub[1] + Math.sin(a) * 2.2], [ex, ey], [ex + nx, ey + ny], [hub[0] + Math.cos(a) * 3 + nx, hub[1] + Math.sin(a) * 2.2 + ny]], sd + 8 + k, "rgba(239,227,200,0.85)");
      }
      break;
    }
    case "townhouse": {
      const p = gable(c, cx, cy, 0.3, 0.3, 13, 6, rx, { ...pal, wall: "#f1e8d4", wallD: "#d8c8a6" }, sd);
      // half-timbering on the front wall
      c.globalAlpha = 0.8;
      line(c, p(-0.3, 0.3, 6.5), p(0.3, 0.3, 6.5), sd + 60, 0.7, "#6b4a32");
      line(c, p(-0.3, 0.3, 0.6), p(0, 0.3, 6.5), sd + 61, 0.6, "#6b4a32");
      line(c, p(0, 0.3, 6.5), p(0.3, 0.3, 13), sd + 62, 0.6, "#6b4a32");
      c.globalAlpha = 1;
      doorV(c, p, -0.15, 0.3, sd + 63);
      windowV(c, p, 0.14, 0.3, 2.2, sd + 64, L); windowV(c, p, -0.14, 0.3, 8.5, sd + 65, L); windowV(c, p, 0.14, 0.3, 8.5, sd + 66, L);
      break;
    }
    case "workshop": case "smithy": {
      const p = gable(c, cx, cy, 0.3, 0.26, 5, 3.5, rx, { ...pal, wall: "#c9b48e", wallD: "#a9946f", roof: "#7c6a58", roofD: "#5f5143" }, sd);
      doorV(c, p, 0, 0.26, sd + 70, 0.1, 3.6, "#4b3a2e");
      const q = p(-0.18, 0, 8.5);
      shape(c, [[q[0] - 1, q[1] + 3], [q[0] + 1, q[1] + 3], [q[0] + 1, q[1] - 2], [q[0] - 1, q[1] - 2]], sd + 71, "#8a5a44");
      smoke(c, q[0], q[1] - 2, t, sd, s.kind === "smithy" ? 1.2 : 0.9);
      if (s.kind === "smithy") L.push({ x: p(0, 0.26, 2)[0], y: p(0, 0.26, 2)[1], r: 6 });
      break;
    }
    case "warehouse": {
      const p = gable(c, cx, cy, 0.42, 0.26, 8, 4, rx, { ...pal, wall: "#b8a88c", wallD: "#9a8a70" }, sd);
      c.globalAlpha = 0.5;
      for (let i = 1; i < 6; i++) { const u = -0.42 + i * 0.14; line(c, p(u, 0.26, 0), p(u, 0.26, 8), sd + 80 + i, 0.35); }
      c.globalAlpha = 1;
      doorV(c, p, 0.1, 0.26, sd + 79, 0.1, 5, "#5b4636");
      break;
    }
    case "factory": case "sawmill": {
      const fac = s.kind === "factory";
      const p = box(c, cx, cy, 0.42, 0.34, fac ? 9 : 6, fac ? "#b5614a" : "#b09070", fac ? "#94503c" : "#8f7458", fac ? "#8a7a6c" : "#7c6a58", sd);
      const H = fac ? 9 : 6;
      for (let k = 0; k < 3; k++) {
        const u0 = -0.42 + k * 0.28;
        shape(c, [p(u0, 0.34, H), p(u0 + 0.28, 0.34, H), p(u0 + 0.28, 0.34, H + 4), p(u0 + 0.28, -0.34, H + 4), p(u0 + 0.28, -0.34, H)], sd + 90 + k, "#6f7882");
        windowV(c, p, u0 + 0.14, 0.34, 3, sd + 95 + k, L, 0.07, 2.8);
      }
      if (fac) {
        const q = p(0.3, -0.25, H);
        shape(c, [[q[0] - 1.6, q[1]], [q[0] + 1.6, q[1]], [q[0] + 1.2, q[1] - 18], [q[0] - 1.2, q[1] - 18]], sd + 99, "#9c4e3a");
        smoke(c, q[0], q[1] - 19, t, sd, 1.8);
      } else {
        const q = p(0.3, 0.55, 0);
        for (let k = 0; k < 3; k++) blob(c, q[0] + k * 2.4, q[1] - k * 0.8, 1.3, "#a87a52", sd + 120 + k);
      }
      break;
    }
    case "pasture": {
      const p = P(cx, cy);
      c.globalAlpha = 0.85;
      line(c, p(-0.48, 0.48, 1.5), p(0.48, 0.48, 1.5), sd, 0.5, "#6b4a32");
      line(c, p(0.48, -0.48, 1.5), p(0.48, 0.48, 1.5), sd + 1, 0.5, "#6b4a32");
      c.globalAlpha = 1;
      if (v > 0.35) {
        const n = v > 0.7 ? 3 : 2;
        for (let k = 0; k < n; k++) {
          const ph = t / 9000 + v * 20 + k * 2.1;
          drawSheep(c, cx + Math.sin(ph) * 5 + (k - 1) * 4, cy + Math.cos(ph * 0.7) * 2 + (k % 2) * 2, Math.cos(ph) > 0, t + k * 1700 + sd);
        }
      }
      break;
    }
    case "market": {
      const cols = ["#c8574a", "#e0b04a", "#5b8fa8"];
      for (let k = 0; k < 3; k++) {
        const ox = cx - 6 + k * 6, oy = cy + (k - 1) * 1.5;
        line(c, [ox - 2, oy], [ox - 2, oy - 4], sd + k, 0.5); line(c, [ox + 2, oy], [ox + 2, oy - 4], sd + k + 5, 0.5);
        shape(c, [[ox - 3, oy - 4], [ox + 3, oy - 4], [ox + 2, oy - 6.5], [ox - 2, oy - 6.5]], sd + 10 + k, cols[k]!);
      }
      break;
    }
    default: break;
  }
}

const RANK: Record<string, number> = { deep: 0, water: 1, sand: 2, fertile: 3, meadow: 3, grass: 4, hill: 5, forest: 6, mountain: 7 };
const NB8: [number, number][] = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]];
const PATHLIKE: ReadonlySet<Kind> = new Set(["path", "street", "square", "well", "market", "road", "bridge", "avenue", "rail"]);

/** Whole map fits ~1000px wide at this zoom. */
export const MIN_ZOOM = 0.025;
const OVERVIEW_BELOW = 0.45;
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

/** Ox pulling a covered cart, oriented along the travel direction (screen-space unit dx,dy). */
function drawCart(c: C, x: number, y: number, dx: number, dy: number, bob: number, sd: number, cover: string, t: number) {
  const px = -dy, py = dx; // side vector
  const P = (f: number, s: number, h = 0): Pt => [x + dx * f + px * s, y + dy * f * 0.5 + py * s * 0.5 - h];
  const step = Math.sin(t / 160 + sd) * 0.5;
  // ox: legs, body, head
  for (const [f, s] of [[5, 1], [5, -1], [8, 1], [8, -1]] as const) line(c, P(f + (s > 0 ? step : -step), s * 0.9), P(f, s * 0.9, 2.2), sd + f + s, 0.55);
  blob(c, ...P(6.5, 0, 3 + bob * 0.5), 2.2, "#8a6a4c", sd, true);
  blob(c, ...P(9.3, 0, 3.4 + bob * 0.5), 1.1, "#6f533b", sd + 1, true);
  line(c, P(4.5, 0, 2.5), P(2.2, 0, 2.2), sd + 2, 0.5); // shaft
  // wheels
  c.fillStyle = INK;
  for (const s of [1.8, -1.8]) { const q = P(-1, s, 1); c.beginPath(); c.ellipse(q[0], q[1], 1.3, 1.3, 0, 0, 7); c.fill(); }
  // cart bed + canvas cover
  shape(c, [P(-3.5, 1.8, 1.8), P(2.2, 1.8, 1.8), P(2.2, -1.8, 1.8), P(-3.5, -1.8, 1.8)], sd + 3, "#a07a52");
  // arched canvas hood over the bed
  const a = P(-3.3, 0, 2), b = P(2, 0, 2);
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, hw = Math.max(1.6, Math.hypot(b[0] - a[0], b[1] - a[1]) / 2);
  c.beginPath(); c.ellipse(mx, my, hw, 3.4, Math.atan2(b[1] - a[1], b[0] - a[0]), Math.PI, Math.PI * 2); c.closePath();
  c.fillStyle = cover; c.fill(); c.strokeStyle = INK; c.lineWidth = 0.55; c.stroke();
  c.globalAlpha = 0.5; line(c, [mx, my], [mx, my - 3.3], sd + 6, 0.4); c.globalAlpha = 1;
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
  const bounce = walk * Math.abs(Math.sin(ph)) * 0.1 * s + (kid && q.act === "play" ? Math.max(0, Math.sin(ph * 0.5)) * 0.5 : 0);
  // shadow
  // grounded: soft ambient shadow cast to the lower right + dark contact patch under the feet
  c.fillStyle = "rgba(25,20,10,0.18)"; c.beginPath(); c.ellipse(X + 1.1 * s, Y + 0.25, 2.3 * s, 0.85 * s, 0.15, 0, 7); c.fill();
  c.fillStyle = "rgba(20,15,8,0.38)"; c.beginPath(); c.ellipse(X, Y, 1.05 * s, 0.42 * s, 0, 0, 7); c.fill();
  if (simple) {
    // Cheap but proportioned figure for mid zoom: two striding legs, tapered torso, arms, hair/hat.
    const sw = Math.sin(ph) * 0.9 * walk * s, hipY = Y - 3.5 * s - bounce, shY = hipY - 2.5 * s;
    const fem = p.sex === "f" && !kid;
    const lc = fem ? skin : pants;
    limb(c, [[X - 0.3 * s, hipY], [X - 0.3 * s - sw * face, Y - 0.2]], lc, 0.75 * s);
    limb(c, [[X + 0.3 * s, hipY], [X + 0.3 * s + sw * face, Y - 0.2]], lc, 0.75 * s);
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
    const a = Math.sin(ph + (l > 0 ? 0 : Math.PI)) * 0.55 * walk;
    const bend = walk * Math.max(0, Math.sin(ph + (l > 0 ? 0 : Math.PI) + 1.2)) * 0.7;
    const knee: Pt = [hip[0] + Math.sin(a) * leg * side * face, hip[1] + Math.cos(a) * leg];
    const foot: Pt = [knee[0] + Math.sin(a - bend) * leg * side * face, knee[1] + Math.cos(a - bend) * leg];
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
  overviewSeason = sk;
  const ready = allTexturesReady();
  const S = 8, W = (MAP * TW) / S, H = (MAP * TH) / S;
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
  if (ready) overview = out;
  return out;
}

function drawOverview(c: C, w: number, h: number, dpr: number, cam: Camera, seeds: Seed[], now: number) {
  const z = cam.zoom * dpr;
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.fillStyle = "#1f4f63"; c.fillRect(0, 0, w, h);
  c.setTransform(z, 0, 0, z, w / 2 - cam.x * z, h / 2 - cam.y * z);
  c.imageSmoothingEnabled = true; c.imageSmoothingQuality = "high";
  c.drawImage(overviewMap(), -(MAP * TW) / 2, 0, MAP * TW, MAP * TH);
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
      if (st.kind === "field") { c.fillStyle = texture(c, st.v > 0.5 ? "wheat" : "crops") ?? "#c9b46a"; diamond(c, cx, cy, step); c.fill(); }
      else if (PATHLIKE.has(st.kind) || st.kind === "square") { c.fillStyle = texture(c, st.kind === "street" || st.kind === "square" ? "cobble" : "dirt") ?? "#bfa47a"; diamond(c, cx, cy, step * 0.8); c.fill(); }
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

/** Traveller on the open road, same muted style as villagers. */
function drawWanderer(c: C, x: number, y: number, dir: number, t: number, sd: number) {
  const ph = t / 260 + sd, st = Math.sin(ph) * 0.55, bob = Math.abs(Math.cos(ph)) * 0.15;
  const coat = ["#5d5244", "#4f5a4a", "#6a4e3a", "#4c4f58"][Math.floor(hash(sd, 1, 7) * 4)]!;
  c.save(); c.translate(x, y); c.scale(dir * 0.9, 0.9);
  c.fillStyle = "rgba(20,15,10,0.3)"; c.beginPath(); c.ellipse(0, 0, 1.4, 0.45, 0, 0, 7); c.fill();
  c.strokeStyle = "#3a3026"; c.lineWidth = 0.45; c.lineCap = "round";
  c.beginPath(); c.moveTo(0, -2.2 - bob); c.lineTo(st, 0); c.moveTo(0, -2.2 - bob); c.lineTo(-st, 0); c.stroke();
  const g = c.createLinearGradient(-0.8, 0, 0.8, 0); g.addColorStop(0, coat); g.addColorStop(1, "#2e2820");
  c.beginPath(); c.moveTo(-0.7, -4.4 - bob); c.lineTo(0.7, -4.4 - bob); c.lineTo(0.85, -1.9 - bob); c.lineTo(-0.85, -1.9 - bob); c.closePath();
  c.fillStyle = g; c.fill(); c.strokeStyle = "rgba(25,20,15,0.6)"; c.lineWidth = 0.18; c.stroke();
  c.fillStyle = "#7a5a3a"; c.fillRect(-1.2, -4.1 - bob, 0.6, 1.3); // bundle on back
  c.fillStyle = "#d4ae88"; c.beginPath(); c.arc(0.1, -5 - bob, 0.5, 0, 7); c.fill();
  c.fillStyle = "#4a3c2c"; c.beginPath(); c.ellipse(0.1, -5.35 - bob, 0.85, 0.22, 0, 0, 7); c.fill(); c.fillRect(-0.3, -5.8 - bob, 0.8, 0.45);
  c.strokeStyle = "#5c4430"; c.lineWidth = 0.25; c.beginPath(); c.moveTo(0.9, -3.4 - bob); c.lineTo(1.3 + st * 0.3, 0); c.stroke();
  c.restore();
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

export function draw(
  c: C, w: number, h: number, dpr: number, cam: Camera, seeds: Seed[], plantings: Map<string, Planting>,
  now: number, hover: [number, number] | null, ghostOk: boolean | null,
) {
  renderNow = now; setArtTime(now); setNatureTime(now);
  lastPeople.length = 0;
  if (cam.zoom < OVERVIEW_BELOW) return drawOverview(c, w, h, dpr, cam, seeds, now);
  const t = performance.now();
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

  // ---- pass 0: one continuous water surface under everything (no tile seams) ----
  // Two slow, counter-drifting layers that breathe back and forth: calm, never a conveyor belt.
  const wA = Math.sin(t / 9000) * 40 + t / 30000, wB = Math.cos(t / 7000) * 30 - t / 45000;
  for (let pass = 0; pass < 2; pass++) {
    const wp = texture(c, "water", pass ? wB : wA);
    c.globalAlpha = pass ? 0.35 + 0.1 * Math.sin(t / 5000) : 1;
    c.beginPath();
    for (let s = x0 + y0; s <= x1 + y1; s++) for (let x = Math.max(x0, s - y1); x <= Math.min(x1, s - y0); x++) {
      const y = s - x; if (!isWater(terrain(x, y))) continue;
      const [cx, cy] = iso(x, y);
      c.moveTo(cx, cy - TH / 2 - 1); c.lineTo(cx + TW / 2 + 1, cy); c.lineTo(cx, cy + TH / 2 + 1); c.lineTo(cx - TW / 2 - 1, cy); c.closePath();
    }
    c.fillStyle = wp ?? hsl(190, 30, 32); c.fill();
  }
  c.globalAlpha = 1;
  // ---- pass 1a: land base. Interior tiles get a diamond; transition tiles get nothing here ----
  type Edge = { x: number; y: number; cx: number; cy: number; tr: string; r: number; coast: boolean };
  const edges: Edge[] = [];
  for (let s = x0 + y0; s <= x1 + y1; s++) {
    for (let x = Math.max(x0, s - y1); x <= Math.min(x1, s - y0); x++) {
      const y = s - x;
      const tr = terrain(x, y);
      if (isWater(tr)) {
        if (tr === "deep") {
          const [cx, cy] = iso(x, y);
          c.fillStyle = "rgba(8,30,40,0.14)"; c.beginPath(); c.ellipse(cx, cy, TW * 0.8, TH * 0.8, 0, 0, 7); c.fill();
        }
        continue;
      }
      const [cx, cy] = iso(x, y);
      const pr = RANK[tr]!;
      let lowest = pr, coast = false;
      for (const [dx, dy] of NB8) { const o = terrain(x + dx, y + dy); const r = RANK[o]!; if (r < lowest) lowest = r; if (isWater(o)) coast = true; }
      if (lowest < pr) { edges.push({ x, y, cx, cy, tr, r: pr, coast }); continue; }
      c.beginPath();
      c.moveTo(cx, cy - TH / 2 - 0.6); c.lineTo(cx + TW / 2 + 0.6, cy); c.lineTo(cx, cy + TH / 2 + 0.6); c.lineTo(cx - TW / 2 - 0.6, cy); c.closePath();
      c.fillStyle = texture(c, TEX_OF[tr]!) ?? "#7a8a50"; c.fill();
    }
  }
  // ---- pass 1b: transition tiles, lowest rank first. Contour radius comes from a smooth
  // world-space noise field, so neighbouring blobs share one continuous, organic outline. ----
  edges.sort((a, b) => a.r - b.r);
  const K = 14;
  const contour = (e: Edge, grow: number) => {
    c.beginPath();
    for (let i = 0; i <= K; i++) {
      const a = (i / K) * Math.PI * 2;
      const dx = Math.cos(a), dy = Math.sin(a);
      // world position of this contour vertex (tile units, rotated back from iso)
      const wx = e.x + (dx + dy) * 0.5, wy = e.y + (dy - dx) * 0.5;
      const n = vnoise(wx * 1.7, wy * 1.7, 31 + e.r) * 0.6 + vnoise(wx * 4.3, wy * 4.3, 47 + e.r) * 0.4;
      const r = (0.64 + n * 0.34) * grow;
      const px = e.cx + dx * r * TW * 0.72, py = e.cy + dy * r * TH * 0.72;
      if (i === 0) c.moveTo(px, py);
      else {
        const am = ((i - 0.5) / K) * Math.PI * 2;
        c.quadraticCurveTo(e.cx + Math.cos(am) * r * TW * 0.74, e.cy + Math.sin(am) * r * TH * 0.74, px, py);
      }
    }
    c.closePath();
  };
  for (const e of edges) {
    if (e.coast) {
      // wet, darker sand rim fading into the water instead of a white sticker outline
      contour(e, 1.1); c.fillStyle = "rgba(40,48,38,0.18)"; c.fill();
    }
    contour(e, 1);
    c.fillStyle = texture(c, TEX_OF[e.tr]!) ?? "#7a8a50"; c.fill();
    if (e.coast && detail) {
      const f = 0.06 + 0.05 * Math.sin(t / 1400 + e.x * 0.7 + e.y * 0.5);
      c.strokeStyle = `rgba(30,36,28,${0.22})`; c.lineWidth = 1.6; c.stroke();
      c.strokeStyle = `rgba(235,240,230,${f})`; c.lineWidth = 3; c.stroke();
    }
  }
  // frayed edges: a few grass tufts and pebbles breaking up the borderline
  if (detail) {
    for (const e of edges) {
      const n = hash(e.x, e.y, 401) < 0.5 ? 1 : 2;
      for (let i = 0; i < n; i++) {
        const a = hash(e.x, e.y, 410 + i) * Math.PI * 2;
        const px = e.cx + Math.cos(a) * TW * 0.42, py = e.cy + Math.sin(a) * TH * 0.42;
        if (e.r >= 3) {
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
        else if (st?.kind === "field") { c.fillStyle = texture(c, st.v > 0.5 ? "wheat" : "crops") ?? hsl(44, 45, 66); c.fill(); }
        else if (st && (PATHLIKE.has(st.kind) || st.kind === "square")) { c.fillStyle = texture(c, st.kind === "street" || st.kind === "square" ? "cobble" : "dirt") ?? "#cdb084"; diamond(c, cx, cy, 0.85); c.fill(); }
        continue;
      }
      if (tr === "hill" || tr === "mountain") {
        const rs = resourceAt(x, y);
        if (rs) {
          const n = rs === "stone" ? 2 : 4;
          const [lit, mid, dark] = rs === "ore" ? ["#b98a6a", "#8a5a3e", "#4e3426"] : rs === "coal" ? ["#5a544e", "#36312d", "#1d1a18"] : ["#d6d0c4", "#a9a295", "#6e685e"];
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
        const ripe = st.kind === "field" && st.v > 0.5;
        const q = [pp(-0.52, -0.52), pp(0.52, -0.52), pp(0.52, 0.52), pp(-0.52, 0.52)];
        c.beginPath(); q.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath();
        c.fillStyle = texture(c, ripe ? "wheat" : "crops") ?? hsl(ripe ? 44 : 80, 50, 60); c.fill();
        const same = (i: number, j: number) => { const o = structureAt(x + i, y + j, seeds, now); return !!o && (o.kind === "field" || o.kind === "garden"); };
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
      if (st && !FLAT.has(st.kind)) drawBuildingSprite(c, st.kind, cx, cy, st.v);
      else if (tr === "forest" && !st && hash(x, y, 19) > 0.25) tree(c, cx, cy + 2, 0.9 + hash(x, y, 20) * 0.3, 0, hash(x, y, 21), x * 13 + y, 0.6);
      else if (tr === "mountain" && hash(x, y, 26) > 0.6) drawNature(c, "crag", cx, cy + 4, 0.6 + hash(x, y, 27) * 0.4, 0, hash(x, y, 29) > 0.5);
      continue;
    }
    if (tr === "mountain" && hash(x, y, 26) > 0.55) {
      const sc = 0.55 + hash(x, y, 27) * 0.5;
      if (!drawNature(c, "crag", cx + (hash(x, y, 28) - 0.5) * 6, cy + 4, sc, 0, hash(x, y, 29) > 0.5)) {
        shape(c, [[cx - 11, cy + 3], [cx, cy - 12], [cx + 11, cy + 3]], x * 29 + y, hsl(30, 10, 58), true, false);
      }
    }
    if (tr === "forest" && !st) {
      if (hash(x, y, 19) > 0.35) tree(c, cx + 6, cy - 1, 0.75 + hash(x, y, 20) * 0.3, t, hash(x, y, 21), x * 17 + y, 0.6);
      tree(c, cx - 5, cy + 3, 0.85 + hash(x, y, 17) * 0.35, t, hash(x, y, 18), x * 13 + y, 0.6);
    } else if ((tr === "grass" || tr === "meadow" || tr === "hill") && !st) {
      if (hash(x, y, 22) > 0.95) tree(c, cx, cy + 1, 0.9, t, hash(x, y, 23), x * 19 + y, 0.2);
      else if (hash(x, y, 22) > 0.9) drawNature(c, "bush", cx + (hash(x, y, 24) - 0.5) * 12, cy + 2, 0.8 + hash(x, y, 25) * 0.5);
    }
    if (st) drawStructure(c, st, cx, cy, x, y, t, L);
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
    if (prog < 1) continue;
    const pts = smoothRoad(l);
    const n = pts.length;
    const mature = Math.min(1, Math.min(ageHours(l.a, now), ageHours(l.b, now)) / 240);
    const count = 1 + Math.round(mature * 3);
    const sn = l.a.x * 7 + l.b.y * 13;
    for (let k = 0; k < count; k++) {
      const secsPerTile = 1.6 + hash(sn, k, 1) * 1.2;
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
        drawWanderer(c, x, y, dx >= 0 ? 1 : -1, t, sn + k);
      }
    }
  }

  // ---- paper, light, labels (screen space) ----
  c.setTransform(1, 0, 0, 1, 0, 0);
  const vg = c.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75);
  vg.addColorStop(0, "rgba(20,15,10,0)"); vg.addColorStop(1, "rgba(20,15,10,0.32)");
  c.fillStyle = vg; c.fillRect(0, 0, w, h);

  const hr = new Date().getHours() + new Date().getMinutes() / 60;
  const night = Math.min(1, Math.max(0, (Math.cos((hr / 24) * Math.PI * 2) + 0.15) / 1.15));
  const dusk = Math.max(0, 1 - Math.abs(hr - 19) / 2) + Math.max(0, 1 - Math.abs(hr - 6.5) / 1.5);
  if (dusk > 0) { c.fillStyle = `rgba(240,150,90,${dusk * 0.12})`; c.fillRect(0, 0, w, h); }
  if (night > 0.02) {
    c.fillStyle = `rgba(30,36,72,${night * 0.45})`; c.fillRect(0, 0, w, h);
    c.globalCompositeOperation = "lighter";
    for (const l of L) {
      const sx = (l.x - cam.x) * z + w / 2, sy = (l.y - cam.y) * z + h / 2;
      if (sx < -60 || sy < -60 || sx > w + 60 || sy > h + 60) continue;
      const r = l.r * z;
      const g = c.createRadialGradient(sx, sy, 0, sx, sy, r);
      g.addColorStop(0, `rgba(255,200,110,${0.45 * night})`); g.addColorStop(1, "rgba(255,200,110,0)");
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
