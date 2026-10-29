import { useEffect, useRef, useState } from "react";
import { coreProgress, startCoreLoad } from "@/game/assets";
import { ART } from "@/game/decisions";

let shownOnce = false;

/** true once the parchment splash has finished on this page view */
export const splashDone = () => shownOnce;

/** Parchment loading screen on the first page load until core sprites are in memory (max 8 s). */
export function LoadingScreen({ title, lines, onDone }: { title: string; lines: string[]; onDone?: () => void }) {
  const [p, setP] = useState(0);
  const [fade, setFade] = useState(shownOnce);
  const [gone, setGone] = useState(shownOnce);
  const [line, setLine] = useState(0);
  const done = useRef(onDone);
  done.current = onDone;
  useEffect(() => {
    if (shownOnce) { done.current?.(); return; }
    startCoreLoad();
    const t0 = performance.now();
    let raf = 0;
    const tick = () => {
      const { loaded, total } = coreProgress();
      const f = total ? loaded / total : 1;
      setP(f);
      if (f >= 1 || performance.now() - t0 > 8000) {
        shownOnce = true; setFade(true);
        setTimeout(() => { setGone(true); done.current?.(); }, 600);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const iv = setInterval(() => setLine((l) => l + 1), 1800);
    return () => { cancelAnimationFrame(raf); clearInterval(iv); };
  }, []);
  if (gone) return null;
  return (
    <div className={`absolute inset-0 z-50 grid place-items-center bg-background p-4 transition-opacity duration-500 ${fade ? "pointer-events-none opacity-0" : "opacity-100"}`}>
      <div className="parchment w-full max-w-md overflow-hidden">
        {ART["guide"] && <img src={ART["guide"]} alt="" width={768} height={480} className="parchment-art block aspect-[16/10] w-full object-cover" />}
        <div className="px-6 pb-6 pt-3 text-center text-ink">
          <h1 className="font-display text-5xl leading-none">{title}</h1>
          <p className="mt-2 min-h-[1.5em] italic opacity-80">{lines[line % lines.length]}</p>
          <div className="mx-auto mt-4 h-2.5 w-4/5 overflow-hidden rounded-full border border-wood/60 bg-ink/10">
            <div className="h-full rounded-full bg-brass transition-[width] duration-200" style={{ width: `${Math.round(p * 100)}%` }} />
          </div>
          <p className="mt-1 text-xs tabular-nums opacity-60">{Math.round(p * 100)} %</p>
        </div>
      </div>
    </div>
  );
}
