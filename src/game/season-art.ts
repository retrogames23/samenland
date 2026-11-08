import { seasonAt, seasonKey, snowCoverAt } from "./season";
import { biomeLook } from "./biome";

let now = 0;
export const setArtTime = (time: number) => { now = time; };
const cache = new WeakMap<HTMLImageElement, Map<string, HTMLCanvasElement>>();
/** Small cached, alpha-preserving seasonal surfaces. No per-frame pixel processing. */
export function seasonalImage(image: HTMLImageElement, role: "building" | "leaf" | "fir" | "ground" | "field" | "water" | "flower" | "track" = "building"): HTMLImageElement | HTMLCanvasElement {
  const w = seasonAt(now), sc = snowCoverAt(now), key = `${role}:${seasonKey(now)}`;
  const look = role === "building" ? null : biomeLook();
  if (!look && (w.winter + w.autumn + w.spring < 0.02 || role === "water" && w.winter < 0.02)) return image;
  let entries = cache.get(image);
  if (!entries) { entries = new Map(); cache.set(image, entries); }
  const hit = entries.get(key); if (hit) return hit;
  const cv = document.createElement("canvas"); cv.width = image.naturalWidth; cv.height = image.naturalHeight;
  const g = cv.getContext("2d"); if (!g) return image;
  g.drawImage(image,0,0);
  const data = g.getImageData(0,0,cv.width,cv.height), d = data.data;
  for (let y=0;y<cv.height;y++) for (let x=0;x<cv.width;x++) {
    const k=(y*cv.width+x)*4; if (!d[k+3]) continue;
    let r=d[k], green=d[k+1], b=d[k+2];
    if (r === undefined || green === undefined || b === undefined) continue;
    const lum=(r+green+b)/3;
    const foliage=role!=="track" && green>r*0.85 && green>b*1.15;
    if (look) {
      // regional island look: tint foliage, stone, sand and water; heather speckles on open ground
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
      // Bright upward-facing surfaces retain snow; dark walls remain legible.
      let snow=0;
      if (role==="ground"||role==="flower"||role==="field") { snow=sc*0.8; if (sc<0.5) { const f=w.winter*(1-sc*2)*0.35; r=r*(1-f)+lum*0.95*f+f*14; green=green*(1-f)+lum*0.9*f; b=b*(1-f)+lum*0.85*f; } } // bare winter: dun grass with rime
      else if (role==="track") { snow=sc*0.12; const wet=1-w.winter*0.22; r*=wet; green*=wet; b*=wet*1.02; } // trodden earth: damp and darker, barely snowed
      else if (role==="leaf"||role==="fir") snow=sc*(lum>55?0.65:0.15);
      else if (y<cv.height*0.65 && lum>65 && r>b*0.8) snow=sc*0.78;
      r=r*(1-snow)+231*snow; green=green*(1-snow)+239*snow; b=b*(1-snow)+242*snow;
      if (role==="flower" && w.spring>0 && foliage && ((x*197+y*29)%359)<3) { const f=w.spring; r=r*(1-f)+242*f; green=green*(1-f)+205*f; b=b*(1-f)+221*f; }
    }
    d[k]=r; d[k+1]=green; d[k+2]=b;
  }
  g.putImageData(data,0,0);
  // Bound memory when the calendar is advanced during previews.
  if (entries.size>=6) entries.clear(); entries.set(key,cv); return cv;
}
