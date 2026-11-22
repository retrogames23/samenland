import { seasonAt, seasonKey, snowCoverAt, type SeasonWeights } from "./season";
import { biomeLook } from "./biome";

export type ArtRole = "building" | "leaf" | "fir" | "ground" | "field" | "water" | "flower" | "track";
type Look = ReturnType<typeof biomeLook>;

let now = 0;
/** Per-frame recolour budget (ms). Misses beyond it show the last finished seasonal surface (or, before any, the
 *  original sprite) until the staged job finishes. */
export const ART_BUDGET_MS = 6;
/** Finished seasonal surfaces kept per image (all roles together); surfaces still on screen are never evicted. */
export const ART_CACHE_PER_IMAGE = 6;
const SLICE_ROWS = 24;
let spent = 0;
const clockMs = () => (typeof performance !== "undefined" ? performance.now() : Date.now());
/** Per image: finished surfaces by key (insertion order = age), the key last asked for per role, and per role the key
 *  of the newest finished surface that was current — the stand-in while the next key is being recoloured. */
type Art = { entries: Map<string, HTMLCanvasElement>; want: Map<ArtRole, string>; shown: Map<ArtRole, string> };
const cache = new WeakMap<HTMLImageElement, Art>();
const artOf = (image: HTMLImageElement) => {
  let a = cache.get(image);
  if (!a) { a = { entries: new Map(), want: new Map(), shown: new Map() }; cache.set(image, a); }
  return a;
};
type Job = { image: HTMLImageElement; key: string; role: ArtRole; w: SeasonWeights; sc: number; look: Look; cv: HTMLCanvasElement; g: CanvasRenderingContext2D; data: ImageData; y: number };
const jobs = new Map<HTMLImageElement, Map<string, Job>>();
const queue: Job[] = [];
let provisional = false, stand = 0;
/** Monotonic count of stand-ins handed out — bakes compare before/after and never cache a surface that used one. */
export const standIns = () => stand;
/** True when the last seasonalImage() call returned a stand-in (previous season or original) — callers must not cache it. */
export const lastWasProvisional = () => provisional;

export const setArtTime = (time: number) => { now = time; spent = 0; pump(); };

/** Recolours rows y0..y1 in place. Arithmetic is the former synchronous loop verbatim (pixel-identical). */
export function recolorRows(d: Uint8ClampedArray, width: number, height: number, y0: number, y1: number, role: ArtRole, w: SeasonWeights, sc: number, look: Look) {
  for (let y=y0;y<y1;y++) for (let x=0;x<width;x++) {
    const k=(y*width+x)*4; if (!d[k+3]) continue;
    let r=d[k], green=d[k+1], b=d[k+2];
    if (r === undefined || green === undefined || b === undefined) continue;
    const lum=(r+green+b)/3;
    const foliage=role!=="track" && green>r*0.85 && green>b*1.15;
    if (look) {
      const m = role==="water" ? look.water : foliage || role==="leaf" || role==="fir" ? look.green : lum>140 && r>b ? look.sand : look.stone;
      r*=m[0]; green*=m[1]; b*=m[2];
      if (look.heather && (role==="ground"||role==="flower") && foliage && ((x*131+y*53)%97)/97<look.heather) { r=r*0.4+128*0.6; green=green*0.4+82*0.6; b=b*0.4+120*0.6; }
    }
    if (role==="leaf" && w.autumn>0) {
      const f=w.autumn*0.85, v=((x*17+y*7)%41)/41;
      r=r*(1-f)+(lum*1.6+35)*f; green=green*(1-f)+(lum*(0.85+v*0.45))*f; b=b*(1-f)+lum*0.4*f;
    } else if ((role==="ground"||role==="flower") && foliage) {
      const f=w.autumn*0.32; r+=f*55; green-=f*15;
      r+=w.spring*3; green+=w.spring*12;
    } else if (role==="field" && w.autumn>0) {
      const f=w.autumn*0.55; r=r*(1-f)+lum*1.15*f; green=green*(1-f)+lum*0.82*f; b=b*(1-f)+lum*0.48*f;
    }
    if (role==="water") { r*=1-w.winter*0.22; green*=1-w.winter*0.18; b*=1-w.winter*0.08; }
    else {
      let snow=0;
      if (role==="ground"||role==="flower"||role==="field") { snow=sc*0.8; if (sc<0.5) { const f=w.winter*(1-sc*2)*0.35; r=r*(1-f)+lum*0.95*f+f*14; green=green*(1-f)+lum*0.9*f; b=b*(1-f)+lum*0.85*f; } }
      else if (role==="track") { snow=sc*0.12; const wet=1-w.winter*0.22; r*=wet; green*=wet; b*=wet*1.02; }
      else if (role==="leaf"||role==="fir") snow=sc*(lum>55?0.65:0.15);
      else if (y<height*0.65 && lum>65 && r>b*0.8) snow=sc*0.78;
      r=r*(1-snow)+231*snow; green=green*(1-snow)+239*snow; b=b*(1-snow)+242*snow;
      if (role==="flower" && w.spring>0 && foliage && ((x*197+y*29)%359)<3) { const f=w.spring; r=r*(1-f)+242*f; green=green*(1-f)+205*f; b=b*(1-f)+221*f; }
    }
    d[k]=r; d[k+1]=green; d[k+2]=b;
  }
}

/** Advances one job within the frame budget; commits only under the key it was computed for. Returns the canvas when done. */
function step(job: Job): HTMLCanvasElement | null {
  const { cv, data } = job;
  while (job.y < cv.height) {
    if (spent >= ART_BUDGET_MS) return null;
    const t0 = clockMs(), y1 = Math.min(cv.height, job.y + SLICE_ROWS);
    recolorRows(data.data, cv.width, cv.height, job.y, y1, job.role, job.w, job.sc, job.look);
    job.y = y1; spent += clockMs() - t0;
  }
  job.g.putImageData(data, 0, 0);
  drop(job);
  const art = artOf(job.image), { entries, shown, want } = art;
  // Bound memory: evict the oldest surfaces, never one still standing in for a role or the key now asked for.
  if (!entries.has(job.key)) for (const k of entries.keys()) {
    if (entries.size < ART_CACHE_PER_IMAGE) break;
    if (!isHeld(art, k)) entries.delete(k);
  }
  entries.set(job.key, job.cv);
  // Only the key currently asked for becomes the stand-in: a superseded job never replaces a newer surface.
  if (want.get(job.role) === job.key) shown.set(job.role, job.key);
  return job.cv;
}
function isHeld(art: Art, key: string) {
  for (const k of art.shown.values()) if (k === key) return true;
  for (const k of art.want.values()) if (k === key) return true;
  return false;
}
function drop(job: Job) {
  const pend = jobs.get(job.image); pend?.delete(job.key); if (pend && !pend.size) jobs.delete(job.image);
  const qi = queue.indexOf(job); if (qi >= 0) queue.splice(qi, 1);
}
/** The key asked for changed: the surface on screen until now becomes the stand-in, superseded jobs are cancelled. */
function retarget(art: Art, image: HTMLImageElement, role: ArtRole, key: string) {
  const prev = art.want.get(role);
  if (prev !== undefined && art.entries.has(prev)) art.shown.set(role, prev);
  art.want.set(role, key);
  const pend = jobs.get(image);
  if (pend) for (const job of [...pend.values()]) if (job.role === role && job.key !== key) drop(job);
}
function pump() { while (queue.length && spent < ART_BUDGET_MS) { if (!step(queue[0]!)) break; } }

/** Cached, alpha-preserving seasonal surfaces, recoloured in budgeted row slices; meanwhile the last finished surface of
 *  the same image and role stands in (the original only before any exists). */
export function seasonalImage(image: HTMLImageElement, role: ArtRole = "building"): HTMLImageElement | HTMLCanvasElement {
  provisional = false;
  const w = seasonAt(now), sc = snowCoverAt(now), key = `${role}:${seasonKey(now)}`;
  const look = role === "building" ? null : biomeLook();
  if (!look && (w.winter + w.autumn + w.spring < 0.02 || role === "water" && w.winter < 0.02)) {
    // the original is the current look again: it, not an old season, stands in for the next recolour
    const a = cache.get(image);
    if (a?.want.has(role)) { a.want.delete(role); a.shown.delete(role); const pend = jobs.get(image); if (pend) for (const job of [...pend.values()]) if (job.role === role) drop(job); }
    return image;
  }
  const art = artOf(image);
  if (art.want.get(role) !== key) retarget(art, image, role, key);
  const hit = art.entries.get(key); if (hit) return hit;
  let pend = jobs.get(image); let job = pend?.get(key);
  if (!job) {
    const cv = document.createElement("canvas"); cv.width = image.naturalWidth; cv.height = image.naturalHeight;
    const g = cv.getContext("2d"); if (!g) return image;
    const t0 = clockMs(); g.drawImage(image,0,0);
    const data = g.getImageData(0,0,cv.width,cv.height); spent += clockMs() - t0;
    job = { image, key, role, w, sc, look, cv, g, data, y: 0 };
    if (!pend) { pend = new Map(); jobs.set(image, pend); }
    pend.set(key, job); queue.push(job);
  }
  const done = step(job); if (done) return done;
  provisional = true; stand++;
  const held = art.shown.get(role);
  return (held !== undefined && art.entries.get(held)) || image;
}

/** Test/diagnostic only: pending recolour jobs (all images) and finished surfaces cached for one image. */
export function seasonArtStats(image?: HTMLImageElement) {
  return { pending: queue.length, cached: image ? cache.get(image)?.entries.size ?? 0 : 0 };
}

/** Test/reference only: the full synchronous recolour, unbudgeted. */
export function seasonalImageSync(image: HTMLImageElement, role: ArtRole = "building") {
  const saved = spent; spent = -Infinity;
  try { return seasonalImage(image, role); } finally { spent = saved; }
}
