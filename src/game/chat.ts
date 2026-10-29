/** Pure chat helpers: channel filtering and unread counting (no I/O). */
export type ChatMsg = { id: string; realm: string; sender_id: string; sender_seed: string; recipient_id: string | null; body: string; created_at: string };
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
