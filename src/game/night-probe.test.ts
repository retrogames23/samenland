import { nightPairs } from "./building-sprites";
import { audit } from "./night-audit";
import { writeFileSync } from "node:fs";
import path from "node:path";
const file = (u: string) => path.resolve(process.cwd(), u.replace(/^\//, "").split("?")[0]);
it("probe", async () => {
  const rows = [];
  for (const p of nightPairs()) { if (!p.night) { rows.push({ key: p.key, night: null }); continue; }
    const a = await audit(file(p.day), file(p.night));
    rows.push({ key: p.key, day: p.day, night: p.night, crop: p.crop, w: a.w, h: a.h, nw: a.nw, nh: a.nh, alpha: a.hasAlpha, lit: a.lit, sil: a.silhouette, out: a.outside, opaque: a.opaque, n: a.blobs.length, warn: a.blobs.filter(b => b.warn.length).map(b => ({ ...b })) }); }
  writeFileSync("/tmp/na/probe.json", JSON.stringify(rows, null, 1));
});
