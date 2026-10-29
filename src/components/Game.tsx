import { tileHits } from "@/game/disasters";
import { AID_TALER, GIFT_TALER, sentToday, thankable, type Gift, type GiftKind } from "@/game/gifts";
import { REALMS, REALM_TZ, detectRealm, setRealm, clock, worldHour, isSunday, isLab, labJump, setLabJump, LAB_SPEED, type Realm } from "@/game/time";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { draw, iso, toTile, MIN_ZOOM, lastPeople, lastTraders, lastSources, peopleFocus, prewarmOverview, setSignposts, signpostMap, type Camera } from "@/game/render";
const pkey = (p: { id: number; seed: { id: string } }) => `${p.seed.id}:${p.id}`;
import { townOf, poseOf, kinOf, type Person } from "@/game/people";
import { traitsOf, thoughtOf } from "@/game/traits";
import { weddingJoy, DOWRY } from "@/game/weddings";
import { inspectAt, type Inspect } from "@/game/inspect";
import { Maximize2, Minimize2, Volume2, VolumeX, Hammer, Bell, Signpost as SignIcon, Map as MapIcon, Sprout, Settings, Plus, Minus, Home, X, LogIn } from "lucide-react";
import { Panel, WoodButton } from "@/components/hud/Panel";
import { Parchment, WaxSeal } from "@/components/hud/Parchment";
import { ART, pickDecision } from "@/game/decisions";
import { ITEM_STAGE } from "@/game/disasters";
import type { DecisionKind } from "@/game/decision-order";
import { Minimap } from "@/components/hud/Minimap";
import { chronicle, FEST_GAP, CHRON_LETTER, CHRON_BANNER, type Chronicle, type ChronEvent } from "@/game/chronicle";
import { scribeGreeting } from "@/lib/chronicle.functions";
import { useServerFn } from "@tanstack/react-start";
import { BookOpen, ArrowLeft } from "lucide-react";
import { seasonAt } from "@/game/season";
import { setScene, setSound, unlock, baa, hm, tap, bell, disposeAudio } from "@/game/audio";
import {
  canPlant,
  MIN_SEED_DISTANCE,
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
  roadCandidates,
  type Seed,
  canPlaceSpecial,
  SPECIAL_KIND,
  characterOf,
  CHARTER_PATHS,
  charterReady,
  charterFits,
  type CharterPath,
  twinLinks, pactOf, pactPending, workOf, marketDay, festivalDate, twinGateAt, PACTS, TWIN_WORKS, PACT_WAIT, type PactKind, type WorkKind,
} from "@/game/world";
const PATH_ICON: Record<string, string> = { trade: "⚖️", craft: "🔨", culture: "📜", farm: "🌾" };
const CHAR_ICON: Record<string, string> = { plains: "🌾", mountain: "⚒", coast: "⚓", forest: "🌲" };
import { drawBuildingSprite, spriteUrl } from "@/game/building-sprites";
import { DICT, plantError, type Lang } from "@/game/i18n";
import { ITEMS, GUILD, canBuy, dailyTax, attributes, treasury, type Item, type Purchase } from "@/game/economy";
import { ENCOUNTERS, choiceOf, pendingEncounter, type Decision } from "@/game/encounters";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type Mode = "look" | "seed" | "tree" | "flower" | "lantern";

export function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rawSeeds, setSeeds] = useState<Seed[]>([]);
  const [blessings, setBlessings] = useState<{ id: string; seed_id: string; created_at: string }[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [gifts, setGifts] = useState<Gift[]>([]);
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
      const bl = by.get(s.id), bo = buys.get(s.id), ch = charters.find((c) => c.seed_id === s.id), fr = firstRoads.find((f) => f.seed_id === s.id), de = decs.get(s.id);
      if (!bl && !bo && !ch && !fr && !de) return s;
      return { ...s, ...(bl ? { blessed: bl.sort((a, b) => a - b) } : {}), ...(bo ? { bought: bo.sort((a, b) => a.at - b.at) } : {}), ...(ch ? { charter: { path: ch.path as CharterPath, at: Date.parse(ch.created_at) } } : {}), ...(fr ? { firstRoad: { target: fr.target_id, at: Date.parse(fr.created_at) } } : {}), ...(de ? { decisions: de.sort((a, b) => a.at - b.at) } : {}) };
    }).map((s) => {
      const sent = gifts.filter((g) => g.from_seed === s.id).map((g) => ({ id: g.id, to: g.to_seed, kind: g.kind as GiftKind, at: Date.parse(g.created_at) }));
      const aid = gifts.filter((g) => g.to_seed === s.id && g.kind === "aid").map((g) => Date.parse(g.created_at));
      return sent.length || aid.length ? { ...s, ...(sent.length ? { sent } : {}), ...(aid.length ? { aid } : {}) } : s;
    });
  }, [rawSeeds, blessings, purchases, charters, firstRoads, encounters, votes, works, gifts]);
  useEffect(() => { setSignposts(signs); }, [signs]);
  const [plantings, setPlantings] = useState<Planting[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  /** the player's own village, wherever it stands — one account plants exactly one seed */
  const [home, setHome] = useState<Seed | null>(null);
  const [lang, setLang] = useState<Lang>("de");
  const t = DICT[lang];
  useEffect(() => { document.title = t.docTitle; }, [t]);
  const mine = seeds.find((s) => userId && s.user_id === userId)?.id ?? null;
  const [auth, setAuth] = useState({ email: "", password: "", signup: false });
  const [mode, setMode] = useState<Mode>("look");
  const [placing, setPlacing] = useState<Item | null>(null);
  const [hover, setHover] = useState<[number, number] | null>(null);
  const [form, setForm] = useState({ name: "", owner: "" });
  const [msg, setMsg] = useState<string | null>(null);
  type Tab = "build" | "rituals" | "signs" | "towns" | "plant";
  const [tab, setTab] = useState<Tab | null>(null);
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
  const st = useRef({ seeds, plantings: new Map<string, Planting>(), hover, mode, mine, placing: null as Item | null });
  st.current.seeds = seeds;
  st.current.hover = hover;
  st.current.placing = placing;
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
    q.limit(1).then(({ data }) => {
      if (live && data?.[0]) setHome(data[0] as Seed);
    });
    return () => { live = false; };
  }, [userId, isAdmin, realm]);

  useEffect(() => {
    const saved = localStorage.getItem("samenland-lang");
    setLang(
      saved === "en" || saved === "de" ? saved : navigator.language.startsWith("de") ? "de" : "en",
    );
    const vi = setInterval(() => {
      const cv = canvasRef.current, c = cam.current; if (!cv) return;
      const [x, y] = toTile(c.x, c.y);
      setView({ x, y, span: (cv.clientWidth / c.zoom) / 32 + (cv.clientHeight / c.zoom) / 16 });
    }, 500);
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((ev, session) => {
      if (
        ev === "SIGNED_IN" ||
        ev === "SIGNED_OUT" ||
        ev === "USER_UPDATED" ||
        ev === "INITIAL_SESSION"
      )
        setUserId(session?.user.id ?? null);
    });
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
      setBlessings(bl.data ?? []);
      setPurchases(pu.data ?? []);
      setSigns((sg.data ?? []) as Signpost[]);
      const ss = (a.data ?? []) as Seed[];
      setSeeds(ss);
      setPlantings((b.data ?? []) as Planting[]);
      const my = ss.find((s) => uid && s.user_id === uid) ?? ss[0];
      if (my) focus(my.x, my.y);
      else focus(MAP / 2, MAP / 2);
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
    };
  }, []);

  // render loop + input
  useEffect(() => {
    const cv = canvasRef.current!;
    const ctx = cv.getContext("2d")!;
    let raf = 0;
    const resize = () => {
      dpr.current = window.devicePixelRatio || 1;
      cv.width = Math.ceil(cv.clientWidth * dpr.current);
      cv.height = Math.ceil(cv.clientHeight * dpr.current);
    };
    resize();
    window.addEventListener("resize", resize);
    let lastScene = 0;
    const loop = () => {
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
      if (s.placing && h && own) {
        // SimCity-style ghost: the building floats over the tile, tinted by whether it may stand there
        const good = canPlaceSpecial(s.placing, h[0], h[1], own, s.seeds, clock()) === null;
        const z = c.zoom * dpr.current, [gx, gy] = iso(h[0], h[1]);
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
        zoom: Math.min(12, Math.max(MIN_ZOOM, target.current.zoom * Math.exp(-dy * 0.0015))),
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
      if (!KEYMAP[k] || typing(e) || e.metaKey || e.ctrlKey || e.altKey) return;
      e.preventDefault(); keys.add(k);
    };
    const onKeyUp = (e: KeyboardEvent) => keys.delete(e.key.toLowerCase());
    const onBlur = () => keys.clear();
    let panRaf = 0, lastPan = performance.now();
    const pan = () => {
      const now = performance.now(), dt = Math.min(50, now - lastPan); lastPan = now;
      if (keys.size) {
        let dx = 0, dy = 0;
        for (const k of keys) { const v = KEYMAP[k]; if (v) { dx += v[0]; dy += v[1]; } }
        const sp = (0.6 * dt) / cam.current.zoom; // screen px per ms, independent of zoom
        cam.current.x += dx * sp; cam.current.y += dy * sp;
      }
      panRaf = requestAnimationFrame(pan);
    };
    panRaf = requestAnimationFrame(pan);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(panRaf);
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
  const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const touches = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ dist: number; mx: number; my: number } | null>(null);

  /** Villager under the pointer; hit radius is in screen pixels so it stays easy to tap at any zoom. */
  const personAt = (e: { clientX: number; clientY: number }): Person | null => {
    const r = canvasRef.current!.getBoundingClientRect(), c = cam.current;
    const wx = (e.clientX - r.left - r.width / 2) / c.zoom + c.x, wy = (e.clientY - r.top - r.height / 2) / c.zoom + c.y;
    let best: Person | null = null, bd = Math.max(3, 16 / c.zoom);
    for (const f of lastPeople) { const dd = Math.hypot(f.x - wx, f.y - 2.5 - wy); if (dd < bd) { bd = dd; best = f.q.p; } }
    return best;
  };
  useEffect(() => { peopleFocus.sel = who ? pkey(who) : null; }, [who]);
  const onClick = async (x: number, y: number) => {
    setMsg(null);
    if (mode === "seed") {
      if (!userId) return setMsg(t.signInToPlant);
      if (!form.name.trim() || !form.owner.trim()) return setMsg(t.needNames);
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
      .insert({ name: form.name.trim(), owner: form.owner.trim(), x, y, hue: Math.floor(Math.random() * 360), user_id: userId, realm })
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
    setMsg(t.planted(data.name));
  };

  const my = seeds.find((s) => s.id === mine);
  const myCharter = my ? charters.find((c) => c.seed_id === my.id)?.path : undefined;
  const sealCharter = async () => {
    if (!my || !userId || !charterPick) return;
    const { data, error } = await supabase.from("charters").insert({ seed_id: my.id, user_id: userId, path: charterPick }).select("id, seed_id, path, created_at").single();
    if (error || !data) return setMsg(t.charter.fail);
    setCharters((s) => (s.some((x) => x.id === data.id) ? s : [...s, data]));
    bell(0); setCharterOpen(false); setMsg(t.charter.sealed(t.charter.paths[charterPick]![0]));
  };
  const myRoad = my ? firstRoads.find((f) => f.seed_id === my.id) : undefined;
  const sealRoad = async () => {
    if (!my || !userId || !roadPick) return;
    const { data, error } = await supabase.from("first_roads").insert({ seed_id: my.id, user_id: userId, target_id: roadPick }).select("id, seed_id, target_id, created_at").single();
    if (error || !data) return setMsg(t.road.fail);
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
    document.documentElement.lang = l;
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
    road: owner && !myRoad && roadCandidates(my!, seeds).length > 0,
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
  useEffect(() => {
    if (userId && !localStorage.getItem("samenland-guide-seen")) { setGuideOpen(true); localStorage.setItem("samenland-guide-seen", "1"); }
  }, [userId]);
  const [chronBanner, setChronBanner] = useState(false);
  const [scribe, setScribe] = useState<string | null | undefined>(undefined);
  const askScribe = useServerFn(scribeGreeting);
  const chronDone = useRef<string | null>(null);
  const chronLine = (e: ChronEvent) => e.code === "stage" ? t.chron.stage(t.stages[e.stage] ?? "") : e.code === "built" ? t.chron.built(t.kind[e.kind] ?? e.kind) : e.code === "bought" ? t.chron.built(t.items[e.item]?.[0] ?? e.item) : e.code === "road" ? t.chron.road(e.other) : e.code === "twin" ? t.chron.twin(e.other) : e.code === "house" ? t.chron.house(t.kind[e.kind] ?? e.kind) : e.code === "family" ? t.chron.family : e.code === "houses" ? t.chron.houses(e.n) : e.code === "families" ? t.chron.families(e.n) : e.code === "wedding" ? t.chron.wedding(e.a, e.b) : e.code === "fire" ? (e.guarded ? t.chron.fireOut : t.chron.fire(e.dead)) : e.code === "flood" ? t.chron.flood : e.code === "raid" ? (e.caught ? t.chron.caught : t.chron.raid(e.loss)) : e.code === "journeyman" ? t.chron.journeyman(e.name, t.job[e.craft]?.[e.sex === "f" ? 0 : 1] ?? e.craft, e.other) : e.code === "journeymen" ? t.chron.journeymen(e.n) : e.code === "bride" ? t.chron.bride(e.name, e.other, e.away) : e.code === "moved" ? t.chron.moved(e.name, e.other, e.away) : t.chron.season(t.seasons[e.season]);
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
      if (big.length) { setFest((q) => [...q, ...big].slice(-6)); bell(); }
    }, 15000);
    return () => window.clearInterval(id);
  }, [owner, my?.id, seeds]);
  const festNow = !anyOpen && !decision.open && !chronOpen ? fest[0] : undefined;
  const festArt = (e: ChronEvent) => e.code === "fire" ? ART["fire"] : e.code === "flood" ? ART["flood"] : e.code === "raid" ? ART["robber"] : e.code === "wedding" ? ART["wedding"] : e.code === "house" ? ART["topping"] : e.code === "family" ? ART["newcomers"] : e.code === "road" ? ART["roadopen"] : e.code === "twin" ? ART["charter"] : ART["fair"];
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
    if (e.code === "stage") return [t.fest.stage[0], t.fest.stage[1](t.stages[e.stage] ?? "")];
    return [t.fest.built[0], t.fest.built[1](chronLine(e).replace(/ (fertiggestellt|completed)$/, ""))];
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
  const { cash, myStage, myTown, at, pop, residents, season, nbs } = useMemo(() => {
    const cash = my ? treasury(my, purchases, slow, gifts) : 0;
    const myStage = my ? stageOf(effAge(my, seeds, slow)) : 0;
    const myTown = my ? townOf(my, seeds, slow) : null;
    const at = my ? attributes(my, seeds, purchases, slow, myTown!.weddings.filter((w) => w.alliance).length) : null;
    const pop = my ? dailyTax(my, ageHours(my, slow)) : 0;
    const residents = myTown ? myTown.people.length : 0;
    const sw = seasonAt(slow);
    const season = (Object.keys(sw) as (keyof typeof sw)[]).reduce((a, b) => (sw[b] > sw[a] ? b : a));
    const nbs = my ? links(seeds).filter((l) => l.a.id === my.id || l.b.id === my.id).map((l) => (l.a.id === my.id ? l.b : l.a)) : [];
    return { cash, myStage, myTown, at, pop, residents, season, nbs };
  }, [my, seeds, purchases, gifts, slow]);
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
    const text = (signDraft[to.id] ?? "").trim().slice(0, 80);
    if (!text) return;
    const { data, error } = await supabase.from("signposts").upsert({ seed_id: my.id, target_id: to.id, user_id: userId!, message: text }, { onConflict: "seed_id,target_id" }).select("id, seed_id, target_id, user_id, message").single();
    if (error || !data) return setMsg(t.blessFail);
    setSigns((s) => [...s.filter((x) => x.id !== data.id), data as Signpost]);
    setMsg(t.signSaved);
  };
  const buy = async (item: Item, x: number, y: number) => {
    if (!my) return;
    const err = canPlaceSpecial(item, x, y, my, seeds, clock());
    if (err) return setMsg(t.place[err as "far" | "ground" | "taken" | "shore"]);
    setPlacing(null);
    const { data, error } = await supabase.from("purchases").insert({ seed_id: my.id, user_id: userId!, item, x, y }).select("id, seed_id, item, cost, created_at, x, y").single();
    if (error || !data) return setMsg(error?.message?.includes("not enough money") ? t.poor : t.buyFail);
    setPurchases((s) => [...s.filter((x) => x.id !== data.id), data]);
    tap();
    setMsg(t.bought(t.items[item]![0]));
  };
  const zoomBy = (f: number) => {
    const cv = canvasRef.current!;
    target.current = { zoom: Math.min(12, Math.max(MIN_ZOOM, target.current.zoom * f)), ax: cv.width / 2, ay: cv.height / 2 };
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
          {myCharter && (
            <div className="rounded-md border border-brass/60 bg-brass/15 p-2 text-xs">
              <b>{PATH_ICON[myCharter]} {t.charter.paths[myCharter]![0]}:</b> {t.charter.bonus[myCharter]}
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
          <p className="text-xs text-muted-foreground">{mode === "seed" ? t.clickLand : t.needNames}</p>
          {mode === "seed" ? <Button type="button" size="sm" variant="ghost" onClick={() => { setMode("look"); setPlantAsk(null); setPtr(null); }}>{t.cancel}</Button>
            : <Button type="submit" size="sm" className="w-full" disabled={!form.name.trim() || !form.owner.trim()}>{t.plant}</Button>}
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
                </span>
              </button>
            </li>
          ))}
        </ul>
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
      if (k === "road") { setRoadPick(null); setRoadOpen(true); }
      else if (k === "charter") { setCharterPick(null); setCharterOpen(true); }
      else if (k === "pact") { setPactPick(null); setPactOpen(true); }
      else setEncOpen(true);
    }, 2500);
    return () => clearTimeout(id);
  }, [decision.open, anyOpen]);

  return (
    <div className="relative h-screen w-full overflow-hidden bg-background">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full cursor-grab touch-none"
        onPointerDown={(e) => {
          touches.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
          (e.target as Element).setPointerCapture(e.pointerId);
          if (touches.current.size >= 2) { pinch.current = null; if (drag.current) drag.current.moved = true; return; }
          drag.current = { x: e.clientX, y: e.clientY, moved: false };
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
              const nz = Math.min(12, Math.max(MIN_ZOOM, c.zoom * (dist / p.dist)));
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
            if (Math.abs(dx) + Math.abs(dy) > 3) d.moved = true;
            if (d.moved) {
              cam.current.x -= dx / cam.current.zoom;
              cam.current.y -= dy / cam.current.zoom;
              d.x = e.clientX;
              d.y = e.clientY;
            }
          }
          if (!drag.current?.moved) {
            const nt = tileAt(e), ph = st.current.hover;
            if (!ph || ph[0] !== nt[0] || ph[1] !== nt[1]) { st.current.hover = nt; setHover(nt); }
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
            drag.current = { x: rest!.x, y: rest!.y, moved: true };
            return;
          }
          pinch.current = null;
          const d = drag.current;
          drag.current = null;
          if (d && !d.moved) {
            if (placing) { const [px, py] = tileAt(e); return buy(placing, px, py); }
            if (mode === "look") {
              const best = personAt(e);
              const pan = (e.clientX / window.innerWidth) * 2 - 1;
              if (best) { hm(pan); setPlace(null); return setWho(best); }
              { const r = canvasRef.current!.getBoundingClientRect(), c = cam.current;
                const wx = (e.clientX - r.left - r.width / 2) / c.zoom + c.x, wy = (e.clientY - r.top - r.height / 2) / c.zoom + c.y;
                const tr = lastTraders.find((f) => Math.hypot(f.x - wx, f.y - 3 - wy) < Math.max(4, 16 / c.zoom));
                if (tr) { tap(pan); setWho(null); setPlace(null); if (tr.walker) { const w = tr.walker; return setMsg(t.walker(w.kind, w.name, w.kind === "bridal" ? w.sex : t.job[w.craft]?.[w.sex === "f" ? 0 : 1] ?? w.craft, tr.from, tr.to)); } return setMsg(t.trade.trader(tr.cart, tr.good ? t.trade.goods[tr.good] ?? tr.good : "–", tr.from, tr.to)); } }
              const [tx, ty] = tileAt(e);
              { const g = twinGateAt(tx, ty, seeds, clock());
                if (g) { tap(pan); setWho(null); setPlace(null); const p = pactOf(g.a, g.b, seeds, clock());
                  return setMsg(`${t.twin.gate(g.a.name, g.b.name)}${p ? ` · ${t.twin.pacts[p.kind]![0]}` : ""}${marketDay(g, clock()) ? ` · ${t.twin.market}` : ""}`); } }
              const sm = signpostMap(seeds);
              for (const [dx, dy] of [[0, 0], [1, 1], [1, 0], [0, 1], [-1, 0], [0, -1]] as const) {
                const sp = sm.get((ty + dy) * MAP + tx + dx);
                if (sp) { tap(pan); setWho(null); setPlace(null); return setMsg(`${t.signFrom(seeds.find((x) => x.id === sp.seed_id)?.name ?? "?")}: „${sp.message}“`); }
              }
              const ins = inspectAt(tx, ty, seeds, clock());
              if (!ins && structureAt(tx, ty, seeds, clock())?.kind === "pasture") baa(pan);
              if (ins) { if (ins.kind === "pasture") baa(pan); else tap(pan); setWho(null); return setPlace(ins); }
              setPlace(null);
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
            <div title={my ? t.character[characterOf(my.x, my.y)]![1] : undefined} className="truncate font-display text-2xl leading-none text-wood">{my ? my.name : "Samenland"}</div>
            <div className="hidden truncate text-xs text-muted-foreground sm:block">
              {my && myStats ? `${CHAR_ICON[characterOf(my.x, my.y)]} ${t.character[characterOf(my.x, my.y)]![0]}${myCharter ? ` · ${PATH_ICON[myCharter]} ${t.charter.paths[myCharter]![0]}` : ""} · ${t.stages[stageOf(myStats.age)]} · ${myStats.buildings} ${t.buildings}` : t.taglineShort}
            </div>
          </div>
          {my && at ? (
            <>
              <div className="flex items-center gap-2 text-sm font-semibold tabular-nums">
                <span className="flex items-center gap-1.5" title={t.taler(Math.max(0, cash))}>
                  <span aria-hidden className="grid h-5 w-5 place-items-center rounded-full border border-wood bg-[radial-gradient(circle_at_35%_30%,var(--color-coin-shine),var(--color-brass)_55%,var(--color-coin-edge))] text-[10px] font-bold leading-none text-wood shadow-[inset_0_-1px_0_var(--color-coin-edge)]">T</span>
                  {t.taler(Math.max(0, cash))}
                </span>
                <span className="hidden text-xs font-normal text-primary sm:inline">{t.perDay(pop)}</span>
              </div>
              <div className="hidden text-sm sm:block">{t.people(residents)}</div>
              <div className="hidden gap-3 lg:flex">
                {(["food", "health", "wealth"] as const).map((k) => (
                  <div key={k} className="w-20 text-xs">
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
            <div>{new Date(now).toLocaleDateString(lang === "de" ? "de-DE" : "en-GB", { day: "numeric", month: "long" })}</div>
            <div>{t.seasons[season]} · {new Date(now).toLocaleTimeString(lang === "de" ? "de-DE" : "en-GB", { hour: "2-digit", minute: "2-digit", timeZone: REALM_TZ[realm] })}</div>
          </div>
          <div className="ml-auto flex items-center gap-1 md:ml-0">
            <button type="button" aria-label={sound ? t.soundOff : t.soundOn} title={sound ? t.soundOff : t.soundOn} onClick={toggleSound} className="grid h-8 w-8 place-items-center rounded-md hover:bg-accent">
              {sound ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>
            <button type="button" aria-label={fs ? t.exitFullscreen : t.fullscreen} title={fs ? t.exitFullscreen : t.fullscreen} onClick={() => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.())} className="hidden h-8 w-8 place-items-center rounded-md hover:bg-accent md:grid">
              {fs ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
            <button type="button" aria-label={t.hud.settings} title={t.hud.settings} aria-expanded={settings} onClick={() => setSettings(!settings)} className="grid h-8 w-8 place-items-center rounded-md hover:bg-accent">
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </Panel>
        {settings && (
          <Panel className="absolute right-0 top-full mt-2 w-56" inner="space-y-2 p-3 text-sm">
            <div className="text-xs text-muted-foreground">{t.hud.language}</div>
            <div className="flex gap-1">
              {(["de", "en"] as Lang[]).map((l) => (
                <button key={l} className={`flex-1 rounded px-2 py-1 uppercase ${lang === l ? "bg-accent text-foreground" : "hover:bg-accent/50"}`} onClick={() => switchLang(l)}>{l}</button>
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
        <Panel inner="!bg-wood !border-0 flex gap-1 p-1 md:flex-col">
          {tabs.map(({ k, icon: I, label }) => (
            <WoodButton key={k} label={label} active={tab === k} onClick={() => pick(k)} className="h-11 flex-1 flex-col gap-0.5 md:h-14 md:w-14 md:flex-none">
              <I className="h-5 w-5" /><span className="text-[10px] leading-none">{label}</span>
            </WoodButton>
          ))}
          {(tab || placing) && (
            <WoodButton label={t.hud.close} onClick={() => { setTab(null); setPlacing(null); }} className="h-11 flex-1 flex-col gap-0.5 md:h-14 md:w-14 md:flex-none">
              <ArrowLeft className="h-5 w-5" /><span className="text-[10px] leading-none">{t.hud.close}</span>
            </WoodButton>
          )}
          <WoodButton label={t.guide.menu} active={guideOpen} onClick={() => setGuideOpen(true)} className="h-11 flex-1 flex-col gap-0.5 md:mt-2 md:h-14 md:w-14 md:flex-none">
            <BookOpen className="h-5 w-5" /><span className="text-[10px] leading-none">{t.guide.menu}</span>
          </WoodButton>
        </Panel>
      </div>
      {tab && (
        <div className="pointer-events-none absolute inset-x-2 bottom-20 z-30 max-h-[65vh] overflow-auto md:inset-x-auto md:bottom-auto md:left-24 md:top-24 md:w-72">
          <Panel>{drawer}</Panel>
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
                        <div key={o.id} className={`flex items-center gap-2 rounded-md border-2 p-2 ${roadPick === o.id ? "border-brass bg-brass/20" : "border-border"}`}>
                          <button type="button" aria-pressed={roadPick === o.id} onClick={() => setRoadPick(o.id)} className="flex-1 text-left">
                            <div className="font-semibold text-wood">{o.name}</div>
                            <div className="text-xs text-muted-foreground">{t.road.dist(Math.round(Math.hypot(o.x - my.x, o.y - my.y)))} · {CHAR_ICON[c]} {t.character[c]![0]}{ch ? ` · ${PATH_ICON[ch]} ${t.charter.paths[ch]![0]}` : ""}</div>
                          </button>
                          <Button size="sm" variant="secondary" onClick={() => { focus(o.x, o.y); later("road"); }}>{t.road.look}</Button>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <span className="text-xs text-muted-foreground">{t.road.final}</span>
                    <Button disabled={!roadPick} onClick={sealRoad}>{t.road.seal}</Button>
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
          <div className="mt-4 flex justify-center"><Button onClick={go}>{t.fest.go}</Button></div>
        </Parchment>
      ); })()}
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
                    <span className="mr-2 text-ink/60">{new Date(e.at).toLocaleDateString(lang === "de" ? "de-DE" : "en-GB", { day: "numeric", month: "short" })}</span>{chronLine(e)}
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
              <div className="flex items-start justify-between">
                <h1 className="font-display text-4xl leading-none text-wood">Samenland</h1>
                <button type="button" aria-label={t.hud.close} onClick={() => setAuthOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
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

      <div className="pointer-events-none absolute bottom-20 left-2 right-2 z-20 flex flex-col items-end space-y-2 text-sm md:bottom-52 md:left-auto md:right-3 md:w-80">
        {placing && (
          <div className="pointer-events-auto flex w-full max-w-xs items-center gap-2 rounded-md border-2 border-wood bg-card px-3 py-2 text-foreground shadow-[var(--shadow-panel)]">
            {spriteUrl(SPECIAL_KIND[placing]!) && <img src={spriteUrl(SPECIAL_KIND[placing]!)} alt="" className="h-10 w-10 object-contain" />}
            <div className="flex-1 text-xs"><div className="font-semibold">{t.items[placing]![0]} · {t.taler(ITEMS[placing])}</div>{t.place.hint}</div>
            <Button size="sm" variant="secondary" onClick={() => { setPlacing(null); setMsg(null); }}>{t.cancel}</Button>
          </div>
        )}
        {placing && hover && ptr && (() => {
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
            <div className="pointer-events-auto w-full max-w-xs rounded-md border-2 border-border bg-card px-3 py-2 shadow-[var(--shadow-panel)] border-wood text-foreground shadow-[var(--shadow-cozy)]">
              <div className="flex items-start justify-between gap-3">
                <div className="font-['Caveat'] text-xl leading-tight">{who.first} {who.last}</div>
                <button type="button" aria-label={t.close} className="text-muted-foreground hover:text-foreground" onClick={() => setWho(null)}>×</button>
              </div>
              <div className="text-sm">{t.personAge(who.age)} · {t.job[who.job]![who.sex === "f" ? 0 : 1]}</div>
              {(kin.spouse || kin.parents.length || kin.children.length || kin.siblings.length || who.maiden) && (
                <div className="mt-1 space-y-0.5 text-xs">
                  {kin.spouse && <div>{t.fest.kinSpouse("")}{kl(kin.spouse)}{who.wedAt ? <span className="text-muted-foreground"> · {t.fest.kinWed(new Date(who.wedAt).toLocaleDateString(lang === "de" ? "de-DE" : "en-GB", { day: "numeric", month: "short" }))}</span> : null}</div>}
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
            <div className="pointer-events-auto w-full max-w-xs rounded-md border-2 border-border bg-card px-3 py-2 shadow-[var(--shadow-panel)] border-wood text-foreground shadow-[var(--shadow-cozy)]">
              <div className="flex items-start justify-between gap-3">
                <div className="font-['Caveat'] text-xl leading-tight">{ins.build !== null ? t.site(name) : name}</div>
                <button type="button" aria-label={t.close} className="text-muted-foreground hover:text-foreground" onClick={() => setPlace(null)}>×</button>
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
