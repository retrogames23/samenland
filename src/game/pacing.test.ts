import { describe, expect, it } from "vitest";
import { stageOf, radiusOf, birthAt, structureAt, landmarkSpots, LANDMARKS, terrain, buildable, waterNearby, links, type Seed, type Kind } from "./world";
import { seasonAt } from "./season";
const now = Date.UTC(2026,6,15,12);
function seed(h: number, x=512, y=512, id="pacing"): Seed { return {id,x,y,name:"Test",owner:"Test",hue:90,created_at:new Date(now-h*3600000).toISOString()}; }
let site: [number,number] = [512,512];
outer: for(let y=400;y<600;y+=4) for(let x=400;x<600;x+=4) {
  if ([[0,0],[1,0],[0,1],[1,1],[-1,0],[2,-2],[3,1],[3,-4],[8,6]].every(([dx,dy])=>buildable(terrain(x+(dx??0),y+(dy??0))))) {site=[x,y];break outer;}
}
let wsite: [number,number] = site;
wouter: for(let y=200;y<824;y+=6) for(let x=200;x<824;x+=6) {
  if (buildable(terrain(x,y)) && buildable(terrain(x+1,y)) && buildable(terrain(x,y+1)) && waterNearby(x+8,y) && !waterNearby(x,y)) {wsite=[x,y];break wouter;}
}
describe("two-year pacing",()=>{
  for(const [h,stage] of [[0,0],[24,1],[168,2],[2160,3],[4380,4],[8760,5]] as const) it(`enters era ${stage} at ${h} hours`,()=>{
    expect(stageOf(h)).toBe(stage); if(h>0) expect(stageOf(h-0.001)).toBe(stage-1);
  });
  it("has about 40–45 tiles radius at two years and keeps growing",()=>{ expect(radiusOf(17520)).toBeGreaterThanOrEqual(40);expect(radiusOf(17520)).toBeLessThanOrEqual(45);expect(radiusOf(35040)).toBeGreaterThan(radiusOf(17520)); });
  it("expands sublinearly and has an invertible birth curve",()=>{ for(const h of [1,24,168,720,4380,8760,17520]) {expect(radiusOf(h+24)).toBeGreaterThan(radiusOf(h));expect(birthAt(radiusOf(h))).toBeCloseTo(h,5);}expect(radiusOf(17520)-radiusOf(8760)).toBeLessThan(radiusOf(8760)-radiusOf(0)); });
  it("starts with two huts, a well, fire and a vegetable garden during day one",()=>{const s=seed(12,...site); for(const [dx,dy,kind] of [[0,0,"well"],[1,0,"hut"],[0,1,"hut"],[1,1,"campfire"],[-1,0,"garden"]] as [number,number,Kind][])expect(structureAt(s.x+dx,s.y+dy,[s],now)?.kind).toBe(kind);});
  it("densifies the historic core instead of replacing it with industry",()=>{const s=seed(17520,...site); expect(structureAt(s.x+1,s.y,[s],now)?.kind).toBe("townhouse");const seat=[...landmarkSpots(s)].find(([,i])=>i.some((n)=>LANDMARKS[n]!.kind==="townhall"))![0].split(",").map(Number); expect(structureAt(s.x+seat[0]!,s.y+seat[1]!,[s],now)?.kind).toBe("townhall");});
  it("only places harbors and watermills near water",()=>{const s=seed(17520,...wsite); let checked=0;for(let y=s.y-44;y<s.y+44;y++)for(let x=s.x-44;x<s.x+44;x++){const st=structureAt(x,y,[s],now);if(st?.kind==="harbor"||st?.kind==="watermill"){checked++;expect(waterNearby(x,y)).toBe(true);}}expect(checked).toBeGreaterThan(0);});
  it("keeps a one-month-old settlement free of late-era landmarks",()=>{const s=seed(720,...site);const industrial=new Set<Kind>(["factory","manufactory","steamworks","station","suburb"]);for(let y=s.y-14;y<=s.y+14;y++)for(let x=s.x-14;x<=s.x+14;x++){const st=structureAt(x,y,[s],now);expect(st&&industrial.has(st.kind)).not.toBe(true);}});
  it("keeps the second-year metropolis pre-industrial: no rails between towns",()=>{const a=seed(20000,...site,"a"), b=seed(20000,site[0]+40,site[1],"b");for(const l of links([a,b]))for(const [x,y] of l.tiles)expect(structureAt(x,y,[a,b],now)?.kind).not.toBe("rail");});
});
describe("calendar seasons",()=>{
  for(const [month,season] of [[0,"winter"],[3,"spring"],[6,"summer"],[9,"autumn"]] as const) it(`uses real UTC month ${month+1} for ${season}`,()=>expect(seasonAt(Date.UTC(2026,month,15))[season]).toBe(1));
  it("smoothly blends through the fourteen-day transition",()=>{const w=seasonAt(Date.UTC(2026,2,1));expect(w.winter).toBe(0.5);expect(w.spring).toBe(0.5);expect(seasonAt(Date.UTC(2026,1,22)).winter).toBe(1);expect(seasonAt(Date.UTC(2026,2,8)).spring).toBe(1);});
  it("normalizes weights, including leap-year and year boundaries",()=>{for(const t of [Date.UTC(2028,1,29),Date.UTC(2026,11,31),Date.UTC(2027,0,1)]){const w=Object.values(seasonAt(t));expect(w.reduce((a,b)=>a+b,0)).toBeCloseTo(1);expect(w.every(x=>x>=0&&x<=1)).toBe(true);}});
});
