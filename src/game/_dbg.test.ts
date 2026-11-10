import { it } from "vitest";
import { townOf, poseOf } from "./people";
import { structureAt, FLAT, canPlant, MAP, type Seed } from "./world";
function spot(): [number, number] { for (let y = MAP / 2; y < MAP; y += 3) for (let x = MAP / 2; x < MAP; x += 3) if (canPlant(x, y, []) === null) return [x, y]; throw 0; }
it("dbg", () => {
  const NOW = Date.UTC(2026, 9, 27, 2, 0, 0); const [sx,sy]=spot();
  const seed = { id: "people-test", name: "T", owner: "", x: sx, y: sy, hue: 0, created_at: "" } as unknown as Seed;
  const old: Seed = { ...seed, id: "coll", created_at: new Date(NOW - 400 * 864e5).toISOString() };
  for (let m = 0; m < 1440; m += 37) { const now = NOW + m*60000, t = townOf(old,[old],now);
    for (const p of t.people) { const q = poseOf(p,t,[old],now); if(!q.visible) continue;
      const st = structureAt(Math.round(q.x),Math.round(q.y),[old],now);
      if (st && !FLAT.has(st.kind) && !["well","market"].includes(st.kind)) console.log(p.home, p.work, p.first,p.job,q.act,q.x-old.x,q.y-old.y,st.kind,m); } }
});
