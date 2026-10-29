import { tileHits } from "@/game/disasters";
import { AID_TALER, GIFT_TALER, sentToday, thankable, type Gift, type GiftKind } from "@/game/gifts";
import { REALMS, REALM_TZ, detectRealm, setRealm, clock, worldHour, isSunday, isLab, labJump, setLabJump, LAB_SPEED, type Realm } from "@/game/time";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { draw, iso, toTile, MIN_ZOOM, lastPeople, lastTraders, lastSources, peopleFocus, prewarmOverview, setSignposts, signpostMap, type Camera } from "@/game/render";
const pkey = (p: { id: number; seed: { id: string } }) => `${p.seed.id}:${p.id}`;
import { townOf, poseOf, kinOf, commandMayor, driveMayor, clearMayorOrder, type Person } from "@/game/people";
import { traitsOf, thoughtOf } from "@/game/traits";
import { weddingJoy, DOWRY } from "@/game/weddings";
import { inspectAt, type Inspect } from "@/game/inspect";
import { larderOf, storedAt, chainOf, boonsOf, type Ware } from "@/game/goods";
import { WareIcon } from "@/components/hud/WareIcon";
import { Maximize2, Minimize2, Volume2, VolumeX, Hammer, Bell, Signpost as SignIcon, Map as MapIcon, Sprout, Settings, Plus, Minus, Home, Crown, X, LogIn, Footprints } from "lucide-react";
import { Panel, WoodButton } from "@/components/hud/Panel";
import { Parchment, WaxSeal } from "@/components/hud/Parchment";
import { ART, pickDecision } from "@/game/decisions";
import { ITEM_STAGE } from "@/game/disasters";
import type { DecisionKind } from "@/game/decision-order";
import { Minimap } from "@/components/hud/Minimap";
import { rideTime, letterArrives } from "@/game/wander";
type LetterRow = { id: string; from_seed: string; to_seed: string; created_at: string };
import { chronicle, FEST_GAP, CHRON_LETTER, CHRON_BANNER, type Chronicle, type ChronEvent } from "@/game/chronicle";
import { scribeGreeting } from "@/lib/chronicle.functions";
import { useServerFn } from "@tanstack/react-start";
import { BookOpen, ScrollText } from "lucide-react";
import logoUrl from "@/assets/logo-keimling.png";
import { QUESTS, questState, type Quest, type QuestClaim } from "@/game/quests";
import { LoadingScreen } from "@/components/LoadingScreen";
import { splashDone } from "@/game/splash";
import { VillageRoll } from "@/components/VillageRoll";
import { Tavern } from "@/components/Tavern";
import { Beer } from "lucide-react";
import { seasonAt } from "@/game/season";
import { setScene, setSound, unlock, baa, hm, tap, bell, jingle, disposeAudio } from "@/game/audio";
import {
  canPlant,
  MIN_SEED_DISTANCE,
  specialSites,
  specialBuild,
  monumentProgress,
  MONUMENT_KEYS, MONUMENT_DEFS, monumentSteps, monumentOf,
  structureAt,
  radiusOf,
  ageHours,
  effAge,
  speedOf,
  speedParts,
  tradeProfile,
  tradePartners,
  mentoring,
  mentorOf,
  tradeHints,
  townStats,
  terrain,
  buildable,
  resourceAt,
  MAP,
  stageOf,
  links,
  isBlessed,
  blessCooldown,
  BLESS_MS,
  type Signpost,
  type Planting,
  roadCandidates, roadHours,
  roadBuilding,
  roadIncoming,
  type Seed,
  canPlaceSpecial,
  SPECIAL_KIND,
  characterOf,
  CHARTER_PATHS,
  charterReady,
  charterFits,
  type CharterPath,
  twinLinks, pactOf, pactPending, workOf, marketDay, marketHours, festivalDate, twinGateAt, PACTS, TWIN_WORKS, PACT_WAIT, type PactKind, type WorkKind,
  timberNear, SEAT_KINDS,
} from "@/game/world";
const PATH_ICON: Record<string, string> = { trade: "⚖️", craft: "🔨", culture: "📜", farm: "🌾" };
const CHAR_ICON: Record<string, string> = { plains: "🌾", mountain: "⚒", coast: "⚓", forest: "🌲" };
import { drawBuildingSprite, spriteUrl } from "@/game/building-sprites";
import { DICT, LANGS, LANG_LABEL, LANG_NAME, RTL, LOCALE, plantError, type Lang } from "@/game/i18n";
import { TITLE_PRICE, TITLE_STEPS, TITLE_RANK, TITLE_BONUS, titleOf, titleBlock, RANK_PRICE, RANK_ROADS, rankOf, rankBlock, type RankStep, ITEMS, MONUMENT_PRICE, MONUMENTS, nextMonumentStep, GUILD, canBuy, dailyTax, attributes, treasury, referralClaims, type Item, type Purchase } from "@/game/economy";
import { ENCOUNTERS, choiceOf, pendingEncounter, type Decision } from "@/game/encounters";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { firstFreeSite, placeTap } from "@/game/placement";

type Mode = "look" | "seed" | "tree" | "flower" | "lantern";

const SHEET = "pointer-events-auto w-full max-w-xs rounded-md border-2 border-wood bg-card px-3 py-2 text-foreground shadow-[var(--shadow-cozy)] max-md:max-h-[45dvh] max-md:max-w-none max-md:overflow-y-auto max-md:overscroll-contain max-md:rounded-t-2xl";
/** swipe a phone sheet down to close it */
const sheetSwipe = (close: () => void) => {
  let y0: number | null = null;
  return {
    onTouchStart: (e: import("react").TouchEvent<HTMLDivElement>) => { y0 = e.currentTarget.scrollTop <= 0 ? e.touches[0]!.clientY : null; },
    onTouchEnd: (e: import("react").TouchEvent<HTMLDivElement>) => { if (y0 != null && e.changedTouches[0]!.clientY - y0 > 60) close(); y0 = null; },
  };
};

export function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rawSeeds, setSeeds] = useState<Seed[]>([]);
  const [blessings, setBlessings] = useState<{ id: string; seed_id: string; created_at: string }[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [letters, setLetters] = useState<LetterRow[]>([]);
  const [bodies, setBodies] = useState<Record<string, string>>({});
  const [postTo, setPostTo] = useState<Seed | null>(null);
  const [postText, setPostText] = useState("");
  const [claims, setClaims] = useState<QuestClaim[]>([]);
  const [charters, setCharters] = useState<{ id: string; seed_id: string; path: string; created_at: string }[]>([]);
  const [charterOpen, setCharterOpen] = useState(false);
  const [firstRoads, setFirstRoads] = useState<{ id: string; seed_id: string; target_id: string; created_at: string }[]>([]);
  const [roadOpen, setRoadOpen] = useState(false);
  type EncRow = { id: string; seed_id: string; event: string; choice: string; cost: number; created_at: string };
  const [encounters, setEncounters] = useState<EncRow[]>([]);
  const [votes, setVotes] = useState<{ id: string; seed_id: string; partner_id: string; pact: string; created_at: string }[]>([]);
  const [works, setWorks] = useState<{ id: string; seed_id: string; partner_id: string; work: string; cost: number; created_at: string }[]>([]);
  const [pactOpen, setPactOpen] = useState(false);
  const [pactPick, setPactPick] = useState<PactKind | null>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const [barH, setBarH] = useState(88);
  useEffect(() => {
    const el = barRef.current; if (!el) return;
    const ro = new ResizeObserver(() => setBarH(el.offsetTop + el.offsetHeight));
    ro.observe(el); return () => ro.disconnect();
  }, []);
  const [encOpen, setEncOpen] = useState(false);
  const [snooze, setSnooze] = useState<Partial<Record<DecisionKind, number>>>({});
  const [roadPick, setRoadPick] = useState<string | null>(null);
  const [charterPick, setCharterPick] = useState<CharterPath | null>(null);
  const [signs, setSigns] = useState<Signpost[]>([]);
  const [signDraft, setSignDraft] = useState<Record<string, string>>({});
  // blessing timestamps travel with the seed, so growth stays a pure function of shared rows
  const seeds = useMemo(() => {
    const by = new Map<string, number[]>();
    for (const b of blessings) { if (!by.has(b.seed_id)) by.set(b.seed_id, []); by.get(b.seed_id)!.push(Date.parse(b.created_at)); }
    const buys = new Map<string, NonNullable<Seed["bought"]>>();
    const decs = new Map<string, Decision[]>();
    for (const e of encounters) { if (!decs.has(e.seed_id)) decs.set(e.seed_id, []); decs.get(e.seed_id)!.push({ event: e.event, choice: e.choice, cost: e.cost, at: Date.parse(e.created_at) }); }
    for (const p of purchases) { if (!buys.has(p.seed_id)) buys.set(p.seed_id, []); buys.get(p.seed_id)!.push({ item: p.item, at: Date.parse(p.created_at), x: p.x ?? null, y: p.y ?? null }); }
    const vo = new Map<string, NonNullable<Seed["votes"]>>(), wo = new Map<string, NonNullable<Seed["works"]>>();
    for (const v of votes) { if (!vo.has(v.seed_id)) vo.set(v.seed_id, []); vo.get(v.seed_id)!.push({ partner: v.partner_id, pact: v.pact as PactKind, at: Date.parse(v.created_at) }); }
    for (const w of works) { if (!wo.has(w.seed_id)) wo.set(w.seed_id, []); wo.get(w.seed_id)!.push({ partner: w.partner_id, work: w.work as WorkKind, cost: w.cost, at: Date.parse(w.created_at) }); }
    return rawSeeds.map((s0) => {
      const v0 = vo.get(s0.id), w0 = wo.get(s0.id);
      const s: Seed = v0 || w0 ? { ...s0, ...(v0 ? { votes: v0 } : {}), ...(w0 ? { works: w0 } : {}) } : s0;
      const bl = by.get(s.id), bo = buys.get(s.id), ch = charters.find((c) => c.seed_id === s.id), fr0 = firstRoads.filter((f) => f.seed_id === s.id), fr = fr0.length ? fr0 : null, de = decs.get(s.id);
      if (!bl && !bo && !ch && !fr && !de) return s;
      return { ...s, ...(bl ? { blessed: bl.sort((a, b) => a - b) } : {}), ...(bo ? { bought: bo.sort((a, b) => a.at - b.at) } : {}), ...(ch ? { charter: { path: ch.path as CharterPath, at: Date.parse(ch.created_at) } } : {}), ...(fr ? { roads: fr.map((f) => ({ target: f.target_id, at: Date.parse(f.created_at) })).sort((a, b) => a.at - b.at) } : {}), ...(de ? { decisions: de.sort((a, b) => a.at - b.at) } : {}) };
    }).map((s) => {
      const lt = letters.filter((g) => g.from_seed === s.id).map((g) => ({ id: g.id, to: g.to_seed, at: Date.parse(g.created_at) }));
      return lt.length ? { ...s, letters: lt } : s;
    }).map((s) => {
      const sent = gifts.filter((g) => g.from_seed === s.id).map((g) => ({ id: g.id, to: g.to_seed, kind: g.kind as GiftKind, at: Date.parse(g.created_at) }));
      const aid = gifts.filter((g) => g.to_seed === s.id && g.kind === "aid").map((g) => Date.parse(g.created_at));
      return sent.length || aid.length ? { ...s, ...(sent.length ? { sent } : {}), ...(aid.length ? { aid } : {}) } : s;
    });
  }, [rawSeeds, blessings, purchases, charters, firstRoads, encounters, votes, works, gifts, letters]);
  useEffect(() => { setSignposts(signs); }, [signs]);
  const [plantings, setPlantings] = useState<Planting[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  /** the player's own village, wherever it stands — one account plants exactly one seed */
  const [home, setHome] = useState<Seed | null>(null);
  const [lang, setLang] = useState<Lang>("de");
  const t = DICT[lang];
  const tRef = useRef(t);
  tRef.current = t;
  const [inviteOpen, setInviteOpen] = useState(false);
  useEffect(() => { document.title = t.docTitle; }, [t]);
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = RTL[lang] ? "rtl" : "ltr";
  }, [lang]);
  const mine = seeds.find((s) => userId && s.user_id === userId)?.id ?? null;
  const [auth, setAuth] = useState({ email: "", password: "", signup: false });
  const [mode, setMode] = useState<Mode>("look");
  const [placing, setPlacing] = useState<string | null>(null);
  const [hover, setHover] = useState<[number, number] | null>(null);
  // touch placement: the preview sits on its own tile until the player confirms
  const [ghost, setGhost] = useState<[number, number] | null>(null);
  const [coarse, setCoarse] = useState(false);
  useEffect(() => { const m = window.matchMedia("(pointer: coarse)"); const on = () => setCoarse(m.matches); on(); m.addEventListener("change", on); return () => m.removeEventListener("change", on); }, []);
  const [form, setForm] = useState({ name: "", owner: "", gender: "d" });
  // a ready-made cozy name lowers the founding hurdle (set after hydration, so SSR stays stable)
  useEffect(() => { const n = ["Lindenau","Haselbrunn","Kornwiese","Mühlbach","Eichenhain","Birkental","Wiesengrund","Hopfenau"]; setForm((f) => (f.name ? f : { ...f, name: n[Math.floor(Math.random() * n.length)] ?? "Lindenau" })); }, []);
  const [msg, setMsg] = useState<string | null>(null);
  type Tab = "build" | "rituals" | "signs" | "towns" | "plant";
  const [tab, setTab] = useState<Tab | null>(null);
  const [walk, setWalk] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [settings, setSettings] = useState(false);
  const [imprint, setImprint] = useState(false);
  const [quitOpen, setQuitOpen] = useState(false);
  const [quitName, setQuitName] = useState("");
  const [quitting, setQuitting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [realm, setRealmState] = useState<Realm>("europe");
  const realmRef = useRef<Realm>("europe");
  const [view, setView] = useState({ x: MAP / 2, y: MAP / 2, span: 40 });
  const [who, setWho] = useState<Person | null>(null);
  const [place, setPlace] = useState<Inspect | null>(null);
  const [, tick] = useState(0);

  const dpr = useRef(1);
  const [fs, setFs] = useState(false);
  const [sound, setSoundOn] = useState(false);
  useEffect(() => {
    const on = localStorage.getItem("samenland.sound") !== "off";
    setSoundOn(on);
    if (!on) return;
    const first = () => { setSound(true); unlock(); };
    window.addEventListener("pointerdown", first, { once: true });
    return () => window.removeEventListener("pointerdown", first);
  }, []);
  useEffect(() => () => disposeAudio(), []);
  const toggleSound = () => {
    const on = !sound; setSoundOn(on); setSound(on);
    localStorage.setItem("samenland.sound", on ? "on" : "off");
  };
  useEffect(() => { prewarmOverview(); }, []);
  useEffect(() => {
    const on = () => setFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", on);
    return () => document.removeEventListener("fullscreenchange", on);
  }, []);
  // start over the settled heartland, never the empty ocean at tile (0,0)
  const cam = useRef<Camera>((() => { const [x, y] = iso(500, 500); return { x, y, zoom: 2.6 }; })());
  const target = useRef({ zoom: 2.6, ax: 0, ay: 0 });
  const st = useRef({ seeds, plantings: new Map<string, Planting>(), hover, mode, mine, placing: null as string | null, ghost: null as [number, number] | null, walk: false });
  st.current.walk = walk;
  st.current.seeds = seeds;
  st.current.hover = hover;
  st.current.placing = placing;
  st.current.ghost = ghost;
  st.current.mode = mode;
  st.current.mine = mine;
  st.current.plantings = new Map(plantings.map((p) => [`${p.x},${p.y}`, p]));

  const focus = (x: number, y: number) => {
    const [ix, iy] = iso(x, y);
    cam.current.x = ix;
    cam.current.y = iy;
  };
  /** Entering seed mode: if the view centre is unplantable (mountain, water), glide to the nearest free valley. */
  const startSeedMode = () => {
    if (home) { setMsg(t.alreadyHave); return; }
    setPlantAsk(null);
    setMode("seed");
    const [cx, cy] = toTile(cam.current.x, cam.current.y);
    if (canPlant(cx, cy, seeds) === null) return;
    for (let r = 2; r < 200; r += 2) for (let a = 0; a < 24; a++) {
      const x = Math.round(cx + Math.cos((a / 24) * 6.283) * r), y = Math.round(cy + Math.sin((a / 24) * 6.283) * r);
      if (canPlant(x, y, seeds) === null && canPlant(x + 3, y, seeds) === null && canPlant(x - 3, y, seeds) === null && canPlant(x, y + 3, seeds) === null && canPlant(x, y - 3, seeds) === null) {
        focus(x, y); target.current = { ...target.current, zoom: Math.max(target.current.zoom, 1.4) }; return;
      }
    }
  };
  const [ptr, setPtr] = useState<[number, number] | null>(null);
  const ptrRef = useRef<[number, number] | null>(null), tipRef = useRef<HTMLDivElement | null>(null);
  const [plantAsk, setPlantAsk] = useState<[number, number] | null>(null);
  const [planting, setPlanting] = useState(false);
  // one seed per account on any map; admins get one per map
  useEffect(() => {
    if (!userId) { setHome(null); return; }
    let live = true;
    setHome(null);
    let q = supabase.from("seeds").select("*").eq("user_id", userId);
    if (isAdmin) q = q.eq("realm", realm);
    q.limit(1).then(async ({ data }) => {
      if (!live) return;
      if (data?.[0]) { setHome(data[0] as Seed); return; }
      // signed in without a village: guide straight into founding instead of leaving them on the map
      setAuthOpen(false);
      setTab("plant");
      const { data: u } = await supabase.auth.getUser();
      const meta = u.user?.user_metadata ?? {};
      const full = String(meta["full_name"] ?? meta["name"] ?? "").split(" ")[0]?.slice(0, 32) ?? "";
      if (live && full) setForm((f) => (f.owner ? f : { ...f, owner: full }));
    });
    return () => { live = false; };
  }, [userId, isAdmin, realm]);
  // optional letter by email when a bought building is finished (sent by the scheduled build-mail route)
  const [mailOn, setMailOn] = useState(false);
  useEffect(() => {
    if (!userId) { setMailOn(false); return; }
    (supabase as unknown as import("@supabase/supabase-js").SupabaseClient).from("build_mail").select("enabled").eq("user_id", userId).maybeSingle().then(({ data }) => setMailOn(!!data?.enabled));
  }, [userId]);
  const toggleMail = async (on: boolean) => {
    if (!userId) return;
    setMailOn(on);
    const { error } = await (supabase as unknown as import("@supabase/supabase-js").SupabaseClient).from("build_mail").upsert({ user_id: userId, enabled: on, lang });
    if (error) setMailOn(!on);
  };
  // admin rights follow the login, even when the session arrives after the first map load
  useEffect(() => {
    if (!userId) { setIsAdmin(false); return; }
    let live = true;
    supabase.from("user_roles").select("role").eq("user_id", userId).then(({ data }) => {
      if (!live) return;
      const adm = !!data?.some((x) => x.role === "admin");
      setIsAdmin(adm);
      const o = localStorage.getItem("samenland-realm");
      // only when the map was loaded before the login arrived, and at most once per page and session
      if (adm && o && o !== realmRef.current && !(window as { __realmFix?: boolean }).__realmFix && !sessionStorage.getItem("samenland-realm-fix")) {
        (window as { __realmFix?: boolean }).__realmFix = true;
        sessionStorage.setItem("samenland-realm-fix", "1");
        window.location.reload();
      }
    });
    return () => { live = false; };
  }, [userId]);

  useEffect(() => {
    const saved = localStorage.getItem("samenland-lang");
    setLang(
      saved && (LANGS as string[]).includes(saved) ? (saved as Lang) : (LANGS.find((l) => navigator.language.toLowerCase().startsWith(l)) ?? "en"),
    );
    const vi = setInterval(() => {
      const cv = canvasRef.current, c = cam.current; if (!cv) return;
      const [x, y] = toTile(c.x, c.y);
      setView({ x, y, span: (cv.clientWidth / c.zoom) / 32 + (cv.clientHeight / c.zoom) / 16 });
    }, 500);
    // one canonical origin, so the stored login is always found
    if (location.hostname === "www.samenland.app") {
      location.replace("https://samenland.app" + location.pathname + location.search + location.hash);
    }
    // friend invite: remember the inviting village until the newcomer plants
    try { const ref = new URLSearchParams(location.search).get("ref"); if (ref && /^[0-9a-f-]{36}$/i.test(ref)) localStorage.setItem("samenland-ref", ref); } catch { /* ignore */ }
    // local session first: a slow/offline network (iPhone waking up) must never look like a logout
    supabase.auth.getSession().then(({ data }) => { if (data.session) setUserId(data.session.user.id); });
    // only an explicit sign-out clears the user: in the editor preview the session arrives
    // late over the editor handshake, and an empty INITIAL_SESSION must not look like a logout
    const { data: sub } = supabase.auth.onAuthStateChange((ev, session) => {
      if (ev === "SIGNED_OUT") { setUserId(null); return; }
      if (session?.user.id) setUserId(session.user.id);
    });
    // Safari pauses timers in background tabs: refresh the token as soon as the page is visible again
    const onVis = () => {
      if (document.visibilityState === "visible") {
        supabase.auth.startAutoRefresh();
        supabase.auth.getSession().then(({ data }) => { if (data.session) setUserId(data.session.user.id); });
      } else supabase.auth.stopAutoRefresh();
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pageshow", onVis);
    (async () => {
      let r = detectRealm();
      let uid: string | null = null;
      try {
        // guests must never wait on auth: local session only, with a short cap
        const sess = await Promise.race([
          supabase.auth.getSession().then((x) => x.data.session),
          new Promise<null>((res) => setTimeout(() => res(null), 1500)),
        ]);
        uid = sess?.user.id ?? null;
        if (uid) {
          const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", uid);
          const adm = !!roles?.some((x) => x.role === "admin");
          setIsAdmin(adm);
          const o = localStorage.getItem("samenland-realm") as Realm | null;
          if (adm && o && (REALMS.includes(o) || o === "lab")) r = o;
          if (r === "lab") setLabJump(Number(localStorage.getItem("samenland-lab-jump") ?? 0));
        }
      } catch { /* play as guest */ }
      // invited newcomers land on their friend's map
      const refId = localStorage.getItem("samenland-ref");
      let refSeed: { id: string; realm: string; name: string } | null = null;
      if (refId && !(r === "lab")) {
        const { data } = await supabase.from("seeds").select("id, realm, name").eq("id", refId).maybeSingle();
        if (data) { refSeed = data; if (REALMS.includes(data.realm as Realm)) r = data.realm as Realm; }
        else localStorage.removeItem("samenland-ref");
      }
      setRealm(r);
      realmRef.current = r;
      setRealmState(r);
      const [a, b, bl, sg, pu] = await Promise.all([
        supabase.from("seeds").select("*").eq("realm", r).order("created_at"),
        supabase.from("plantings").select("*"),
        supabase.from("blessings").select("id, seed_id, created_at"),
        supabase.from("signposts").select("id, seed_id, target_id, user_id, message"),
        supabase.from("purchases").select("id, seed_id, item, cost, created_at, x, y"),
      ]);
      supabase.from("charters").select("id, seed_id, path, created_at").then(({ data }) => setCharters(data ?? []));
      supabase.from("encounters").select("id, seed_id, event, choice, cost, created_at").then(({ data }) => setEncounters(data ?? []));
      supabase.from("first_roads").select("id, seed_id, target_id, created_at").then(({ data }) => setFirstRoads(data ?? []));
      supabase.from("twin_votes").select("id, seed_id, partner_id, pact, created_at").then(({ data }) => setVotes(data ?? []));
      supabase.from("twin_works").select("id, seed_id, partner_id, work, cost, created_at").then(({ data }) => setWorks(data ?? []));
      supabase.from("gifts").select("id, from_seed, to_seed, kind, amount, note, created_at").then(({ data }) => setGifts((data ?? []) as Gift[]));
      supabase.from("letters").select("id, from_seed, to_seed, created_at").gte("created_at", new Date(Date.now() - 60 * 864e5).toISOString()).then(({ data }) => setLetters(data ?? []));
      supabase.from("letter_bodies").select("letter_id, body").then(({ data }) => setBodies(Object.fromEntries((data ?? []).map((b) => [b.letter_id, b.body]))));
      const ss = (a.data ?? []) as Seed[];
      Promise.all([
        supabase.from("quest_claims").select("id, seed_id, quest, reward, created_at"),
        supabase.from("market_sales").select("id, seed_id, day, reward, created_at"),
        supabase.from("referrals").select("id, referrer_seed, referee_seed, reward, created_at"),
      ]).then(([q, m, rf]) => {
        setClaims([...(q.data ?? []), ...(m.data ?? []).map((x) => ({ id: x.id, seed_id: x.seed_id, quest: `market:${x.day}`, reward: x.reward, created_at: x.created_at }) as QuestClaim), ...referralClaims(rf.data ?? [])]);
        // tell the inviter once when a friend has answered the call
        const mine = ss.find((s) => uid && s.user_id === uid);
        const got = (rf.data ?? []).filter((x) => mine && x.referrer_seed === mine.id);
        const seen = Number(localStorage.getItem("samenland-ref-seen") ?? 0);
        if (got.length > seen) {
          const last = ss.find((s) => s.id === got[got.length - 1]!.referee_seed);
          setMsg(tRef.current.invite.got(last?.name ?? "?"));
          localStorage.setItem("samenland-ref-seen", String(got.length));
        }
      });
      setBlessings(bl.data ?? []);
      setPurchases(pu.data ?? []);
      setSigns((sg.data ?? []) as Signpost[]);
      setSeeds(ss);
      setPlantings((b.data ?? []) as Planting[]);
      // visitors without a village first see the oldest (most grown) town of this map
      const oldest = [...ss].sort((p, q) => Date.parse(p.created_at) - Date.parse(q.created_at))[0];
      const own = ss.find((s) => uid && s.user_id === uid);
      const friend = refSeed ? ss.find((s) => s.id === refSeed!.id) : undefined;
      const my = own ?? friend ?? oldest;
      if (my) focus(my.x, my.y);
      else focus(MAP / 2, MAP / 2);
      if (!own && friend) setMsg(tRef.current.invite.welcome(friend.name));
    })();
    const ch = supabase
      .channel(`world-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "seeds" }, (p) => {
        if ((p.new as { realm?: string }).realm !== realmRef.current) return;
        setSeeds((s) => (s.some((x) => x.id === (p.new as Seed).id) ? s : [...s, p.new as Seed]));
      },
      )
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "plantings" }, (p) =>
        setPlantings((s) =>
          s.some((x) => x.id === (p.new as Planting).id) ? s : [...s, p.new as Planting],
        ),
      )
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "purchases" }, (p) => {
        const n = p.new as Purchase;
        setPurchases((s) => (s.some((x) => x.id === n.id) ? s : [...s, n]));
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "letters" }, (p) => {
        const n = p.new as LetterRow;
        setLetters((s) => (s.some((x) => x.id === n.id) ? s : [...s, n]));
        supabase.from("letter_bodies").select("letter_id, body").eq("letter_id", n.id).maybeSingle().then(({ data }) => { if (data) setBodies((b) => ({ ...b, [data.letter_id]: data.body })); });
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "charters" }, (p) => {
        const n = p.new as { id: string; seed_id: string; path: string; created_at: string };
        setCharters((s) => (s.some((x) => x.id === n.id) ? s : [...s, n]));
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "encounters" }, (p) => {
        const n = p.new as EncRow;
        setEncounters((s) => (s.some((x) => x.id === n.id) ? s : [...s, n]));
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "first_roads" }, (p) => {
        const n = p.new as { id: string; seed_id: string; target_id: string; created_at: string };
        setFirstRoads((s) => (s.some((x) => x.id === n.id) ? s : [...s, n]));
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "gifts" }, (p) => {
        const g = p.new as Gift; setGifts((q) => (q.some((x) => x.id === g.id) ? q : [...q, g]));
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "blessings" }, (p) => {
        const n = p.new as { id: string; seed_id: string; created_at: string };
        setBlessings((s) => (s.some((x) => x.id === n.id) ? s : [...s, n]));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "signposts" }, (p) => {
        if (p.eventType === "DELETE") return setSigns((s) => s.filter((x) => x.id !== (p.old as Signpost).id));
        const n = p.new as Signpost;
        setSigns((s) => [...s.filter((x) => x.id !== n.id), n]);
      })
      .subscribe();
    const iv = setInterval(() => tick((n) => n + 1), isLab() && LAB_SPEED > 1 ? 2000 : 30000);
    return () => {
      supabase.removeChannel(ch);
      clearInterval(iv);
      clearInterval(vi);
      sub.subscription.unsubscribe();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pageshow", onVis);
    };
  }, []);

  // render loop + input
  useEffect(() => {
    const cv = canvasRef.current!;
    const ctx = cv.getContext("2d")!;
    let raf = 0;
    const resize = () => {
      // phones: cap pixel density at 2 – DPR 3 screens otherwise push ~2.25x the pixels for no visible gain
      const touch = window.matchMedia("(pointer: coarse)").matches;
      dpr.current = Math.min(window.devicePixelRatio || 1, touch ? 2 : 3);
      cv.width = Math.ceil(cv.clientWidth * dpr.current);
      cv.height = Math.ceil(cv.clientHeight * dpr.current);
    };
    resize();
    window.addEventListener("resize", resize);
    let lastScene = 0;
    let panStep = () => {};
    const loop = () => {
      panStep(); // keyboard pan + fling share the draw frame (one rAF loop)
      const c = cam.current,
        tg = target.current;
      if (Math.abs(tg.zoom - c.zoom) > 0.0005) {
        const nz = c.zoom + (tg.zoom - c.zoom) * 0.16;
        const px = (tg.ax - cv.width / 2) / dpr.current,
          py = (tg.ay - cv.height / 2) / dpr.current;
        c.x += px / c.zoom - px / nz;
        c.y += py / c.zoom - py / nz;
        c.zoom = nz;
      }
      // keep the camera over the island, so far panning or fast wheel zoom never leaves the map
      c.x = Math.max(-MAP * 16, Math.min(MAP * 16, c.x)); c.y = Math.max(0, Math.min(MAP * 16, c.y));
      const s = st.current;
      const h = s.hover;
      const ok = h && s.mode === "seed" ? canPlant(h[0], h[1], s.seeds) === null : null;
      draw(ctx, cv.width, cv.height, dpr.current, c, s.seeds, s.plantings, clock(), h, ok);
      if (s.mode === "seed") {
        // drawn above the night grade, so the founding marker stays readable at midnight
        const z = c.zoom * dpr.current, k = Math.SQRT2;
        ctx.save();
        ctx.setTransform(z, 0, 0, z, cv.width / 2 - c.x * z, cv.height / 2 - c.y * z);
        const lw = 1.5 / c.zoom;
        for (const o of s.seeds) {
          const [ox, oy] = iso(o.x, o.y), R = MIN_SEED_DISTANCE;
          ctx.beginPath(); ctx.ellipse(ox, oy, R * 16 * k, R * 8 * k, 0, 0, 7);
          ctx.fillStyle = "rgba(170,50,40,0.16)"; ctx.fill();
          ctx.setLineDash([6 / c.zoom, 4 / c.zoom]); ctx.lineWidth = lw; ctx.strokeStyle = "rgba(200,70,55,0.75)"; ctx.stroke(); ctx.setLineDash([]);
        }
        if (h) {
          const [gx, gy] = iso(h[0], h[1]);
          ctx.globalCompositeOperation = "lighter";
          const gr = ctx.createRadialGradient(gx, gy, 0, gx, gy, 90);
          gr.addColorStop(0, "rgba(255,190,110,0.32)"); gr.addColorStop(1, "rgba(255,150,70,0)");
          ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(gx, gy, 90, 50, 0, 0, 7); ctx.fill();
          ctx.globalCompositeOperation = "source-over";
          const col = ok ? "rgba(110,215,110,0.95)" : "rgba(235,85,70,0.95)";
          if (ok) { // first-year village reach
            ctx.beginPath(); ctx.ellipse(gx, gy, 5 * 16 * k, 5 * 8 * k, 0, 0, 7);
            ctx.fillStyle = "rgba(110,215,110,0.12)"; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = "rgba(110,215,110,0.7)"; ctx.stroke();
          }
          ctx.beginPath(); ctx.moveTo(gx, gy - 8); ctx.lineTo(gx + 16, gy); ctx.lineTo(gx, gy + 8); ctx.lineTo(gx - 16, gy); ctx.closePath();
          ctx.fillStyle = ok ? "rgba(110,215,110,0.3)" : "rgba(235,85,70,0.3)"; ctx.fill();
          ctx.lineWidth = 2.2 / c.zoom; ctx.strokeStyle = col; ctx.stroke();
          // founding stake with pennant
          ctx.fillStyle = "rgba(20,14,8,0.35)"; ctx.beginPath(); ctx.ellipse(gx, gy, 3, 1.2, 0, 0, 7); ctx.fill();
          ctx.fillStyle = "#6b4a2b"; ctx.fillRect(gx - 0.7, gy - 20, 1.4, 20);
          const wv = Math.sin(performance.now() / 300) * 1.5;
          ctx.beginPath(); ctx.moveTo(gx + 0.7, gy - 20); ctx.quadraticCurveTo(gx + 6, gy - 19 + wv, gx + 10, gy - 17 + wv); ctx.lineTo(gx + 0.7, gy - 14); ctx.closePath();
          ctx.fillStyle = ok ? "#c9a227" : "#a33a2c"; ctx.fill();
        }
        ctx.restore();
      }
      const own = s.seeds.find((x) => x.id === s.mine);
      const gh = s.ghost ?? h;
      if (s.placing && gh && own) {
        // SimCity-style ghost: the building floats over the tile, tinted by whether it may stand there
        const good = canPlaceSpecial(s.placing, gh[0], gh[1], own, s.seeds, clock()) === null;
        const z = c.zoom * dpr.current, [gx, gy] = iso(gh[0], gh[1]);
        ctx.save();
        ctx.setTransform(z, 0, 0, z, cv.width / 2 - c.x * z, cv.height / 2 - c.y * z);
        ctx.beginPath(); ctx.moveTo(gx, gy - 8); ctx.lineTo(gx + 16, gy); ctx.lineTo(gx, gy + 8); ctx.lineTo(gx - 16, gy); ctx.closePath();
        ctx.fillStyle = good ? "rgba(90,190,90,0.45)" : "rgba(210,70,60,0.45)"; ctx.fill();
        ctx.lineWidth = 1 / Math.max(0.5, c.zoom); ctx.strokeStyle = good ? "rgba(40,120,40,0.9)" : "rgba(150,30,25,0.9)"; ctx.stroke();
        ctx.globalAlpha = good ? 0.8 : 0.45;
        drawBuildingSprite(ctx, SPECIAL_KIND[s.placing]!, gx, gy, 0.5);
        ctx.restore();
      }
      const nowMs = performance.now();
      if (nowMs - lastScene > 250) {
        lastScene = nowMs;
        const hw = cv.clientWidth / 2 / c.zoom, hh = cv.clientHeight / 2 / c.zoom;
        const [tx, ty] = toTile(c.x, c.y), span = Math.min(200, Math.max(4, (hw / 16 + hh / 8) / 2));
        let forest = 0, water = 0, sea = 0, n = 0;
        for (let j = -4; j <= 4; j++) for (let i = -4; i <= 4; i++) {
          const tr = terrain(Math.round(tx + (i * span) / 4), Math.round(ty + (j * span) / 4)); n++;
          if (tr === "forest") forest++; else if (tr === "water") water++; else if (tr === "deep") sea++;
        }
        const zn = Math.min(1, Math.max(0, (Math.log(c.zoom) - Math.log(MIN_ZOOM)) / (Math.log(5) - Math.log(MIN_ZOOM))));
        const talkers = lastPeople.filter((p) => p.q.talk !== null && p.q.talkTurn).length;
        const sources = lastSources.slice(0, 40).map((q) => {
          const dx = (q.x - c.x) / hw, dy = (q.y - c.y) / hh;
          return { k: q.k, pan: dx, near: Math.max(0, 1 - Math.hypot(dx, dy) * 0.8) };
        }).filter((q) => q.near > 0);
        setScene({ zoom: zn, forest: forest / n, water: water / n, sea: sea / n, people: lastPeople.length, talkers, sources });
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = cv.getBoundingClientRect();
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
      target.current = {
        zoom: Math.min(st.current.walk ? 20 : 12, Math.max(MIN_ZOOM, target.current.zoom * Math.exp(-dy * 0.0015))),
        ax: (e.clientX - r.left) * dpr.current,
        ay: (e.clientY - r.top) * dpr.current,
      };
    };
    cv.addEventListener("wheel", onWheel, { passive: false });
    // keyboard panning: WASD + arrow keys, smooth per frame
    const keys = new Set<string>();
    const KEYMAP: Record<string, [number, number]> = { w: [0, -1], arrowup: [0, -1], s: [0, 1], arrowdown: [0, 1], a: [-1, 0], arrowleft: [-1, 0], d: [1, 0], arrowright: [1, 0] };
    const typing = (e: KeyboardEvent) => { const el = e.target as HTMLElement | null; return !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable); };
    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === "escape" && st.current.walk) { setWalk(false); return; }
      if (!KEYMAP[k] || typing(e) || e.metaKey || e.ctrlKey || e.altKey) return;
      e.preventDefault(); keys.add(k);
    };
    const onKeyUp = (e: KeyboardEvent) => keys.delete(e.key.toLowerCase());
    const onBlur = () => keys.clear();
    let lastPan = performance.now(), walkDriven = false;
    panStep = () => {
      const now = performance.now(), dt = Math.min(50, now - lastPan); lastPan = now;
      if (st.current.walk) {
        // stroll mode: the keys steer the own mayor and the camera follows him softly
        const S = st.current, my = S.seeds.find((x) => x.id === S.mine);
        if (my) {
          let dx = 0, dy = 0;
          for (const k of keys) { const v = KEYMAP[k]; if (v) { dx += v[0]; dy += v[1]; } }
          const nw = clock(), tw = townOf(my, S.seeds, nw), me = tw.people.find((q) => q.role === "mayor");
          if (me) {
            if (keys.size || walkDriven) { driveMayor(me, tw, S.seeds, nw, dx + dy, dy - dx, dt / 1000); walkDriven = true; }
            const q = poseOf(me, tw, S.seeds, nw), [ix, iy] = iso(q.x, q.y), k = 1 - Math.exp(-dt / 220);
            cam.current.x += (ix - cam.current.x) * k; cam.current.y += (iy - 10 - cam.current.y) * k;
          }
        }
        return;
      }
      walkDriven = false;
      if (keys.size) {
        let dx = 0, dy = 0;
        for (const k of keys) { const v = KEYMAP[k]; if (v) { dx += v[0]; dy += v[1]; } }
        const sp = (0.6 * dt) / cam.current.zoom; // screen px per ms, independent of zoom
        cam.current.x += dx * sp; cam.current.y += dy * sp;
      }
      const f = fling.current;
      if (!drag.current && (f.vx || f.vy)) {
        cam.current.x -= (f.vx * dt) / cam.current.zoom; cam.current.y -= (f.vy * dt) / cam.current.zoom;
        const k = Math.exp(-dt / 130);
        f.vx *= k; f.vy *= k;
        if (Math.hypot(f.vx, f.vy) < 0.01) { f.vx = 0; f.vy = 0; }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      cv.removeEventListener("wheel", onWheel);
    };
  }, []);

  const tileAt = (e: React.PointerEvent) => {
    const cv = canvasRef.current!,
      r = cv.getBoundingClientRect(),
      c = cam.current;
    const sx = e.clientX - r.left,
      sy = e.clientY - r.top;
    return toTile((sx - r.width / 2) / c.zoom + c.x, (sy - r.height / 2) / c.zoom + c.y) as [
      number,
      number,
    ];
  };
  const drag = useRef<{ x: number; y: number; moved: boolean; t0?: number; touch?: boolean; sx?: number; sy?: number; ghost?: boolean } | null>(null);
  // inertia: screen px/ms of the last drag; decays in the pan loop
  const fling = useRef({ vx: 0, vy: 0, t: 0 });
  const lastTap = useRef({ t: 0, x: 0, y: 0 });
  const touches = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ dist: number; mx: number; my: number } | null>(null);

  /** Villager under the pointer; hit radius is in screen pixels so it stays easy to tap at any zoom. */
  const personAt = (e: { clientX: number; clientY: number }): Person | null => {
    const r = canvasRef.current!.getBoundingClientRect(), c = cam.current;
    const wx = (e.clientX - r.left - r.width / 2) / c.zoom + c.x, wy = (e.clientY - r.top - r.height / 2) / c.zoom + c.y;
    let best: Person | null = null, bd = Math.max(3, (coarse ? 26 : 16) / c.zoom);
    for (const f of lastPeople) { const dd = Math.hypot(f.x - wx, f.y - 2.5 - wy); if (dd < bd) { bd = dd; best = f.q.p; } }
    return best;
  };
  useEffect(() => { peopleFocus.sel = who ? pkey(who) : null; }, [who]);
  const onClick = async (x: number, y: number) => {
    setMsg(null);
    if (mode === "seed") {
      if (!userId) return setMsg(t.signInToPlant);
      if (!form.name.trim() || !form.owner.trim() || !form.gender) return setMsg(t.needNames);
      const err = canPlant(x, y, seeds);
      if (err) return setMsg(plantError(t, err));
      setPlantAsk([x, y]);
    } else if (mode === "tree" || mode === "flower" || mode === "lantern") {
      const my = seeds.find((s) => s.id === mine);
      if (!my) return;
      if (Math.hypot(x - my.x, y - my.y) > radiusOf(effAge(my, seeds, clock())) + 3)
        return setMsg(t.nearOnly);
      if (!buildable(terrain(x, y))) return setMsg(t.noGrow);
      const { data } = await supabase
        .from("plantings")
        .insert({ seed_id: my.id, kind: mode, x, y })
        .select()
        .single();
      if (data) setPlantings((p) => [...p, data as Planting]);
    }
  };

  /** Planting only after the player confirms the spot on the parchment. */
  const plantNow = async () => {
    if (!plantAsk || !userId) return;
    const [x, y] = plantAsk;
    setPlanting(true);
    const { data, error } = await supabase
      .from("seeds")
      .insert({ name: form.name.trim(), owner: form.owner.trim(), mayor_gender: form.gender || null, x, y, hue: Math.floor(Math.random() * 360), user_id: userId, realm })
      .select()
      .single();
    setPlanting(false);
    // whatever the outcome, the seed is no longer held in the hand
    setPlantAsk(null);
    setPtr(null);
    setHover(null);
    setMode("look");
    if (error?.code === "23505") { setTab(null); return setMsg(t.alreadyHave); }
    if (error || !data) return setMsg(t.plantFail);
    setHome(data as Seed);
    setSeeds((s) => [...s, data as Seed]);
    setTab(null);
    focus(x, y);
    setMsg(t.planted(data.name)); jingle("fanfare");
    // invited newcomer: both villages receive the friend bonus (checked by the database)
    const ref = localStorage.getItem("samenland-ref");
    if (ref) {
      localStorage.removeItem("samenland-ref");
      const { error: re } = await supabase.rpc("claim_referral", { _seed: data.id, _ref: ref });
      if (!re) {
        const now0 = new Date().toISOString();
        setClaims((c) => [...c, ...referralClaims([{ id: `local-${data.id}`, referrer_seed: ref, referee_seed: data.id, reward: 50, created_at: now0 }])]);
        setMsg(`${t.planted(data.name)} ${t.quests.got(50)}`); setTimeout(() => jingle("coins"), 900);
      }
    }
  };

  const my = seeds.find((s) => s.id === mine);
  const startWalk = () => { if (!my) return; setTab(null); setWho(null); setPlace(null); setPlacing(null); const cv = canvasRef.current; target.current = { zoom: 16, ax: (cv?.width ?? 0) / 2, ay: (cv?.height ?? 0) / 2 }; setWalk(true); };
  const wasWalk = useRef(false);
  useEffect(() => { if (wasWalk.current && !walk) { clearMayorOrder(); target.current = { ...target.current, zoom: Math.min(12, target.current.zoom) }; } wasWalk.current = walk; }, [walk]);
  const findMayor = () => { if (!my) return; const nw = clock(), tw = townOf(my, seeds, nw), me = tw.people.find((q) => q.role === "mayor"); if (!me) return focus(my.x, my.y); const z = poseOf(me, tw, seeds, nw); focus(z.x, z.y); setPlace(null); setWho(me); };
  const myCharter = my ? charters.find((c) => c.seed_id === my.id)?.path : undefined;
  const sealCharter = async () => {
    if (!my || !userId || !charterPick) return;
    const { data, error } = await supabase.from("charters").insert({ seed_id: my.id, user_id: userId, path: charterPick }).select("id, seed_id, path, created_at").single();
    if (error || !data) return setMsg(t.charter.fail);
    setCharters((s) => (s.some((x) => x.id === data.id) ? s : [...s, data]));
    bell(0); setCharterOpen(false); setMsg(t.charter.sealed(t.charter.paths[charterPick]![0]));
  };
  const myRoad = my ? firstRoads.find((f) => f.seed_id === my.id) : undefined;
  const openRoad = () => { const cs = my ? roadCandidates(my, seeds) : []; setRoadPick(cs.length === 1 ? cs[0]!.id : null); setTab(null); setRoadOpen(true); };
  const joinRoad = async (target: string) => {
    if (!my || !userId) return;
    const { data, error } = await supabase.from("first_roads").insert({ seed_id: my.id, user_id: userId, target_id: target }).select("id, seed_id, target_id, created_at").single();
    if (error || !data) return setMsg(error?.message?.includes("under construction") ? t.road.busyFail : t.road.fail);
    setFirstRoads((s) => (s.some((x) => x.id === data.id) ? s : [...s, data]));
    bell(0); setMsg(t.road.joined(seeds.find((s) => s.id === target)?.name ?? ""));
  };
  const sealRoad = async () => {
    if (!my || !userId || !roadPick) return;
    const { data, error } = await supabase.from("first_roads").insert({ seed_id: my.id, user_id: userId, target_id: roadPick }).select("id, seed_id, target_id, created_at").single();
    if (error || !data) return setMsg(error?.message?.includes("under construction") ? t.road.busyFail : t.road.fail);
    setFirstRoads((s) => (s.some((x) => x.id === data.id) ? s : [...s, data]));
    bell(0); setRoadOpen(false); setMsg(t.road.sealed(seeds.find((s) => s.id === roadPick)?.name ?? ""));
  };
  const decide = async (event: string, choice: string) => {
    if (!my || !userId) return;
    const { data, error } = await supabase.from("encounters").insert({ seed_id: my.id, user_id: userId, event, choice }).select("id, seed_id, event, choice, cost, created_at").single();
    if (error || !data) return setMsg(t.enc.fail);
    setEncounters((s) => (s.some((x) => x.id === data.id) ? s : [...s, data]));
    bell(0); setEncOpen(false); setMsg(t.enc.done);
  };
  const twinsOfMine = my ? twinLinks(my, seeds, clock()).map((l) => (l.a.id === my.id ? l.b : l.a)) : [];
  const pactPartner = twinsOfMine.find((o) => pactPending(my!, o, seeds, clock()) === "vote") ?? null;
  const sealPact = async () => {
    if (!my || !userId || !pactPartner || !pactPick) return;
    const { data, error } = await supabase.from("twin_votes").insert({ seed_id: my.id, partner_id: pactPartner.id, user_id: userId, pact: pactPick }).select("id, seed_id, partner_id, pact, created_at").single();
    if (error || !data) return setMsg(t.twin.fail);
    setVotes((v) => [...v, data]); bell(0); setPactOpen(false);
  };
  const payWork = async (o: Seed, work: WorkKind) => {
    if (!my || !userId) return;
    const { data, error } = await supabase.from("twin_works").insert({ seed_id: my.id, partner_id: o.id, user_id: userId, work }).select("id, seed_id, partner_id, work, cost, created_at").single();
    if (error || !data) return setMsg(t.twin.poor);
    setWorks((w) => [...w, data]); tap();
  };
  const myStats = my ? townStats(my, seeds, clock()) : null;
  const switchLang = (l: Lang) => {
    setLang(l);
    localStorage.setItem("samenland-lang", l);
  };
  const emailAuth = async () => {
    setMsg(null);
    const { email, password, signup } = auth;
    if (signup) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) return setMsg(error.message);
      if (!data.session) setMsg(t.checkMail);
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMsg(t.authFail);
    }
  };
  const oauth = async (p: "google" | "apple") => {
    const r = await lovable.auth.signInWithOAuth(p, { redirect_uri: window.location.origin });
    if (r?.error) setMsg(t.authFail);
  };

  const now = clock();
  const owner = !!my && !!userId && my.user_id === userId;
  const decision = pickDecision({
    road: owner && !myRoad && !links(seeds).some((l) => l.a.id === my!.id || l.b.id === my!.id) && roadCandidates(my!, seeds).length > 0,
    charter: owner && !myCharter && charterReady(my!.created_at, now),
    pact: owner && !!pactPartner,
    encounter: owner && !!pendingEncounter(my!, my!.decisions ?? [], now),
  }, (k) => (snooze[k] ?? 0) > now);
  const anyOpen = roadOpen || charterOpen || encOpen || pactOpen;
  const sealShown = !anyOpen && !decision.open && decision.due.length > 0;
  function later(k: DecisionKind) {
    setSnooze((m) => ({ ...m, [k]: Date.now() + 3.6e6 }));
    if (k === "road") setRoadOpen(false); else if (k === "charter") setCharterOpen(false); else if (k === "pact") setPactOpen(false); else setEncOpen(false);
  }
  function reopen() { setSnooze({}); }
  // Village chronicle: derived from time since the last visit (per village, per device)
  const [chron, setChron] = useState<Chronicle | null>(null);
  const [chronOpen, setChronOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [welcome, setWelcome] = useState(false);
  const [tavernOpen, setTavernOpen] = useState(false);
  const [chatUnread, setChatUnread] = useState(0);
  const [rollOpen, setRollOpen] = useState(false);
  // the tutorial parchment greets every visitor on their very first page load,
  // signed in or not, as soon as the loading screen has stepped aside
  const openGuide = () => {
    if (localStorage.getItem("samenland-guide-seen")) return;
    localStorage.setItem("samenland-guide-seen", "1");
    setWelcome(true);
  };
  useEffect(() => { if (splashDone()) openGuide(); }, []);
  const [chronBanner, setChronBanner] = useState(false);
  const [scribe, setScribe] = useState<string | null | undefined>(undefined);
  const askScribe = useServerFn(scribeGreeting);
  const chronDone = useRef<string | null>(null);
  const myCharterPath = (s: typeof my) => s?.charter?.path;
  const titleName = (k: number) => (myCharterPath(my) ? t.office.names[myCharterPath(my)!]?.[k] : undefined) ?? t.office.title;
  const itemName = (item: string) => { if (/^title[1-3]$/.test(item)) return titleName(+item.slice(5) - 1); const mk = monumentOf(item); return t.items[item]?.[0] ?? (mk ? t.items[`${mk}1`]![0] : item); };
  const chronLine = (e: ChronEvent) => e.code === "stage" ? t.chron.stage(t.stages[e.stage] ?? "") : e.code === "built" ? t.chron.built(t.kind[e.kind] ?? e.kind) : e.code === "bought" ? t.chron.built(itemName(e.item)) : e.code === "road" ? t.chron.road(e.other) : e.code === "twin" ? t.chron.twin(e.other) : e.code === "house" ? t.chron.house(t.kind[e.kind] ?? e.kind) : e.code === "family" ? t.chron.family : e.code === "houses" ? t.chron.houses(e.n) : e.code === "families" ? t.chron.families(e.n) : e.code === "wedding" ? t.chron.wedding(e.a, e.b) : e.code === "fire" ? (e.guarded ? t.chron.fireOut : t.chron.fire(e.dead)) : e.code === "flood" ? t.chron.flood : e.code === "raid" ? (e.caught ? t.chron.caught : t.chron.raid(e.loss)) : e.code === "journeyman" ? t.chron.journeyman(e.name, t.job[e.craft]?.[e.sex === "f" ? 0 : 1] ?? e.craft, e.other) : e.code === "journeymen" ? t.chron.journeymen(e.n) : e.code === "bride" ? t.chron.bride(e.name, e.other, e.away) : e.code === "moved" ? t.chron.moved(e.name, e.other, e.away) : e.code === "letter" ? t.chron.letter(e.other) : t.chron.season(t.seasons[e.season]);
  useEffect(() => {
    if (!owner || !my || seeds.length === 0 || chronDone.current === my.id) return;
    chronDone.current = my.id;
    const k = `samenland-seen-${my.id}`, now = clock(), last = Number(localStorage.getItem(k) ?? 0);
    localStorage.setItem(k, String(now));
    const save = () => localStorage.setItem(k, String(clock()));
    window.addEventListener("pagehide", save);
    if (!last) return;
    const gap = now - last;
    if (gap < CHRON_BANNER) return;
    const c = chronicle(my, seeds, last, now);
    setChron(c);
    if (gap >= CHRON_LETTER) {
      setChronOpen(true);
      const facts = [...c.events.filter((e) => e.code !== "season").slice(-8).map(chronLine), t.chron.pop(c.popFrom, c.popTo), t.chron.taler(c.taler)];
      askScribe({ data: { lang, town: my.name, days: Math.floor(gap / 864e5), facts } }).then((r) => setScribe(r.text)).catch(() => setScribe(null));
    } else { setChronBanner(true); setScribe(null); }
  }, [owner, my?.id, seeds.length]);
  // Live celebrations: while the player watches, newly derived milestones open an illustrated parchment.
  const [fest, setFest] = useState<ChronEvent[]>([]);
  const [seenGifts, setSeenGifts] = useState<string[]>([]);
  useEffect(() => { try { setSeenGifts(JSON.parse(localStorage.getItem("samenland-gifts-seen") ?? "[]")); } catch { /* ignore */ } }, []);
  const liveFrom = useRef(0), lastSmall = useRef(0);
  useEffect(() => {
    if (!owner || !my || seeds.length === 0) return;
    liveFrom.current = clock();
    const id = window.setInterval(() => {
      if (document.hidden) return;
      const now = clock(), c = chronicle(my, seeds, liveFrom.current, now);
      liveFrom.current = now;
      localStorage.setItem(`samenland-seen-${my.id}`, String(now));
      let big = c.events.filter((e) => e.code !== "season" && e.code !== "houses" && e.code !== "families");
      // Small moments (one house + its family) at most every few minutes, so big towns don't flood the screen.
      const small = big.filter((e) => e.code === "house" || e.code === "family");
      big = big.filter((e) => e.code !== "house" && e.code !== "family");
      if (small.length && Date.now() - lastSmall.current > FEST_GAP) { const h = small.find((e) => e.code === "house") ?? small[0]!; big.push(h, ...small.filter((e) => e.code === "family" && "x" in h && e.x === h.x && e.y === h.y)); lastSmall.current = Date.now(); }
      if (big.length) setFest((q) => [...q, ...big].slice(-6));
    }, 15000);
    return () => window.clearInterval(id);
  }, [owner, my?.id, seeds]);
  const festNow = !anyOpen && !decision.open && !chronOpen ? fest[0] : undefined;
  const festSounded = useRef<ChronEvent | null>(null), giftSounded = useRef<string | null>(null);
  useEffect(() => {
    if (!festNow || festSounded.current === festNow) return;
    festSounded.current = festNow;
    const e = festNow;
    jingle(e.code === "wedding" ? "wedding" : e.code === "stage" ? "stage" : e.code === "road" ? "road" : e.code === "twin" ? "twin" : e.code === "letter" ? "letter" : e.code === "family" ? "welcome" : e.code === "built" && SEAT_KINDS.includes(e.kind) ? (["built", "fanfare", "stage", "stage"] as const)[SEAT_KINDS.indexOf(e.kind)]! : e.code === "house" || e.code === "built" || e.code === "bought" ? "built" : e.code === "fire" ? (e.guarded ? "relief" : "woe") : e.code === "flood" ? "woe" : e.code === "raid" ? (e.caught ? "relief" : "woe") : "fanfare");
  }, [festNow]);
  const festArt = (e: ChronEvent) => e.code === "fire" ? ART["fire"] : e.code === "flood" ? ART["flood"] : e.code === "raid" ? ART["robber"] : e.code === "wedding" ? ART["wedding"] : e.code === "house" ? ART["topping"] : e.code === "family" ? ART["newcomers"] : e.code === "road" ? ART["roadopen"] : e.code === "twin" || (e.code === "bought" && /^title[1-3]$/.test(e.item)) ? ART["charter"] : ART["fair"];
  const festText = (e: ChronEvent): [string, string] => {
    const n = my?.name ?? "";
    if (e.code === "fire") return e.guarded ? [t.woe.fireGuarded[0], t.woe.fireGuarded[1](n)] : [t.woe.fire[0], t.woe.fire[1](n, e.water, e.dead)];
    if (e.code === "flood") return [t.woe.flood[0], t.woe.flood[1](n)];
    if (e.code === "raid") return e.caught ? [t.woe.caught[0], t.woe.caught[1](n)] : [t.woe.raid[0], t.woe.raid[1](n, e.loss)];
    if (e.code === "wedding") return [t.fest.wedding, t.fest.wedBody(e.a, e.b, DOWRY) + (e.alliance ? " " + t.fest.wedAlliance : "")];
    if (e.code === "house") return [t.fest.topping[0], t.fest.topping[1](t.kind[e.kind] ?? e.kind, n)];
    if (e.code === "family") return [t.fest.newcomers[0], t.fest.newcomers[1](n)];
    if (e.code === "road") return [t.fest.road[0], t.fest.road[1](e.other)];
    if (e.code === "twin") return [t.fest.twin[0], t.fest.twin[1](e.other)];
    if (e.code === "letter") return [t.post.arrived(e.other), bodies[e.id] ? `„${bodies[e.id]}“` : t.post.sealed];
    if (e.code === "bought" && /^title[1-3]$/.test(e.item)) return [t.office.fest, t.office.festBody(my?.owner ?? n, itemName(e.item))];
    if (e.code === "stage") return [t.fest.stage[0], t.fest.stage[1](t.stages[e.stage] ?? "")];
    if (e.code === "built" && SEAT_KINDS.includes(e.kind)) { const p = t.fest.seat[SEAT_KINDS.indexOf(e.kind)]; if (p) return p; }
    const name = e.code === "built" ? (t.kind[e.kind] ?? e.kind) : e.code === "bought" ? (itemName(e.item)) : chronLine(e);
    return [t.fest.built[0], t.fest.built[1](name)];
  };
  function openChron() {
    if (!my) return;
    const now = clock();
    setChron((c) => c ?? chronicle(my, seeds, now - 7 * 864e5, now));
    setScribe((x) => (x === undefined ? null : x));
    setChronBanner(false); setChronOpen(true);
  }
  // heavy derivations refresh every 5 s of world time, not on every pointer move
  const slow = Math.floor(now / 5000) * 5000;
  const { cash, myStage, myTown, at, pop, residents, season, nbs, larder, boons } = useMemo(() => {
    const cash = my ? treasury(my, purchases, slow, gifts, claims) : 0;
    const myStage = my ? stageOf(effAge(my, seeds, slow)) : 0;
    const myTown = my ? townOf(my, seeds, slow) : null;
    const larder = my ? larderOf(my, seeds, slow) : null;
    const boons = larder ? boonsOf(larder) : null;
    const at = my ? attributes(my, seeds, purchases, slow, myTown!.weddings.filter((w) => w.alliance).length, boons ?? undefined) : null;
    const pop = my ? dailyTax(my, ageHours(my, slow)) : 0;
    const residents = myTown ? myTown.people.length : 0;
    const sw = seasonAt(slow);
    const season = (Object.keys(sw) as (keyof typeof sw)[]).reduce((a, b) => (sw[b] > sw[a] ? b : a));
    const nbs = my ? links(seeds).filter((l) => l.a.id === my.id || l.b.id === my.id).map((l) => (l.a.id === my.id ? l.b : l.a)) : [];
    return { cash, myStage, myTown, at, pop, residents, season, nbs, larder, boons };
  }, [my, seeds, purchases, gifts, claims, slow]);
  const [larderOpen, setLarderOpen] = useState(false);
  // "come back later": purse too thin for anything new while builders still work — say so once per session
  const [waitShut, setWaitShut] = useState(false);
  const waitDone = (() => {
    if (!owner || !my || !at) return null;
    const cheapest = Math.min(...(Object.keys(ITEMS) as Item[]).filter((it) => canBuy(it, myCharter) && !at.has(it) && (ITEM_STAGE[it] ?? 0) <= myStage).map((it) => ITEMS[it]));
    if (cash >= cheapest) return null;
    const dur = specialBuild(my);
    const ends = [...specialSites(my).values()].map((s) => s.at + dur).filter((e) => e > slow);
    return ends.length ? Math.min(...ends) : null;
  })();
  // the "come back later" band stays shut for this build site: remembered per finishing building
  useEffect(() => {
    if (!waitDone) return;
    try { if (localStorage.getItem("samenland-wait-shut") === String(waitDone)) setWaitShut(true); } catch { /* ignore */ }
  }, [waitDone]);
  const shutWait = () => {
    setWaitShut(true);
    try { localStorage.setItem("samenland-wait-shut", String(waitDone)); } catch { /* ignore */ }
  };

  const wareName = (w: Ware, n: number) => t.goods.ware[w]![n === 1 ? 0 : 1];
  const [questOpen, setQuestOpen] = useState(false);
  const [questFold, setQuestFold] = useState(false);
  useEffect(() => { if (coarse && window.innerWidth < 768) setQuestFold(true); }, [coarse]); // phones: quest starts as a small badge
  const quest = my ? questState(claims, my.id, {
    blessings: blessings.filter((b) => b.seed_id === my.id).length,
    purchases: purchases.filter((p) => p.seed_id === my.id).length,
    signposts: signs.filter((s) => s.seed_id === my.id).length,
    encounters: encounters.filter((e) => e.seed_id === my.id).length,
    giftsSent: gifts.filter((g) => g.from_seed === my.id).length,
    residents, stage: myStage, roads: firstRoads.filter((f) => f.seed_id === my.id).length,
  }) : null;
  const questHow = () => {
    if (!quest || !my) return;
    const tabs: Partial<Record<Quest, Tab>> = { bless: "rituals", bless7: "rituals", build: "build", buy3: "build", buy6: "build", sign: "signs", gift: "towns", gifts5: "towns", road: "build", roads2: "build" };
    const tb = tabs[quest.quest];
    if (tb) setTab(tb); else { focus(my.x, my.y); setMsg(t.quests.list[quest.quest]![1]); }
  };
  const claimQuest = async () => {
    if (!my || !userId || !quest?.ready) return;
    const { data, error } = await supabase.from("quest_claims").insert({ seed_id: my.id, user_id: userId, quest: quest.quest }).select("id, seed_id, quest, reward, created_at").single();
    setQuestOpen(false);
    if (error || !data) return setMsg(t.quests.fail);
    setClaims((c) => [...c, data]);
    jingle("fanfare"); setTimeout(() => jingle("coins"), 700); setMsg(t.quests.got(data.reward));
  };
  const sendLetter = async () => {
    if (!my || !postTo) return;
    const body = postText.trim(), to = postTo;
    const { data, error } = await supabase.rpc("send_letter", { _from: my.id, _to: to.id, _body: body });
    setPostTo(null);
    if (error || !data) return setMsg(t.post.fail);
    const row = { id: data as string, from_seed: my.id, to_seed: to.id, created_at: new Date().toISOString() };
    setLetters((s) => (s.some((x) => x.id === row.id) ? s : [...s, row]));
    setBodies((b) => ({ ...b, [row.id]: body }));
    setMsg(t.post.sent(Math.round(rideTime(my, to) / 6e4)));
  };
  const holdMarket = async (small: boolean) => {
    if (!my || !userId) return;
    const { data, error } = await supabase.from("market_sales").insert({ seed_id: my.id, user_id: userId, small }).select("id, seed_id, day, reward, created_at").single();
    if (error || !data) return setMsg(t.goods.marketFail);
    setClaims((c) => [...c, { id: data.id, seed_id: data.seed_id, quest: `market:${data.day}`, reward: data.reward, created_at: data.created_at } as QuestClaim]);
    jingle("coins"); setMsg(t.goods.marketGot(data.reward));
  };
  const ring = async (kind: "bell" | "well") => {
    if (!my) return;
    const { data, error } = await supabase.from("blessings").insert({ seed_id: my.id, user_id: userId!, kind }).select("id, seed_id, created_at").single();
    if (error || !data) return setMsg(t.blessFail);
    setBlessings((s) => [...s, data]);
    if (kind === "bell") bell(); else tap();
    setMsg(t.blessed(my.name));
  };
  const sendGift = async (to: Seed, kind: GiftKind, note = 0) => {
    if (!my || !userId) return;
    const { data, error } = await supabase.from("gifts").insert({ from_seed: my.id, to_seed: to.id, user_id: userId, kind, note }).select("id, from_seed, to_seed, kind, amount, note, created_at").single();
    if (error || !data) return setMsg(t.gifts.fail);
    setGifts((q) => (q.some((x) => x.id === data.id) ? q : [...q, data as Gift]));
    tap(); setMsg(kind === "thanks" ? t.gifts.thanked(to.name) : t.gifts.sent(to.name));
  };
  const saveSign = async (to: Seed) => {
    if (!my) return;
    const cur = signs.find((x) => x.seed_id === my.id && x.target_id === to.id);
    const text = (signDraft[to.id] ?? cur?.message ?? "").trim().slice(0, 80);
    if (!text) return setMsg(t.signPlaceholder);
    if (cur && cur.message === text) return setMsg(t.signSaved);
    const { data, error } = await supabase.from("signposts").upsert({ seed_id: my.id, target_id: to.id, user_id: userId!, message: text }, { onConflict: "seed_id,target_id" }).select("id, seed_id, target_id, user_id, message").single();
    if (error || !data) return setMsg(t.blessFail);
    setSigns((s) => [...s.filter((x) => x.id !== data.id), data as Signpost]);
    setMsg(t.signSaved);
  };
  const buy = async (item: string, x?: number, y?: number) => {
    if (!my) return;
    if (x != null && y != null) {
      const err = canPlaceSpecial(item, x, y, my, seeds, clock());
      if (err) return setMsg(t.place[err as "far" | "ground" | "taken" | "shore"]);
    }
    setPlacing(null);
    const { data, error } = await supabase.from("purchases").insert({ seed_id: my.id, user_id: userId!, item, x: x ?? null, y: y ?? null }).select("id, seed_id, item, cost, created_at, x, y").single();
    if (error || !data) return setMsg(error?.message?.includes("not enough money") ? t.poor : t.buyFail);
    setPurchases((s) => [...s.filter((x) => x.id !== data.id), data]);
    tap();
    if (/^title[1-3]$/.test(item)) { jingle("stage"); bell(0); setMsg(t.office.fest); } else if (item === "rank2" || item === "rank3") { jingle("fanfare"); bell(0); setMsg(t.rank.sealed(t.rank.ranks[item === "rank2" ? 1 : 2]!)); } else { const mk = monumentOf(item); jingle(mk ? "fanfare" : "coins"); setMsg(mk ? `${t.monuments[mk]!.title} · ${t.monument.step(+item.slice(mk.length), monumentSteps(mk).length)}` : t.bought(t.items[item]![0])); }
  };
  useEffect(() => {
    if (!placing || !coarse) { setGhost(null); return; }
    const own = seeds.find((x) => x.id === mine); if (!own) return;
    const g = firstFreeSite(placing, own, seeds, clock()) ?? [own.x, own.y];
    setGhost(g); focus(g[0], g[1]); target.current = { ...target.current, zoom: Math.max(target.current.zoom, 6) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placing, coarse]);
  const zoomBy = (f: number) => {
    const cv = canvasRef.current!;
    target.current = { zoom: Math.min(st.current.walk ? 20 : 12, Math.max(MIN_ZOOM, target.current.zoom * f)), ax: cv.width / 2, ay: cv.height / 2 };
  };
  const pick = (k: Tab) => setTab(tab === k ? null : k);
  const tabs: { k: Tab; icon: typeof Hammer; label: string }[] = [
    ...(my ? [
      { k: "build" as Tab, icon: Hammer, label: t.hud.build },
      { k: "rituals" as Tab, icon: Bell, label: t.hud.rituals },
      { k: "signs" as Tab, icon: SignIcon, label: t.hud.signs },
    ] : [{ k: "plant" as Tab, icon: Sprout, label: t.hud.plant }]),
    { k: "towns", icon: MapIcon, label: t.hud.towns },
  ];
  const Head = ({ children }: { children: React.ReactNode }) => <div className="font-display text-2xl leading-none text-wood">{children}</div>;

  const drawer = tab && (
    <div className="space-y-3 p-3 text-sm">
      <div className="flex items-center justify-between">
        <Head>{tabs.find((x) => x.k === tab)?.label}</Head>
        <button type="button" aria-label={t.hud.close} onClick={() => setTab(null)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
      </div>
      {tab === "build" && my && at && (
        <div className="space-y-2">
          {(() => {
            const b = roadBuilding(my, now, seeds), inc = b ? null : roadIncoming(my, seeds, now), cs = roadCandidates(my, seeds), to = b ? seeds.find((s) => s.id === b.target) : null;
            return (
              <div className="rounded-md border border-border bg-secondary/60 p-2">
                <div className="flex items-center gap-2">
                  {ART["road"] && <img src={ART["road"]} alt="" loading="lazy" className="h-12 w-12 shrink-0 rounded object-cover" />}
                  <span className="flex-1 font-semibold">{t.road.menu}</span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{t.road.menuHint}</div>
                {b ? <div className="mt-2 text-xs font-semibold text-wood">{t.road.busy(to?.name ?? "", Math.max(1, Math.ceil((b.done - now) / 3.6e6)))}</div>
                  : inc ? <div className="mt-2 space-y-1"><div className="text-xs font-semibold text-wood">{t.road.incoming(inc.from.name, Math.max(1, Math.ceil((inc.done - now) / 3.6e6)))}</div><Button size="sm" className="w-full" onClick={() => joinRoad(inc.from.id)}>{t.road.join}</Button></div>
                  : cs.length === 0 ? <div className="mt-2 text-xs">{t.road.none}</div>
                  : <Button size="sm" className="mt-2 w-full" onClick={openRoad}>{t.road.btn}</Button>}
              </div>
            );
          })()}
          {myCharter && (
            <div className="rounded-md border border-brass/60 bg-brass/15 p-2 text-xs">
              <b>{PATH_ICON[myCharter]} {t.charter.paths[myCharter]![0]}:</b> {t.charter.bonus[myCharter]}
              {my && (() => {
                const r = rankOf(my, purchases), step: RankStep = r === 1 ? "rank2" : "rank3";
                const roads = links(seeds).filter((l) => (l.a.id === my.id || l.b.id === my.id) && now >= l.since).length;
                const blk = rankBlock(my, purchases, now, roads);
                const why = blk === "age" ? t.rank.need.age(t.stages[step === "rank2" ? 2 : 4] ?? "") : blk === "guild" ? t.rank.need.guild : blk === "belfry" ? t.rank.need.belfry : blk === "roads" ? t.rank.need.roads(RANK_ROADS) : "";
                return (
                  <div className="mt-2 border-t border-brass/40 pt-2">
                    <div className="font-semibold">{t.rank.title}</div>
                    <div className="mt-1 flex gap-1">
                      {t.rank.ranks.map((n, k) => <span key={k} className={`rounded-full px-2 py-0.5 text-[10px] ${k < r ? "bg-brass/60 font-semibold text-wood" : "bg-ink/10 opacity-60"}`}>{k < r ? "✦" : "○"} {n}</span>)}
                    </div>
                    <ul className="mt-1 space-y-0.5">
                      {t.rank.perks[myCharter]!.map((p, k) => <li key={k} className={k + 2 <= r ? "text-primary" : "opacity-70"}>{k + 2 <= r ? "✓" : "·"} <b>{t.rank.ranks[k + 1]}:</b> {p}</li>)}
                    </ul>
                    {blk === "max" ? <div className="mt-1 font-semibold text-primary">{t.rank.need.max}</div>
                      : blk ? <div className="mt-1 text-muted-foreground">{t.rank.exam[r]}: {why}</div>
                      : <Button size="sm" className="mt-1.5 h-7 w-full" disabled={cash < RANK_PRICE[step]} onClick={() => void buy(step)}>{t.rank.exam[r]} · {t.taler(RANK_PRICE[step])}</Button>}
                  </div>
                );
              })()}
              {my && (() => {
                const n = titleOf(my, purchases), blk = titleBlock(my, purchases, now), step = TITLE_STEPS[Math.min(n, 2)]!;
                const why = blk === "age" ? t.office.need.age(t.stages[[3, 4, 5][n] ?? 5] ?? "") : blk === "rank" ? t.office.need.rank(t.rank.ranks[TITLE_RANK[step] - 1] ?? "") : blk === "charter" ? t.office.need.charter : "";
                const fmt = (b: Partial<Record<string, number>>) => Object.entries(b).map(([k, v]) => `+${v} ${t.office.stat[k] ?? k}`).join(", ");
                return (
                  <div className="mt-2 border-t border-brass/40 pt-2">
                    <div className="font-semibold">📜 {t.office.title}</div>
                    <div className="mt-0.5 text-muted-foreground">{t.office.intro}</div>
                    <ul className="mt-1 space-y-0.5">
                      {TITLE_STEPS.map((st, k) => <li key={st} className={k < n ? "text-primary" : "opacity-70"}>{k < n ? "✓" : "·"} <b>{titleName(k)}</b> · {fmt(TITLE_BONUS[myCharter as CharterPath][k] ?? {})} · {t.office.garb[k]}</li>)}
                    </ul>
                    {blk === "max" ? <div className="mt-1 font-semibold text-primary">{t.office.need.max}</div>
                      : blk ? <div className="mt-1 text-muted-foreground">{titleName(n)}: {why}</div>
                      : <Button size="sm" className="mt-1.5 h-7 w-full" disabled={cash < TITLE_PRICE[step]} onClick={() => void buy(step)}>{t.office.appoint}: {titleName(n)} · {t.taler(TITLE_PRICE[step])}</Button>}
                  </div>
                );
              })()}
            </div>
          )}
          {(Object.keys(ITEMS) as Item[]).filter((it) => canBuy(it, myCharter) && !at.has(it) && (ITEM_STAGE[it] ?? 0) <= myStage)
            .sort((a, b) => ITEMS[a] - ITEMS[b])
            .map((it) => {
            return (
              <div key={it} className="rounded-md border border-border bg-secondary/60 p-2">
                <div className="flex items-center gap-2">
                  {spriteUrl(SPECIAL_KIND[it]!) && <img src={spriteUrl(SPECIAL_KIND[it]!)} alt="" loading="lazy" className="h-12 w-12 shrink-0 object-contain drop-shadow" />}
                  <span className="flex-1 font-semibold">{t.items[it]![0]}{GUILD[it] && <span className="ml-1 rounded-full bg-brass/30 px-1.5 py-0.5 text-[10px] text-wood">{t.charter.guild}</span>}</span>
                  <span className="text-xs text-muted-foreground">{t.taler(ITEMS[it])}</span>
                </div>
                <div className="text-xs text-muted-foreground">{t.items[it]![1]}</div>
                <div className="mt-1.5">
                  {at.has(it) ? <span className="text-xs font-semibold text-primary">{t.owned}</span> : (
                    (ITEM_STAGE[it] ?? 0) > myStage ? <span className="text-xs text-muted-foreground">{t.needStage(t.stages[ITEM_STAGE[it]!] ?? "")}</span> :
                    <Button size="sm" className="h-7 w-full" disabled={cash < ITEMS[it]} onClick={() => { setPlacing(it); setTab(null); setMsg(t.place.pick(t.items[it]![0])); if (my) focus(my.x, my.y); }}>{t.hud.build}</Button>
                  )}
                </div>
              </div>
            );
          })}
          {my && MONUMENT_KEYS.filter((k) => myStage >= MONUMENTS[k].stage).map((key) => {
            const steps = monumentSteps(key), mt = t.monuments[key]!;
            const paid = purchases.filter((p) => p.seed_id === my.id && steps.includes(p.item));
            const next = nextMonumentStep(paid.map((p) => p.item), key);
            const prog = monumentProgress(my, now, key), n = steps.length, i = paid.length;
            const last = Math.max(0, ...paid.map((p) => Date.parse(p.created_at)));
            const ready = i === 0 || (prog >= i / n && now - last >= 3 * 3600000);
            const waitH = Math.max(Math.ceil((last + 3 * 3600000 - now) / 3.6e6), Math.ceil(((i / n - prog) * n * specialBuild(my)) / 3.6e6));
            const kind = MONUMENT_DEFS[key].kind, first = `${key}1`;
            return (
              <div key={key} className="rounded-md border border-brass/60 bg-brass/10 p-2">
                <div className="flex items-center gap-2">
                  {spriteUrl(kind) && <img src={spriteUrl(kind)} alt="" loading="lazy" className="h-14 w-12 shrink-0 object-contain drop-shadow" />}
                  <span className="flex-1 font-semibold">{mt.title}</span>
                  {next && <span className="text-xs text-muted-foreground">{t.taler(MONUMENT_PRICE[next]!)}</span>}
                </div>
                <div className="text-xs text-muted-foreground">{t.items[first]![1]}</div>
                <div className="mt-1 h-1.5 overflow-hidden rounded bg-ink/15"><div className="h-full bg-brass" style={{ width: `${100 * prog}%` }} /></div>
                <ol className="mt-1 space-y-0.5 text-xs">
                  {mt.steps.map((name, k) => <li key={k} className={k < i ? "text-primary" : k === i ? "font-semibold" : "opacity-60"}>{k < i ? "✓" : `${k + 1}.`} {name}</li>)}
                </ol>
                <div className="mt-1.5">
                  {!next ? <span className="text-xs font-semibold text-primary">{prog >= 1 ? mt.done : t.monument.building}</span>
                    : !ready ? <span className="text-xs text-muted-foreground">{t.monument.wait(Math.max(1, waitH))}</span>
                    : <Button size="sm" className="h-7 w-full" disabled={cash < MONUMENT_PRICE[next]!} onClick={() => {
                        if (next === first) { setPlacing(first); setTab(null); setMsg(t.place.pick(t.items[first]![0])); focus(my.x, my.y); }
                        else void buy(next);
                      }}>{t.monument.step(i + 1, n)} · {t.monument.pay}</Button>}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {tab === "rituals" && my && (() => {
        const live = isBlessed(my, now), last = Math.max(0, ...(my.blessed ?? [])), cd = blessCooldown(my, now);
        return (
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">{t.ritual}</div>
            {live && <div className="text-xs text-primary">{t.festive(Math.ceil((last + BLESS_MS - now) / 3.6e6))}</div>}
            {cd > 0 ? <div className="text-xs text-muted-foreground">{t.blessAgain(Math.ceil(cd / 3.6e6))}</div> : (
              <div className="grid gap-2">
                <Button size="sm" variant="secondary" onClick={() => ring("bell")}>{t.ringBell}</Button>
                <Button size="sm" variant="secondary" onClick={() => ring("well")}>{t.decorateWell}</Button>
              </div>
            )}
          </div>
        );
      })()}
      {tab === "signs" && my && (
        <div className="space-y-2">
          {nbs.length === 0 ? <div className="text-xs text-muted-foreground">{t.noNeighbours}</div> : nbs.map((o) => {
            const cur = signs.find((x) => x.seed_id === my.id && x.target_id === o.id);
            const hurt = tileHits(o, now).size > 0, used = sentToday(my.id, gifts, now);
            return (
              <div key={o.id} className="space-y-1">
              <div className="flex flex-wrap gap-1">
                <Button size="sm" variant="secondary" disabled={used || cash < GIFT_TALER} onClick={() => sendGift(o, "gift")}>{t.gifts.give(GIFT_TALER)}</Button>
                {hurt && <Button size="sm" disabled={used || cash < AID_TALER} onClick={() => sendGift(o, "aid")}>{t.gifts.aid(AID_TALER)}</Button>}
              </div>
              {used && <div className="text-xs text-muted-foreground">{t.gifts.once}</div>}
              <form className="space-y-1" onSubmit={(e) => { e.preventDefault(); saveSign(o); }}>
                <div className="text-xs">{t.signTo(o.name)}</div>
                <div className="flex gap-1">
                  <Input className="h-8 text-xs" maxLength={80} placeholder={t.signPlaceholder} value={signDraft[o.id] ?? cur?.message ?? ""} onChange={(e) => setSignDraft({ ...signDraft, [o.id]: e.target.value })} />
                  <Button type="submit" size="sm" variant="secondary">{t.signSave}</Button>
                </div>
              </form>
              </div>
            );
          })}
        </div>
      )}
      {tab === "plant" && (!userId ? (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">{t.hud.login}</p>
          <Button size="sm" className="w-full" onClick={() => setAuthOpen(true)}>{t.signIn}</Button>
        </div>
      ) : home ? (
        <div className="space-y-2">
          <p className="text-xs">{t.hasTown.at(home.name, t.realms[home.realm ?? "europe"])}</p>
          <p className="text-xs text-muted-foreground">{t.hasTown.one}</p>
          {home.realm === realm && <Button size="sm" variant="secondary" className="w-full" onClick={() => focus(home.x, home.y)}>{t.hasTown.look}</Button>}
        </div>
      ) : (
        <form className="space-y-2" onSubmit={(e) => { e.preventDefault(); startSeedMode(); }}>
          <Input placeholder={t.townName} maxLength={32} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input placeholder={t.yourName} maxLength={32} value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} />
          <div className="flex gap-1" role="radiogroup" aria-label={t.gender.label}>
            {(["m", "w", "d"] as const).map((g) => <Button key={g} type="button" size="sm" className="flex-1" variant={form.gender === g ? "default" : "outline"} aria-pressed={form.gender === g} onClick={() => setForm({ ...form, gender: g })}>{t.gender[g]}</Button>)}
          </div>
          <p className="text-xs text-muted-foreground">{mode === "seed" ? t.clickLand : t.needNames}</p>
          {mode === "seed" ? <Button type="button" size="sm" variant="ghost" onClick={() => { setMode("look"); setPlantAsk(null); setPtr(null); }}>{t.cancel}</Button>
            : <Button type="submit" size="sm" className="w-full" disabled={!form.name.trim() || !form.owner.trim() || !form.gender}>{t.plant}</Button>}
        </form>
      ))}
      {tab === "towns" && my && (() => {
        const g = (xs: string[]) => xs.map((x) => t.trade.goods[x] ?? x).join(", ");
        const prof = tradeProfile(my, now), parts = tradePartners(my, seeds, now), hints = tradeHints(my, seeds, now);
        return (
          <div className="mb-2 space-y-1 border-b border-border pb-2 text-xs text-muted-foreground">
            <div className="font-display text-sm text-foreground">{t.trade.title}</div>
            <div>{t.trade.exports}: {g(prof.exports)}</div>
            <div>{t.trade.imports}: {g(prof.imports)}</div>
            <div className="text-foreground">{t.trade.partners}</div>
            {parts.length === 0 && <div>{t.trade.none}</div>}
            {parts.map((p) => (
              <div key={p.seed.id}>{t.trade.partner(p.seed.name, Math.round(p.bonus * 100), t.trade.fit(p.factor))}<span className="block">{t.trade.flow(g(p.buy), g(p.sell))}</span></div>
            ))}
            {hints.map((h) => <div key={h.good} className="italic">{t.trade.hint(t.trade.goods[h.good] ?? h.good, h.from?.name ?? null)}</div>)}
            {twinLinks(my, seeds, now).map((l) => {
              const o = l.a.id === my.id ? l.b : l.a, p = pactOf(my, o, seeds, now), pend = pactPending(my, o, seeds, now), w = workOf(my, o, now);
              const mine = (my.votes ?? []).filter((v) => v.partner === o.id).sort((a, b) => b.at - a.at)[0];
              return (
                <div key={o.id} className="mt-2 space-y-1 rounded border border-border p-2">
                  <div className="font-display text-sm text-foreground">{t.twin.title(my.name, o.name)}</div>
                  <div>{t.twin.bonus}</div>
                  {p ? <div className="text-foreground">{t.twin.agreed(t.twin.pacts[p.kind]![0])}</div>
                    : pend === "wait" && mine ? <div>{t.twin.waiting(Math.max(1, Math.ceil((mine.at + PACT_WAIT - now) / 864e5)))}</div>
                    : owner ? <Button size="sm" variant="secondary" onClick={() => { setPactPick(null); setPactOpen(true); }}>{t.twin.seal}</Button> : null}
                  {marketDay(l, now) && <div>{t.twin.market}</div>}
                  <div>{t.twin.festival(festivalDate(l))}</div>
                  {p && (
                    <div className="space-y-1">
                      <div className="text-foreground">{t.twin.workTitle}</div>
                      {w.done !== null ? <div>{now >= w.done ? t.twin.built(t.twin.works[w.work!]!) : t.twin.building}</div>
                        : w.mine ? <div>{t.twin.paid}</div>
                        : <>
                            <div>{t.twin.workIntro}</div>
                            {(Object.keys(TWIN_WORKS) as WorkKind[]).filter((k) => !w.work || w.work === k).map((k) => (
                              <Button key={k} size="sm" variant="secondary" className="mr-1" disabled={!owner || cash < TWIN_WORKS[k]} onClick={() => payWork(o, k)}>{t.twin.works[k]} · {t.twin.pay(TWIN_WORKS[k])}</Button>
                            ))}
                          </>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })()}
      {tab === "towns" && (
        <ul className="max-h-[50vh] space-y-1 overflow-auto">
          {seeds.map((s) => (
            <li key={s.id}>
              <button className="w-full rounded px-2 py-1 text-left hover:bg-accent" onClick={() => { focus(s.x, s.y); setTab(null); }}>
                <span className="text-foreground">{s.name}</span>
                <span className="block text-xs text-muted-foreground">
                  {t.character[characterOf(s.x, s.y)]![0]} · {t.stages[stageOf(effAge(s, seeds, now))]} · {s.owner} · {t.age(ageHours(s, now))}
                  {(() => { const p = speedParts(s, seeds, now); return (<>
                    {p.bless > 0.005 && <span className="block">{t.blessBonus(Math.round(p.bless * 100))}</span>}
                    {p.trade > 0.005 && <span className="block">{t.tradeBonus(Math.round(p.trade * 100))}</span>}
                    {p.farm > 0.005 && <span className="block">{t.farmBonus(Math.round(p.farm * 100))}</span>}
                  </>); })()}
                  {mentoring(s, seeds, now) && mentorOf(s, seeds, now) && <span className="block">{t.mentorBy(mentorOf(s, seeds, now)!.name)}</span>}
                  {my && s.id !== my.id && links(seeds).some((l) => now >= l.since && ((l.a.id === my.id && l.b.id === s.id) || (l.b.id === my.id && l.a.id === s.id))) && <span className="block">{marketHours(now) ? t.market.open : t.market.next(s.name)}</span>}
                </span>
              </button>
              {owner && my && s.id !== my.id && <Button size="sm" variant="secondary" className="ml-2 mb-1" onClick={() => { setPostText(""); setPostTo(s); }}>{t.post.send}</Button>}
            </li>
          ))}
        </ul>
      )}
      {tab === "towns" && my && owner && (
        <div className="mt-2 border-t border-border pt-2 text-xs">
          <div className="font-display text-sm text-foreground">{t.post.book}</div>
          {(() => { const now2 = clock(); const got = seeds.flatMap((o) => (o.letters ?? []).filter((g) => g.to === my.id && letterArrives(o, my, g.at) <= now2).map((g) => ({ ...g, o }))).sort((a, b) => b.at - a.at).slice(0, 20);
            return got.length === 0 ? <div className="text-muted-foreground">{t.post.empty}</div> : (
              <ul className="max-h-48 space-y-1 overflow-auto">{got.map((g) => (
                <li key={g.id}><span className="italic text-foreground">„{bodies[g.id] ?? "…"}“</span> <span className="text-muted-foreground">{t.post.from(g.o.name)}</span></li>
              ))}</ul>); })()}
        </div>
      )}
    </div>
  );

  const dueKey = decision.due.join(",");
  useEffect(() => {
    // close a popup whose decision is no longer due (e.g. answered on another device)
    if (roadOpen && !decision.due.includes("road")) setRoadOpen(false);
    if (charterOpen && !decision.due.includes("charter")) setCharterOpen(false);
    if (encOpen && !decision.due.includes("encounter")) setEncOpen(false);
    if (pactOpen && !decision.due.includes("pact")) setPactOpen(false);
  }, [dueKey]);
  useEffect(() => {
    if (anyOpen || !decision.open) return;
    const k = decision.open;
    // let all village records arrive before asking, so nothing pops up that is already settled
    const id = setTimeout(() => {
      if (k === "road") openRoad();
      else if (k === "charter") { setCharterPick(null); setCharterOpen(true); }
      else if (k === "pact") { setPactPick(null); setPactOpen(true); }
      else setEncOpen(true);
    }, 2500);
    return () => clearTimeout(id);
  }, [decision.open, anyOpen]);

  return (
    <div className={`relative h-screen w-full overflow-hidden bg-background supports-[height:100dvh]:h-[100dvh] ${walk ? "[&>*:not(canvas):not([data-walk])]:hidden" : ""}`}>
      {walk && (
        <div data-walk className="pointer-events-none absolute inset-x-0 bottom-3 z-40 flex flex-col items-center gap-2 pb-[env(safe-area-inset-bottom)]">
          <span className="rounded bg-background/70 px-2 py-0.5 text-[11px] text-foreground/80">{t.hud.walkHint}</span>
          <WoodButton label={t.hud.walkExit} onClick={() => setWalk(false)} className="pointer-events-auto h-11 gap-1.5 px-4">
            <X className="h-4 w-4" /><span className="text-xs">{t.hud.walkExit}</span>
          </WoodButton>
        </div>
      )}
      <LoadingScreen title="Samenland" lines={t.loading} onDone={openGuide} />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full cursor-grab touch-none"
        onPointerDown={(e) => {
          touches.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
          (e.target as Element).setPointerCapture(e.pointerId);
          if (touches.current.size >= 2) { pinch.current = null; if (drag.current) drag.current.moved = true; return; }
          fling.current = { vx: 0, vy: 0, t: performance.now() };
          drag.current = { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, moved: false, t0: performance.now(), touch: e.pointerType !== "mouse" };
          { const g = st.current.ghost; if (st.current.placing && g && e.pointerType !== "mouse") { const [tx, ty] = tileAt(e); if (Math.abs(tx - g[0]) <= 1 && Math.abs(ty - g[1]) <= 1) drag.current.ghost = true; } }
        }}
        onPointerMove={(e) => {
          const tp = touches.current;
          if (tp.has(e.pointerId)) tp.set(e.pointerId, { x: e.clientX, y: e.clientY });
          if (tp.size >= 2) {
            // two-finger pinch: zoom around the midpoint and pan with it
            const [a, b] = [...tp.values()];
            const dist = Math.hypot(a!.x - b!.x, a!.y - b!.y), mx = (a!.x + b!.x) / 2, my = (a!.y + b!.y) / 2;
            const r = canvasRef.current!.getBoundingClientRect(), c = cam.current;
            const p = pinch.current;
            if (p && p.dist > 0) {
              const nz = Math.min(st.current.walk ? 20 : 12, Math.max(MIN_ZOOM, c.zoom * (dist / p.dist)));
              const ox = p.mx - r.left - r.width / 2, oy = p.my - r.top - r.height / 2;
              const wx = ox / c.zoom + c.x, wy = oy / c.zoom + c.y;
              const nx = mx - r.left - r.width / 2, ny = my - r.top - r.height / 2;
              c.zoom = nz; c.x = wx - nx / nz; c.y = wy - ny / nz;
              target.current = { zoom: nz, ax: 0, ay: 0 };
            }
            pinch.current = { dist, mx, my };
            if (drag.current) drag.current.moved = true;
            return;
          }
          const d = drag.current;
          if (d && e.buttons) {
            const dx = e.clientX - d.x,
              dy = e.clientY - d.y;
            const lim = d.touch ? 10 : 3;
            if (!d.moved && Math.abs(e.clientX - (d.sx ?? d.x)) + Math.abs(e.clientY - (d.sy ?? d.y)) > lim) d.moved = true;
            if (d.moved && d.ghost) {
              const nt = tileAt(e), g = st.current.ghost;
              if (!g || g[0] !== nt[0] || g[1] !== nt[1]) { st.current.ghost = nt; setGhost(nt); }
              d.x = e.clientX; d.y = e.clientY;
            } else if (d.moved) {
              cam.current.x -= dx / cam.current.zoom;
              cam.current.y -= dy / cam.current.zoom;
              const nowT = performance.now(), f = fling.current, el = Math.max(1, nowT - f.t);
              const a = Math.min(1, el / 50); // smoothed release velocity over the last ~80 ms
              f.vx = f.vx * (1 - a) + (dx / el) * a; f.vy = f.vy * (1 - a) + (dy / el) * a; f.t = nowT;
              d.x = e.clientX;
              d.y = e.clientY;
            }
          }
          if (!drag.current?.moved) {
            const nt = tileAt(e), ph = st.current.hover;
            if (!ph || ph[0] !== nt[0] || ph[1] !== nt[1]) { st.current.hover = nt; if (e.pointerType === "mouse" || mode === "seed" || placing) setHover(nt); }
          }
          if (mode === "seed" || placing) {
            ptrRef.current = [e.clientX, e.clientY];
            if (tipRef.current) { tipRef.current.style.left = `${e.clientX + 18}px`; tipRef.current.style.top = `${e.clientY + 18}px`; }
            if (!ptr) setPtr(ptrRef.current);
          }
          const hp = mode === "look" && !placing && !drag.current?.moved ? personAt(e) : null;
          peopleFocus.hover = hp ? pkey(hp) : null;
          (e.target as HTMLElement).style.cursor = hp ? "pointer" : "";
        }}
        onPointerCancel={(e) => { touches.current.delete(e.pointerId); pinch.current = null; drag.current = null; }}
        onPointerUp={(e) => {
          touches.current.delete(e.pointerId);
          if (touches.current.size > 0) {
            // one finger left after a pinch: continue as a drag from there, no click
            pinch.current = null;
            const [rest] = [...touches.current.values()];
            drag.current = { x: rest!.x, y: rest!.y, moved: true, touch: true };
            fling.current = { vx: 0, vy: 0, t: performance.now() };
            return;
          }
          pinch.current = null;
          const d = drag.current;
          drag.current = null;
          const nowT = performance.now();
          if (d?.ghost) { fling.current = { vx: 0, vy: 0, t: nowT }; if (d.moved) return; }
          if (d?.moved && nowT - fling.current.t > 80) fling.current = { vx: 0, vy: 0, t: nowT }; // held still before release: no glide
          if (d && !d.moved && placing && placeTap(!!d.touch) === "move") { const g = tileAt(e); st.current.ghost = g; setGhost(g); return; }
          if (d && !d.moved && d.touch && d.t0 != null && nowT - d.t0 > 350) { if (placing || mode !== "look") return; const p = personAt(e); if (p) { setPlace(null); return setWho(p); } const [lx, ly] = tileAt(e); const li = inspectAt(lx, ly, seeds, clock()); if (li) { setWho(null); setPlace(li); } return; } // long press opens what lies under the finger
          if (d && !d.moved && d.touch && !placing && mode === "look") {
            const lt = lastTap.current;
            if (nowT - lt.t < 300 && Math.hypot(e.clientX - lt.x, e.clientY - lt.y) < 30) {
              lastTap.current = { t: 0, x: 0, y: 0 };
              const r = canvasRef.current!.getBoundingClientRect();
              target.current = { zoom: Math.min(st.current.walk ? 20 : 12, target.current.zoom * 1.6), ax: (e.clientX - r.left) * dpr.current, ay: (e.clientY - r.top) * dpr.current };
              return;
            }
            lastTap.current = { t: nowT, x: e.clientX, y: e.clientY };
          }
          if (d && !d.moved) {
            if (placing) { const [px, py] = tileAt(e); return buy(placing, px, py); }
            if (walk) {
              // stroll mode: a tap sends the mayor there, nothing else opens
              const [tx, ty] = tileAt(e), my = seeds.find((x) => x.id === mine);
              if (my) { const nw = clock(), tw = townOf(my, seeds, nw), me = tw.people.find((q) => q.role === "mayor"); if (me && commandMayor(me, tw, seeds, nw, [tx, ty])) tap((e.clientX / window.innerWidth) * 2 - 1); }
              return;
            }
            if (mode === "look") {
              const best = personAt(e);
              const pan = (e.clientX / window.innerWidth) * 2 - 1;
              if (best) { hm(pan); setPlace(null); return setWho(best); }
              { const r = canvasRef.current!.getBoundingClientRect(), c = cam.current;
                const wx = (e.clientX - r.left - r.width / 2) / c.zoom + c.x, wy = (e.clientY - r.top - r.height / 2) / c.zoom + c.y;
                const tr = lastTraders.find((f) => Math.hypot(f.x - wx, f.y - 3 - wy) < Math.max(4, 16 / c.zoom));
                if (tr) { tap(pan); setWho(null); setPlace(null); if (tr.stall) return setMsg(t.market.stall(tr.from, tr.good ? t.trade.goods[tr.good] ?? tr.good : "–", tr.to)); if (tr.walker) { const w = tr.walker; return setMsg(t.walker(w.kind, w.name, w.kind === "bridal" ? w.sex : t.job[w.craft]?.[w.sex === "f" ? 0 : 1] ?? w.craft, tr.from, tr.to)); } return setMsg(t.trade.trader(tr.cart, tr.good ? t.trade.goods[tr.good] ?? tr.good : "–", tr.from, tr.to)); } }
              const [tx, ty] = tileAt(e);
              { const g = twinGateAt(tx, ty, seeds, clock());
                if (g) { tap(pan); setWho(null); setPlace(null); const p = pactOf(g.a, g.b, seeds, clock());
                  return setMsg(`${t.twin.gate(g.a.name, g.b.name)}${p ? ` · ${t.twin.pacts[p.kind]![0]}` : ""}${marketDay(g, clock()) ? ` · ${t.twin.market}` : ""}`); } }
              const sm = signpostMap(seeds);
              for (const [dx, dy] of [[0, 0], [1, 1], [1, 0], [0, 1], [-1, 0], [0, -1]] as const) {
                const sp = sm.get((ty + dy) * MAP + tx + dx);
                if (sp) { tap(pan); setWho(null); setPlace(null); return setMsg(`${t.signFrom(seeds.find((x) => x.id === sp.seed_id)?.name ?? "?")}: „${sp.message}“`); }
              }
              // a click on a pasture means the flock, never a house whose roof rises over it
              { const here = structureAt(tx, ty, seeds, clock());
                if (here?.kind === "pasture" && here.build === undefined) { baa(pan); setWho(null); setPlace(null); return; } }
              // send your mayor to a walkable tile of your own village; when he is selected this wins over nearby roofs
              const sendMayor = () => { const my = seeds.find((x) => x.id === mine); if (!my) return false;
                const nw = clock(), tw = townOf(my, seeds, nw), me = tw.people.find((q) => q.role === "mayor");
                if (!me || tx < tw.x0 || tx > tw.x1 || ty < tw.y0 || ty > tw.y1 || !commandMayor(me, tw, seeds, nw, [tx, ty])) return false;
                tap(pan); setWho(null); setPlace(null); return true; };
              if (who?.role === "mayor" && who.seed.id === mine && sendMayor()) return;
              const ins = inspectAt(tx, ty, seeds, clock());
              if (ins) { if (ins.kind === "pasture") baa(pan); else tap(pan); setWho(null); return setPlace(ins); }
              const hadCard = !!who || !!place;
              setPlace(null); setWho(null);
              if (!hadCard && sendMayor()) return;
            }
            const [x, y] = tileAt(e);
            onClick(x, y);
          }
        }}
        onPointerLeave={() => setHover(null)}
      />
      {/* top bar */}
      <div ref={barRef} className="pointer-events-none absolute inset-x-2 top-2 z-30 md:inset-x-3 md:top-3">
        <Panel inner="flex items-center gap-3 px-3 py-1.5 md:gap-5">
          <div className="min-w-0 shrink">
            <div title={my ? t.character[characterOf(my.x, my.y)]![1] : undefined} className="-my-[0.34em] truncate py-[0.34em] pl-0.5 pr-3 font-display text-2xl leading-none text-wood">{my ? my.name : "Samenland"}</div>
            <div className="hidden truncate text-xs text-muted-foreground sm:block">
              {my && myStats ? `${CHAR_ICON[characterOf(my.x, my.y)]} ${t.character[characterOf(my.x, my.y)]![0]}${myCharter ? ` · ${PATH_ICON[myCharter]} ${t.charter.paths[myCharter]![0]}` : ""} · ${t.stages[stageOf(myStats.age)]} · ${myStats.buildings} ${t.buildings}` : t.taglineShort}
            </div>
          </div>
          {my && at ? (
            <>
              <div className="flex shrink-0 items-center gap-2 text-sm font-semibold tabular-nums">
                <span className="flex items-center gap-1.5" title={t.taler(Math.max(0, cash))}>
                  <span aria-hidden className="grid h-5 w-5 place-items-center rounded-full border border-wood bg-[radial-gradient(circle_at_35%_30%,var(--color-coin-shine),var(--color-brass)_55%,var(--color-coin-edge))] text-[10px] font-bold leading-none text-wood shadow-[inset_0_-1px_0_var(--color-coin-edge)]">T</span>
                  {t.taler(Math.max(0, cash))}
                </span>
                <span className="hidden text-xs font-normal text-primary sm:inline">{t.perDay(pop)}</span>
              </div>
              <div className="hidden text-sm sm:block">{t.people(residents)}</div>
              {larder && larder.flows.length > 0 && (
                <button type="button" title={t.goods.larder} onClick={() => setLarderOpen(true)} className="pointer-events-auto hidden items-center gap-2 rounded px-1 text-xs tabular-nums hover:bg-muted md:flex">
                  {[...larder.flows].sort((a, b) => b.stock - a.stock).slice(0, 4).map((f) => (
                    <span key={f.ware} className="flex items-center gap-0.5"><WareIcon ware={f.ware} />{f.stock}<span className={f.trend > 0 ? "text-primary" : "text-muted-foreground"}>{f.trend > 0 ? "▲" : f.trend < 0 ? "▼" : ""}</span></span>
                  ))}
                </button>
              )}
              <div className="hidden gap-3 lg:flex">
                {(["food", "health", "wealth"] as const).map((k) => (
                  <div key={k} className="w-20 text-xs" title={k === "food" && larder ? t.goods.food(larder.food, larder.eaters) : undefined}>
                    <div className="flex justify-between"><span>{t.attrs[k]}</span><span>{at[k]}</span></div>
                    <div className="h-1.5 rounded bg-muted"><div className="h-full rounded bg-primary" style={{ width: `${at[k]}%` }} /></div>
                  </div>
                ))}
                {my && weddingJoy(my, now) && <span className="self-center text-xs text-primary" title={t.fest.joy}>💍</span>}
              </div>
            </>
          ) : !userId ? (
            <Button size="sm" onClick={() => setAuthOpen(true)}><LogIn className="mr-1 h-4 w-4" />{t.signIn}</Button>
          ) : null}
          <div className="ml-auto hidden text-right text-xs text-muted-foreground md:block">
            <div>{new Date(now).toLocaleDateString(LOCALE[lang], { day: "numeric", month: "long" })}</div>
            <div>{t.seasons[season]} · {new Date(now).toLocaleTimeString(LOCALE[lang], { hour: "2-digit", minute: "2-digit", timeZone: REALM_TZ[realm] })}</div>
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-1 md:ml-0">
            <button type="button" aria-label={sound ? t.soundOff : t.soundOn} title={sound ? t.soundOff : t.soundOn} onClick={toggleSound} className="grid h-8 w-8 place-items-center rounded-md hover:bg-accent">
              {sound ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>
            <button type="button" aria-label={fs ? t.exitFullscreen : t.fullscreen} title={fs ? t.exitFullscreen : t.fullscreen} onClick={() => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.())} className="hidden h-8 w-8 place-items-center rounded-md hover:bg-accent md:grid">
              {fs ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
            <button type="button" aria-label={t.hud.settings} title={t.hud.settings} aria-expanded={settings} onClick={() => { if (!settings) { setWho(null); setPlace(null); } setSettings(!settings); }} className="grid h-8 w-8 place-items-center rounded-md hover:bg-accent">
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </Panel>
        {settings && <div className="fixed inset-0 -z-10" aria-hidden onClick={() => setSettings(false)} />}
        {settings && (
          <Panel className="absolute right-0 top-full mt-2 w-64" inner="space-y-2 p-3 text-sm">
            <div className="text-xs text-muted-foreground">{t.hud.language}</div>
            <div className="grid grid-cols-2 gap-1" role="radiogroup" aria-label={t.hud.language}>
              {LANGS.map((l) => (
                <button key={l} type="button" role="radio" aria-checked={lang === l} lang={l} dir={RTL[l] ? "rtl" : "ltr"} onClick={() => switchLang(l)}
                  className={`flex items-center gap-1.5 rounded-md border px-1.5 py-1 text-start ${lang === l ? "border-primary bg-accent text-foreground shadow-sm" : "border-transparent hover:bg-accent/50"}`}>
                  <span className={`grid h-5 min-w-6 place-items-center rounded px-1 text-[10px] font-bold ${lang === l ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{LANG_LABEL[l]}</span>
                  <span className="truncate text-xs">{LANG_NAME[l]}</span>
                </button>
              ))}
            </div>
            {isAdmin && (<>
              <div className="text-xs text-muted-foreground">{t.hud.realm}</div>
              <div className="grid grid-cols-2 gap-1">
                {[...REALMS, "lab" as Realm].map((r) => (
                  <button key={r} className={`rounded px-2 py-1 text-xs ${realm === r ? "bg-accent text-foreground" : "hover:bg-accent/50"}`} onClick={() => { if (r === realm) return; localStorage.setItem("samenland-realm", r); window.location.reload(); }}>{t.realms[r]}</button>
                ))}
              </div>
              {realm === "lab" && (<>
                <div className="text-xs text-muted-foreground">{t.lab.title(LAB_SPEED)}</div>
                <div className="grid grid-cols-3 gap-1">
                  {[0, 24, 168, 2160, 4380, 8760].map((h, i) => (
                    <button key={h} className={`rounded px-1 py-1 text-[10px] ${labJump() === h ? "bg-accent text-foreground" : "hover:bg-accent/50"}`} onClick={() => { localStorage.setItem("samenland-lab-jump", String(h)); setLabJump(h); tick((n) => n + 1); }}>{t.stages[i]}</button>
                  ))}
                </div>
                <div className="text-[10px] text-muted-foreground">{t.lab.note}</div>
              </>)}
            </>)}
            {userId && home && (
              <label className="flex cursor-pointer items-center gap-2 text-xs">
                <input type="checkbox" checked={mailOn} onChange={(e) => toggleMail(e.target.checked)} className="accent-primary" />
                ✉ {t.guide.notify.label}
              </label>
            )}
            {userId && home && <Button size="sm" variant="secondary" className="w-full" onClick={() => { setInviteOpen(true); setSettings(false); }}>✉ {t.invite.button}</Button>}
            {userId && home && <button type="button" className="w-full rounded border border-destructive/40 px-2 py-1 text-xs text-destructive hover:bg-destructive/10" onClick={() => { setQuitOpen(true); setSettings(false); }}>{t.quit.button}</button>}
            {userId ? <Button size="sm" variant="secondary" className="w-full" onClick={() => { supabase.auth.signOut(); setSettings(false); }}>{t.signOut}</Button>
              : <Button size="sm" className="w-full" onClick={() => { setAuthOpen(true); setSettings(false); }}>{t.signIn}</Button>}
            <div className="flex flex-wrap justify-center gap-x-2 gap-y-1 border-t border-border/60 pt-2 text-[10px] uppercase tracking-wider text-muted-foreground">
              <a href="https://buymeacoffee.com/doener" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">☕ {t.imprint.coffee}</a>
              <a href="https://lovable.dev/invite/LN0I260" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">♥ {t.imprint.built}</a>
              <button type="button" onClick={() => setImprint(!imprint)} className="uppercase hover:text-foreground">{t.imprint.title}</button>
            </div>
            {imprint && (
              <div className="space-y-1.5 rounded border border-border/60 bg-background/40 p-2 text-[11px] leading-snug text-muted-foreground">
                <div className="text-foreground">Stephan Dörner<br />Bornholmer Str. 89<br />10439 Berlin</div>
                <div>{t.imprint.contact}: <a href="mailto:stephan.doerner@posteo.de" className="underline-offset-2 hover:underline">stephan.doerner@posteo.de</a></div>
                <p className="italic">{t.imprint.note}</p>
              </div>
            )}
          </Panel>
        )}
      </div>

      {/* build rail: left on desktop, bottom on phones */}
      <div className="pointer-events-none absolute inset-x-2 bottom-2 z-30 md:inset-x-auto md:bottom-auto md:left-3 md:top-[var(--bar-h,6rem)]" style={{ "--bar-h": `${barH + 8}px` } as import("react").CSSProperties}>
        <Panel inner="!bg-wood !border-0 flex gap-1 p-1 md:flex-col" className="max-md:mb-[env(safe-area-inset-bottom)]">
          {tabs.map(({ k, icon: I, label }) => (
            <WoodButton key={k} label={label} active={tab === k} onClick={() => pick(k)} className="h-11 flex-1 flex-col gap-0.5 md:h-14 md:w-14 md:flex-none">
              <I className="h-5 w-5" /><span className="text-[10px] leading-none">{label}</span>
            </WoodButton>
          ))}
          {owner && myTown && (
            <WoodButton label={t.roll.title} active={rollOpen} onClick={() => setRollOpen(true)} className="h-11 flex-1 flex-col gap-0.5 md:mt-2 md:h-14 md:w-14 md:flex-none">
              <ScrollText className="h-5 w-5" /><span className="text-[10px] leading-none">{t.roll.menu}</span>
            </WoodButton>
          )}
          <WoodButton label={t.tavern.menu} active={tavernOpen} onClick={() => setTavernOpen(true)} className="relative h-11 flex-1 flex-col gap-0.5 md:mt-2 md:h-14 md:w-14 md:flex-none">
            <Beer className="h-5 w-5" /><span className="text-[10px] leading-none">{t.tavern.menu}</span>
            {chatUnread > 0 && <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-destructive" />}
          </WoodButton>
          {my && (
            <WoodButton label={t.mayorFind} onClick={findMayor} className="h-11 flex-1 flex-col gap-0.5 md:mt-2 md:h-14 md:w-14 md:flex-none">
              <Crown className="h-5 w-5" /><span className="text-[10px] leading-none">{t.roll.role["mayor"]![1]}</span>
            </WoodButton>
          )}
          <WoodButton label={t.guide.menu} active={guideOpen} onClick={() => setGuideOpen(true)} className="h-11 flex-1 flex-col gap-0.5 md:mt-2 md:h-14 md:w-14 md:flex-none">
            <BookOpen className="h-5 w-5" /><span className="text-[10px] leading-none">{t.guide.menu}</span>
          </WoodButton>
        </Panel>
      </div>
      {tab && (
        <div className="pointer-events-none absolute inset-x-2 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-30 md:inset-x-auto md:bottom-auto md:left-24 md:top-24 md:w-72">
          <Panel className="max-h-[min(72dvh,calc(100dvh-11rem))] overflow-y-auto overscroll-contain">{drawer}</Panel>
        </div>
      )}

      {/* minimap + zoom */}
      <div className="pointer-events-none absolute bottom-3 right-3 z-20 hidden md:block">
        <Panel inner="p-1.5">
          <Minimap seeds={seeds} mine={mine} view={view} onJump={(x, y) => focus(x, y)} />
          <div className="mt-1.5 flex gap-1">
            <Button size="sm" variant="secondary" className="h-7 flex-1 px-0" aria-label={t.hud.zoomOut} onClick={() => zoomBy(1 / 1.6)}><Minus className="h-4 w-4" /></Button>
            <Button size="sm" variant="secondary" className="h-7 flex-1 px-0" aria-label={t.hud.zoomIn} onClick={() => zoomBy(1.6)}><Plus className="h-4 w-4" /></Button>
            {my && <Button size="sm" variant="secondary" className="h-7 flex-1 px-0" aria-label={t.toMine} title={t.toMine} onClick={() => focus(my.x, my.y)}><Home className="h-4 w-4" /></Button>}
            {my && <Button size="sm" variant="secondary" className="h-7 flex-1 px-0" aria-label={t.mayorFind} title={t.mayorFind} onClick={findMayor}><Crown className="h-4 w-4" /></Button>}
          </div>
        </Panel>
      </div>

      {plantAsk && (() => {
        const [px, py] = plantAsk;
        const c = characterOf(px, py);
        let near: Seed | null = null, nd = Infinity;
        for (const s of seeds) { const d = Math.hypot(px - s.x, py - s.y); if (d < nd) { nd = d; near = s; } }
        return (
          <Parchment image={ART["surveyor"]} title={t.plantAsk.title} later={t.cancel} onLater={() => setPlantAsk(null)}>
            <p className="mt-2 text-center font-display text-xl leading-snug">{t.plantAsk.intro(form.name.trim())}</p>
            <div className="mt-4 space-y-1 text-sm">
              <div className="flex items-baseline justify-between gap-3"><span className="text-muted-foreground">{t.plantAsk.land}</span><span className="text-right font-semibold">{CHAR_ICON[c]} {t.character[c]![0]}</span></div>
              <div className="flex items-baseline justify-between gap-3"><span className="text-muted-foreground">{t.plantAsk.owner}</span><span className="text-right font-semibold">{form.owner.trim()}</span></div>
              <div className="flex items-baseline justify-between gap-3"><span className="text-muted-foreground">{t.plantAsk.spread}</span><span className="text-right">{t.plantAsk.first(Math.round(radiusOf(8760)))}</span></div>
              <div className="flex items-baseline justify-between gap-3"><span className="text-muted-foreground">{t.plantAsk.nearest}</span><span className="text-right">{near ? t.plantAsk.near(near.name, Math.round(nd)) : t.plantAsk.none}</span></div>
            </div>
            <p className="mt-3 text-center text-xs text-muted-foreground">{t.character[c]![1]}</p>
            <div className="mt-4 flex justify-center">
              <Button type="button" size="sm" disabled={planting} onClick={plantNow}>{planting ? t.plantAsk.wait : t.plantAsk.ok}</Button>
            </div>
          </Parchment>
        );
      })()}
      {larderOpen && larder && (
        <Parchment title={t.goods.larder} later={t.close} onLater={() => setLarderOpen(false)}>
          <p className="mb-2 text-sm">{t.goods.larderIntro}</p>
          <table className="w-full text-sm tabular-nums">
            <thead><tr className="text-xs text-muted-foreground"><th /><th className="text-right">{t.goods.stock}</th><th className="text-right">{t.goods.made}</th><th className="text-right">{t.goods.used}</th></tr></thead>
            <tbody>
              {larder.flows.map((f) => (
                <tr key={f.ware}>
                  <td className="flex items-center gap-1.5 py-0.5"><WareIcon ware={f.ware} size={26} />{wareName(f.ware, 2)}</td>
                  <td className="text-right font-semibold">{f.stock}</td><td className="text-right text-primary">+{f.made}</td><td className="text-right text-muted-foreground">−{f.used}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-xs text-muted-foreground">{t.goods.food(larder.food, larder.eaters)}</p>
          {larder.flows.every((f) => !f.stock) && <p className="mt-2 text-sm italic">{t.goods.young}</p>}
          <div className="mt-3 border-t border-border pt-2 text-sm">
            <p className="mb-1 font-semibold">{t.goods.boonsTitle}</p>
            <ul className="space-y-0.5">
              {(["fed", "varied", "surplus"] as const).map((k) => (
                <li key={k} className={boons?.[k] ? "text-primary" : "text-muted-foreground"}>{boons?.[k] ? "✓" : "○"} {t.goods.boons[k]}</li>
              ))}
              <li className={my && timberNear(my) ? "text-primary" : "text-muted-foreground"}>{my && timberNear(my) ? "✓" : "○"} {t.goods.timber}</li>
            </ul>
            {(() => {
              const today = new Date(clock()).toISOString().slice(0, 10);
              const done = !!my && claims.some((c) => c.seed_id === my.id && c.quest === `market:${today}`);
              return (
                <div className="mt-2">
                  <button type="button" disabled={done} onClick={() => holdMarket(!boons?.surplus)}
                    className="rounded border border-border bg-primary px-3 py-1 text-sm text-primary-foreground disabled:opacity-50">{boons?.surplus ? t.goods.market : t.goods.smallMarket}</button>
                  <p className="mt-1 text-xs text-muted-foreground">{done ? t.goods.marketDone : !boons?.surplus ? t.goods.marketNeed : ""}</p>
                </div>
              );
            })()}
          </div>
        </Parchment>
      )}
      {inviteOpen && home && (() => {
        const ok = Date.now() - Date.parse(home.created_at) >= 24 * 3600e3;
        const link = `https://samenland.app/?ref=${home.id}`;
        const n = claims.filter((c) => c.seed_id === home.id && c.quest.startsWith("ref:")).length;
        return (
          <Parchment image={ART["surveyor"]} title={t.invite.title} later={t.cancel} onLater={() => setInviteOpen(false)}>
            {ok ? (<>
              <p className="mt-2 text-center text-sm leading-snug">{t.invite.body}</p>
              <Input className="mt-3 text-xs" readOnly value={link} onFocus={(e) => e.currentTarget.select()} />
              <div className="mt-3 flex justify-center">
                <Button type="button" size="sm" onClick={async () => {
                  const text = `${t.invite.share} ${link}`;
                  try { if (navigator.share) await navigator.share({ text, url: link }); else await navigator.clipboard.writeText(text); setMsg(t.invite.copied); }
                  catch { try { await navigator.clipboard.writeText(text); setMsg(t.invite.copied); } catch { /* user cancelled */ } }
                }}>{t.invite.copy}</Button>
              </div>
              {n > 0 && <p className="mt-2 text-center text-xs text-muted-foreground">{t.invite.count(n)}</p>}
            </>) : <p className="mt-2 text-center text-sm">{t.invite.locked}</p>}
          </Parchment>
        );
      })()}
      {quitOpen && home && (
        <Parchment image={ART["surveyor"]} title={t.quit.title(home.name)} later={t.cancel} onLater={() => { setQuitOpen(false); setQuitName(""); }}>
          <p className="mt-2 text-center text-sm leading-snug">{t.quit.warn}</p>
          <p className="mt-3 text-center text-xs text-muted-foreground">{t.quit.type(home.name)}</p>
          <Input className="mt-2" value={quitName} onChange={(e) => setQuitName(e.target.value)} placeholder={home.name} />
          <div className="mt-4 flex justify-center">
            <Button type="button" size="sm" variant="destructive" disabled={quitting || quitName.trim() !== home.name} onClick={async () => {
              setQuitting(true);
              const { error } = await supabase.rpc("abandon_village", { _seed: home.id });
              setQuitting(false);
              if (error) { toast.error(t.quit.fail); return; }
              const id = home.id;
              setSeeds((s) => s.filter((x) => x.id !== id));
              setHome(null); setQuitOpen(false); setQuitName("");
              toast.success(t.quit.done);
            }}>{quitting ? t.plantAsk.wait : t.quit.ok}</Button>
          </div>
        </Parchment>
      )}
      {encOpen && my && (() => {
        const ev = pendingEncounter(my, my.decisions ?? [], clock());
        const fxText = (e: string, c: string) => {
          const ch = choiceOf(e, c)!; const f = ch.fx as { h?: number; growth?: number; food?: number; health?: number; wealth?: number };
          const parts = [f.growth ? t.enc.growth(Math.round(f.growth * 100)) : "", f.food ? `+${f.food} ${t.enc.food}` : "", f.health ? `+${f.health} ${t.enc.health}` : "", f.wealth ? `+${f.wealth} ${t.enc.wealth}` : ""].filter(Boolean);
          return parts.length && f.h ? `${parts.join(" · ")} · ${t.enc.lasts(f.h)}` : parts.join(" · ");
        };
        const created = Date.parse(my.created_at);
        return (
          <Parchment image={ev ? ART[ev] : undefined} title={ev ? t.enc.events[ev]![0] : t.enc.title} later={t.enc.later} onLater={() => later("encounter")}>
                {!ev ? <p className="mt-2 text-sm text-muted-foreground">{t.enc.decided}</p> : (
                  <>
                    <p className="mt-2 text-center font-display text-xl leading-snug">{t.enc.events[ev]![1]}</p>
                    <div className="mt-4 grid gap-2">
                      {Object.keys(ENCOUNTERS[ev]).map((c) => {
                        const cost = choiceOf(ev, c)!.cost, poor = cost > cash, fx = fxText(ev, c);
                        return (
                          <button key={c} type="button" disabled={poor} onClick={() => decide(ev, c)} className="rounded-md border-2 border-border p-2 text-left hover:border-brass hover:bg-brass/20 disabled:opacity-50">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold text-wood">{t.enc.choices[`${ev}:${c}`]}</span>
                              <span className="text-xs font-semibold tabular-nums">{cost > 0 ? t.taler(cost) : cost < 0 ? t.enc.gain(-cost) : t.enc.free}</span>
                            </div>
                            {(fx || poor) && <div className="text-xs text-muted-foreground">{poor ? t.enc.poor : fx}</div>}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
                <h3 className="mt-5 font-display text-2xl text-wood">{t.enc.chronicle}</h3>
                {(my.decisions ?? []).length === 0 ? <p className="text-xs text-muted-foreground">{t.enc.none}</p> : (
                  <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                    {[...(my.decisions ?? [])].reverse().slice(0, 8).map((d) => (
                      <li key={d.at}>{t.enc.dayN(Math.floor((d.at - created) / 86400000) + 1)}: {t.enc.events[d.event]?.[0]} – {t.enc.choices[`${d.event}:${d.choice}`]}</li>
                    ))}
                  </ul>
                )}
          </Parchment>
        );
      })()}
      {roadOpen && my && (
        <Parchment image={ART["road"]} title={t.road.title} later={t.enc.later} onLater={() => later("road")}>
              <p className="mt-2 text-sm text-center">{t.road.intro}</p>
              {roadCandidates(my, seeds).length === 0 ? <p className="mt-4 text-sm font-semibold">{t.road.none}</p> : (
                <>
                  <div className="mt-4 grid gap-2">
                    {roadCandidates(my, seeds).map((o) => {
                      const c = characterOf(o.x, o.y), ch = charters.find((x) => x.seed_id === o.id)?.path;
                      return (
                        <div key={o.id} onClick={() => setRoadPick(o.id)} className={`flex cursor-pointer items-center gap-2 rounded-md border-2 p-2 ${roadPick === o.id ? "border-brass bg-brass/20" : "border-border"}`}>
                          <button type="button" aria-pressed={roadPick === o.id} onClick={() => setRoadPick(o.id)} className="flex-1 py-1 text-left">
                            <div className="font-semibold text-wood">{o.name}</div>
                            <div className="text-xs text-muted-foreground">{t.road.dist(Math.round(Math.hypot(o.x - my.x, o.y - my.y)))} · ⏳ {roadHours(my, o)} h · {CHAR_ICON[c]} {t.character[c]![0]}{ch ? ` · ${PATH_ICON[ch]} ${t.charter.paths[ch]![0]}` : ""}</div>
                          </button>
                          <Button size="sm" variant="secondary" onClick={() => { focus(o.x, o.y); later("road"); }}>{t.road.look}</Button>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <span className="text-xs text-muted-foreground">{t.road.final}</span>
                    <Button disabled={!roadPick || !!roadBuilding(my, now, seeds)} onClick={sealRoad}>{t.road.seal}</Button>
                  </div>
                </>
              )}
        </Parchment>
      )}

      {pactOpen && my && pactPartner && (() => {
        const theirs = (pactPartner.votes ?? []).filter((v) => v.partner === my.id).sort((a, b) => b.at - a.at)[0];
        return (
          <Parchment image={ART["charter"]} title={t.twin.title(my.name, pactPartner.name)} later={t.enc.later} onLater={() => later("pact")}>
            <p className="mt-2 text-sm text-center">{t.twin.intro}</p>
            {theirs && <p className="mt-2 text-center text-sm font-semibold">{t.twin.partnerChose(t.twin.pacts[theirs.pact]![0])}</p>}
            <div className="mt-4 grid gap-2">
              {PACTS.map((p) => (
                <button key={p} type="button" aria-pressed={pactPick === p} onClick={() => setPactPick(p)}
                  className={`rounded-md border-2 p-2 text-left ${pactPick === p ? "border-brass bg-brass/20" : "border-border hover:border-brass/60"}`}>
                  <div className="font-semibold text-wood">{t.twin.pacts[p]![0]}</div>
                  <div className="text-xs text-muted-foreground">{t.twin.pacts[p]![1]}</div>
                </button>
              ))}
            </div>
            <div className="mt-4 flex justify-end"><Button disabled={!pactPick} onClick={sealPact}>{t.twin.seal}</Button></div>
          </Parchment>
        );
      })()}
      {charterOpen && my && (
        <Parchment wide image={ART["charter"]} title={`${t.charter.title} · ${my.name}`} later={t.enc.later} onLater={() => later("charter")}>
              <p className="mt-2 text-sm text-center">{t.charter.intro}</p>
              {!charterReady(my.created_at, now) ? (
                <p className="mt-4 text-sm font-semibold">{t.charter.locked}</p>
              ) : (
                <>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {CHARTER_PATHS.map((p) => {
                      const [name, style, bonus, builds] = t.charter.paths[p]!;
                      const fit = charterFits(characterOf(my.x, my.y), p);
                      return (
                        <button key={p} type="button" onClick={() => setCharterPick(p)} aria-pressed={charterPick === p}
                          className={`rounded-md border-2 p-3 text-left transition ${charterPick === p ? "border-brass bg-brass/20" : "border-border hover:border-brass/60"}`}>
                          <div className="font-display text-2xl leading-none text-wood">{PATH_ICON[p]} {name}</div>
                          <div className="mt-1 text-xs text-muted-foreground">{style}</div>
                          <div className="mt-2 text-xs"><b>+</b> {bonus}</div>
                          <div className="mt-1 text-xs"><b>{t.charter.buildings}:</b> {builds}</div>
                          {fit && <div className="mt-2 inline-block rounded-full bg-brass/30 px-2 py-0.5 text-[11px] font-semibold text-wood">✦ {t.charter.fits}</div>}
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <span className="text-xs text-muted-foreground">{t.charter.final}</span>
                    <Button disabled={!charterPick} onClick={sealCharter}>{t.charter.sealBtn}</Button>
                  </div>
                </>
              )}
        </Parchment>
      )}

      {rollOpen && my && myTown && (
        <VillageRoll t={t} town={myTown} hue={my.hue} onClose={() => setRollOpen(false)} onPick={(p) => {
          const now = clock();
          const z = poseOf(p, townOf(p.seed, seeds, now), seeds, now);
          setRollOpen(false);
          focus(z.visible ? z.x : p.home[0], z.visible ? z.y : p.home[1]);
          cam.current.zoom = Math.max(cam.current.zoom, 2);
          setWho(p);
          setMsg(z.visible ? null : `${p.first} ${z.act === "sleep" || z.act === "home" || z.act === "sick" ? t.roll.home : t.roll.inside}`);
        }} />
      )}
      <Tavern t={t} open={tavernOpen} onClose={() => setTavernOpen(false)} userId={userId} my={my} seeds={seeds} realm={realm} lang={lang} onUnread={setChatUnread} />
      {waitDone && !waitShut && !anyOpen && !decision.open && (
        <div className="pointer-events-none absolute inset-x-2 z-20 flex justify-center" style={{ top: barH + 56 }}>
          <Panel className="w-full max-w-md" inner="relative p-3 text-center">
            <button type="button" aria-label={t.hud.close} onClick={shutWait} className="pointer-events-auto absolute right-0 top-0 p-2.5 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>

            <p className="px-4 font-display text-lg leading-snug text-wood">🔨 {t.guide.wait.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t.guide.wait.body(Math.max(1, Math.ceil((waitDone - now) / 3.6e6)))}</p>
            {mailOn ? <p className="mt-2 text-xs text-primary">{t.guide.notify.on}</p>
              : <Button size="sm" variant="secondary" className="pointer-events-auto mt-2" onClick={() => toggleMail(true)}>✉ {t.guide.notify.label}</Button>}
          </Panel>
        </div>
      )}
      {welcome && !my && !guideOpen && (
        <div className="pointer-events-none absolute inset-x-2 top-20 z-30 flex justify-center md:top-24">
          <Panel className="w-full max-w-md" inner="relative p-3 text-center">
            <button type="button" aria-label={t.hud.close} onClick={() => setWelcome(false)} className="pointer-events-auto absolute right-0 top-0 p-2.5 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            <p className="px-4 font-display text-lg leading-snug text-wood">{t.guide.welcome.pitch}</p>
            <div className="mt-2 flex justify-center gap-2">
              <Button size="sm" onClick={() => { setWelcome(false); if (userId) setTab("plant"); else setAuthOpen(true); }}><Sprout className="mr-1 h-4 w-4" />{t.guide.welcome.plant}</Button>
              <Button size="sm" variant="secondary" onClick={() => { setWelcome(false); setGuideOpen(true); }}>{t.guide.welcome.more}</Button>
            </div>
          </Panel>
        </div>
      )}
      {guideOpen && (
        <Parchment wide image={ART["guide"]} title={t.guide.title} later={t.guide.close} onLater={() => setGuideOpen(false)}>
          <p className="text-center text-sm italic">{t.guide.intro}</p>
          <ul className="mt-3 space-y-2 text-sm">
            {t.guide.steps.map(([h, d]) => (
              <li key={h}><b className="font-display text-lg text-ink">{h}</b> – {d}</li>
            ))}
          </ul>
        </Parchment>
      )}

      {owner && quest && !settings && !chronOpen && (
        <div className={`absolute right-16 z-30 max-w-[calc(100vw-5rem)] md:w-64 ${questFold ? "w-44" : "w-60"}`} style={{ top: barH + 8 }}>
          <div className="parchment px-3 py-2 text-sm text-ink shadow">
            <button type="button" onClick={() => setQuestFold((f) => !f)} className="flex w-full items-center justify-between gap-2 text-left">
              <span className="font-display text-lg leading-none">{t.quests.card}</span>
              <span className="text-[10px] opacity-70">{t.quests.step(quest.index + 1, QUESTS.length)}</span>
            </button>
            {!questFold && (
              <div className="mt-1 space-y-1">
                <div className="font-semibold">{t.quests.list[quest.quest]![0]}</div>
                <div className="text-xs opacity-80">{t.quests.list[quest.quest]![1]}</div>
                <div className="h-1.5 overflow-hidden rounded bg-ink/15"><div className="h-full bg-brass" style={{ width: `${(100 * quest.have) / quest.need}%` }} /></div>
                <div className="flex items-center justify-between text-xs"><span>{quest.have}/{quest.need}</span><span>{t.quests.reward(quest.reward)}</span></div>
                {quest.ready
                  ? <Button size="sm" className="h-7 w-full" onClick={() => setQuestOpen(true)}>{t.quests.claim}</Button>
                  : <Button size="sm" variant="outline" className="h-7 w-full" onClick={questHow}>{t.quests.how}</Button>}
              </div>
            )}
          </div>
        </div>
      )}
      {owner && my && quest?.ready && questOpen && (
        <Parchment image={ART["quest"]} title={t.quests.doneTitle} later={t.quests.later} onLater={() => setQuestOpen(false)}>
          <p className="text-center font-semibold">{t.quests.list[quest.quest]![0]}</p>
          <p className="mt-2 text-center italic">{t.quests.says(my.owner)} „{t.quests.list[quest.quest]![2]}“</p>
          {quest.quest === "metro" && <p className="mt-1 text-center text-sm">{t.quests.end}</p>}
          <div className="mt-4 flex justify-center"><Button onClick={claimQuest}>{t.quests.claim} · {t.taler(quest.reward)}</Button></div>
        </Parchment>
      )}
      {chronBanner && !chronOpen && (
        <button type="button" onClick={openChron} className="parchment absolute left-1/2 z-30 -translate-x-1/2 px-4 py-1.5 font-display text-lg text-ink shadow-lg" style={{ top: barH + 8 }}>
          {t.chron.banner(Math.max(1, Math.floor(((chron?.to ?? 0) - (chron?.from ?? 0)) / 864e5)))}
        </button>
      )}
      {owner && !chronOpen && !chronBanner && (
        <button type="button" onClick={openChron} title={t.chron.open} aria-label={t.chron.open} className="absolute right-3 z-30 grid h-10 w-10 place-items-center rounded-full border-2 border-border bg-card/90 text-foreground shadow" style={{ top: barH + 8 }}>
          <BookOpen className="h-5 w-5" />
        </button>
      )}
      {!festNow && my && !anyOpen && !decision.open && !chronOpen && (() => {
        const g = thankable(my.id, gifts, now).find((x) => !seenGifts.includes(x.id));
        const tl = !g ? gifts.find((x) => x.kind === "thanks" && x.to_seed === my.id && now - Date.parse(x.created_at) < 7 * 864e5 && !seenGifts.includes(x.id)) : undefined;
        const e = g ?? tl; if (!e) return null;
        const from = seeds.find((s) => s.id === e.from_seed); if (!from) return null;
        if (giftSounded.current !== e.id) { giftSounded.current = e.id; const gk = g ? "gift" : "letter"; setTimeout(() => jingle(gk), 0); }
        const seen = () => { const n = [...seenGifts, e.id].slice(-50); setSeenGifts(n); localStorage.setItem("samenland-gifts-seen", JSON.stringify(n)); };
        return (
          <Parchment image={ART["fair"]} title={g ? t.gifts.gotTitle : t.gifts.letterTitle} later={t.fest.close} onLater={seen}>
            {g ? (<>
              <p className="text-center text-ink">{t.gifts.got(from.name, g.amount, g.kind === "aid")}</p>
              <div className="mt-4 grid gap-2">{t.gifts.notes.map((n, i) => <Button key={i} variant="secondary" onClick={() => { seen(); sendGift(from, "thanks", i); }}>{n}</Button>)}</div>
            </>) : (
              <p className="text-center font-['Caveat'] text-xl text-ink">„{t.gifts.notes[tl!.note] ?? t.gifts.notes[0]}“ — {from.name}</p>
            )}
          </Parchment>
        );
      })()}
      {festNow && my && (() => { const [h, body] = festText(festNow); const go = () => { const e = festNow; if ("x" in e) focus(e.x, e.y); else focus(my.x, my.y); setFest((q) => q.slice(1)); }; return (
        <Parchment image={festArt(festNow)} title={h} later={t.fest.close} onLater={() => setFest((q) => q.slice(1))}>
          <p className="text-center font-display text-xl leading-snug text-ink">{body}</p>
          <div className="mt-4 flex justify-center gap-2">
            {festNow.code === "letter" ? (() => { const fe = festNow; const o = seeds.find((x) => x.name === fe.other); return o && owner ? <Button onClick={() => { setFest((q) => q.slice(1)); setPostText(""); setPostTo(o); }}>{t.post.reply}</Button> : null; })() : <Button onClick={go}>{t.fest.go}</Button>}
          </div>
        </Parchment>
      ); })()}
      {postTo && my && (
        <Parchment title={t.post.title(postTo.name)} later={t.fest.close} onLater={() => setPostTo(null)}>
          <p className="text-center text-sm text-ink/70">{t.post.hint}</p>
          <textarea className="mt-3 w-full rounded border border-border bg-background/80 p-2 text-ink" rows={3} maxLength={140} value={postText} placeholder={t.post.place} onChange={(e) => setPostText(e.target.value)} />
          <div className="mt-1 text-right text-xs text-ink/60">{postText.length}/140</div>
          <div className="mt-3 flex justify-center"><Button disabled={!postText.trim()} onClick={sendLetter}>{t.post.go}</Button></div>
        </Parchment>
      )}
      {chronOpen && chron && my && (
        <Parchment title={t.chron.title} later={t.chron.close} onLater={() => setChronOpen(false)}>
          <p className="text-center text-sm text-ink/70">{t.chron.away(Math.max(1, Math.round((chron.to - chron.from) / 864e5)))}</p>
          <p className="mt-3 text-center font-display text-xl leading-snug text-ink">{scribe === undefined ? <span className="animate-pulse text-ink/60">{t.chron.writing}</span> : scribe ?? t.chron.greet}</p>
          <div className="mt-4 flex justify-center gap-4 font-display text-lg text-ink">
            <span>{t.chron.pop(chron.popFrom, chron.popTo)}</span><span>{t.chron.taler(chron.taler)}</span>
          </div>
          {chron.events.length === 0 ? <p className="mt-3 text-center text-sm text-ink/70">{t.chron.quiet}</p> : (
            <ul className="mt-3 space-y-1 border-l-2 border-ink/20 pl-3">
              {chron.events.slice(-14).map((e, i) => (
                <li key={i}>
                  <button type="button" className="text-left text-sm text-ink hover:underline" onClick={() => { if (e.code === "road") focus(e.x, e.y); else focus(my.x, my.y); setChronOpen(false); }}>
                    <span className="mr-2 text-ink/60">{new Date(e.at).toLocaleDateString(LOCALE[lang], { day: "numeric", month: "short" })}</span>{chronLine(e)}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Parchment>
      )}

      {sealShown && (
        <div className="absolute right-3 z-30" style={{ top: barH + 8 }}>
          <WaxSeal label={t.enc.waiting} onClick={reopen} />
        </div>
      )}

      {authOpen && !userId && (
        <div className="absolute inset-0 z-40 grid place-items-center bg-foreground/30 p-4" onClick={() => setAuthOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm">
            <Panel inner="p-4">
              <div className="relative">
                <h1 className="flex justify-center leading-none text-wood"><img src={logoUrl} alt="Samenland" width={371} height={360} className="h-28 w-auto" /></h1>
                <button type="button" aria-label={t.hud.close} onClick={() => setAuthOpen(false)} className="absolute right-0 top-0 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{t.tagline}</p>
              <form className="mt-3 space-y-2" onSubmit={(e) => { e.preventDefault(); emailAuth(); }}>
                <div className="flex gap-2">
                  <Button type="button" size="sm" variant="secondary" className="flex-1" onClick={() => oauth("google")}>{t.google}</Button>
                  <Button type="button" size="sm" variant="secondary" className="flex-1" onClick={() => oauth("apple")}>{t.apple}</Button>
                </div>
                <div className="text-center text-xs text-muted-foreground">{t.or}</div>
                <Input type="email" required placeholder={t.email} value={auth.email} onChange={(e) => setAuth({ ...auth, email: e.target.value })} />
                <Input type="password" required minLength={6} placeholder={t.password} value={auth.password} onChange={(e) => setAuth({ ...auth, password: e.target.value })} />
                <Button type="submit" size="sm" className="w-full">{auth.signup ? t.signUp : t.signIn}</Button>
                <button type="button" className="w-full text-xs text-muted-foreground underline" onClick={() => setAuth({ ...auth, signup: !auth.signup })}>{auth.signup ? t.haveAccount : t.noAccount}</button>
                {msg && <p className="text-xs text-destructive">{msg}</p>}
              </form>
            </Panel>
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute bottom-[calc(5rem+env(safe-area-inset-bottom))] left-2 right-2 z-20 flex flex-col items-end space-y-2 text-sm md:bottom-52 md:left-auto md:right-3 md:w-80">
        {placing && coarse && ghost && (() => {
          const own = seeds.find((s) => s.id === mine);
          const err = own ? canPlaceSpecial(placing, ghost[0], ghost[1], own, seeds, clock()) as keyof typeof t.place | null : "ground";
          const nudge = (dx: number, dy: number) => { const g: [number, number] = [ghost[0] + dx, ghost[1] + dy]; setGhost(g); focus(g[0], g[1]); };
          const price = MONUMENT_PRICE[placing] ?? ITEMS[placing as Item];
          return (
            <div className="pointer-events-auto w-full space-y-2 rounded-md border-2 border-wood bg-card p-2 text-foreground shadow-[var(--shadow-panel)]">
              <div className="flex items-center gap-2">
                {spriteUrl(SPECIAL_KIND[placing]!) && <img src={spriteUrl(SPECIAL_KIND[placing]!)} alt="" className="h-10 w-10 shrink-0 object-contain" />}
                <div className="min-w-0 flex-1 text-xs"><div className="truncate font-semibold">{t.items[placing]![0]}</div>
                  <div className={err ? "text-destructive" : "text-primary"}>{err ? `✕ ${(t.place[err] as string) ?? t.place.ground}` : `✓ ${t.place.drag}`}</div></div>
                <div className="grid shrink-0 grid-cols-3 gap-0.5">
                  <span /><Button size="icon" variant="secondary" className="h-9 w-9" aria-label="↑" onClick={() => nudge(-1, -1)}>↑</Button><span />
                  <Button size="icon" variant="secondary" className="h-9 w-9" aria-label="←" onClick={() => nudge(-1, 1)}>←</Button><span />
                  <Button size="icon" variant="secondary" className="h-9 w-9" aria-label="→" onClick={() => nudge(1, -1)}>→</Button>
                  <span /><Button size="icon" variant="secondary" className="h-9 w-9" aria-label="↓" onClick={() => nudge(1, 1)}>↓</Button><span />
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" className="h-11 flex-1" onClick={() => { setPlacing(null); setMsg(null); }}>{t.cancel}</Button>
                <Button className="h-11 flex-[2]" disabled={!!err || cash < price} onClick={() => buy(placing, ghost[0], ghost[1])}>{t.place.here} · {t.taler(price)}</Button>
              </div>
            </div>
          );
        })()}
        {placing && !(coarse && ghost) && (
          <div className="pointer-events-auto flex w-full max-w-xs items-center gap-2 rounded-md border-2 border-wood bg-card px-3 py-2 text-foreground shadow-[var(--shadow-panel)]">
            {spriteUrl(SPECIAL_KIND[placing]!) && <img src={spriteUrl(SPECIAL_KIND[placing]!)} alt="" className="h-10 w-10 object-contain" />}
            <div className="flex-1 text-xs"><div className="font-semibold">{t.items[placing]![0]} · {t.taler(MONUMENT_PRICE[placing] ?? ITEMS[placing as Item])}</div>{t.place.hint}</div>
            <Button size="sm" variant="secondary" onClick={() => { setPlacing(null); setMsg(null); }}>{t.cancel}</Button>
          </div>
        )}
        {placing && !coarse && hover && ptr && (() => {
          const own = seeds.find((s) => s.id === mine);
          if (!own) return null;
          const err = canPlaceSpecial(placing, hover[0], hover[1], own, seeds, clock()) as keyof typeof t.place | null;
          const txt = err ? (t.place[err] as string) ?? t.place.ground : t.place.hint;
          return (
            <div className="pointer-events-none fixed z-50 max-w-[16rem] rounded-md border-2 border-wood bg-card px-2 py-1 text-xs text-foreground shadow-[var(--shadow-panel)]" ref={tipRef} style={{ left: (ptrRef.current ?? ptr)[0] + 18, top: (ptrRef.current ?? ptr)[1] + 18 }}>
              <span className={err ? "text-destructive" : "text-primary"}>{err ? "✕ " : "✓ "}</span>{txt}
            </div>
          );
        })()}
        {mode === "seed" && hover && ptr && (() => {
          const err = canPlant(hover[0], hover[1], seeds);
          let txt = t.seedHint.ok(form.name.trim());
          if (err?.startsWith("near:")) {
            const o = seeds.find((s) => s.name === err.slice(5));
            const d = o ? Math.max(1, Math.ceil(MIN_SEED_DISTANCE - Math.hypot(hover[0] - o.x, hover[1] - o.y))) : 1;
            txt = t.seedHint.near(err.slice(5), d);
          } else if (err) txt = err === "hill" ? t.seedHint.hill : t.seedHint.water;
          return (
            <div className="pointer-events-none fixed z-50 rounded-md border-2 border-wood bg-card px-2 py-1 text-xs text-foreground shadow-[var(--shadow-panel)]" ref={tipRef} style={{ left: (ptrRef.current ?? ptr)[0] + 18, top: (ptrRef.current ?? ptr)[1] + 18 }}>
              <span className={err ? "text-destructive" : "text-primary"}>{err ? "✕ " : "✓ "}</span>{txt}
            </div>
          );
        })()}
        {msg && (
          <div className="rounded-md border-2 border-border bg-card px-3 py-2 shadow-[var(--shadow-panel)] border-wood text-foreground">
            {msg}
          </div>
        )}
        {who && (() => {
          const now = clock();
          const tw = townOf(who.seed, seeds, now);
          const q = poseOf(who, tw, seeds, now);
          const kin = kinOf(who, tw);
          const pick = (p: Person) => { const z = poseOf(p, tw, seeds, now); focus(z.x, z.y); setWho(p); };
          const kl = (p: Person) => <button key={p.id} type="button" className="underline-offset-2 hover:underline" onClick={() => pick(p)}>{p.first}{p.role === "child" ? ` (${p.age})` : ""}</button>;
          const row = (label: string, ps: Person[]) => ps.length ? <div><span className="text-muted-foreground">{label}: </span>{ps.map((p, i) => <span key={p.id}>{i ? ", " : ""}{kl(p)}</span>)}</div> : null;
          return (
            <div {...sheetSwipe(() => setWho(null))} className={SHEET}>
              <div aria-hidden className="mx-auto mb-1 h-1 w-10 rounded-full bg-muted-foreground/40 md:hidden" />
              <div className="flex items-start justify-between gap-3">
                <div className="font-['Caveat'] text-xl leading-tight">{who.first} {who.last}</div>
                <button type="button" aria-label={t.close} className="-m-2 p-2 text-lg leading-none text-muted-foreground hover:text-foreground" onClick={() => setWho(null)}>×</button>
              </div>
              <div className="text-sm">{t.personAge(who.age)} · {t.job[who.job]![who.sex === "f" ? 0 : 1]}</div>
              {(kin.spouse || kin.parents.length || kin.children.length || kin.siblings.length || who.maiden) && (
                <div className="mt-1 space-y-0.5 text-xs">
                  {kin.spouse && <div>{t.fest.kinSpouse("")}{kl(kin.spouse)}{who.wedAt ? <span className="text-muted-foreground"> · {t.fest.kinWed(new Date(who.wedAt).toLocaleDateString(LOCALE[lang], { day: "numeric", month: "short" }))}</span> : null}</div>}
                  {who.maiden && <div className="text-muted-foreground">{t.fest.kinMaiden(who.maiden)}</div>}
                  {row(t.fest.kinParents, kin.parents)}{row(t.fest.kinChildren, kin.children)}{row(t.fest.kinSiblings, kin.siblings)}
                </div>
              )}
              {(() => {
                const sickOne = who.carer != null ? tw.people.find((x) => x.id === who.carer) : null;
                const carer = who.sick ? tw.people.find((x) => x.carer === who.id) : null;
                const sw = seasonAt(now), season = (Object.keys(sw) as (keyof typeof sw)[]).reduce((a, b) => (sw[b] > sw[a] ? b : a));
                const hr = worldHour(now);
                const th = thoughtOf(who.id, { act: q.act, working: q.working || q.act === "work", sick: !!who.sick, caring: who.carer != null, sunday: isSunday(now), season, newlywed: !!who.wedAt && now - who.wedAt < 7 * 864e5, baby: tw.people.some((x) => x.hh === who.hh && x.age <= 1 && x.role === "child") && who.age >= 18, child: who.job === "child", night: hr < 5.5 || hr >= 22 }, now);
                return (
                  <div className="mt-1 space-y-0.5 text-xs">
                    <div><span className="text-muted-foreground">{t.person.traitsL}: </span>{traitsOf(who.id).map((k) => t.person.traits[k]).join(", ")}</div>
                    {carer && <div>{t.person.sickBy("")}{kl(carer)}</div>}
                    {sickOne && <div>{t.person.caresFor("")}{kl(sickOne)}</div>}
                    <div className="font-['Caveat'] text-base leading-tight">{t.person.thoughts[th]}</div>
                  </div>
                );
              })()}
              <div className="text-xs text-muted-foreground">{t.livesIn(who.seed.name)} – {q.carry && q.dest ? t.carrying(q.carry, q.dest) : t.act[q.walking && q.act !== "play" ? "walking" : q.act]}</div>
              {who.role === "mayor" && my && who.seed.id === my.id && (
                <Button type="button" size="sm" className="mt-2 w-full gap-1.5" onClick={startWalk}><Footprints className="h-4 w-4" />{t.hud.walk}</Button>
              )}
            </div>
          );
        })()}
        {place && (() => {
          const ins = inspectAt(place.x, place.y, seeds, clock()) ?? place;
          const name = t.kind[ins.kind] ?? ins.kind;
          const list = (ps: Person[]) => ps.length ? (
            <ul className="mt-0.5 space-y-0.5">
              {ps.slice(0, 6).map((p) => (
                <li key={p.id}>
                  <button type="button" className="text-left underline-offset-2 hover:underline" onClick={() => { setPlace(null); setWho(p); }}>
                    {p.first} {p.last} · {t.job[p.job]![p.sex === "f" ? 0 : 1]}
                  </button>
                </li>
              ))}
            </ul>
          ) : <div className="text-muted-foreground">{t.nobody}</div>;
          return (
            <div {...sheetSwipe(() => setPlace(null))} className={SHEET}>
              <div aria-hidden className="mx-auto mb-1 h-1 w-10 rounded-full bg-muted-foreground/40 md:hidden" />
              <div className="flex items-start justify-between gap-3">
                <div className="font-['Caveat'] text-xl leading-tight">{ins.build !== null ? t.site(name) : name}</div>
                <button type="button" aria-label={t.close} className="-m-2 p-2 text-lg leading-none text-muted-foreground hover:text-foreground" onClick={() => setPlace(null)}>×</button>
              </div>
              <div className="text-xs text-muted-foreground">{t.inTown(name, ins.seed.name)}</div>
              {ins.build !== null ? (
                <div className="mt-1 space-y-1 text-sm">
                  <div>{t.progress(Math.round(ins.build * 100))}</div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary" style={{ width: `${Math.round(ins.build * 100)}%` }} /></div>
                  <div className="text-xs text-muted-foreground">{t.needs}</div>
                  <div className="text-xs font-semibold">{t.builders}</div>
                  <div className="text-xs">{list(ins.workers)}</div>
                </div>
              ) : (
                <div className="mt-1 space-y-1 text-sm">
                  {t.purpose[ins.kind] && <div>{t.purpose[ins.kind]}</div>}
                  {ins.residents.length > 0 && <div className="text-xs"><div className="font-semibold">{t.residents}</div>{list(ins.residents)}</div>}
                  {ins.workers.length > 0 && <div className="text-xs"><div className="font-semibold">{t.workers}</div>{list(ins.workers)}</div>}
                  {(() => {
                    const l = larderOf(ins.seed, seeds, clock());
                    const held = storedAt(ins.kind, [ins.x, ins.y], l);
                    const ch = chainOf(ins.kind, [ins.x, ins.y], l, townOf(ins.seed, seeds, clock()).people);
                    return (<>
                      {held.length > 0 && <div className="text-xs"><div className="font-semibold">{t.goods.stored}</div>
                        <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-1">{held.map((h) => <span key={h.ware} className="flex items-center gap-1"><WareIcon ware={h.ware} />{h.n} {wareName(h.ware, h.n)}</span>)}</div></div>}
                      {ch && <div className="text-xs"><div className="font-semibold">{t.goods.chain}</div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1">{ch.map((c, i) => (
                          <span key={i} className="flex items-center gap-1">
                            {i > 0 && <span className="text-muted-foreground">→</span>}
                            <button type="button" disabled={!c.tile || c.here} title={c.tile ? undefined : t.goods.missing}
                              className={c.here ? "rounded bg-primary/15 px-1 font-semibold" : c.tile ? "rounded px-1 underline-offset-2 hover:underline" : "rounded px-1 text-muted-foreground line-through"}
                              onClick={() => { if (c.tile) { focus(c.tile[0], c.tile[1]); setPlace({ ...ins, x: c.tile[0], y: c.tile[1], kind: c.kind }); } }}>
                              {t.kind[c.kind] ?? c.kind}
                            </button>
                          </span>))}</div></div>}
                    </>);
                  })()}
                </div>
              )}
            </div>
          );
        })()}
        {hover && (
          <div className="hidden rounded bg-card/80 px-2 py-1 text-xs text-muted-foreground md:block">
            {t.terrain[terrain(hover[0], hover[1])]}{resourceAt(hover[0], hover[1]) ? ` · ${t.resource[resourceAt(hover[0], hover[1])!]}` : ""} · {hover[0]}, {hover[1]}
          </div>
        )}
      </div>
    </div>
  );
}
