import { townCharacter } from "./character";
import { rankInput, rankOf } from "./rank";
import { links, matches, tradeProfile, SPECIAL_KIND, specialDone, type Kind, type Seed } from "./world";
import { rideTime } from "./wander";

/** Neighbourly comparison of two towns — pure codes for the town profile, never a ranking. */
export type Profile = {
  way: string; side: string | null; charter: string | null; rank: number; citizens: number; homes: number;
  buildings: Kind[]; exports: string[]; imports: string[];
  vs: null | { sameWay: boolean; sameCharter: boolean; rankDiff: number; theyGive: string[]; weGive: string[]; road: boolean; rideMin: number; gifts: number };
};

export function profileOf(s: Seed, me: Seed | null, seeds: Seed[], now: number): Profile {
  const c = townCharacter(s), ri = rankInput(s, seeds, now), tp = tradeProfile(s, now);
  const buildings = [...new Set((s.bought ?? []).filter((b) => SPECIAL_KIND[b.item] && specialDone(s, b.at, seeds, now) <= now).map((b) => SPECIAL_KIND[b.item]))];
  let vs: Profile["vs"] = null;
  if (me && me.id !== s.id) {
    const mp = tradeProfile(me, now);
    vs = {
      sameWay: townCharacter(me).main === c.main,
      sameCharter: !!s.charter && s.charter.path === me.charter?.path,
      rankDiff: rankOf(ri) - rankOf(rankInput(me, seeds, now)),
      theyGive: tp.exports.filter((g) => mp.imports.includes(g)),
      weGive: mp.exports.filter((g) => tp.imports.includes(g)),
      road: links(seeds).some((l) => now >= l.since && ((l.a.id === me.id && l.b.id === s.id) || (l.b.id === me.id && l.a.id === s.id))),
      rideMin: Math.round(rideTime(me, s) / 6e4),
      gifts: (me.sent ?? []).filter((g) => g.to === s.id).length + (s.sent ?? []).filter((g) => g.to === me.id).length,
    };
    void matches;
  }
  return { way: c.main, side: c.side ?? null, charter: s.charter && now > s.charter.at ? s.charter.path : null, rank: rankOf(ri), citizens: ri.citizens, homes: ri.homes, buildings, exports: tp.exports, imports: tp.imports, vs };
}
