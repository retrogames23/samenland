// The look of a rebuild after a fire: soot-black ground, ash, charred beams and posts where the house stood. Drawn by
// drawSite (render.ts) under the rising walls, so a burnt-out plot never reads as an ordinary new building site.
// Pure canvas strokes, no sprite; fades as the rebuild proceeds. Paint only.
import { hash } from "./world";

/** The few canvas calls used here (a real 2D context, or a recorder in tests and previews). */
export type BurntCtx = Pick<
  CanvasRenderingContext2D,
  "beginPath" | "moveTo" | "lineTo" | "closePath" | "ellipse" | "fill" | "stroke"
> & {
  fillStyle: string | CanvasGradient | CanvasPattern;
  strokeStyle: string | CanvasGradient | CanvasPattern;
  lineWidth: number;
  lineCap: CanvasLineCap;
};

/** Charred beams lie until the new walls stand this high; the standing posts are cleared earlier. */
export const BURNT_BEAMS_UNTIL = 0.5,
  BURNT_POSTS_UNTIL = 0.35,
  BURNT_SMOKE_UNTIL = 0.12;

/**
 * @param hw,hh half width / half height of the plot diamond  @param p rebuild progress 0…1
 * @param sd per-tile seed (stable look)  @param t frame time in ms (only the last wisps of smoke move)
 */
export function drawBurntSite(
  c: BurntCtx,
  cx: number,
  cy: number,
  hw: number,
  hh: number,
  p: number,
  sd: number,
  t: number,
  detail: boolean,
): void {
  const dia = (k: number) => {
    c.beginPath();
    c.moveTo(cx, cy - hh * k);
    c.lineTo(cx + hw * k, cy);
    c.lineTo(cx, cy + hh * k);
    c.lineTo(cx - hw * k, cy);
    c.closePath();
  };
  const fade = 1 - 0.7 * Math.min(1, Math.max(0, p));
  // scorched ground: a soot-black plot reaching past the trodden rim, a pale ash bed in the middle
  dia(1.18);
  c.fillStyle = `rgba(26,22,20,${(0.6 * fade).toFixed(3)})`;
  c.fill();
  dia(0.62);
  c.fillStyle = `rgba(126,120,112,${(0.38 * Math.max(0, 1 - p)).toFixed(3)})`;
  c.fill();
  // cinders and ash flecks
  for (let i = 0; i < 9; i++) {
    const a = hash(sd, i, 41) - 0.5,
      b = hash(sd, i, 42) - 0.5;
    c.fillStyle =
      i % 3
        ? `rgba(16,13,12,${(0.75 * fade).toFixed(3)})`
        : `rgba(170,164,154,${(0.5 * fade).toFixed(3)})`;
    c.beginPath();
    c.ellipse(cx + (a - b) * hw * 1.05, cy + (a + b) * hh * 1.05, 1, 0.5, 0, 0, 7);
    c.fill();
  }
  c.lineCap = "round";
  // fallen, charred beams (cleared away as the new walls rise)
  if (p < BURNT_BEAMS_UNTIL) {
    const k = 1 - p / BURNT_BEAMS_UNTIL,
      n = Math.max(1, Math.round(4 * k));
    for (let i = 0; i < n; i++) {
      const a = hash(sd, i, 43) - 0.5,
        b = hash(sd, i, 44) - 0.5,
        ang = (hash(sd, i, 45) - 0.5) * 1.1,
        len = hw * (0.45 + 0.3 * hash(sd, i, 46));
      const mx = cx + (a - b) * hw * 0.55,
        my = cy + (a + b) * hh * 0.55,
        dx = Math.cos(ang) * len * 0.5,
        dy = Math.sin(ang) * len * 0.25;
      c.strokeStyle = "rgba(18,15,13,0.95)";
      c.lineWidth = 1.5;
      c.beginPath();
      c.moveTo(mx - dx, my - dy);
      c.lineTo(mx + dx, my + dy);
      c.stroke();
      c.strokeStyle = "rgba(150,142,130,0.45)";
      c.lineWidth = 0.4;
      c.beginPath();
      c.moveTo(mx - dx * 0.6, my - dy * 0.6 - 0.5);
      c.lineTo(mx + dx * 0.2, my + dy * 0.2 - 0.5);
      c.stroke();
    }
  }
  if (!detail) return;
  // two charred corner posts still stand at the back, each with a snapped-off top
  if (p < BURNT_POSTS_UNTIL) {
    for (const side of [-1, 1]) {
      const bx = cx + side * hw * 0.5,
        by = cy - hh * 0.45,
        h = 5 + 3 * hash(sd, side + 2, 47);
      c.strokeStyle = "rgba(16,13,12,0.95)";
      c.lineWidth = 1.4;
      c.beginPath();
      c.moveTo(bx, by);
      c.lineTo(bx + side * 0.6, by - h);
      c.stroke();
      c.lineWidth = 0.8;
      c.beginPath();
      c.moveTo(bx + side * 0.6, by - h);
      c.lineTo(bx + side * 2.2, by - h + 1.2);
      c.stroke();
    }
  }
  // the last thin smoke from the embers, only right after the fire is out
  if (p < BURNT_SMOKE_UNTIL) {
    const q = 1 - p / BURNT_SMOKE_UNTIL;
    for (let i = 0; i < 2; i++) {
      const ph = (((t / 2600 + i * 0.5 + (sd % 7) / 7) % 1) + 1) % 1;
      c.fillStyle = `rgba(190,186,180,${(0.3 * q * (1 - ph)).toFixed(3)})`;
      c.beginPath();
      c.ellipse(
        cx + (i ? 2 : -2) + Math.sin(ph * 6 + i) * 1.2,
        cy - 2 - ph * 11,
        1.2 + ph * 1.6,
        0.8 + ph,
        0,
        0,
        7,
      );
      c.fill();
    }
  }
}
