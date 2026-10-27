import { useEffect, useRef } from "react";
import { MAP, terrain, type Seed } from "@/game/world";

const N = 96;
const PAL: Record<string, string> = { deep: "#2f5566", water: "#4f7f8a", sand: "#cdb98a", forest: "#4d6a3a", mountain: "#857a6c", rock: "#857a6c", grass: "#7f9a52", hill: "#8f8a5a", fertile: "#6f8a42", meadow: "#8aa45a" };

/** Top-down overview of the whole map; click jumps the camera. */
export function Minimap({ seeds, mine, view, onJump }: { seeds: Seed[]; mine: string | null; view: { x: number; y: number; span: number }; onJump: (x: number, y: number) => void }) {
  const bg = useRef<HTMLCanvasElement | null>(null);
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = document.createElement("canvas");
    c.width = c.height = N;
    const g = c.getContext("2d")!;
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      g.fillStyle = PAL[terrain(Math.floor(((i + 0.5) * MAP) / N), Math.floor(((j + 0.5) * MAP) / N))] ?? PAL["grass"]!;
      g.fillRect(i, j, 1, 1);
    }
    bg.current = c;
  }, []);
  useEffect(() => {
    const cv = ref.current; if (!cv || !bg.current) return;
    const g = cv.getContext("2d")!, W = cv.width, k = W / MAP;
    g.imageSmoothingEnabled = false;
    g.drawImage(bg.current, 0, 0, W, W);
    for (const s of seeds) {
      g.fillStyle = s.id === mine ? "#f2c14e" : "#f4ead2";
      g.beginPath(); g.arc(s.x * k, s.y * k, s.id === mine ? 4 : 2.5, 0, 7); g.fill();
    }
    const sp = Math.max(6, view.span * k);
    g.strokeStyle = "#f4ead2"; g.lineWidth = 1.5;
    g.strokeRect(view.x * k - sp / 2, view.y * k - sp / 2, sp, sp);
  }, [seeds, mine, view]);
  return (
    <canvas
      ref={ref}
      width={320}
      height={320}
      className="block h-36 w-36 cursor-crosshair rounded"
      onClick={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        onJump(((e.clientX - r.left) / r.width) * MAP, ((e.clientY - r.top) / r.height) * MAP);
      }}
    />
  );
}
