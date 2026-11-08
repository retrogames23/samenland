import { useEffect, useMemo, useRef, useState } from "react";
import roomUrl from "@/assets/sprites/stube/farmhouse-room.webp";
import hutRoomUrl from "@/assets/sprites/stube/hut-room.webp";
import farmHillUrl from "@/assets/sprites/stube/farmhouse-room-workshop.webp";
import farmCoastUrl from "@/assets/sprites/stube/farmhouse-room-gateway.webp";
import hutHillUrl from "@/assets/sprites/stube/hut-room-workshop.webp";
import hutCoastUrl from "@/assets/sprites/stube/hut-room-gateway.webp";
import craftUrl from "@/assets/sprites/stube/craft-room.webp";
import craftHillUrl from "@/assets/sprites/stube/craft-room-workshop.webp";
import craftCoastUrl from "@/assets/sprites/stube/craft-room-gateway.webp";
import patUrl from "@/assets/sprites/stube/patrician-room.webp";
import patHillUrl from "@/assets/sprites/stube/patrician-room-workshop.webp";
import patCoastUrl from "@/assets/sprites/stube/patrician-room-gateway.webp";
import { townCharacter } from "@/game/character";
/** Room picture per house kind and building style (plains / hill stone / coastal), matching the map sprite. */
const ROOMS = { farmhouse: { grain: roomUrl, workshop: farmHillUrl, gateway: farmCoastUrl }, hut: { grain: hutRoomUrl, workshop: hutHillUrl, gateway: hutCoastUrl }, handwerker: { grain: craftUrl, workshop: craftHillUrl, gateway: craftCoastUrl }, patrician: { grain: patUrl, workshop: patHillUrl, gateway: patCoastUrl } } as const;
export type StubeKind = keyof typeof ROOMS;
export const STUBE_KINDS: ReadonlySet<string> = new Set(Object.keys(ROOMS));
import manUrl from "@/assets/sprites/stube/eat-man.webp";
import womanUrl from "@/assets/sprites/stube/eat-woman.webp";
import sleepUrl from "@/assets/sprites/stube/sleeper.webp";
import stirUrl from "@/assets/sprites/stube/stir.webp";
import elderUrl from "@/assets/sprites/stube/warm-elder.webp";
import elderWomanUrl from "@/assets/sprites/stube/elder-woman.webp";
import boyUrl from "@/assets/sprites/stube/eat-boy.webp";
import girlUrl from "@/assets/sprites/stube/eat-girl.webp";
import sleepChildUrl from "@/assets/sprites/stube/sleep-child.webp";
import writeUrl from "@/assets/sprites/stube/write-man.webp";
import writeBase from "@/assets/sprites/stube/write-man-base.webp";
import writeTop from "@/assets/sprites/stube/write-man-top.webp";
import writeAlt from "@/assets/sprites/stube/write-man-b.webp";
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
import newFig0 from "@/assets/sprites/stube/pat-eat-boy.webp";
import newFig0Base from "@/assets/sprites/stube/pat-eat-boy-base.webp";
import newFig0Top from "@/assets/sprites/stube/pat-eat-boy-top.webp";
import newFig0Alt from "@/assets/sprites/stube/pat-eat-boy-b.webp";
import newFig1 from "@/assets/sprites/stube/pat-eat-girl.webp";
import newFig1Base from "@/assets/sprites/stube/pat-eat-girl-base.webp";
import newFig1Top from "@/assets/sprites/stube/pat-eat-girl-top.webp";
import newFig1Alt from "@/assets/sprites/stube/pat-eat-girl-b.webp";
import newFig2 from "@/assets/sprites/stube/pat-eat-man.webp";
import newFig2Base from "@/assets/sprites/stube/pat-eat-man-base.webp";
import newFig2Top from "@/assets/sprites/stube/pat-eat-man-top.webp";
import newFig2Alt from "@/assets/sprites/stube/pat-eat-man-b.webp";
import newFig3 from "@/assets/sprites/stube/pat-eat-woman.webp";
import newFig3Base from "@/assets/sprites/stube/pat-eat-woman-base.webp";
import newFig3Top from "@/assets/sprites/stube/pat-eat-woman-top.webp";
import newFig3Alt from "@/assets/sprites/stube/pat-eat-woman-b.webp";
import newFig4 from "@/assets/sprites/stube/pat-elder-man.webp";
import newFig4Base from "@/assets/sprites/stube/pat-elder-man-base.webp";
import newFig4Top from "@/assets/sprites/stube/pat-elder-man-top.webp";
import newFig4Alt from "@/assets/sprites/stube/pat-elder-man-b.webp";
import newFig5 from "@/assets/sprites/stube/pat-elder-woman.webp";
import newFig5Base from "@/assets/sprites/stube/pat-elder-woman-base.webp";
import newFig5Top from "@/assets/sprites/stube/pat-elder-woman-top.webp";
import newFig5Alt from "@/assets/sprites/stube/pat-elder-woman-b.webp";
import newFig6 from "@/assets/sprites/stube/pat-write-man.webp";
import newFig6Base from "@/assets/sprites/stube/pat-write-man-base.webp";
import newFig6Top from "@/assets/sprites/stube/pat-write-man-top.webp";
import newFig6Alt from "@/assets/sprites/stube/pat-write-man-b.webp";
import newFig7 from "@/assets/sprites/stube/pat-write-woman.webp";
import newFig7Base from "@/assets/sprites/stube/pat-write-woman-base.webp";
import newFig7Top from "@/assets/sprites/stube/pat-write-woman-top.webp";
import newFig7Alt from "@/assets/sprites/stube/pat-write-woman-b.webp";
import newFig8 from "@/assets/sprites/stube/stir-man.webp";
import newFig8Base from "@/assets/sprites/stube/stir-man-base.webp";
import newFig8Top from "@/assets/sprites/stube/stir-man-top.webp";
import newFig8Alt from "@/assets/sprites/stube/stir-man-b.webp";
import newFig9 from "@/assets/sprites/stube/warm-boy.webp";
import newFig9Base from "@/assets/sprites/stube/warm-boy-base.webp";
import newFig9Top from "@/assets/sprites/stube/warm-boy-top.webp";
import newFig9Alt from "@/assets/sprites/stube/warm-boy-b.webp";
import newFig10 from "@/assets/sprites/stube/warm-girl.webp";
import newFig10Base from "@/assets/sprites/stube/warm-girl-base.webp";
import newFig10Top from "@/assets/sprites/stube/warm-girl-top.webp";
import newFig10Alt from "@/assets/sprites/stube/warm-girl-b.webp";
import newFig11 from "@/assets/sprites/stube/warm-man.webp";
import newFig11Base from "@/assets/sprites/stube/warm-man-base.webp";
import newFig11Top from "@/assets/sprites/stube/warm-man-top.webp";
import newFig11Alt from "@/assets/sprites/stube/warm-man-b.webp";
import newFig12 from "@/assets/sprites/stube/warm-woman.webp";
import newFig12Base from "@/assets/sprites/stube/warm-woman-base.webp";
import newFig12Top from "@/assets/sprites/stube/warm-woman-top.webp";
import newFig12Alt from "@/assets/sprites/stube/warm-woman-b.webp";
import patWarmBoy from "@/assets/sprites/stube/pat-warm-boy.webp";
import patWarmBoyBase from "@/assets/sprites/stube/pat-warm-boy-base.webp";
import patWarmBoyTop from "@/assets/sprites/stube/pat-warm-boy-top.webp";
import patWarmBoyAlt from "@/assets/sprites/stube/pat-warm-boy-b.webp";
import patWarmGirl from "@/assets/sprites/stube/pat-warm-girl.webp";
import patWarmGirlBase from "@/assets/sprites/stube/pat-warm-girl-base.webp";
import patWarmGirlTop from "@/assets/sprites/stube/pat-warm-girl-top.webp";
import patWarmGirlAlt from "@/assets/sprites/stube/pat-warm-girl-b.webp";
import patWarmMan from "@/assets/sprites/stube/pat-warm-man.webp";
import patWarmManBase from "@/assets/sprites/stube/pat-warm-man-base.webp";
import patWarmManTop from "@/assets/sprites/stube/pat-warm-man-top.webp";
import patWarmManAlt from "@/assets/sprites/stube/pat-warm-man-b.webp";
import patWarmWoman from "@/assets/sprites/stube/pat-warm-woman.webp";
import patWarmWomanBase from "@/assets/sprites/stube/pat-warm-woman-base.webp";
import patWarmWomanTop from "@/assets/sprites/stube/pat-warm-woman-top.webp";
import patWarmWomanAlt from "@/assets/sprites/stube/pat-warm-woman-b.webp";
import seatUrl from "@/assets/sprites/stube/seat.webp";
import { stubeFigureKey, stubeOf, SWADDLE_AGE, STUBE_SLOTS, PATRICIAN_SLOTS, type StubePlace } from "@/game/stube";
import { clock } from "@/game/time";
import { nightLevel } from "@/game/sun";
import { STUBE } from "@/game/lang/stube";
import type { Lang } from "@/game/i18n";
import type { Person } from "@/game/people";
import type { Seed } from "@/game/world";

type Fig = { url: string; layers?: [string, string, string]; x: number; y: number; h: number; flip: boolean; anim: "eat" | "stir" | "warm" | "sleep" | "write"; ph: number; rate?: number };
/** Whole-pose layers: unchanged lower body, painted upper body in pose A and pose B. */
const LAYERS: Record<string, [string, string, string]> = {
  [patWarmBoy]: [patWarmBoyBase, patWarmBoyTop, patWarmBoyAlt],
  [patWarmGirl]: [patWarmGirlBase, patWarmGirlTop, patWarmGirlAlt],
  [patWarmMan]: [patWarmManBase, patWarmManTop, patWarmManAlt],
  [patWarmWoman]: [patWarmWomanBase, patWarmWomanTop, patWarmWomanAlt],
  [manUrl]: [manBase, manTop, manAlt], [writeUrl]: [writeBase, writeTop, writeAlt], [womanUrl]: [womanBase, womanTop, womanAlt], [boyUrl]: [boyBase, boyTop, boyAlt], [girlUrl]: [girlBase, girlTop, girlAlt],
  [newFig0]: [newFig0Base, newFig0Top, newFig0Alt],
  [newFig1]: [newFig1Base, newFig1Top, newFig1Alt],
  [newFig2]: [newFig2Base, newFig2Top, newFig2Alt],
  [newFig3]: [newFig3Base, newFig3Top, newFig3Alt],
  [newFig4]: [newFig4Base, newFig4Top, newFig4Alt],
  [newFig5]: [newFig5Base, newFig5Top, newFig5Alt],
  [newFig6]: [newFig6Base, newFig6Top, newFig6Alt],
  [newFig7]: [newFig7Base, newFig7Top, newFig7Alt],
  [newFig8]: [newFig8Base, newFig8Top, newFig8Alt],
  [newFig9]: [newFig9Base, newFig9Top, newFig9Alt],
  [newFig10]: [newFig10Base, newFig10Top, newFig10Alt],
  [newFig11]: [newFig11Base, newFig11Top, newFig11Alt],
  [newFig12]: [newFig12Base, newFig12Top, newFig12Alt],
  [stirUrl]: [stirBase, stirTop, stirAlt], [elderUrl]: [elderBase, elderTop, elderAlt], [elderWomanUrl]: [elderWomanBase, elderWomanTop, elderWomanAlt],
};
const FIGURES: Record<string, string> = {
  "pat-warm-boy": patWarmBoy,
  "pat-warm-girl": patWarmGirl,
  "pat-warm-man": patWarmMan,
  "pat-warm-woman": patWarmWoman,
  "eat-man": manUrl, "eat-woman": womanUrl, "eat-boy": boyUrl, "eat-girl": girlUrl, "stir": stirUrl, "warm-elder": elderUrl, "elder-woman": elderWomanUrl,
  "pat-eat-boy": newFig0,
  "pat-eat-girl": newFig1,
  "pat-eat-man": newFig2,
  "pat-eat-woman": newFig3,
  "pat-elder-man": newFig4,
  "pat-elder-woman": newFig5,
  "pat-write-man": newFig6,
  "pat-write-woman": newFig7,
  "stir-man": newFig8,
  "warm-boy": newFig9,
  "warm-girl": newFig10,
  "warm-man": newFig11,
  "warm-woman": newFig12,
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
const GESTURE = { eat: [1.1, 0.28, 1.6], stir: [0.9, 0.55, 0.9], warm: [3.2, 0.45, 1.8], write: [2.6, 0.5, 1.3] } as const;
const imgs = new Map<string, HTMLImageElement>();
/** Figures painted with their own bench or stool; desk writers use the painted chair. */
const OWN_SEAT = new Set([boyUrl, elderWomanUrl]);
const img = (u: string) => { let i = imgs.get(u); if (!i) { i = new Image(); i.src = u; imgs.set(u, i); } return i; };

/** Painted seat for each place in the room (fractions of the room picture). */
export function figOf(pl: StubePlace): Fig | null {
  const { p, spot, slot } = pl, kid = p.age < 14, small = p.age < SWADDLE_AGE, f = p.sex === "f", ph = (p.id % 97) / 97 * 6.28;
  const figure = FIGURES[stubeFigureKey(pl)];
  // the picture always matches the resident's real age and sex
  if (spot === "bed") return small
    ? { url: sleepChildUrl, x: 0.1, y: slot ? 0.497 : 0.677, h: 0.03, flip: false, anim: "sleep", ph }
    : { url: sleepUrl, x: 0.12, y: slot ? 0.497 : 0.677, h: 0.043 * (kid ? 0.8 : 1), flip: false, anim: "sleep", ph };
  if (spot === "hearth") return { url: figure ?? stirUrl, x: 0.35, y: 0.82, h: 0.3 * (kid ? 0.7 : 1), flip: false, anim: "stir", ph };
  if (spot === "fire") return { url: figure ?? elderUrl, x: 0.455, y: 0.82, h: 0.22 * (kid ? 0.75 : 1), flip: false, anim: "warm", ph };
  if (spot === "table") {
    const left = slot % 2 === 0;
    const url = figure ?? manUrl;
    const flip = left ? f : !f; // males face right, females face left in the art
    const x = [0.56, 0.715, 0.525, 0.75][slot] ?? 0.56;
    return { url, x, y: slot < 2 ? 0.8 : 0.83, h: kid ? 0.2 * Math.min(1, 0.6 + p.age / 30) : 0.26, flip, anim: "eat", ph };
  }
  return null;
}

/** Merchant's town house, cut open top to bottom (fractions of the 1024×1536 picture): bedchamber, Dornse, Diele. */
export function tallFigOf(pl: StubePlace): Fig | null {
  const { p, spot, slot } = pl, kid = p.age < 14, small = p.age < SWADDLE_AGE, f = p.sex === "f", ph = (p.id % 97) / 97 * 6.28;
  const figure = FIGURES[stubeFigureKey(pl, true)] ?? manUrl;
  if (spot === "bed") return { url: small ? sleepChildUrl : sleepUrl, x: slot ? 0.405 : 0.235, y: 0.398, h: small ? 0.028 : 0.04 * (kid ? 0.8 : 1), flip: false, anim: "sleep", ph };
  if (spot === "hearth") return { url: figure, x: 0.4, y: 0.895, h: 0.12 * (kid ? 0.7 : 1), flip: false, anim: "stir", ph };
  if (spot === "fire") return { url: figure, x: 0.31, y: 0.655, h: 0.09 * (kid ? 0.75 : 1), flip: false, anim: "warm", ph };
  if (spot === "desk") return { url: figure, x: 0.6, y: 0.895, h: 0.1, flip: false, anim: "write", ph };
  if (spot === "table") {
    const left = slot % 2 === 0, url = figure;
    return { url, x: ([0.6, 0.745, 0.565, 0.785][slot] ?? 0.6), y: slot < 2 ? 0.635 : 0.655, h: kid ? 0.08 * Math.min(1, 0.6 + p.age / 30) : 0.1, flip: !left, anim: "eat", ph };
  }
  return null;
}
type Layout = { w: number; h: number; seat: (pl: StubePlace) => Fig | null; slots: typeof STUBE_SLOTS; glow: [number, number, number, number][]; floors?: [keyof typeof STUBE.de.floors, number][] };
const WIDE: Layout = { w: 1536, h: 1024, seat: figOf, slots: STUBE_SLOTS, glow: [[0.42, 0.71, 0.38, 1]] };
const TALL: Layout = { w: 1024, h: 1536, seat: tallFigOf, slots: PATRICIAN_SLOTS, glow: [[0.26, 0.84, 0.32, 1], [0.39, 0.6, 0.2, 0.5], [0.62, 0.36, 0.12, 0.35]], floors: [["loft", 0.04], ["chamber", 0.3], ["dornse", 0.495], ["diele", 0.685]] };
const layoutOf = (k: StubeKind) => (k === "patrician" ? TALL : WIDE);

/** Farmhouse diorama: the painted room with exactly those residents the derived routine keeps at home. */
export function Stube({ kind = "farmhouse", seed, seeds, residents, family, lang, onClose }: { seed: Seed; seeds: Seed[]; residents: Person[]; family: string; lang: Lang; onClose: () => void; kind?: StubeKind }) {
  const T = STUBE[lang];
  const ref = useRef<HTMLCanvasElement>(null);
  const L0 = layoutOf(kind), W = L0.w, H = L0.h;
  const [places, setPlaces] = useState<StubePlace[]>(() => stubeOf(residents, seed, seeds, clock(), L0.slots));
  useEffect(() => { const id = setInterval(() => setPlaces(stubeOf(residents, seed, seeds, clock(), L0.slots)), 2000); return () => clearInterval(id); }, [residents, seed, seeds, L0]);
  // never in lockstep: housemates have neighbouring ids, so each figure gets a hashed tempo and a golden-ratio phase offset in the room
  const figs = useMemo(() => places.map((pl, i) => { const f = L0.seat(pl); if (!f) return null; const u = (Math.imul(pl.p.id | 0, 2654435761) >>> 0) / 4294967296; return { ...f, ph: f.ph + u * 9 + i * 2.618, rate: 0.82 + ((u * 7.31) % 1) * 0.36 }; }).filter((f): f is Fig => !!f).sort((a, b) => a.y - b.y), [places, L0]);
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
        const w = f.anim === "sleep" ? 0.115 * 1536 * (f.h / 0.043) : f.h * H * im.naturalWidth / im.naturalHeight;
        const hh = w * im.naturalHeight / im.naturalWidth;
        const px = f.x * W, py = f.y * H;
        if ((f.anim === "eat" || f.anim === "warm") && !OWN_SEAT.has(f.url)) {
          const seat = img(seatUrl);
          if (seat.complete && seat.naturalWidth) {
            const sh = hh * 0.37, sw = sh * seat.naturalWidth / seat.naturalHeight;
            g.drawImage(seat, px - sw / 2, py - sh, sw, sh);
          }
        }
        g.save(); g.translate(px, py);
        if (f.flip) g.scale(-1, 1);
        const tr = t * (f.rate ?? 1), s = Math.sin(tr * 0.8 + f.ph), L = LAYERS[f.url];
        if (f.anim === "sleep" || !L) { g.scale(1, 1 + 0.025 * s); g.drawImage(im, -w / 2, -hh, w, hh); } // breathing under the blanket
        else {
          const [hA, mv, hB] = GESTURE[f.anim], k = poseMix(tr + f.ph, hA, mv, hB);
          const [base, top, alt] = L.map(img) as [HTMLImageElement, HTMLImageElement, HTMLImageElement];
          g.drawImage(base, -w / 2, -hh, w, hh);
          // the upper body breathes gently and leans into each gesture
          g.translate(0, -hh * 0.4); g.scale(1, 1 + 0.006 * Math.sin(tr * 1.6 + f.ph)); g.translate(0, hh * 0.4);
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
      for (const [gx, gy, gr0, gk] of L0.glow) {
        const gr = g.createRadialGradient(gx * W, gy * H, 10, gx * W, gy * H, gr0 * W);
        gr.addColorStop(0, `rgba(255,150,60,${(0.22 + 0.3 * n) * fl * gk})`); gr.addColorStop(1, "rgba(255,120,40,0)");
        g.fillStyle = gr; g.fillRect(0, 0, W, H);
      }
      g.globalCompositeOperation = "source-over";
      raf = requestAnimationFrame(draw);
    };
    for (const u of [seatUrl, ...Object.values(FIGURES), roomUrl, hutRoomUrl, manUrl, womanUrl, sleepUrl, stirUrl, elderUrl, elderWomanUrl, boyUrl, girlUrl, sleepChildUrl, ...Object.values(LAYERS).flat()]) img(u);
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [figs, kind, seed, L0, W, H]);
  useEffect(() => { const k = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); }; window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [onClose]);
  const home = places.filter((p) => p.spot !== "out"), away = places.filter((p) => p.spot === "out");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-3 backdrop-blur-[2px]" onClick={onClose}>
      <div className={`w-full ${L0.floors ? "max-w-md" : "max-w-4xl"} overflow-hidden rounded-xl border-4 border-[hsl(25_35%_25%)] bg-card shadow-2xl`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-3 px-3 py-1.5">
          <div className="font-['Caveat'] text-2xl leading-tight">{T.title(family)}</div>
          <button type="button" aria-label={T.close} className="hit relative p-1 text-2xl leading-none text-muted-foreground hover:text-foreground" onClick={onClose}>×</button>
        </div>
        {L0.floors ? (
          <div className="relative max-h-[70dvh] overflow-y-auto overscroll-contain">
            <div className="relative">
              <canvas ref={ref} width={W} height={H} className="block aspect-[2/3] w-full" dir="ltr" />
              {L0.floors.map(([k, at]) => (
                <span key={k} className="pointer-events-none absolute start-2 rounded bg-card/80 px-1.5 font-['Caveat'] text-base leading-tight text-foreground" style={{ top: at * 100 + "%" }}>{T.floors[k]}</span>
              ))}
            </div>
          </div>
        ) : <canvas ref={ref} width={W} height={H} className="block aspect-[3/2] max-h-[70dvh] w-full object-contain" dir="ltr" />}
        <div className="space-y-0.5 px-3 py-2 text-xs text-muted-foreground">
          {residents.length === 0 ? <div>{T.nobodyLives}</div> : home.length === 0 ? <div>{T.empty}</div> : null}
          {away.length > 0 && <div><span className="font-semibold">{T.out}:</span> {away.map((a) => a.p.first).join(", ")}</div>}
        </div>
      </div>
    </div>
  );
}
