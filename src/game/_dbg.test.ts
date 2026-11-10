import { it } from "vitest";
import { townOf, poseOf } from "./people";
import { structureAt, FLAT, type Seed } from "./world";
it("dbg", () => {
  const NOW = Date.parse("2026-06-15T12:00:00Z");
  const seed = { id: "people-test", name: "T", owner: "", x: 512, y: 512, hue: 0, created_at: "" } as unknown as Seed;
  const old: Seed = { ...seed, id: "coll", created_at: new Date(NOW - 400 * 864e5).toISOString() };
  for (let m = 0; m < 1440; m += 37) { const now = NOW + m*60000, t = townOf(old,[old],now);
    for (const p of t.people) { const q = poseOf(p,t,[old],now); if(!q.visible) continue;
      const st = structureAt(Math.round(q.x),Math.round(q.y),[old],now);
      if (st && !FLAT.has(st.kind) && !["well","market"].includes(st.kind)) console.log(p.first,p.job,q.act,q.x-old.x,q.y-old.y,st.kind,m); } }
});
