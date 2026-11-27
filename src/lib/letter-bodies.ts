// Letter texts (letter_bodies) are readable only by sender and recipient (RLS). A failed read used to drop every text
// silently, and the guestbook then told the recipient the letter was "sealed". This keeps the state per letter instead.
import { allIn } from "./fetch-all";

export type BodyMiss = "loading" | "failed";
type Row = { letter_id: string; body: string };

/**
 * Reads the texts of `ids`. Never throws: a read error marks every id "failed"; an id the server does not return
 * (not ours, or gone) is "failed" too, so the reader can offer a retry instead of waiting forever.
 */
export async function readBodies(
  ids: string[],
  q: (chunk: string[]) => unknown,
): Promise<{ got: Record<string, string>; failed: string[] }> {
  try {
    const rows = await allIn<Row>(ids, q as (c: string[]) => never, "letter_id");
    const got = Object.fromEntries(rows.map((r) => [r.letter_id, r.body]));
    return { got, failed: ids.filter((id) => !(id in got)) };
  } catch {
    return { got: {}, failed: [...ids] };
  }
}

/** Ids still worth asking for: no text yet and not already on the way (a failed one only when retrying). */
export const toFetch = (
  ids: string[],
  bodies: Record<string, string>,
  miss: Record<string, BodyMiss>,
  retry = false,
) =>
  [...new Set(ids)].filter(
    (id) => !(id in bodies) && miss[id] !== "loading" && (retry || miss[id] !== "failed"),
  );

/** What the guestbook / messenger card shows for one of the player's own letters. */
export const bodyView = (
  id: string,
  bodies: Record<string, string>,
  miss: Record<string, BodyMiss>,
): { text: string } | { state: BodyMiss } =>
  id in bodies ? { text: bodies[id]! } : { state: miss[id] === "failed" ? "failed" : "loading" };
