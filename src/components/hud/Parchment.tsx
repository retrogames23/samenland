import { useEffect, useRef, useState, type ReactNode } from "react";
import { X } from "lucide-react";

/** Short haptic tick on phones that support it; silently ignored elsewhere. */
export const buzz = (ms = 8) => { try { navigator.vibrate?.(ms); } catch { /* unsupported */ } };

/** Illustrated parchment overlay for decisions (road, charter, encounters).
 *  On phones it rises from the bottom as a sheet within thumb reach and closes with a downward swipe. */
export function Parchment({ image, title, later, onLater, wide, action, children }: {
  image?: string | undefined; title: string; later: string; onLater: () => void; wide?: boolean; action?: ReactNode; children: ReactNode;
}) {
  const y0 = useRef<number | null>(null);
  const body = useRef<HTMLDivElement>(null);
  const [more, setMore] = useState(false);
  // soft fade + chevron while the parchment can be scrolled further down
  const checkMore = () => { const el = body.current; if (el) setMore(el.scrollHeight - el.scrollTop - el.clientHeight > 8); };
  useEffect(() => { checkMore(); const el = body.current; if (!el) return; const ro = new ResizeObserver(checkMore); ro.observe(el); return () => ro.disconnect(); }, [children]);
  return (
    <div className="absolute inset-0 z-40 grid place-items-center bg-foreground/40 p-3 backdrop-blur-[1px] max-md:place-items-end max-md:p-0">
      <div ref={body} onScroll={checkMore}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => { y0.current = e.currentTarget.scrollTop <= 0 && e.target === e.currentTarget.querySelector("img") ? e.touches[0]!.clientY : null; }}
        onTouchEnd={(e) => { if (y0.current != null && e.changedTouches[0]!.clientY - y0.current > 80) onLater(); y0.current = null; }}
        className={`parchment relative max-h-full w-full overflow-y-auto overflow-x-hidden overscroll-contain max-md:max-h-[88dvh] max-md:rounded-b-none max-md:pb-[env(safe-area-inset-bottom)] max-md:animate-in max-md:slide-in-from-bottom ${wide ? "max-w-2xl" : "max-w-xl"} max-md:max-w-none`}>
        <div aria-hidden className="sticky top-0 z-10 mx-auto h-0 md:hidden"><div className="mx-auto mt-1.5 h-1 w-12 rounded-full bg-ink/30" /></div>
        {/* zero-height sticky rail keeps the close cross in reach while the parchment scrolls */}
        <div className="sticky top-0 z-20 h-0">
          <button type="button" aria-label={later} onClick={onLater}
            className="hit absolute end-2 top-2 grid h-9 w-9 place-items-center rounded-full bg-parchment/90 text-ink/60 shadow-sm hover:bg-parchment hover:text-ink md:h-7 md:w-7">
            <X className="h-4 w-4" />
          </button>
        </div>
        {image && (
          <img src={image} alt="" width={768} height={480} className="parchment-art mx-auto block aspect-[16/10] max-h-[22dvh] w-full object-cover object-[50%_15%] sm:max-h-[36vh]" />
        )}
        <div className="px-5 pb-5 pt-2 sm:px-8">
          <h2 className="text-center font-display text-4xl leading-none text-ink max-md:text-3xl">{title}</h2>
          <div className="mx-auto my-2 h-px w-2/3 bg-ink/30" />
          {children}
          {/* sticky footer: the primary action and "later" stay visible however long the text runs */}
          <div className="sticky bottom-0 z-10 -mx-5 -mb-5 mt-4 bg-parchment/95 px-5 pb-4 pt-3 sm:-mx-8 sm:px-8 max-md:pb-[calc(1rem+env(safe-area-inset-bottom))]">
            {more && <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-10 h-10 bg-gradient-to-t from-parchment/95 to-transparent"><span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 animate-bounce text-ink/50">▾</span></div>}
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              {action}
              <button type="button" onClick={onLater} className="hit relative font-display text-xl text-ink/70 underline decoration-ink/30 underline-offset-4 hover:text-ink">{later}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import sealUrl from "@/assets/wax-seal.webp";
/** Wax seal reminder for a postponed decision. */
export function WaxSeal({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" title={label} aria-label={label} onClick={onClick}
      className="hit pointer-events-auto relative block h-12 w-12 transition-transform hover:scale-105">
      <img src={sealUrl} alt="" width={48} height={48} className="h-12 w-12 object-contain drop-shadow-md" />
    </button>
  );
}
