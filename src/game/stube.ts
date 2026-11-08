import { poseOf, townOf, BABY_AGE, type Person, type Pose } from "./people";
import type { Seed } from "./world";

/** Where a resident shows up in the farmhouse diorama (Schaukasten), or "out" when not at home. */
export type StubeSpot = "bed" | "table" | "hearth" | "fire" | "desk" | "out";
export type StubePlace = { p: Person; spot: StubeSpot; slot: number };

/** Seats per spot in the painted room: two box beds, four table places, one cook, one fireside stool. */
export type StubeSlots = Record<Exclude<StubeSpot, "out">, number>;
export const STUBE_SLOTS: StubeSlots = { bed: 2, table: 4, hearth: 1, fire: 1, desk: 0 };
/** Merchant's town house: bedchamber, Dornse and Diele with one counting desk for an awake adult at home. */
export const PATRICIAN_SLOTS: StubeSlots = { ...STUBE_SLOTS, desk: 1 };

const home = (q: Pose) => !q.visible && Math.hypot(q.x - q.p.home[0], q.y - q.p.home[1]) < 1.5;

/** Pure from the derived routine: only people really at home appear; nothing is stored. */
export function stubePlaces(poses: Pose[], slots: StubeSlots = STUBE_SLOTS): StubePlace[] {
  const used: Record<string, number> = { bed: 0, table: 0, hearth: 0, fire: 0, desk: 0 };
  const out: StubePlace[] = [];
  const put = (p: Person, want: StubeSpot[]) => {
    for (const s of want) {
      if (s === "out") break;
      if (used[s]! < slots[s]) { out.push({ p, spot: s, slot: used[s]!++ }); return; }
    }
    out.push({ p, spot: "out", slot: 0 });
  };
  // sleepers and the sick first (beds), then the cook, the old by the fire, then the table
  const order = [...poses].sort((a, b) => rank(a) - rank(b));
  for (const q of order) {
    const p = q.p;
    if (!home(q)) { out.push({ p, spot: "out", slot: 0 }); continue; }
    if (q.act === "sleep" || q.act === "sick" || p.age < BABY_AGE) put(p, ["bed"]);
    else if (q.act === "lunch") put(p, ["table", "fire"]);
    else if (p.job === "homemaker" || q.act === "care") put(p, ["hearth", "table"]);
    else if (p.job === "retired" || p.age >= 60) put(p, ["fire", "table"]);
    else put(p, p.age >= 14 ? ["desk", "table", "fire"] : ["table", "fire"]);
  }
  return out;
}
const rank = (q: Pose) => (q.act === "sleep" || q.act === "sick" ? 0 : q.p.job === "homemaker" ? 1 : q.p.age >= 60 ? 2 : 3);

/** Residents of one house with their exact current pose. */
export function stubeOf(residents: Person[], seed: Seed, seeds: Seed[], now: number, slots: StubeSlots = STUBE_SLOTS): StubePlace[] {
  const t = townOf(seed, seeds, now);
  return stubePlaces(residents.map((p) => poseOf(p, t, seeds, now)), slots);
}
