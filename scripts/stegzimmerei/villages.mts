// Stegzimmerei, Auswertung echter Dörfer (read-only): node --import tsx villages.mts seeds.json
// seeds.json = [{id,x,y,realm,user_id,created_at,roads:[{target,at}]}] — exported from public.seeds/first_roads.
// Per player village: road partners today (bridge <= MAX_BRIDGE), extra partners with MAX_BRIDGE+8, sea ways aside.
import { readFileSync } from "node:fs";
const W: any = await import("../../src/game/world.ts");
const T: any = await import("../../src/game/time.ts");
const all: any[] = JSON.parse(readFileSync(process.argv[2]!, "utf8"));
const out: any[] = [];
for (const realm of [...new Set(all.map((s) => s.realm ?? "europe"))]) {
  T.setRealm(realm);
  const seeds = all.filter((s) => (s.realm ?? "europe") === realm).map((s) => ({ name: s.id, owner: s.id, hue: 0, roads: [], ...s }));
  for (const s of seeds.filter((v) => v.user_id)) {
    const near = seeds.filter((o) => W.roadAllowed(s, o, seeds));
    const br = near.map((o) => W.roadBridge(s, o));
    const today = br.filter((b) => b !== null && b <= W.MAX_BRIDGE).length;
    const steg = br.filter((b) => b !== null && b > W.MAX_BRIDGE && b <= W.MAX_BRIDGE + 8).length;
    const linked = (s.roads ?? []).length + seeds.filter((o) => (o.roads ?? []).some((r: any) => r.target === s.id)).length;
    out.push({ realm, id: s.id, today, steg, linked, benefits: today === 0 && linked === 0 && steg > 0 });
  }
}
const n = out.length, b = out.filter((r) => r.benefits);
console.log(JSON.stringify({ villages: n, noRoadToday: out.filter((r) => r.today === 0 && r.linked === 0).length, stegHelps: b.length, cases: b }, null, 1));
