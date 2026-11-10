/**
 * Diagnostic-only performance probe. Inactive unless the URL carries ?perf=1 (any build, any realm).
 * When off every call returns after one boolean check, so the picture and game logic never change.
 *
 * Timing: nested spans keep a stack; each span records inclusive time (whole span) and exclusive
 * time (inclusive minus its child spans), so nested functions are never counted twice.
 * Memory: canvases / OffscreenCanvases / ImageBitmaps are tracked through weak references from the
 * moment the probe switches on; bytes are an *estimate* (w × h × 4, uncompressed RGBA) and are
 * reported separately from the real JS heap (performance.memory, Chromium only).
 */
type SpanAgg = { incl: number; excl: number; calls: number };
type FrameRow = { t: number; interval: number; draw: number; spans: Record<string, [number, number]>; counts: Record<string, number> };

const on: boolean = (() => {
  try { return typeof location !== "undefined" && new URLSearchParams(location.search).get("perf") === "1"; } catch { return false; }
})();
export const perfOn = () => on;
/** ?perf=0 keeps the probe off but still exposes the benchmark camera hook, so overhead can be compared at the same scene. */
export const perfCamOn = (): boolean => { try { return on || (typeof location !== "undefined" && new URLSearchParams(location.search).get("perf") === "0"); } catch { return false; } };

const now = () => performance.now();
// span stack
const sName: string[] = [], sT0: number[] = [], sChild: number[] = [];
let frameSpans: Record<string, [number, number]> = {};
let frameCounts: Record<string, number> = {};
const totals = new Map<string, SpanAgg>();
const countTotals = new Map<string, number>();
const evictions = new Map<string, number>();
const frames: FrameRow[] = [];
const MAX_FRAMES = 20000;
let lastFrame = -1;
let scenario = "";

export function pBegin(name: string) {
  if (!on) return;
  sName.push(name); sT0.push(now()); sChild.push(0);
}
export function pEnd() {
  if (!on || !sName.length) return;
  const name = sName.pop()!, t0 = sT0.pop()!, child = sChild.pop()!;
  const incl = now() - t0, excl = incl - child;
  if (sChild.length) sChild[sChild.length - 1]! += incl;
  const f = frameSpans[name] ?? (frameSpans[name] = [0, 0]); f[0] += incl; f[1] += excl;
  const a = totals.get(name) ?? { incl: 0, excl: 0, calls: 0 }; a.incl += incl; a.excl += excl; a.calls++; totals.set(name, a);
}
export function pCount(name: string, n = 1) {
  if (!on) return;
  frameCounts[name] = (frameCounts[name] ?? 0) + n;
  countTotals.set(name, (countTotals.get(name) ?? 0) + n);
}
export function pEvict(cache: string, n = 1) {
  if (!on) return;
  evictions.set(cache, (evictions.get(cache) ?? 0) + n);
}
/** Called once per animation frame by the render loop with the measured draw() duration. */
export function pFrame(drawMs: number) {
  if (!on) return;
  sName.length = 0; sT0.length = 0; sChild.length = 0; // a thrown frame must never unbalance the next one
  const t = now(), interval = lastFrame < 0 ? 0 : t - lastFrame; lastFrame = t;
  if (frames.length < MAX_FRAMES) frames.push({ t, interval, draw: drawMs, spans: frameSpans, counts: frameCounts });
  frameSpans = {}; frameCounts = {};
}

// ---- cache size reporters (registered by render.ts) ----
type CacheInfo = { entries: number; bytes: number };
const caches = new Map<string, () => CacheInfo>();
export function pCache(name: string, fn: () => CacheInfo) { if (on) caches.set(name, fn); }
export const canvasBytes = (cv: { width: number; height: number } | null | undefined) => (cv ? cv.width * cv.height * 4 : 0);

// ---- graphics object census ----
type Tracked = { ref: WeakRef<object>; kind: "canvas" | "offscreen" | "bitmap"; born: number };
const tracked: Tracked[] = [];
let created = { canvas: 0, offscreen: 0, bitmap: 0 };
let bitmapsClosed = 0;
if (on && typeof window !== "undefined" && typeof WeakRef !== "undefined") {
  const ce = document.createElement.bind(document);
  document.createElement = ((tag: string, o?: ElementCreationOptions) => {
    const el = ce(tag, o);
    if (tag.toLowerCase() === "canvas") { created.canvas++; tracked.push({ ref: new WeakRef(el), kind: "canvas", born: now() }); }
    return el;
  }) as typeof document.createElement;
  if (typeof OffscreenCanvas !== "undefined") {
    const OC = OffscreenCanvas;
    (window as unknown as { OffscreenCanvas: unknown }).OffscreenCanvas = class extends OC {
      constructor(w: number, h: number) { super(w, h); created.offscreen++; tracked.push({ ref: new WeakRef(this), kind: "offscreen", born: now() }); }
    };
  }
  if (typeof createImageBitmap !== "undefined") {
    const cib = window.createImageBitmap.bind(window);
    (window as unknown as { createImageBitmap: unknown }).createImageBitmap = async (...a: Parameters<typeof createImageBitmap>) => {
      const bm = await cib(...a); created.bitmap++; tracked.push({ ref: new WeakRef(bm), kind: "bitmap", born: now() });
      const close = bm.close.bind(bm); bm.close = () => { bitmapsClosed++; close(); };
      return bm;
    };
  }
}
function census() {
  const out = { canvas: { live: 0, bytes: 0 }, offscreen: { live: 0, bytes: 0 }, bitmap: { live: 0, bytes: 0 } };
  const dims = new Map<string, number>();
  for (let i = tracked.length - 1; i >= 0; i--) {
    const o = tracked[i]!.ref.deref() as { width: number; height: number } | undefined;
    if (!o) { tracked.splice(i, 1); continue; }
    const w = o.width, h = o.height; if (!w || !h) continue; // closed bitmaps report 0×0
    const k = tracked[i]!.kind; out[k].live++; out[k].bytes += w * h * 4;
    const d = `${k}:${w}x${h}`; dims.set(d, (dims.get(d) ?? 0) + 1);
  }
  const topDims = [...dims.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25).map(([d, n]) => ({ dim: d, n }));
  return { created: { ...created }, bitmapsClosed, ...out, estBytes: out.canvas.bytes + out.offscreen.bytes + out.bitmap.bytes, topDims };
}

// ---- memory timeline ----
const memRows: { t: number; scenario: string; jsHeapUsed: number | null; jsHeapTotal: number | null; estGfxBytes: number; liveCanvases: number; liveBitmaps: number; cacheBytes: number }[] = [];
function cacheSnap() { const o: Record<string, CacheInfo> = {}; let bytes = 0; for (const [k, f] of caches) { try { const v = f(); o[k] = v; bytes += v.bytes; } catch { /* ignore */ } } return { caches: o, bytes }; }
function memSample() {
  const m = (performance as unknown as { memory?: { usedJSHeapSize: number; totalJSHeapSize: number } }).memory;
  const c = census(), cs = cacheSnap();
  memRows.push({ t: now(), scenario, jsHeapUsed: m?.usedJSHeapSize ?? null, jsHeapTotal: m?.totalJSHeapSize ?? null, estGfxBytes: c.estBytes, liveCanvases: c.canvas.live + c.offscreen.live, liveBitmaps: c.bitmap.live, cacheBytes: cs.bytes });
}
if (on && typeof window !== "undefined") setInterval(memSample, 5000);

const pct = (a: number[], p: number) => { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))]!; };
function dist(a: number[]) {
  return { n: a.length, mean: a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0, p50: pct(a, 50), p95: pct(a, 95), p99: pct(a, 99), max: a.length ? Math.max(...a) : 0,
    over33: a.filter((x) => x > 33).length, over50: a.filter((x) => x > 50).length, over100: a.filter((x) => x > 100).length };
}
function summary() {
  const fr = frames.slice(1); // first interval is undefined
  const iv = fr.map((f) => f.interval), dr = fr.map((f) => f.draw);
  const dur = fr.length ? (fr[fr.length - 1]!.t - frames[0]!.t) / 1000 : 0;
  const spans: Record<string, { inclTotal: number; exclTotal: number; calls: number; inclPerFrame: number; exclPerFrame: number; exclP95: number }> = {};
  for (const [k, a] of totals) {
    const ex = fr.map((f) => f.spans[k]?.[1] ?? 0);
    spans[k] = { inclTotal: a.incl, exclTotal: a.excl, calls: a.calls, inclPerFrame: a.incl / Math.max(1, fr.length), exclPerFrame: a.excl / Math.max(1, fr.length), exclP95: pct(ex, 95) };
  }
  const counts: Record<string, number> = {}; for (const [k, v] of countTotals) counts[k] = v / Math.max(1, fr.length);
  return { scenario, seconds: dur, fps: dur ? fr.length / dur : 0, frameInterval: dist(iv), drawTime: dist(dr), spans, countsPerFrame: counts, evictions: Object.fromEntries(evictions), graphics: census(), ...cacheSnap() };
}
function reset(name = "") {
  scenario = name; frames.length = 0; totals.clear(); countTotals.clear(); evictions.clear(); lastFrame = -1; frameSpans = {}; frameCounts = {};
}
function framesCsv() {
  const keys = [...totals.keys()].sort(), ck = [...countTotals.keys()].sort();
  const head = ["t_ms", "interval_ms", "draw_ms", ...keys.flatMap((k) => [`${k}.incl`, `${k}.excl`]), ...ck.map((k) => `n.${k}`)].join(",");
  const rows = frames.map((f) => [f.t.toFixed(2), f.interval.toFixed(2), f.draw.toFixed(3), ...keys.flatMap((k) => [(f.spans[k]?.[0] ?? 0).toFixed(3), (f.spans[k]?.[1] ?? 0).toFixed(3)]), ...ck.map((k) => String(f.counts[k] ?? 0))].join(","));
  return [head, ...rows].join("\n");
}
if (on && typeof window !== "undefined") {
  (window as unknown as { __perf: unknown }).__perf = { summary, reset, framesCsv, memRows: () => memRows, memSample, census, frames: () => frames };
}
