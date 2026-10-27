import { hash, structureAt, terrain, isWater, MAP, FLAT, type Planting, type Seed, type Structure, type Kind } from "./world";

export const TW = 32, TH = 16;
export const iso = (x: number, y: number) => [(x - y) * (TW / 2), (x + y) * (TH / 2)] as const;
export const toTile = (ix: number, iy: number) => {
  const a = ix / (TW / 2), b = iy / (TH / 2);
  return [Math.round((a + b) / 2), Math.round((b - a) / 2)] as const;
};
export type Camera = { x: number; y: number; zoom: number };
type C = CanvasRenderingContext2D;
type Pt = [number, number];

const INK = "#4a3526";
const TERRAIN: Record<string, [number, number, number]> = {
  deep: [205, 38, 62], water: [198, 40, 70], sand: [42, 52, 80], grass: [88, 30, 66],
  meadow: [76, 36, 70], forest: [100, 24, 58], hill: [70, 22, 62],
};
const hsl = (h: number, s: number, l: number, a = 1) => `hsla(${h} ${s}% ${l}% / ${a})`;

// ---------- hand-drawn helpers ----------
function jit(p: Pt, sd: number, i: number, amt = 0.45): Pt {
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

function tree(c: C, x: number, y: number, s: number, t: number, v: number, sd: number) {
  const sway = Math.sin(t / 1100 + v * 10) * 0.4;
  c.strokeStyle = INK; c.lineWidth = 1.2 * s; c.beginPath(); c.moveTo(x, y); c.lineTo(x + sway * 0.3, y - 5 * s); c.stroke();
  const g = v > 0.5 ? 104 : 92;
  blob(c, x + sway - 2 * s, y - 7 * s, 3.4 * s, hsl(g, 30, 42), sd);
  blob(c, x + sway + 2 * s, y - 7.5 * s, 3.2 * s, hsl(g, 30, 46), sd + 1);
  blob(c, x + sway, y - 10 * s, 3.4 * s, hsl(g - 6, 32, 52), sd + 2);
}
function smoke(c: C, x: number, y: number, t: number, sd: number, big = 1) {
  for (let i = 0; i < 4; i++) {
    const ph = (t / (3200 * big) + hash(sd, 1, 1) + i / 4) % 1;
    c.fillStyle = `rgba(236,232,224,${0.55 * (1 - ph)})`;
    c.beginPath(); c.arc(x + ph * 6 * big + Math.sin(ph * 6 + sd) * 1.2, y - ph * 16 * big, (1 + ph * 3) * big, 0, Math.PI * 2); c.fill();
  }
}

let paper: CanvasPattern | null = null;
function paperPattern(c: C) {
  if (paper) return paper;
  const o = document.createElement("canvas"); o.width = o.height = 256;
  const g = o.getContext("2d")!;
  const img = g.createImageData(256, 256);
  for (let i = 0; i < 256 * 256; i++) {
    const x = i % 256, y = (i / 256) | 0;
    const n = hash(x, y, 91) * 0.6 + hash(x >> 3, y >> 3, 92) * 0.4;
    const v = 200 + n * 55;
    img.data[i * 4] = v; img.data[i * 4 + 1] = v * 0.96; img.data[i * 4 + 2] = v * 0.86; img.data[i * 4 + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  paper = c.createPattern(o, "repeat");
  return paper;
}

export type Light = { x: number; y: number; r: number };
const roofHue = (s: Structure, slate = false) => slate ? [215, 12, 46] : [12 + s.v * 18 + (s.seed.hue % 20) - 10, 48, 50];

function drawStructure(c: C, s: Structure, cx: number, cy: number, x: number, y: number, t: number, L: Light[]) {
  const sd = x * 1000 + y;
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
        const wob = Math.sin(t / 3000 + v * 20) * 1.5;
        blob(c, cx - 3 + wob, cy, 1.8, "#f4efe4", sd + 2); blob(c, cx + 4 - wob, cy + 2, 1.6, "#f4efe4", sd + 3);
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

const PATHLIKE: ReadonlySet<Kind> = new Set(["path", "street", "square", "well", "market"]);

export function draw(
  c: C, w: number, h: number, dpr: number, cam: Camera, seeds: Seed[], plantings: Map<string, Planting>,
  now: number, hover: [number, number] | null, ghostOk: boolean | null,
) {
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
  const L: Light[] = [];
  const tiles: { x: number; y: number; cx: number; cy: number; st: Structure | null }[] = [];

  // ---- pass 1: watercolor ground, coasts, flat things ----
  for (let s = x0 + y0; s <= x1 + y1; s++) {
    for (let x = Math.max(x0, s - y1); x <= Math.min(x1, s - y0); x++) {
      const y = s - x;
      const [cx, cy] = iso(x, y);
      const tr = terrain(x, y);
      const [hh, ss, ll] = TERRAIN[tr]!;
      const n = hash(x, y, 11) - 0.5;
      c.beginPath();
      c.moveTo(cx, cy - TH / 2 - 0.6); c.lineTo(cx + TW / 2 + 0.6, cy); c.lineTo(cx, cy + TH / 2 + 0.6); c.lineTo(cx - TW / 2 - 0.6, cy); c.closePath();
      c.fillStyle = hsl(hh + n * 6, ss, ll + n * 3); c.fill();
      const st = structureAt(x, y, seeds, now);
      tiles.push({ x, y, cx, cy, st });
      if (!detail) {
        if (st && !FLAT.has(st.kind)) { /* drawn in pass 2 */ }
        else if (st?.kind === "field") { c.fillStyle = hsl(st.v > 0.5 ? 44 : 78, 45, 66, 0.9); c.fill(); }
        else if (st && PATHLIKE.has(st.kind)) { c.fillStyle = "#cdb084"; c.fill(); }
        continue;
      }
      // watercolor blotch
      if (hash(x, y, 12) > 0.55) { blob(c, cx + n * 14, cy + (hash(x, y, 13) - 0.5) * 8, 7 + hash(x, y, 14) * 8, hsl(hh, ss + 6, ll - 6, 0.14), x * 7 + y, false); }
      // coast / river ink
      if (!isWater(tr)) {
        const pp = P(cx, cy);
        const edges: [number, number, Pt, Pt][] = [[1, 0, pp(0.5, -0.5), pp(0.5, 0.5)], [0, 1, pp(0.5, 0.5), pp(-0.5, 0.5)], [-1, 0, pp(-0.5, 0.5), pp(-0.5, -0.5)], [0, -1, pp(-0.5, -0.5), pp(0.5, -0.5)]];
        for (const [dx, dy, a, b] of edges) if (isWater(terrain(x + dx, y + dy))) line(c, a, b, x * 31 + y * 17 + dx * 3 + dy, 0.6);
      } else if (hash(x, y, 15) > 0.82) {
        const ph = Math.sin(t / 1500 + x + y) * 1.2;
        c.strokeStyle = "rgba(255,255,255,0.55)"; c.lineWidth = 0.5;
        c.beginPath(); c.moveTo(cx - 4 + ph, cy); c.quadraticCurveTo(cx - 2 + ph, cy - 1.5, cx + ph, cy); c.quadraticCurveTo(cx + 2 + ph, cy + 1.5, cx + 4 + ph, cy); c.stroke();
      }
      if (tr === "hill") { c.globalAlpha = 0.35; line(c, [cx - 8, cy + 2], [cx - 2, cy - 3], x * 9 + y, 0.5); line(c, [cx - 2, cy - 3], [cx + 5, cy + 1], x * 9 + y + 1, 0.5); c.globalAlpha = 1; }
      if (tr === "meadow" && !st) for (let i = 0; i < 3; i++) if (hash(x, y, 20 + i) > 0.5) { c.fillStyle = ["#f2e6a0", "#e9a3b4", "#f7f2e6"][i]!; c.beginPath(); c.arc(cx + (hash(x, y, 30 + i) - 0.5) * 18, cy + (hash(x, y, 40 + i) - 0.5) * 8, 0.8, 0, 7); c.fill(); }

      if (!st) continue;
      const sd = x * 1000 + y;
      const pp = P(cx, cy);
      if (st.kind === "path" || st.kind === "street") {
        const street = st.kind === "street";
        const col = street ? "#b3aa98" : "#c49e6c";
        c.strokeStyle = col; c.lineWidth = street ? 8 : 5.5; c.lineCap = "round";
        let any = false;
        for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
          if (!i && !j) continue;
          const o = structureAt(x + i, y + j, seeds, now);
          if (o && PATHLIKE.has(o.kind)) { any = true; const m = pp(i * 0.55, j * 0.55); c.beginPath(); c.moveTo(cx, cy); c.lineTo(m[0], m[1]); c.stroke(); }
        }
        if (!any) blob(c, cx, cy, 3, col, sd, false);
        if (street) { c.fillStyle = "rgba(90,80,70,0.35)"; for (let k = 0; k < 4; k++) c.fillRect(cx + (hash(x, y, 50 + k) - 0.5) * 10, cy + (hash(x, y, 60 + k) - 0.5) * 4, 0.8, 0.6); }
      } else if (st.kind === "square" || st.kind === "market" || st.kind === "well") {
        shape(c, [pp(0, -0.5), pp(0.5, 0), pp(0, 0.5), pp(-0.5, 0)].map((p) => [p[0], p[1]] as Pt), sd, "#cfc6b2", false);
        c.beginPath(); c.moveTo(cx, cy - TH / 2); c.lineTo(cx + TW / 2, cy); c.lineTo(cx, cy + TH / 2); c.lineTo(cx - TW / 2, cy); c.closePath();
        c.fillStyle = "#d3cab6"; c.fill();
        c.fillStyle = "rgba(90,80,70,0.25)"; for (let k = 0; k < 6; k++) c.fillRect(cx + (hash(x, y, 70 + k) - 0.5) * 22, cy + (hash(x, y, 80 + k) - 0.5) * 9, 1.2, 0.7);
      } else if (st.kind === "field") {
        const ripe = st.v > 0.5;
        shape(c, [pp(-0.45, -0.45), pp(0.45, -0.45), pp(0.45, 0.45), pp(-0.45, 0.45)], sd, hsl(ripe ? 44 : 80, ripe ? 55 : 35, ripe ? 68 : 58), true);
        c.globalAlpha = 0.5;
        for (let k = -3; k <= 3; k++) { const u = k * 0.12; if (st.v > 0.25 && st.v < 0.75) line(c, pp(u, -0.42), pp(u, 0.42), sd + k + 9, 0.4); else line(c, pp(-0.42, u), pp(0.42, u), sd + k + 9, 0.4); }
        c.globalAlpha = 1;
      } else if (st.kind === "garden") {
        shape(c, [pp(-0.32, -0.32), pp(0.32, -0.32), pp(0.32, 0.32), pp(-0.32, 0.32)], sd, "#a98663", true);
        for (let k = 0; k < 6; k++) { const q = pp(-0.22 + (k % 3) * 0.22, -0.15 + Math.floor(k / 3) * 0.3); blob(c, q[0], q[1] - 0.8, 1.3, hsl(100, 38, 45), sd + k, false); }
      } else if (st.kind === "pasture") {
        c.beginPath(); c.moveTo(cx, cy - TH / 2); c.lineTo(cx + TW / 2, cy); c.lineTo(cx, cy + TH / 2); c.lineTo(cx - TW / 2, cy); c.closePath();
        c.fillStyle = hsl(84, 34, 70, 0.6); c.fill();
      }
    }
  }

  // ---- pass 2: standing objects in depth order ----
  for (const { x, y, cx, cy, st } of tiles) {
    const tr = terrain(x, y);
    if (!detail) {
      if (st && !FLAT.has(st.kind) && st.kind !== "hay") {
        const [rh, rs, rl] = roofHue(st, st.kind === "factory" || st.kind === "warehouse");
        c.beginPath(); c.moveTo(cx, cy - 7); c.lineTo(cx + 7, cy - 3); c.lineTo(cx, cy + 1); c.lineTo(cx - 7, cy - 3); c.closePath();
        c.fillStyle = hsl(rh!, rs!, rl!); c.fill(); c.strokeStyle = INK; c.lineWidth = 0.8; c.stroke();
      } else if (tr === "forest" && !st && hash(x, y, 19) > 0.3) blob(c, cx, cy - 3, 7, hsl(100, 26, 44), x * 3 + y, false);
      continue;
    }
    if (tr === "forest" && !st) {
      tree(c, cx - 5, cy + 2, 0.85 + hash(x, y, 17) * 0.35, t, hash(x, y, 18), x * 13 + y);
      if (hash(x, y, 19) > 0.35) tree(c, cx + 5, cy - 1, 0.7 + hash(x, y, 20) * 0.3, t, hash(x, y, 21), x * 17 + y);
    } else if ((tr === "grass" || tr === "meadow") && !st && hash(x, y, 22) > 0.95) tree(c, cx, cy + 1, 0.9, t, hash(x, y, 23), x * 19 + y);
    if (st) drawStructure(c, st, cx, cy, x, y, t, L);
    const pl = plantings.get(`${x},${y}`);
    if (pl) {
      const sd = x * 77 + y;
      if (pl.kind === "tree") tree(c, cx, cy + 2, 1.15, t, hash(x, y, 30), sd);
      if (pl.kind === "flower") for (let i = 0; i < 7; i++) blob(c, cx - 7 + hash(x, y, 40 + i) * 14, cy - 3 + hash(x, y, 50 + i) * 6, 1, ["#e9a3b4", "#f2e6a0", "#f7f2e6", "#b9a3e0"][i % 4]!, sd + i, false);
      if (pl.kind === "lantern") {
        line(c, [cx, cy], [cx, cy - 11], sd, 0.8);
        shape(c, [[cx - 1.4, cy - 11], [cx + 1.4, cy - 11], [cx + 1.4, cy - 14], [cx - 1.4, cy - 14]], sd + 1, "#f2c66b");
        L.push({ x: cx, y: cy - 12.5, r: 14 });
      }
    }
    if (hover && hover[0] === x && hover[1] === y) {
      c.beginPath(); c.moveTo(cx, cy - TH / 2); c.lineTo(cx + TW / 2, cy); c.lineTo(cx, cy + TH / 2); c.lineTo(cx - TW / 2, cy); c.closePath();
      c.setLineDash([2, 1.5]); c.strokeStyle = ghostOk === false ? "#b5503e" : INK; c.lineWidth = 0.9; c.stroke(); c.setLineDash([]);
    }
  }

  // ---- paper, light, labels (screen space) ----
  c.setTransform(1, 0, 0, 1, 0, 0);
  const pat = paperPattern(c);
  if (pat) { c.globalCompositeOperation = "multiply"; c.globalAlpha = 0.35; c.fillStyle = pat; c.fillRect(0, 0, w, h); c.globalAlpha = 1; c.globalCompositeOperation = "source-over"; }
  const vg = c.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75);
  vg.addColorStop(0, "rgba(120,90,50,0)"); vg.addColorStop(1, "rgba(120,90,50,0.28)");
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

  c.font = `700 ${Math.round(22 * dpr)}px 'Caveat', cursive`; c.textAlign = "center";
  c.lineJoin = "round";
  for (const sd of seeds) {
    const [ix, iy] = iso(sd.x, sd.y);
    const sx = (ix - cam.x) * z + w / 2, sy = (iy - cam.y) * z + h / 2 - 22 * z - 8 * dpr;
    c.lineWidth = 4 * dpr; c.strokeStyle = "rgba(246,238,220,0.9)"; c.strokeText(sd.name, sx, sy);
    c.fillStyle = INK; c.fillText(sd.name, sx, sy);
  }
}
