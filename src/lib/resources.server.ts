import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Realm } from "@/game/time";

/**
 * Certifies the village's location for wood and stone (Wirtschaft Paket 2, DB village_sites): the main way from
 * townCharacter on the trusted server — terrain never changes, so the row is written once and never updated. The
 * client supplies nothing but the village id; the position and map are read here.
 */
export async function certifySite(id: string): Promise<{ site: "grain" | "workshop" | "gateway" }> {
  const { data: seed, error } = await supabaseAdmin
    .from("seeds")
    .select("id, x, y, realm")
    .eq("id", id)
    .maybeSingle();
  if (error || !seed) throw new Error("Missing village");
  const { setRealm } = await import("@/game/time");
  const { townCharacter, resetCharacters } = await import("@/game/character");
  setRealm(seed.realm as Realm);
  // the character cache is keyed by position only; a worker serves several maps, so never reuse another map's terrain
  resetCharacters();
  // setRealm → reset → compute is synchronous (no await), so no other request of this isolate can interleave
  const site = townCharacter({ x: seed.x, y: seed.y }).main;
  // and leave no entry behind that another map's request could read for the same coordinates
  resetCharacters();
  const { error: we } = await supabaseAdmin
    .from("village_sites")
    .upsert({ seed_id: id, way: site }, { onConflict: "seed_id", ignoreDuplicates: true });
  if (we) throw new Error("Site certificate failed");
  // an existing row is final: report what is stored, not what was just computed
  const { data: row, error: re } = await supabaseAdmin
    .from("village_sites")
    .select("way")
    .eq("seed_id", id)
    .single();
  if (re || !row) throw new Error("Site certificate failed");
  return { site: row.way as "grain" | "workshop" | "gateway" };
}
