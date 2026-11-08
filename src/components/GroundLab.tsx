import { useEffect, useRef } from "react";
import { drawGroundLab } from "@/game/render";
import { clock } from "@/game/time";

const STAGES = ["1 · Grundtextur", "2 · + textureAlt", "3 · + wildTurf", "4 · + Weidepflanzen"];

/** Dev only: the same pasture patch built up layer by layer, to see which layer causes the wallpaper look. */
export default function GroundLab() {
  const refs = useRef<(HTMLCanvasElement | null)[]>([]);
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const d = window.devicePixelRatio || 1, now = clock();
      refs.current.forEach((cv, i) => {
        if (!cv) return; const W = cv.clientWidth, H = cv.clientHeight;
        if (cv.width !== Math.round(W * d)) { cv.width = Math.round(W * d); cv.height = Math.round(H * d); }
        const c = cv.getContext("2d")!; c.setTransform(d, 0, 0, d, 0, 0); c.clearRect(0, 0, W, H);
        drawGroundLab(c, i, W, H, Math.min(W / (5 * 32), H / (5 * 16)) * 0.9, now);
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop); return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <div className="grid flex-1 grid-cols-1 gap-3 overflow-y-auto p-3 md:grid-cols-2">
      {STAGES.map((s, i) => (
        <figure key={s} className="rounded-lg border border-border bg-card">
          <canvas ref={(el) => { refs.current[i] = el; }} className="h-80 w-full" />
          <figcaption className="px-2 py-1 text-xs">{s} · roter Strich = Größe eines Dorfbewohners</figcaption>
        </figure>
      ))}
    </div>
  );
}
