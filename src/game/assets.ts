/** Core sprite preloading with progress, used by the first-visit loading screen.
 * Night windows and hunting sheets are left out: they stream in afterwards. */
const all = import.meta.glob<string>(["@/assets/sprites/**/*.webp", "@/assets/sprites/**/*.png", "@/assets/terrain/**/*.webp", "@/assets/terrain/**/*.png"], { eager: true, import: "default" });
const LATE = /\/night\/|deer|boar|hunter|-night/;
export const CORE_URLS = Object.entries(all).filter(([p]) => !LATE.test(p)).map(([, u]) => u);

let loaded = 0, started = false;
export function startCoreLoad() {
  if (started || typeof Image === "undefined") return;
  started = true;
  for (const u of CORE_URLS) {
    const im = new Image();
    im.decoding = "async";
    im.onload = im.onerror = () => { loaded++; };
    im.src = u;
  }
}
export const coreProgress = () => ({ loaded, total: CORE_URLS.length });
