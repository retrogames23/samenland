import { useEffect, useMemo, useRef, useState } from "react";
import roomUrl from "@/assets/sprites/stube/farmhouse-room.webp";
import manUrl from "@/assets/sprites/stube/eat-man.webp";
import womanUrl from "@/assets/sprites/stube/eat-woman.webp";
import sleepUrl from "@/assets/sprites/stube/sleeper.webp";
import stirUrl from "@/assets/sprites/stube/stir.webp";
import elderUrl from "@/assets/sprites/stube/warm-elder.webp";
import { stubeOf, type StubePlace } from "@/game/stube";
import { clock } from "@/game/time";
import { nightLevel } from "@/game/sun";
import { STUBE } from "@/game/lang/stube";
import type { Lang } from "@/game/i18n";
import type { Person } from "@/game/people";
import type { Seed } from "@/game/world";

const W = 1536, H = 1024;
type Fig = { url: string; x: number; y: number; h: number; flip: boolean; anim: "eat" | "stir" | "warm" | "sleep"; ph: number };
const imgs = new Map<string, HTMLImageElement>();
const img = (u: string) => { let i = imgs.get(u); if (!i) { i = new Image(); i.src = u; imgs.set(u, i); } return i; };

/** Painted seat for each place in the room (fractions of the room picture). */
function figOf(pl: StubePlace): Fig | null {
  const { p, spot, slot } = pl, kid = p.age < 14, ph = (p.id % 97) / 97 * 6.28;
  if (spot === "bed") return { url: sleepUrl, x: 0.12, y: slot ? 0.497 : 0.677, h: 0.043 * (kid ? 0.8 : 1), flip: false, anim: "sleep", ph };
  if (spot === "hearth") return { url: stirUrl, x: 0.35, y: 0.79, h: 0.3 * (kid ? 0.7 : 1), flip: false, anim: "stir", ph };
  if (spot === "fire") return { url: elderUrl, x: 0.505, y: 0.8, h: 0.22 * (kid ? 0.75 : 1), flip: false, anim: "warm", ph };
  if (spot === "table") {
    const left = slot % 2 === 0, f = p.sex === "f";
    const url = left ? (f ? womanUrl : manUrl) : (f ? womanUrl : manUrl);
    const flip = left ? f : !f; // man faces right, woman faces left in the art
    const x = [0.56, 0.715, 0.525, 0.75][slot]!;
    return { url, x, y: slot < 2 ? 0.8 : 0.83, h: 0.26 * (kid ? 0.72 : 1), flip, anim: "eat", ph };
  }
  return null;
}

/** Farmhouse diorama: the painted room with exactly those residents the derived routine keeps at home. */
export function Stube({ seed, seeds, residents, family, lang, onClose }: { seed: Seed; seeds: Seed[]; residents: Person[]; family: string; lang: Lang; onClose: () => void }) {
  const T = STUBE[lang];
  const ref = useRef<HTMLCanvasElement>(null);
  const [places, setPlaces] = useState<StubePlace[]>(() => stubeOf(residents, seed, seeds, clock()));
  useEffect(() => { const id = setInterval(() => setPlaces(stubeOf(residents, seed, seeds, clock())), 2000); return () => clearInterval(id); }, [residents, seed, seeds]);
  const figs = useMemo(() => places.map(figOf).filter((f): f is Fig => !!f).sort((a, b) => a.y - b.y), [places]);
  useEffect(() => {
    const cv = ref.current; if (!cv) return;
    const g = cv.getContext("2d"); if (!g) return;
    let raf = 0;
    const draw = () => {
      const t = performance.now() / 1000, room = img(roomUrl);
      g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H);
      if (room.complete && room.naturalWidth) g.drawImage(room, 0, 0, W, H);
      for (const f of figs) {
        const im = img(f.url); if (!im.complete || !im.naturalWidth) continue;
        // sleepers are sized by bed width, everyone else by body height
        const w = f.anim === "sleep" ? 0.115 * W * (f.h / 0.043) : f.h * H * im.naturalWidth / im.naturalHeight;
        const hh = w * im.naturalHeight / im.naturalWidth;
        const px = f.x * W, py = f.y * H;
        g.save(); g.translate(px, py);
        if (f.flip) g.scale(-1, 1);
        const s = Math.sin(t * (f.anim === "stir" ? 2.2 : f.anim === "eat" ? 2.6 : f.anim === "warm" ? 0.9 : 0.8) + f.ph);
        if (f.anim === "sleep") g.scale(1, 1 + 0.025 * s); // breathing under the blanket
        else g.rotate((f.anim === "stir" ? 0.035 : f.anim === "eat" ? 0.02 : 0.012) * s); // spoon, ladle, gentle rocking
        g.drawImage(im, -w / 2, -hh, w, hh);
        g.restore();
      }
      // dusk and night: the room darkens, the hearth keeps glowing
      const n = nightLevel(clock());
      if (n > 0.01) { g.fillStyle = `rgba(18,20,42,${0.6 * n})`; g.fillRect(0, 0, W, H); }
      const fl = 0.85 + 0.1 * Math.sin(t * 7.3) + 0.05 * Math.sin(t * 13.1);
      g.globalCompositeOperation = "lighter";
      const gr = g.createRadialGradient(0.42 * W, 0.71 * H, 10, 0.42 * W, 0.71 * H, 0.38 * W);
      gr.addColorStop(0, `rgba(255,150,60,${(0.22 + 0.3 * n) * fl})`); gr.addColorStop(1, "rgba(255,120,40,0)");
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
      g.globalCompositeOperation = "source-over";
      raf = requestAnimationFrame(draw);
    };
    for (const u of [roomUrl, manUrl, womanUrl, sleepUrl, stirUrl, elderUrl]) img(u);
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [figs]);
  useEffect(() => { const k = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); }; window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [onClose]);
  const home = places.filter((p) => p.spot !== "out"), away = places.filter((p) => p.spot === "out");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-3 backdrop-blur-[2px]" onClick={onClose}>
      <div className="w-full max-w-4xl overflow-hidden rounded-xl border-4 border-[hsl(25_35%_25%)] bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-3 px-3 py-1.5">
          <div className="font-['Caveat'] text-2xl leading-tight">{T.title(family)}</div>
          <button type="button" aria-label={T.close} className="hit relative p-1 text-2xl leading-none text-muted-foreground hover:text-foreground" onClick={onClose}>×</button>
        </div>
        <canvas ref={ref} width={W} height={H} className="block aspect-[3/2] max-h-[70dvh] w-full object-contain" dir="ltr" />
        <div className="space-y-0.5 px-3 py-2 text-xs text-muted-foreground">
          {residents.length === 0 ? <div>{T.nobodyLives}</div> : home.length === 0 ? <div>{T.empty}</div> : null}
          {away.length > 0 && <div><span className="font-semibold">{T.out}:</span> {away.map((a) => a.p.first).join(", ")}</div>}
        </div>
      </div>
    </div>
  );
}
