import { hash, structureAt, terrain, MAP, type Planting, type Seed } from "./world";

export const TW = 32, TH = 16;
export const iso = (x: number, y: number) => [(x - y) * (TW / 2), (x + y) * (TH / 2)] as const;
export const toTile = (ix: number, iy: number) => {
  const a = ix / (TW / 2), b = iy / (TH / 2);
  return [Math.round((a + b) / 2), Math.round((b - a) / 2)] as const;
};

export type Camera = { x: number; y: number; zoom: number };

const TERRAIN: Record<string, string[]> = {
  deep: ["#3d6e8c", "#3a6a88", "#41728f"],
  water: ["#5a93a8", "#5e98ac", "#5590a5"],
  sand: ["#e6cf97", "#e2c98f", "#e9d39d"],
  grass: ["#8fb86a", "#8ab365", "#94bd6e", "#87b062"],
  meadow: ["#a3c46f", "#9ec06a", "#a8c874"],
  forest: ["#6f9d58", "#6a9854", "#73a15c"],
  hill: ["#a6b56f", "#9fae69"],
};
const pick = (arr: string[] | undefined, x: number, y: number) => (arr ? arr[Math.floor(hash(x, y, 11) * arr.length)] : undefined) ?? "#8fb86a";
const hsl = (h: number, s: number, l: number) => `hsl(${h} ${s}% ${l}%)`;

function diamond(c: CanvasRenderingContext2D, cx: number, cy: number, w = TW / 2, h = TH / 2) {
  c.beginPath();
  c.moveTo(cx, cy - h); c.lineTo(cx + w, cy); c.lineTo(cx, cy + h); c.lineTo(cx - w, cy); c.closePath();
}
function poly(c: CanvasRenderingContext2D, pts: number[], fill: string) {
  c.beginPath(); c.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]);
  c.closePath(); c.fillStyle = fill; c.fill();
}

function tree(c: CanvasRenderingContext2D, x: number, y: number, s: number, t: number, v: number) {
  const sway = Math.sin(t / 900 + v * 10) * 0.6;
  c.fillStyle = "#6b4a32"; c.fillRect(x - 1, y - 4 * s, 2, 4 * s);
  poly(c, [x - 5 * s, y - 3 * s, x + 5 * s, y - 3 * s, x + sway, y - 12 * s], v > 0.5 ? "#3f7a4a" : "#477f43");
  poly(c, [x - 4 * s, y - 7 * s, x + 4 * s, y - 7 * s, x + sway * 1.5, y - 15 * s], v > 0.5 ? "#4f8e55" : "#5a9150");
}

export type Light = { x: number; y: number; r: number };

export function draw(
  c: CanvasRenderingContext2D, w: number, h: number, cam: Camera, seeds: Seed[], plantings: Map<string, Planting>,
  now: number, hover: [number, number] | null, ghostOk: boolean | null,
) {
  const t = performance.now();
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.fillStyle = "#35627e"; c.fillRect(0, 0, w, h);
  const z = cam.zoom;
  c.setTransform(z, 0, 0, z, w / 2 - cam.x * z, h / 2 - cam.y * z);
  c.imageSmoothingEnabled = false;

  const inv = (sx: number, sy: number) => toTile((sx - w / 2) / z + cam.x, (sy - h / 2) / z + cam.y);
  const cs = [inv(0, 0), inv(w, 0), inv(0, h), inv(w, h)];
  const x0 = Math.max(0, Math.min(...cs.map((p) => p[0])) - 2), x1 = Math.min(MAP - 1, Math.max(...cs.map((p) => p[0])) + 2);
  const y0 = Math.max(0, Math.min(...cs.map((p) => p[1])) - 2), y1 = Math.min(MAP - 1, Math.max(...cs.map((p) => p[1])) + 4);
  const detail = z >= 0.55;
  const lights: Light[] = [];
  const near = seeds; // small counts in prototype

  for (let s = x0 + y0; s <= x1 + y1; s++) {
    for (let x = Math.max(x0, s - y1); x <= Math.min(x1, s - y0); x++) {
      const y = s - x;
      const [cx, cy] = iso(x, y);
      const tr = terrain(x, y);
      const st = structureAt(x, y, near, now);
      let col = pick(TERRAIN[tr], x, y);
      if (tr === "water" || tr === "deep") {
        const sh = Math.sin(t / 1400 + x * 0.6 + y * 0.4);
        if (sh > 0.93 && detail) col = "#8cc2cf";
      }
      if (st?.kind === "road") col = hash(x, y, 8) > 0.5 ? "#c9a777" : "#c4a172";
      if (st?.kind === "plaza") col = hash(x, y, 8) > 0.5 ? "#c8c0ad" : "#bfb7a3";
      if (st?.kind === "field") col = st.v > 0.5 ? "#d9b85a" : "#9fbf5e";
      const lift = tr === "hill" && !st ? 4 : 0;
      if (lift) {
        poly(c, [cx - TW / 2, cy - lift, cx, cy + TH / 2 - lift, cx, cy + TH / 2, cx - TW / 2, cy], "#7c8a52");
        poly(c, [cx + TW / 2, cy - lift, cx, cy + TH / 2 - lift, cx, cy + TH / 2, cx + TW / 2, cy], "#6c7a47");
      }
      diamond(c, cx, cy - lift, TW / 2 + 0.3, TH / 2 + 0.3);
      c.fillStyle = col; c.fill();
      if (!detail) continue;

      if (st?.kind === "field") {
        c.fillStyle = st.v > 0.5 ? "#c49f45" : "#86a84c";
        for (let i = -2; i <= 2; i++) c.fillRect(cx + i * 4 - 1, cy - 1 + (i % 2), 2, 1);
      }
      if (tr === "meadow" && !st && hash(x, y, 13) > 0.6) {
        c.fillStyle = hash(x, y, 14) > 0.5 ? "#f2e6a0" : "#e9a3b4";
        c.fillRect(cx - 4 + hash(x, y, 15) * 8, cy - 2, 1, 1);
        c.fillRect(cx + 3 - hash(x, y, 16) * 6, cy + 1, 1, 1);
      }
      if (tr === "forest" && !st) {
        tree(c, cx - 4, cy + 1, 0.8 + hash(x, y, 17) * 0.4, t, hash(x, y, 18));
        if (hash(x, y, 19) > 0.4) tree(c, cx + 5, cy - 1, 0.7 + hash(x, y, 20) * 0.3, t, hash(x, y, 21));
      } else if (tr === "grass" && !st && hash(x, y, 22) > 0.96) tree(c, cx, cy, 0.9, t, hash(x, y, 23));

      if (st?.kind === "plaza" && x === st.seed.x && y === st.seed.y) {
        poly(c, [cx - 5, cy, cx, cy + 2.5, cx + 5, cy, cx + 5, cy - 3, cx, cy - 0.5, cx - 5, cy - 3], "#8d8676");
        diamond(c, cx, cy - 3, 5, 2.5); c.fillStyle = "#5a93a8"; c.fill();
        c.fillStyle = "#6b4a32"; c.fillRect(cx - 5, cy - 10, 1, 7); c.fillRect(cx + 4, cy - 10, 1, 7);
        poly(c, [cx - 7, cy - 9, cx + 7, cy - 9, cx, cy - 14], hsl(st.seed.hue, 45, 48));
        lights.push({ x: cx, y: cy - 8, r: 18 });
      }
      if (st?.kind === "house") {
        const L = st.level, bw = 8 + (L > 2 ? 2 : 0), bh = bw / 2, H = 4 + L * 4, R = 6 + L;
        const ox = (st.v - 0.5) * 2;
        const X = cx + ox, Y = cy;
        const wall = L === 3 ? "#e8dcc4" : st.v > 0.5 ? "#efe2c6" : "#e3cfa8";
        poly(c, [X - bw, Y, X, Y + bh, X, Y + bh - H, X - bw, Y - H], wall);
        poly(c, [X + bw, Y, X, Y + bh, X, Y + bh - H, X + bw, Y - H], "#c9b28c");
        const hue = st.seed.hue + (st.v - 0.5) * 30;
        poly(c, [X - bw - 1, Y - H, X, Y + bh - H + 0.5, X, Y - H - R + bh], hsl(hue, 50, 52));
        poly(c, [X + bw + 1, Y - H, X, Y + bh - H + 0.5, X, Y - H - R + bh], hsl(hue, 45, 40));
        c.fillStyle = "#5b4636";
        c.fillRect(X - bw / 2 - 1, Y - 3 + bh / 2, 2, 3);
        for (let f = 0; f < L; f++) {
          const wy = Y - 5 - f * 4 + bh / 2;
          c.fillStyle = "#4a5a6a"; c.fillRect(X + bw / 2 - 1, wy, 2, 2);
          lights.push({ x: X + bw / 2, y: wy + 1, r: 3.5 });
        }
        if (L >= 2) {
          c.fillStyle = "#7a5a48"; c.fillRect(X + 3, Y - H - R + bh, 2, 4);
          for (let p = 0; p < 3; p++) {
            const ph = ((t / 2600 + st.v + p / 3) % 1);
            c.globalAlpha = 0.5 * (1 - ph);
            c.fillStyle = "#f4f1ea";
            const r = 1 + ph * 2;
            c.fillRect(X + 4 + ph * 5 - r / 2, Y - H - R + bh - 2 - ph * 12, r, r);
          }
          c.globalAlpha = 1;
        }
      }
      const pl = plantings.get(`${x},${y}`);
      if (pl) {
        if (pl.kind === "tree") tree(c, cx, cy + 1, 1.1, t, hash(x, y, 30));
        if (pl.kind === "flower") {
          for (let i = 0; i < 6; i++) {
            c.fillStyle = ["#e9a3b4", "#f2e6a0", "#f4f1ea", "#b9a3e0"][i % 4]!;
            c.fillRect(cx - 6 + hash(x, y, 40 + i) * 12, cy - 3 + hash(x, y, 50 + i) * 6, 2, 2);
          }
        }
        if (pl.kind === "lantern") {
          c.fillStyle = "#4b3a2e"; c.fillRect(cx, cy - 11, 1, 11);
          c.fillStyle = "#f7d27a"; c.fillRect(cx - 1, cy - 13, 3, 3);
          lights.push({ x: cx + 0.5, y: cy - 11.5, r: 14 });
        }
      }
      if (hover && hover[0] === x && hover[1] === y) {
        diamond(c, cx, cy - lift);
        c.strokeStyle = ghostOk === false ? "#d0644f" : "#fff6dc";
        c.lineWidth = 1 / z * 1.5; c.stroke();
      }
    }
  }

  // Day/night by the viewer's local clock
  const hr = new Date().getHours() + new Date().getMinutes() / 60;
  const night = Math.min(1, Math.max(0, (Math.cos((hr / 24) * Math.PI * 2) + 0.15) / 1.15));
  const dusk = Math.max(0, 1 - Math.abs(hr - 19) / 2) + Math.max(0, 1 - Math.abs(hr - 6.5) / 1.5);
  c.setTransform(1, 0, 0, 1, 0, 0);
  if (dusk > 0) { c.fillStyle = `rgba(240,150,90,${dusk * 0.12})`; c.fillRect(0, 0, w, h); }
  if (night > 0.02) {
    c.fillStyle = `rgba(22,28,64,${night * 0.55})`; c.fillRect(0, 0, w, h);
    c.globalCompositeOperation = "lighter";
    for (const l of lights) {
      const sx = (l.x - cam.x) * z + w / 2, sy = (l.y - cam.y) * z + h / 2;
      if (sx < -40 || sy < -40 || sx > w + 40 || sy > h + 40) continue;
      const r = l.r * z;
      const g = c.createRadialGradient(sx, sy, 0, sx, sy, r);
      g.addColorStop(0, `rgba(255,200,110,${0.4 * night})`); g.addColorStop(1, "rgba(255,200,110,0)");
      c.fillStyle = g; c.fillRect(sx - r, sy - r, r * 2, r * 2);
    }
    c.globalCompositeOperation = "source-over";
  }

  // Town labels
  c.font = "8px 'Pixelify Sans', monospace"; c.textAlign = "center";
  for (const sd of seeds) {
    const [ix, iy] = iso(sd.x, sd.y);
    const sx = Math.round((ix - cam.x) * z + w / 2), sy = Math.round((iy - cam.y) * z + h / 2 - 18 * z - 6);
    const tw = c.measureText(sd.name).width + 8;
    c.fillStyle = "rgba(58,42,32,0.75)"; c.fillRect(sx - tw / 2, sy - 8, tw, 11);
    c.fillStyle = "#fff3d6"; c.fillText(sd.name, sx, sy);
  }
}
