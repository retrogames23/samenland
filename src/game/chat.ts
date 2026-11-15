/** Pure chat helpers: channel filtering and unread counting (no I/O). */
export type ChatMsg = { id: string; realm: string; sender_id: string; sender_seed: string; recipient_id: string | null; body: string; created_at: string; edited_at?: string | null };
export type Channel = "tavern" | { peer: string };

export const chanKey = (c: Channel) => (c === "tavern" ? "tavern" : c.peer);

/** Messages visible in a channel for me, with blocked senders hidden. */
export function inChannel(msgs: ChatMsg[], c: Channel, me: string | null, realm: string, blocked: Set<string>) {
  return msgs.filter((m) => {
    if (blocked.has(m.sender_id)) return false;
    if (c === "tavern") return m.recipient_id === null && m.realm === realm;
    return m.recipient_id !== null && ((m.sender_id === me && m.recipient_id === c.peer) || (m.sender_id === c.peer && m.recipient_id === me));
  });
}

/** Peers I have letters with. */
export const peersOf = (msgs: ChatMsg[], me: string | null) => {
  const s = new Set<string>();
  for (const m of msgs) if (m.recipient_id && me) { if (m.sender_id === me) s.add(m.recipient_id); else if (m.recipient_id === me) s.add(m.sender_id); }
  return [...s];
};

/** Unread = foreign, unblocked messages newer than the last look at that channel. */
export function unread(msgs: ChatMsg[], c: Channel, me: string | null, realm: string, blocked: Set<string>, seenAt: number) {
  return inChannel(msgs, c, me, realm, blocked).filter((m) => m.sender_id !== me && Date.parse(m.created_at) > seenAt).length;
}

/** Buffer sizes: the map room and my letters are kept separately, so neither crowds out the other. */
export const ROOM_KEEP = 300, LETTER_KEEP = 300;
const isLetter = (m: ChatMsg, me: string | null) => !!me && m.recipient_id !== null && (m.sender_id === me || m.recipient_id === me);
/** Whether a live message belongs in this client's buffer: this map's room or one of my letters. */
export const relevant = (m: ChatMsg, me: string | null, realm: string) => (m.recipient_id === null && m.realm === realm) || isLetter(m, me);
/** Merge, dedupe by id, sort by time, and trim room and letters each to its own limit. */
export function mergeChat(cur: ChatMsg[], add: ChatMsg[], me: string | null, realm: string): ChatMsg[] {
  const all = [...new Map([...cur, ...add].filter((m) => relevant(m, me, realm)).map((m) => [m.id, m])).values()]
    .sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id));
  const room = all.filter((m) => m.recipient_id === null).slice(-ROOM_KEEP), mail = all.filter((m) => m.recipient_id !== null).slice(-LETTER_KEEP);
  const keep = new Set([...room, ...mail].map((m) => m.id));
  return all.filter((m) => keep.has(m.id));
}
