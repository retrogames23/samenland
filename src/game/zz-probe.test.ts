import { it } from "vitest";
import { townTiles, foodCapacity } from "./households";
import { characterOf, terrain, buildable, type Seed } from "./world";
const start = Date.parse("2026-01-01T00:00:00Z"), day = 86400000;
it("probe", () => {
  const all = ["fisher","hunter","granary","dairy","herbs","healer","library"];
  const out: string[] = [];
  let n = 0;
  for (let y = 120; y < 900 && n < 40; y += 67) for (let x = 120; x < 900 && n < 40; x += 71) {
    if (!buildable(terrain(x, y))) continue; n++;
    const s: Seed = { id: "s"+x+"_"+y, name: "p", owner: "L", hue: 1, x, y, user_id: "u", created_at: new Date(start).toISOString(), bought: all.map(item => ({ item, at: start })) };
    for (const d of [90, 365]) {
      const at = start + d*day; const tt = townTiles(s, [s], at); const k = tt.byKind;
      const farm = (k.get("field")?.length??0)+(k.get("garden")?.length??0)+(k.get("pasture")?.length??0);
      out.push(`${characterOf(x,y)} d${d} r${tt.r.toFixed(1)} farm${farm} share${(farm/(Math.PI*tt.r*tt.r)).toFixed(2)} cap${foodCapacity(s,k,Date.parse("2026-07-01"))}`);
    }
  }
  console.log(out.join("\n"));
}, 120000);
