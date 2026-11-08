import { poseOf, townOf, BABY_AGE, type Person, type Pose } from "./people";
import type { Seed } from "./world";

/** Where a resident shows up in the farmhouse diorama (Schaukasten), or "out" when not at home. */
export type StubeSpot = "bed" | "table" | "hearth" | "fire" | "desk" | "out";
export type StubePlace = { p: Person; spot: StubeSpot; slot: number };

/** Semantic painted figure; age, sex and household dress never depend on the seat overflow. */
export function stubeFigureKey({ p, spot }: StubePlace, patrician = false): string {
  const female = p.sex === "f", kid = p.age < 14;
  const who = kid ? (female ? "girl" : "boy") : (female ? "woman" : "man");
  if (spot === "hearth") return female ? "stir" : "stir-man";
  if (spot === "desk") return `pat-write-${female ? "woman" : "man"}`;
  if (spot === "fire") {
    if (p.age >= 60) return patrician ? `pat-elder-${female ? "woman" : "man"}` : female ? "elder-woman" : "warm-elder";
    return `${patrician ? "pat-" : ""}warm-${who}`;
  }
  return `${patrician ? "pat-" : ""}eat-${who}`;
}

/** Seats per spot in the painted room: two box beds, four table places, one cook, one fireside stool. */
export type StubeSlots = Record<Exclude<StubeSpot, "out">, number>;
export const STUBE_SLOTS: StubeSlots = { bed: 2, table: 4, hearth: 1, fire: 1, desk: 0 };
/** Merchant's town house: bedchamber, Dornse and Diele with one counting desk for an awake adult at home. */
export const PATRICIAN_SLOTS: StubeSlots = { ...STUBE_SLOTS, desk: 1 };

const home = (q: Pose) => !q.visible && Math.hypot(q.x - q.p.home[0], q.y - q.p.home[1]) < 1.5;

/** Only infants are swaddled in bed all day; toddlers (1–2) sit with the family. */
export const SWADDLE_AGE = 1;

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
    if (q.act === "sleep" || q.act === "sick" || p.age < SWADDLE_AGE) put(p, ["bed"]);
    else if (p.age < BABY_AGE) put(p, ["table", "bed"]); // toddlers sit at the table by day
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

// ---------- Body-contact and furniture anchors (Schaukasten) ----------
/** Where a painted figure touches its support, measured from the sprite's bottom edge as a share of its height:
 *  "seat" = buttocks on the seat board, "feet" = soles on the floor (standing, or a stool painted into the figure),
 *  "bed" = body lying on the mattress (sprite bottom). Every figure key must be listed here. */
export type BodyAnchor = { on: "seat" | "feet" | "bed"; at: number };
export const BODY_ANCHORS: Record<string, BodyAnchor> = {
  "eat-man": { on: "seat", at: 0.37 }, "eat-woman": { on: "seat", at: 0.36 }, "eat-girl": { on: "seat", at: 0.37 },
  "eat-boy": { on: "feet", at: 0 }, // painted on his own stool
  "pat-eat-man": { on: "seat", at: 0.38 }, "pat-eat-woman": { on: "seat", at: 0.35 }, "pat-eat-boy": { on: "seat", at: 0.4 }, "pat-eat-girl": { on: "seat", at: 0.37 },
  "warm-man": { on: "seat", at: 0.31 }, "warm-woman": { on: "seat", at: 0.3 }, "warm-boy": { on: "seat", at: 0.3 }, "warm-girl": { on: "seat", at: 0.3 }, "warm-elder": { on: "seat", at: 0.29 },
  "elder-woman": { on: "feet", at: 0 }, // painted on her own stool
  "pat-warm-man": { on: "seat", at: 0.33 }, "pat-warm-woman": { on: "seat", at: 0.33 }, "pat-warm-boy": { on: "seat", at: 0.33 }, "pat-warm-girl": { on: "seat", at: 0.31 },
  "pat-elder-man": { on: "seat", at: 0.3 }, "pat-elder-woman": { on: "seat", at: 0.3 },
  "pat-write-man": { on: "seat", at: 0.36 }, "pat-write-woman": { on: "seat", at: 0.35 },
  "stir": { on: "feet", at: 0 }, "stir-man": { on: "feet", at: 0 },
  "sleep": { on: "bed", at: 0 }, "sleep-child": { on: "bed", at: 0 },
};
/** One place in a room picture (fractions of its width/height): floor line, and the seat top for seats.
 *  bench/chair are painted into the room; stool is the separate stool sprite standing on the floor. */
export type Furniture = { x: number; floor: number; kind: "bench" | "stool" | "chair" | "floor" | "bed"; seat?: number };
export type StubeLayoutKey = "wide" | "tall" | "coast";
const stool = (x: number, floor: number, seatH: number): Furniture => ({ x, floor, kind: "stool", seat: floor - seatH });
export const FURNITURE: Record<StubeLayoutKey, Partial<Record<Exclude<StubeSpot, "out">, Furniture[]>>> = {
  wide: {
    bed: [{ x: 0.12, floor: 0.677, kind: "bed" }, { x: 0.12, floor: 0.497, kind: "bed" }],
    hearth: [{ x: 0.35, floor: 0.82, kind: "floor" }],
    fire: [stool(0.455, 0.82, 0.0814)],
    table: [0.56, 0.715, 0.525, 0.75].map((x): Furniture => ({ x, floor: 0.8, kind: "bench", seat: 0.7038 })),
  },
  tall: {
    bed: [{ x: 0.235, floor: 0.398, kind: "bed" }, { x: 0.405, floor: 0.398, kind: "bed" }],
    hearth: [{ x: 0.4, floor: 0.895, kind: "floor" }],
    fire: [stool(0.31, 0.655, 0.0333)],
    desk: [{ x: 0.6, floor: 0.895, kind: "chair", seat: 0.859 }],
    table: [stool(0.6, 0.635, 0.037), stool(0.745, 0.635, 0.037), stool(0.565, 0.655, 0.037), stool(0.785, 0.655, 0.037)],
  },
  coast: {
    bed: [{ x: 0.415, floor: 0.47, kind: "bed" }, { x: 0.455, floor: 0.47, kind: "bed" }],
    hearth: [{ x: 0.585, floor: 0.86, kind: "floor" }],
    fire: [stool(0.67, 0.88, 0.0592)],
    table: [stool(0.44, 0.88, 0.0703), stool(0.6, 0.88, 0.0703), stool(0.41, 0.9, 0.0703), stool(0.63, 0.9, 0.0703)],
  },
};
/** Bottom edge (fraction of room height) for a figure of height h (fraction of room height) so its body anchor meets the furniture anchor. */
export function anchorBottom(furn: Furniture, body: BodyAnchor, h: number): number {
  if (body.on === "seat") return (furn.seat ?? furn.floor) + body.at * h;
  return furn.floor; // feet and lying bodies rest on the floor / mattress line
}
/** Furniture anchor point y for the debug overlay and tests. */
export const furnitureY = (furn: Furniture, body: BodyAnchor) => (body.on === "seat" ? furn.seat ?? furn.floor : furn.floor);
