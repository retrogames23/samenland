import { useEffect, useMemo, useRef, useState } from "react";
import roomUrl from "@/assets/sprites/stube/farmhouse-room.webp";
import hutRoomUrl from "@/assets/sprites/stube/hut-room.webp";
import farmHillUrl from "@/assets/sprites/stube/farmhouse-room-workshop.webp";
import farmCoastUrl from "@/assets/sprites/stube/farmhouse-room-gateway.webp";
import hutHillUrl from "@/assets/sprites/stube/hut-room-workshop.webp";
import hutCoastUrl from "@/assets/sprites/stube/hut-room-gateway.webp";
import { townCharacter } from "@/game/character";
/** Room picture per house kind and building style (plains / hill stone / coastal), matching the map sprite. */
const ROOMS = { farmhouse: { grain: roomUrl, workshop: farmHillUrl, gateway: farmCoastUrl }, hut: { grain: hutRoomUrl, workshop: hutHillUrl, gateway: hutCoastUrl } } as const;
import manUrl from "@/assets/sprites/stube/eat-man.webp";
import womanUrl from "@/assets/sprites/stube/eat-woman.webp";
import sleepUrl from "@/assets/sprites/stube/sleeper.webp";
import stirUrl from "@/assets/sprites/stube/stir.webp";
import elderUrl from "@/assets/sprites/stube/warm-elder.webp";
import elderWomanUrl from "@/assets/sprites/stube/elder-woman.webp";
import boyUrl from "@/assets/sprites/stube/eat-boy.webp";
import girlUrl from "@/assets/sprites/stube/eat-girl.webp";
import sleepChildUrl from "@/assets/sprites/stube/sleep-child.webp";
import manBase from "@/assets/sprites/stube/eat-man-base.webp";
import manTop from "@/assets/sprites/stube/eat-man-top.webp";
import manAlt from "@/assets/sprites/stube/eat-man-b.webp";
import womanBase from "@/assets/sprites/stube/eat-woman-base.webp";
import womanTop from "@/assets/sprites/stube/eat-woman-top.webp";
import womanAlt from "@/assets/sprites/stube/eat-woman-b.webp";
import boyBase from "@/assets/sprites/stube/eat-boy-base.webp";
import boyTop from "@/assets/sprites/stube/eat-boy-top.webp";
import boyAlt from "@/assets/sprites/stube/eat-boy-b.webp";
import girlBase from "@/assets/sprites/stube/eat-girl-base.webp";
import girlTop from "@/assets/sprites/stube/eat-girl-top.webp";
import girlAlt from "@/assets/sprites/stube/eat-girl-b.webp";
import stirBase from "@/assets/sprites/stube/stir-base.webp";
import stirTop from "@/assets/sprites/stube/stir-top.webp";
import stirAlt from "@/assets/sprites/stube/stir-b.webp";
import elderBase from "@/assets/sprites/stube/warm-elder-base.webp";
import elderTop from "@/assets/sprites/stube/warm-elder-top.webp";
import elderAlt from "@/assets/sprites/stube/warm-elder-b.webp";
import elderWomanBase from "@/assets/sprites/stube/elder-woman-base.webp";
import elderWomanTop from "@/assets/sprites/stube/elder-woman-top.webp";
import elderWomanAlt from "@/assets/sprites/stube/elder-woman-b.webp";
import { stubeOf, type StubePlace } from "@/game/stube";
import { clock } from "@/game/time";
import { nightLevel } from "@/game/sun";
import { STUBE } from "@/game/lang/stube";
import type { Lang } from "@/game/i18n";
import type { Person } from "@/game/people";
import type { Seed } from "@/game/world";

const W = 1536, H = 1024;
type Fig = { url: string; layers?: [string, string, string]; x: number; y: number; h: number; flip: boolean; anim: "eat" | "stir" | "warm" | "sleep"; ph: number };
/** Whole-pose layers: unchanged lower body, painted upper body in pose A and pose B. */
const LAYERS: Record<string, [string, string, string]> = {
  [manUrl]: [manBase, manTop, manAlt], [womanUrl]: [womanBase, womanTop, womanAlt], [boyUrl]: [boyBase, boyTop, boyAlt], [girlUrl]: [girlBase, girlTop, girlAlt],
  [stirUrl]: [stirBase, stirTop, stirAlt], [elderUrl]: [elderBase, elderTop, elderAlt], [elderWomanUrl]: [elderWomanBase, elderWomanTop, elderWomanAlt],
};
const ease = (x: number) => x * x * (3 - 2 * x);
/** Weight of pose B over one gesture cycle: hold A, move, hold B, move back (seconds). */
export function poseMix(t: number, holdA: number, move: number, holdB: number): number {
  const c = holdA + holdB + 2 * move, u = ((t % c) + c) % c;
  if (u < holdA) return 0;
  if (u < holdA + move) return ease((u - holdA) / move);
  if (u < holdA + move + holdB) return 1;
  return 1 - ease((u - holdA - move - holdB) / move);
}
// eating: spoon in the bowl (B) longer than at the mouth (A); stirring: steady strokes; fireside: hands held out, now and then rubbed
const GESTURE = { eat: [1.1, 0.28, 1.6], stir: [0.9, 0.55, 0.9], warm: [3.2, 0.45, 1.8] } as const;
const imgs = new Map<string, HTMLImageElement>();
const img = (u: string) => { let i = imgs.get(u); if (!i) { i = new Image(); i.src = u; imgs.set(u, i); } return i; };

/** Painted seat for each place in the room (fractions of the room picture). */
function figOf(pl: StubePlace): Fig | null {
  const { p, spot, slot } = pl, kid = p.age < 14, small = p.age < 4, f = p.sex === "f", ph = (p.id % 97) / 97 * 6.28;
  // the picture always matches the resident's real age and sex
  if (spot === "bed") return small
    ? { url: sleepChildUrl, x: 0.1, y: slot ? 0.497 : 0.677, h: 0.03, flip: false, anim: "sleep", ph }
    : { url: sleepUrl, x: 0.12, y: slot ? 0.497 : 0.677, h: 0.043 * (kid ? 0.8 : 1), flip: false, anim: "sleep", ph };
  if (spot === "hearth") return { url: stirUrl, x: 0.35, y: 0.79, h: 0.3 * (kid ? 0.7 : 1), flip: false, anim: "stir", ph };
  if (spot === "fire") return f
    ? { url: elderWomanUrl, x: 0.505, y: 0.8, h: 0.22 * (kid ? 0.75 : 1), flip: false, anim: "warm", ph }
    : { url: elderUrl, x: 0.505, y: 0.8, h: 0.22 * (kid ? 0.75 : 1), flip: false, anim: "warm", ph };
  if (spot === "table") {
    const left = slot % 2 === 0;
    const url = kid ? (f ? girlUrl : boyUrl) : (f ? womanUrl : manUrl);
    const flip = left ? f : !f; // males face right, females face left in the art
    const x = [0.56, 0.715, 0.525, 0.75][slot]!;
    return { url, x, y: slot < 2 ? 0.8 : 0.83, h: kid ? 0.2 * Math.min(1, 0.6 + p.age / 30) : 0.26, flip, anim: "eat", ph };
  }
  return null;
}

/** Farmhouse diorama: the painted room with exactly those residents the derived routine keeps at home. */
export function Stube({ kind = "farmhouse", seed, seeds, residents, family, lang, onClose }: { seed: Seed; seeds: Seed[]; residents: Person[]; family: string; lang: Lang; onClose: () => void; kind?: "farmhouse" | "hut" }) {
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
      const t = performance.now() / 1000, room = img(ROOMS[kind][townCharacter(seed).main]);
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
        const s = Math.sin(t * 0.8 + f.ph), L = LAYERS[f.url];
        if (f.anim === "sleep" || !L) { g.scale(1, 1 + 0.025 * s); g.drawImage(im, -w / 2, -hh, w, hh); } // breathing under the blanket
        else {
          const [hA, mv, hB] = GESTURE[f.anim], k = poseMix(t + f.ph, hA, mv, hB);
          const [base, top, alt] = L.map(img) as [HTMLImageElement, HTMLImageElement, HTMLImageElement];
          g.drawImage(base, -w / 2, -hh, w, hh);
          // the upper body breathes gently and leans into each gesture
          g.translate(0, -hh * 0.4); g.scale(1, 1 + 0.006 * Math.sin(t * 1.6 + f.ph)); g.translate(0, hh * 0.4);
          // the nearer pose stays opaque, the other blends over it — the body never turns see-through mid-gesture
          const [first, second, a2] = k <= 0.5 ? [top, alt, 2 * k] : [alt, top, 2 * (1 - k)];
          g.drawImage(first, -w / 2, -hh, w, hh);
          if (a2 > 0) { g.globalAlpha = a2; g.drawImage(second, -w / 2, -hh, w, hh); }
          g.globalAlpha = 1;
        }
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
    for (const u of [roomUrl, hutRoomUrl, manUrl, womanUrl, sleepUrl, stirUrl, elderUrl, elderWomanUrl, boyUrl, girlUrl, sleepChildUrl, ...Object.values(LAYERS).flat()]) img(u);
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [figs, kind, seed]);
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
