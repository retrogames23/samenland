import { useEffect, type RefObject } from "react";
import mayorWalk4 from "@/assets/sprites/folk/mayor-walk4.webp";

/** Magnifier cursor (hot spot in the lens centre) for the Schaukasten lens. */
const LENS = `url("data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><line x1="19" y1="19" x2="29" y2="29" stroke="#3b2414" stroke-width="5" stroke-linecap="round"/><line x1="19" y1="19" x2="28" y2="28" stroke="#8a5a2b" stroke-width="3" stroke-linecap="round"/><circle cx="12" cy="12" r="9" fill="rgba(255,248,225,0.35)" stroke="#3b2414" stroke-width="3.5"/><circle cx="12" cy="12" r="9" fill="none" stroke="#c9a14a" stroke-width="1.5"/></svg>',
)}") 12 12, zoom-in`;

let frames: Promise<string[]> | null = null;
/** Cuts the mayor's painted 4-step walk sheet into small cursor images (once). */
function walkFrames(): Promise<string[]> {
  frames ??= new Promise((res) => {
    const img = new Image();
    img.onload = () => {
      const fw = img.width / 4, H = 40, W = Math.round((fw / img.height) * H);
      const out: string[] = [];
      for (let i = 0; i < 4; i++) {
        const c = document.createElement("canvas"); c.width = W; c.height = H;
        c.getContext("2d")!.drawImage(img, i * fw, 0, fw, img.height, 0, 0, W, H);
        out.push(`url(${c.toDataURL("image/png")}) ${Math.round(W / 2)} ${H - 2}, pointer`);
      }
      res(out);
    };
    img.onerror = () => res([]);
    img.src = mayorWalk4;
  });
  return frames;
}

/** Lens mode shows a magnifier, stroll mode a little walking mayor; otherwise the canvas keeps its grab cursor. */
export function useModeCursor(ref: RefObject<HTMLCanvasElement | null>, lens: boolean, walk: boolean) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (lens && !walk) { el.style.cursor = LENS; return () => { el.style.cursor = ""; }; }
    if (!walk) { el.style.cursor = ""; return; }
    let id = 0, dead = false;
    void walkFrames().then((f) => {
      if (dead || !f.length) return;
      let i = 0; el.style.cursor = f[0];
      id = window.setInterval(() => { i = (i + 1) % f.length; el.style.cursor = f[i]; }, 180);
    });
    return () => { dead = true; clearInterval(id); el.style.cursor = ""; };
  }, [ref, lens, walk]);
}
