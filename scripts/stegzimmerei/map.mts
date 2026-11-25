// Run: npx tsx scripts/stegzimmerei/map.mts <realm> [samples=2000] [seed=7]
// Kartenauswertung Stegzimmerei: for sampled legal founding tiles, can ANY legal neighbour site within road reach be
// connected with a bridge <= MAX_BRIDGE (today), only with <= MAX_BRIDGE+8 (Stegzimmerei), or not at all?
const W: any = await import("../../src/game/world.ts");
const T: any = await import("../../src/game/time.ts");
const C: any = await import("../../src/game/character.ts");
const [realm, nArg = "300", seedArg = "1"] = process.argv.slice(2);
T.setRealm(realm);
let rs = Number(seedArg) * 9301 + 49297; const rnd = () => ((rs = (rs * 233280 + 49297) % 2147483647) / 2147483647);
const mk = (id: string, x: number, y: number) => ({ id, name: id, owner: id, x, y, hue: 0, realm, user_id: "u-" + id, created_at: "2026-11-20T00:00:00Z", roads: [] });
const EXTRA = 8, N = Number(nArg);
const cnt: Record<string, number> = { land: 0, steg: 0, none: 0, nosite: 0 }, byWay: Record<string, Record<string, number>> = {};
const examples: any[] = []; let tries = 0, i = 0;
while (i < N && tries < N * 200) {
  tries++;
  const x = Math.floor(rnd() * W.MAP), y = Math.floor(rnd() * W.MAP);
  if (W.canPlant(x, y, []) !== null) continue;
  i++;
  const a = mk("a" + i, x, y), way = C.townCharacter(a).main;
  let best = Infinity, sites = 0;
  outer: for (const d of [45, 60, 75]) for (let k = 0; k < 24; k++) {
    const ang = (k / 24) * 2 * Math.PI, bx = Math.round(x + Math.cos(ang) * d), by = Math.round(y + Math.sin(ang) * d);
    if (bx < 0 || by < 0 || bx >= W.MAP || by >= W.MAP || W.canPlant(bx, by, [a]) !== null) continue;
    sites++;
    const r = W.roadBridge(a, mk(`b${i}-${d}-${k}`, bx, by));
    if (r !== null && r < best) best = r;
    if (best <= W.MAX_BRIDGE) break outer;
  }
  const cls = sites === 0 ? "nosite" : best <= W.MAX_BRIDGE ? "land" : best <= W.MAX_BRIDGE + EXTRA ? "steg" : "none";
  cnt[cls]++; (byWay[way] ??= { land: 0, steg: 0, none: 0, nosite: 0 })[cls]++;
  if (cls === "steg" && examples.length < 8) examples.push([x, y, way, best]);
}
console.log(JSON.stringify({ realm, N: i, cnt, byWay, examples }));
