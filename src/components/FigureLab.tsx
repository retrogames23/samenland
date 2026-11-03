import { useEffect, useRef, useState } from "react";
import { drawFigureLab } from "@/game/render";

/** Dev overlay (key P in dev or with ?figs): every figure class walking, with hip/hem/pivot guides. */
export default function FigureLab({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [boxes, setBoxes] = useState(true), [lines, setLines] = useState(true), [scale, setScale] = useState(14);
  const opts = useRef({ boxes, lines, scale }); opts.current = { boxes, lines, scale };
  useEffect(() => {
    let raf = 0;
    const loop = (t: number) => {
      const cv = ref.current; if (cv) {
        const d = window.devicePixelRatio || 1, W = cv.clientWidth, H = cv.clientHeight;
        if (cv.width !== W * d) { cv.width = W * d; cv.height = H * d; }
        const c = cv.getContext("2d")!; c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, cv.width, cv.height);
        c.save(); c.scale(d, d); drawFigureLab(c, W, H, t, opts.current); c.restore();
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop); return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <div className="fixed inset-0 z-[60] bg-card/95" dir="ltr">
      <div className="absolute start-2 top-2 z-10 flex flex-wrap items-center gap-3 rounded bg-background/90 px-3 py-1 text-xs text-foreground">
        <b>Figure Lab</b>
        <label><input type="checkbox" checked={boxes} onChange={(e) => setBoxes(e.target.checked)} /> Boxen</label>
        <label><input type="checkbox" checked={lines} onChange={(e) => setLines(e.target.checked)} /> Hüfte (rot) / Saum (grün)</label>
        <label>Zoom <input type="range" min={6} max={30} value={scale} onChange={(e) => setScale(+e.target.value)} /></label>
        <button className="rounded border px-2" onClick={onClose}>✕</button>
      </div>
      <canvas ref={ref} className="h-full w-full" />
    </div>
  );
}
