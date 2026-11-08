import { useEffect, type RefObject } from "react";

/** Magnifier cursor (hot spot in the lens centre) for the Schaukasten lens. */
const LENS = `url("data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><line x1="19" y1="19" x2="29" y2="29" stroke="#3b2414" stroke-width="5" stroke-linecap="round"/><line x1="19" y1="19" x2="28" y2="28" stroke="#8a5a2b" stroke-width="3" stroke-linecap="round"/><circle cx="12" cy="12" r="9" fill="rgba(255,248,225,0.35)" stroke="#3b2414" stroke-width="3.5"/><circle cx="12" cy="12" r="9" fill="none" stroke="#c9a14a" stroke-width="1.5"/></svg>',
)}") 12 12, zoom-in`;

/** Lens mode shows a magnifier; otherwise (also while strolling) the canvas keeps its normal cursor. */
export function useModeCursor(ref: RefObject<HTMLCanvasElement | null>, lens: boolean, walk: boolean) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (lens && !walk) { el.style.cursor = LENS; return () => { el.style.cursor = ""; }; }
    el.style.cursor = "";
    return undefined;
  }, [ref, lens, walk]);
}
