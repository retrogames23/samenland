import { LOCALE } from "@/game/i18n";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Seed } from "@/game/world";
import type { Dict } from "@/game/i18n";
import { chanKey, inChannel, peersOf, unread, type Channel, type ChatMsg } from "@/game/chat";
import { X } from "lucide-react";
import { toast } from "sonner";

const SEEN = "samenland-chat-seen";
const seenKey = (uid: string | null) => `${SEEN}:${uid ?? "anon"}`;
const readSeen = (uid: string | null): Record<string, number> => { try { return JSON.parse(localStorage.getItem(seenKey(uid)) ?? localStorage.getItem(SEEN) ?? "{}"); } catch { return {}; } };

/** IRC-style tavern chat: one room per map, letters between mayors, blocking. Always mounted to count unread. */
export function Tavern({ t, open, onClose, peer, userId, my, seeds, realm, lang, onUnread }: {
  t: Dict; open: boolean; onClose: () => void; peer?: string | null; userId: string | null; my: Seed | undefined; seeds: Seed[]; realm: string; lang: string; onUnread: (n: number) => void;
}) {
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [blocked, setBlocked] = useState<Set<string>>(new Set());
  const [chan, setChan] = useState<Channel>("tavern");
  const [text, setText] = useState("");
  const [menu, setMenu] = useState<string | null>(null);
  const [seen, setSeen] = useState<Record<string, number>>({});
  const [showBlocked, setShowBlocked] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  const shell = useRef<HTMLDivElement>(null);
  // iOS keyboard: Safari only shrinks/shifts the visual viewport, so the overlay is pinned to it directly.
  // Written straight to the element's style (rAF-batched) — no React state, typing never re-renders through this.
  useEffect(() => {
    const vv = window.visualViewport, el = shell.current;
    if (!open || !vv || !el) return;
    let raf = 0;
    const fit = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => {
      el.style.top = `${vv.offsetTop}px`; el.style.height = `${vv.height}px`;
      end.current?.scrollIntoView({ block: "end" });
    }); };
    fit();
    vv.addEventListener("resize", fit); vv.addEventListener("scroll", fit);
    return () => { cancelAnimationFrame(raf); vv.removeEventListener("resize", fit); vv.removeEventListener("scroll", fit); el.style.top = ""; el.style.height = ""; };
  }, [open]);

  const [side, setSide] = useState(false);
  // read marks live on the account (chat_reads), merged with this browser's copy — survives preview frames and other devices
  const [readsReady, setReadsReady] = useState(false);
  useEffect(() => {
    const local = readSeen(userId);
    setSeen(local);
    setReadsReady(false);
    if (!userId) return;
    let live = true;
    supabase.from("chat_reads").select("channel, seen_at").then(({ data }) => {
      if (!live) return;
      setReadsReady(true);
      if (!data) return;
      setSeen((cur) => {
        const m = { ...cur };
        for (const r of data) m[r.channel] = Math.max(m[r.channel] ?? 0, Date.parse(r.seen_at));
        try { localStorage.setItem(seenKey(userId), JSON.stringify(m)); } catch { /* account copy suffices */ }
        return m;
      });
    });
    return () => { live = false; };
  }, [userId]);
  useEffect(() => {
    if (!userId) { setMsgs([]); return; }
    let live = true;
    supabase.from("chat_messages").select("*").order("created_at", { ascending: false }).limit(300)
      .then(({ data }) => { if (live && data) setMsgs((data as ChatMsg[]).reverse()); });
    supabase.from("chat_blocks").select("blocked_id").then(({ data }) => { if (live && data) setBlocked(new Set(data.map((b) => b.blocked_id))); });
    const ch = supabase.channel(`chat-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, (p) => {
        const m = p.new as ChatMsg;
        setMsgs((ms) => (ms.some((x) => x.id === m.id) ? ms : [...ms.slice(-299), m]));
      }).subscribe();
    return () => { live = false; supabase.removeChannel(ch); };
  }, [userId]);

  // who is who: user id → mayor + village (this map first)
  const people = useMemo(() => {
    const m = new Map<string, Seed>();
    for (const s of seeds) if (s.user_id && (!m.has(s.user_id) || s.realm === realm)) m.set(s.user_id, s);
    return m;
  }, [seeds, realm]);
  const bySeed = useMemo(() => new Map(seeds.map((s) => [s.id, s])), [seeds]);
  const label = (uid: string, seedId?: string) => { const s = (seedId && bySeed.get(seedId)) || people.get(uid); return s ? `${s.owner} · ${s.name}` : t.tavern.stranger; };

  const peers = useMemo(() => peersOf(msgs, userId), [msgs, userId]);
  const shown = useMemo(() => inChannel(msgs, chan, userId, realm, blocked), [msgs, chan, userId, realm, blocked]);
  const unreadOf = (c: Channel) => unread(msgs, c, userId, realm, blocked, seen[chanKey(c)] ?? 0);
  const total = unreadOf("tavern") + peers.reduce((a, p) => a + unreadOf({ peer: p }), 0);
  // no dot until the account's read marks have arrived — otherwise old messages flash as "new" in fresh browsers
  useEffect(() => onUnread(open || !readsReady ? 0 : total), [total, open, readsReady]); // eslint-disable-line react-hooks/exhaustive-deps

  // mark current channel seen while open
  useEffect(() => {
    if (!open) return;
    const k = chanKey(chan), last = shown.length ? Date.parse(shown[shown.length - 1]!.created_at) : Date.now();
    if ((seen[k] ?? 0) >= last) return;
    const next = { ...readSeen(userId), ...seen, [k]: last };
    setSeen(next);
    try { localStorage.setItem(seenKey(userId), JSON.stringify(next)); } catch { /* account copy below */ }
    if (userId) void supabase.from("chat_reads").upsert({ user_id: userId, channel: k, seen_at: new Date(last).toISOString() }, { onConflict: "user_id,channel" });
  }, [open, chan, shown, seen, userId]);
  // opened by tapping another mayor in the world: go straight to that letter channel
  useEffect(() => { if (open && peer && peer !== userId) setChan({ peer }); }, [open, peer]); // eslint-disable-line react-hooks/exhaustive-deps
  // on opening: jump to a waiting letter when the main room has nothing new
  const wasOpen = useRef(false);
  useEffect(() => {
    if (open && !wasOpen.current && !peer && unreadOf("tavern") === 0) {
      const p = peers.find((x) => !blocked.has(x) && unreadOf({ peer: x }) > 0);
      if (p) setChan({ peer: p });
    }
    wasOpen.current = open;
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { end.current?.scrollIntoView({ block: "end" }); }, [shown.length, open, chan]);

  // one send at a time: the field clears at once and the button locks, so a slow reply can't trigger a second copy
  const sendingRef = useRef(false);
  const [sending, setSending] = useState(false);
  const send = async () => {
    const body = text.trim();
    if (!body || !userId || !my || sendingRef.current) return;
    sendingRef.current = true; setSending(true); setText("");
    const { data, error } = await supabase.from("chat_messages").insert({ body, sender_id: userId, sender_seed: my.id, realm, recipient_id: chan === "tavern" ? null : chan.peer }).select().single();
    sendingRef.current = false; setSending(false);
    if (error) {
      setText((cur) => cur || body);
      toast.error(error.message.includes("blocked") ? t.tavern.refused : error.message.includes("too fast") ? t.tavern.slow : t.tavern.fail);
    } else if (data) {
      const m = data as ChatMsg;
      setMsgs((ms) => (ms.some((x) => x.id === m.id) ? ms : [...ms.slice(-299), m]));
    }
  };
  const toggleBlock = async (uid: string) => {
    if (blocked.has(uid)) {
      await supabase.from("chat_blocks").delete().eq("blocked_id", uid);
      setBlocked((b) => { const n = new Set(b); n.delete(uid); return n; });
    } else {
      const { error } = await supabase.from("chat_blocks").insert({ blocker_id: userId!, blocked_id: uid });
      if (!error) { setBlocked((b) => new Set(b).add(uid)); if (chan !== "tavern" && chan.peer === uid) setChan("tavern"); }
    }
    setMenu(null);
  };

  if (!open) return null;
  const time = (iso: string) => new Date(iso).toLocaleTimeString((LOCALE as Record<string,string>)[lang] ?? "en-GB", { hour: "2-digit", minute: "2-digit" });
  const chanBtn = (c: Channel, name: string) => {
    const on = chanKey(c) === chanKey(chan), n = unreadOf(c);
    return (
      <button key={chanKey(c)} type="button" onClick={() => { setChan(c); setSide(false); }} className={`flex w-full items-center justify-between truncate rounded px-1.5 py-0.5 text-start max-sm:min-h-11 ${on ? "bg-ink/15 font-semibold" : "hover:bg-ink/10"}`}>
        <span className="truncate">{name}</span>{n > 0 && !on && <span className="ms-1 rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground">{n}</span>}
      </button>
    );
  };
  const others = [...people.entries()].filter(([u, s]) => u !== userId && s.realm === realm);

  return (
    <div ref={shell} className="fixed inset-x-0 top-0 z-40 grid h-[100dvh] place-items-center overflow-hidden bg-foreground/40 pb-[max(0.5rem,env(safe-area-inset-bottom))] pl-[var(--safe-l)] pr-[var(--safe-r)] pt-[max(0.5rem,env(safe-area-inset-top))] max-md:place-items-stretch sm:p-3" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="parchment relative flex h-full max-h-[640px] w-full max-w-[min(48rem,calc(100vw-1rem))] flex-col overflow-hidden text-ink max-md:max-h-none max-md:max-w-none md:h-[min(80dvh,640px)] md:justify-self-center">
        <div className="border-b border-ink/25 px-4 pb-2 pt-5 sm:pt-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="truncate pe-2 pb-1 font-display text-2xl leading-tight sm:text-3xl">{t.tavern.title}</h2>
            <button type="button" aria-label={t.close} onClick={onClose} className="hit relative grid h-7 w-7 shrink-0 place-items-center rounded-full hover:bg-ink/10"><X className="h-4 w-4" /></button>
          </div>
            <button type="button" onClick={() => setSide((v) => !v)} className="hit relative mt-2 inline-flex min-h-9 max-w-full items-center rounded border border-ink/30 px-3 text-sm sm:hidden">
              {chan === "tavern" ? `# ${t.tavern.room}` : `@ ${people.get(chan.peer)?.owner ?? t.tavern.stranger}`} ▾
              {total - unreadOf(chan) > 0 && <span className="absolute -end-1.5 -top-1.5 rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground">{total - unreadOf(chan)}</span>}
            </button>
        </div>
        <div className="relative flex min-h-0 flex-1">
          <aside className={`${side ? "absolute inset-0 z-10 block bg-card/95" : "hidden"} space-y-2 overflow-y-auto overflow-x-hidden border-e border-ink/25 p-3 text-sm sm:static sm:block sm:w-44 sm:shrink-0 sm:bg-transparent sm:p-2 sm:text-xs`}>
            {chanBtn("tavern", `# ${t.tavern.room}`)}
            <div>
              <div className="px-1.5 pt-1 font-semibold uppercase tracking-wide text-ink/60">{t.tavern.letters}</div>
              {peers.filter((p) => !blocked.has(p)).map((p) => chanBtn({ peer: p }, `@ ${people.get(p)?.owner ?? t.tavern.stranger}`))}
            </div>
            <div>
              <div className="px-1.5 pt-1 font-semibold uppercase tracking-wide text-ink/60">{t.tavern.mayors}</div>
              {others.map(([u, s]) => (
                <button key={u} type="button" onClick={() => setMenu(menu === u ? null : u)} className={`block w-full truncate rounded px-1.5 py-0.5 text-start hover:bg-ink/10 max-sm:min-h-11 ${blocked.has(u) ? "line-through opacity-50" : ""}`}>{s.owner}</button>
              ))}
              {!others.length && <div className="px-1.5 text-ink/50">{t.tavern.alone}</div>}
            </div>
            {blocked.size > 0 && (
              <button type="button" onClick={() => setShowBlocked((v) => !v)} className="px-1.5 text-ink/60 underline">{t.tavern.blockedList(blocked.size)}</button>
            )}
            {showBlocked && [...blocked].map((u) => (
              <div key={u} className="flex items-center justify-between gap-1 px-1.5"><span className="truncate">{people.get(u)?.owner ?? t.tavern.stranger}</span>
                <button type="button" className="underline" onClick={() => toggleBlock(u)}>{t.tavern.unblock}</button></div>
            ))}
          </aside>
          <div className="relative flex min-w-0 flex-1 flex-col">
            <div className="selectable min-h-0 flex-1 overflow-y-auto overflow-x-hidden break-words px-3 pb-2 pt-3 font-mono [mask-image:linear-gradient(to_bottom,transparent,black_1.25rem)] text-[13px] leading-snug">
              {!userId && <div className="text-ink/60">{t.tavern.signIn}</div>}
              {userId && !shown.length && <div className="text-ink/60">{chan === "tavern" ? t.tavern.empty : t.tavern.emptyLetter}</div>}
              {shown.map((m) => (
                <div key={m.id} className="break-words">
                  <span dir="ltr" className="text-ink/50">[{time(m.created_at)}]</span>{" "}
                  <button type="button" disabled={m.sender_id === userId} onClick={() => setMenu(menu === m.sender_id ? null : m.sender_id)} className="font-semibold text-primary hover:underline disabled:text-ink disabled:no-underline">&lt;{label(m.sender_id, m.sender_seed)}&gt;</button>{" "}
                  <span dir="auto">{m.body}</span>
                </div>
              ))}
              <div ref={end} />
            </div>
            {menu && (
              <div className="absolute end-3 top-2 z-10 w-56 rounded border border-ink/30 bg-parchment p-2 text-sm shadow-lg">
                <div className="mb-1 font-semibold">{label(menu)}</div>
                {!blocked.has(menu) && <button type="button" className="block w-full rounded px-1 py-0.5 text-start hover:bg-ink/10 max-sm:min-h-11" onClick={() => { setChan({ peer: menu }); setMenu(null); }}>✉ {t.tavern.write}</button>}
                <button type="button" className="block w-full rounded px-1 py-0.5 text-start hover:bg-ink/10 max-sm:min-h-11" onClick={() => toggleBlock(menu)}>{blocked.has(menu) ? t.tavern.unblock : t.tavern.block}</button>
              </div>
            )}
            <form className="flex gap-2 border-t border-ink/25 p-2" onSubmit={(e) => { e.preventDefault(); void send(); }}>
              <textarea dir="auto" rows={3} value={text} maxLength={300} disabled={!userId || !my} onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); void send(); } }}
                placeholder={!my ? t.tavern.needVillage : chan === "tavern" ? t.tavern.say : t.tavern.sayLetter(people.get(chan.peer)?.owner ?? "")}
                className="min-w-0 flex-1 resize-none rounded border border-ink/30 bg-parchment/60 px-2 py-1 font-mono text-base outline-none sm:text-sm focus:border-ink/60" />
              <button type="submit" disabled={!text.trim() || !my || sending} className="min-h-11 rounded bg-primary px-3 text-sm text-primary-foreground disabled:opacity-40 sm:min-h-0">{t.tavern.send}</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
