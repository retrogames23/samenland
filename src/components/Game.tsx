import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { draw, iso, toTile, MIN_ZOOM, lastPeople, lastSources, peopleFocus, prewarmOverview, setSignposts, signpostMap, type Camera } from "@/game/render";
const pkey = (p: { id: number; seed: { id: string } }) => `${p.seed.id}:${p.id}`;
import { townOf, poseOf, type Person } from "@/game/people";
import { inspectAt, type Inspect } from "@/game/inspect";
import { Maximize2, Minimize2, Volume2, VolumeX, Hammer, Bell, Signpost as SignIcon, Map as MapIcon, Sprout, Settings, Plus, Minus, Home, X, LogIn } from "lucide-react";
import { Panel, WoodButton } from "@/components/hud/Panel";
import { Minimap } from "@/components/hud/Minimap";
import { seasonAt } from "@/game/season";
import { setScene, setSound, unlock, baa, hm, tap, bell, disposeAudio } from "@/game/audio";
import {
  canPlant,
  structureAt,
  radiusOf,
  ageHours,
  effAge,
  speedOf,
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

type Mode = "look" | "seed" | "tree" | "flower" | "lantern";

export function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rawSeeds, setSeeds] = useState<Seed[]>([]);
  const [blessings, setBlessings] = useState<{ id: string; seed_id: string; created_at: string }[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [charters, setCharters] = useState<{ id: string; seed_id: string; path: string; created_at: string }[]>([]);
  const [charterOpen, setCharterOpen] = useState(false);
  const [firstRoads, setFirstRoads] = useState<{ id: string; seed_id: string; target_id: string; created_at: string }[]>([]);
  const [roadOpen, setRoadOpen] = useState(false);
  type EncRow = { id: string; seed_id: string; event: string; choice: string; cost: number; created_at: string };
  const [encounters, setEncounters] = useState<EncRow[]>([]);
  const barRef = useRef<HTMLDivElement>(null);
  const [barH, setBarH] = useState(88);
  useEffect(() => {
    const el = barRef.current; if (!el) return;
    const ro = new ResizeObserver(() => setBarH(el.offsetTop + el.offsetHeight));
    ro.observe(el); return () => ro.disconnect();
  }, []);
  const [encOpen, setEncOpen] = useState(false);
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
    return rawSeeds.map((s) => {
      const bl = by.get(s.id), bo = buys.get(s.id), ch = charters.find((c) => c.seed_id === s.id), fr = firstRoads.find((f) => f.seed_id === s.id), de = decs.get(s.id);
      if (!bl && !bo && !ch && !fr && !de) return s;
      return { ...s, ...(bl ? { blessed: bl.sort((a, b) => a - b) } : {}), ...(bo ? { bought: bo.sort((a, b) => a.at - b.at) } : {}), ...(ch ? { charter: { path: ch.path as CharterPath, at: Date.parse(ch.created_at) } } : {}), ...(fr ? { firstRoad: { target: fr.target_id, at: Date.parse(fr.created_at) } } : {}), ...(de ? { decisions: de.sort((a, b) => a.at - b.at) } : {}) };
    });
  }, [rawSeeds, blessings, purchases, charters, firstRoads, encounters]);
  useEffect(() => { setSignposts(signs); }, [signs]);
  const [plantings, setPlantings] = useState<Planting[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [lang, setLang] = useState<Lang>("de");
  const t = DICT[lang];
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
  const cam = useRef<Camera>({ x: 0, y: 0, zoom: 2.6 });
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
      const [a, b, bl, sg, pu] = await Promise.all([
        supabase.from("seeds").select("*").order("created_at"),
        supabase.from("plantings").select("*"),
        supabase.from("blessings").select("id, seed_id, created_at"),
        supabase.from("signposts").select("id, seed_id, target_id, user_id, message"),
        supabase.from("purchases").select("id, seed_id, item, cost, created_at, x, y"),
      ]);
      supabase.from("charters").select("id, seed_id, path, created_at").then(({ data }) => setCharters(data ?? []));
      supabase.from("encounters").select("id, seed_id, event, choice, cost, created_at").then(({ data }) => setEncounters(data ?? []));
      supabase.from("first_roads").select("id, seed_id, target_id, created_at").then(({ data }) => setFirstRoads(data ?? []));
      setBlessings(bl.data ?? []);
      setPurchases(pu.data ?? []);
      setSigns((sg.data ?? []) as Signpost[]);
      const ss = (a.data ?? []) as Seed[];
      setSeeds(ss);
      setPlantings((b.data ?? []) as Planting[]);
      const { data: u } = await supabase.auth.getUser();
      const my = ss.find((s) => u.user && s.user_id === u.user.id) ?? ss[0];
      if (my) focus(my.x, my.y);
      else focus(MAP / 2, MAP / 2);
    })();
    const ch = supabase
      .channel(`world-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "seeds" }, (p) =>
        setSeeds((s) => (s.some((x) => x.id === (p.new as Seed).id) ? s : [...s, p.new as Seed])),
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
    const iv = setInterval(() => tick((n) => n + 1), 30000);
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
      draw(ctx, cv.width, cv.height, dpr.current, c, s.seeds, s.plantings, Date.now(), h, ok);
      const own = s.seeds.find((x) => x.id === s.mine);
      if (s.placing && h && own) {
        // SimCity-style ghost: the building floats over the tile, tinted by whether it may stand there
        const good = canPlaceSpecial(s.placing, h[0], h[1], own, s.seeds, Date.now()) === null;
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
        zoom: Math.min(7, Math.max(MIN_ZOOM, target.current.zoom * Math.exp(-dy * 0.0015))),
        ax: (e.clientX - r.left) * dpr.current,
        ay: (e.clientY - r.top) * dpr.current,
      };
    };
    cv.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
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
      const { data, error } = await supabase
        .from("seeds")
        .insert({
          name: form.name.trim(),
          owner: form.owner.trim(),
          x,
          y,
          hue: Math.floor(Math.random() * 360),
          user_id: userId,
        })
        .select()
        .single();
      if (error?.code === "23505") return setMsg(t.alreadyHave);
      if (error || !data) return setMsg(t.plantFail);
      setSeeds((s) => [...s, data as Seed]);
      setMode("look");
      setMsg(t.planted(data.name));
    } else if (mode === "tree" || mode === "flower" || mode === "lantern") {
      const my = seeds.find((s) => s.id === mine);
      if (!my) return;
      if (Math.hypot(x - my.x, y - my.y) > radiusOf(effAge(my, seeds, Date.now())) + 3)
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
  const myStats = my ? townStats(my, seeds, Date.now()) : null;
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

  const now = Date.now();
  const cash = my ? treasury(my, purchases, now) : 0;
  const at = my ? attributes(my, seeds, purchases, now) : null;
  const pop = my ? dailyTax(my, ageHours(my, now)) : 0;
  const sw = seasonAt(now);
  const season = (Object.keys(sw) as (keyof typeof sw)[]).reduce((a, b) => (sw[b] > sw[a] ? b : a));
  const nbs = my ? links(seeds).filter((l) => l.a.id === my.id || l.b.id === my.id).map((l) => (l.a.id === my.id ? l.b : l.a)) : [];
  const ring = async (kind: "bell" | "well") => {
    if (!my) return;
    const { data, error } = await supabase.from("blessings").insert({ seed_id: my.id, user_id: userId!, kind }).select("id, seed_id, created_at").single();
    if (error || !data) return setMsg(t.blessFail);
    setBlessings((s) => [...s, data]);
    if (kind === "bell") bell(); else tap();
    setMsg(t.blessed(my.name));
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
    const err = canPlaceSpecial(item, x, y, my, seeds, Date.now());
    if (err) return setMsg(t.place[err as "far" | "ground" | "taken" | "shore"]);
    setPlacing(null);
    const { data, error } = await supabase.from("purchases").insert({ seed_id: my.id, user_id: userId!, item, x, y }).select("id, seed_id, item, cost, created_at, x, y").single();
    if (error || !data) return setMsg(t.poor);
    setPurchases((s) => [...s.filter((x) => x.id !== data.id), data]);
    tap();
    setMsg(t.bought(t.items[item]![0]));
  };
  const zoomBy = (f: number) => {
    const cv = canvasRef.current!;
    target.current = { zoom: Math.min(7, Math.max(MIN_ZOOM, target.current.zoom * f)), ax: cv.width / 2, ay: cv.height / 2 };
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
          <div className="rounded-md border border-brass/60 bg-brass/15 p-2 text-xs">
            {myCharter ? <><b>{PATH_ICON[myCharter]} {t.charter.paths[myCharter]![0]}:</b> {t.charter.bonus[myCharter]}</> : t.charter.guildLocked}
          </div>
          {(Object.keys(ITEMS) as Item[]).filter((it) => canBuy(it, myCharter))
            .sort((a, b) => (Number(at.has(a)) - Number(at.has(b))) || (ITEMS[a] - ITEMS[b]))
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
            return (
              <form key={o.id} className="space-y-1" onSubmit={(e) => { e.preventDefault(); saveSign(o); }}>
                <div className="text-xs">{t.signTo(o.name)}</div>
                <div className="flex gap-1">
                  <Input className="h-8 text-xs" maxLength={80} placeholder={t.signPlaceholder} value={signDraft[o.id] ?? cur?.message ?? ""} onChange={(e) => setSignDraft({ ...signDraft, [o.id]: e.target.value })} />
                  <Button type="submit" size="sm" variant="secondary">{t.signSave}</Button>
                </div>
              </form>
            );
          })}
        </div>
      )}
      {tab === "plant" && (!userId ? (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">{t.hud.login}</p>
          <Button size="sm" className="w-full" onClick={() => setAuthOpen(true)}>{t.signIn}</Button>
        </div>
      ) : (
        <form className="space-y-2" onSubmit={(e) => { e.preventDefault(); setMode("seed"); }}>
          <Input placeholder={t.townName} maxLength={32} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input placeholder={t.yourName} maxLength={32} value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} />
          <p className="text-xs text-muted-foreground">{mode === "seed" ? t.clickLand : t.needNames}</p>
          {mode === "seed" ? <Button type="button" size="sm" variant="ghost" onClick={() => setMode("look")}>{t.cancel}</Button>
            : <Button type="submit" size="sm" className="w-full" disabled={!form.name.trim() || !form.owner.trim()}>{t.plant}</Button>}
        </form>
      ))}
      {tab === "towns" && (
        <ul className="max-h-[50vh] space-y-1 overflow-auto">
          {seeds.map((s) => (
            <li key={s.id}>
              <button className="w-full rounded px-2 py-1 text-left hover:bg-accent" onClick={() => { focus(s.x, s.y); setTab(null); }}>
                <span className="text-foreground">{s.name}</span>
                <span className="block text-xs text-muted-foreground">
                  {t.character[characterOf(s.x, s.y)]![0]} · {t.stages[stageOf(effAge(s, seeds, now))]} · {s.owner} · {t.age(ageHours(s, now))}
                  {speedOf(s, seeds, now) > 1.005 && <span className="block">{t.tradeBonus(Math.round((speedOf(s, seeds, now) - 1) * 100))}</span>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

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
              const nz = Math.min(7, Math.max(MIN_ZOOM, c.zoom * (dist / p.dist)));
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
          setHover(tileAt(e));
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
              const [tx, ty] = tileAt(e);
              const sm = signpostMap(seeds);
              for (const [dx, dy] of [[0, 0], [1, 1], [1, 0], [0, 1], [-1, 0], [0, -1]] as const) {
                const sp = sm.get((ty + dy) * MAP + tx + dx);
                if (sp) { tap(pan); setWho(null); setPlace(null); return setMsg(`${t.signFrom(seeds.find((x) => x.id === sp.seed_id)?.name ?? "?")}: „${sp.message}“`); }
              }
              const ins = inspectAt(tx, ty, seeds, Date.now());
              if (!ins && structureAt(tx, ty, seeds, Date.now())?.kind === "pasture") baa(pan);
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
            <div className="mt-0.5 flex flex-wrap gap-1">
            {my && !myRoad && my.user_id === userId && (
              <button type="button" onClick={() => { setRoadPick(null); setRoadOpen(true); }} className="pointer-events-auto flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border border-brass bg-brass/20 px-2 py-0.5 text-[11px] font-semibold text-wood hover:bg-brass/40">
                <span aria-hidden>🛤</span>{t.road.btn}
              </button>
            )}
            {my && my.user_id === userId && pendingEncounter(my, my.decisions ?? [], Date.now()) && (
              <button type="button" onClick={() => setEncOpen(true)} className="pointer-events-auto flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border border-brass bg-brass/20 px-2 py-0.5 text-[11px] font-semibold text-wood hover:bg-brass/40">
                <span aria-hidden>📜</span>{t.enc.btn}
              </button>
            )}
            {my && !myCharter && my.user_id === userId && (
              <button type="button" onClick={() => { setCharterPick(null); setCharterOpen(true); }} className="pointer-events-auto flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border border-brass bg-brass/20 px-2 py-0.5 text-[11px] font-semibold text-wood hover:bg-brass/40">
                <span aria-hidden className="grid h-3.5 w-3.5 place-items-center rounded-full bg-destructive text-[8px] text-destructive-foreground">✦</span>{t.charter.seal}
              </button>
            )}
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
              <div className="hidden text-sm sm:block">{t.people(pop)}</div>
              <div className="hidden gap-3 lg:flex">
                {(["food", "health", "wealth"] as const).map((k) => (
                  <div key={k} className="w-20 text-xs">
                    <div className="flex justify-between"><span>{t.attrs[k]}</span><span>{at[k]}</span></div>
                    <div className="h-1.5 rounded bg-muted"><div className="h-full rounded bg-primary" style={{ width: `${at[k]}%` }} /></div>
                  </div>
                ))}
              </div>
            </>
          ) : !userId ? (
            <Button size="sm" onClick={() => setAuthOpen(true)}><LogIn className="mr-1 h-4 w-4" />{t.signIn}</Button>
          ) : null}
          <div className="ml-auto hidden text-right text-xs text-muted-foreground md:block">
            <div>{new Date(now).toLocaleDateString(lang === "de" ? "de-DE" : "en-GB", { day: "numeric", month: "long" })}</div>
            <div>{t.seasons[season]} · {new Date(now).toLocaleTimeString(lang === "de" ? "de-DE" : "en-GB", { hour: "2-digit", minute: "2-digit" })}</div>
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
            {userId ? <Button size="sm" variant="secondary" className="w-full" onClick={() => { supabase.auth.signOut(); setSettings(false); }}>{t.signOut}</Button>
              : <Button size="sm" className="w-full" onClick={() => { setAuthOpen(true); setSettings(false); }}>{t.signIn}</Button>}
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

      {encOpen && my && (() => {
        const ev = pendingEncounter(my, my.decisions ?? [], Date.now());
        const fxText = (e: string, c: string) => {
          const ch = choiceOf(e, c)!; const f = ch.fx as { h?: number; growth?: number; food?: number; health?: number; wealth?: number };
          const parts = [f.growth ? t.enc.growth(Math.round(f.growth * 100)) : "", f.food ? `+${f.food} ${t.enc.food}` : "", f.health ? `+${f.health} ${t.enc.health}` : "", f.wealth ? `+${f.wealth} ${t.enc.wealth}` : ""].filter(Boolean);
          return parts.length && f.h ? `${parts.join(" · ")} · ${t.enc.lasts(f.h)}` : parts.join(" · ");
        };
        const created = Date.parse(my.created_at);
        return (
          <div className="absolute inset-0 z-40 grid place-items-center bg-foreground/30 p-4" onClick={() => setEncOpen(false)}>
            <div onClick={(e) => e.stopPropagation()} className="max-h-full w-full max-w-xl overflow-auto">
              <Panel inner="p-5">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-display text-4xl leading-none text-wood">{ev ? t.enc.events[ev]![0] : t.enc.title}</h2>
                  <button type="button" aria-label={t.hud.close} onClick={() => setEncOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
                </div>
                {!ev ? <p className="mt-2 text-sm text-muted-foreground">{t.enc.decided}</p> : (
                  <>
                    <p className="mt-2 text-sm italic text-muted-foreground">{t.enc.events[ev]![1]}</p>
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
              </Panel>
            </div>
          </div>
        );
      })()}
      {roadOpen && my && (
        <div className="absolute inset-0 z-40 grid place-items-center bg-foreground/30 p-4" onClick={() => setRoadOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="max-h-full w-full max-w-xl overflow-auto">
            <Panel inner="p-5">
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-display text-4xl leading-none text-wood">{t.road.title}</h2>
                <button type="button" aria-label={t.hud.close} onClick={() => setRoadOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{t.road.intro}</p>
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
                          <Button size="sm" variant="secondary" onClick={() => { focus(o.x, o.y); setRoadOpen(false); }}>{t.road.look}</Button>
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
            </Panel>
          </div>
        </div>
      )}

      {charterOpen && my && (
        <div className="absolute inset-0 z-40 grid place-items-center bg-foreground/30 p-4" onClick={() => setCharterOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="max-h-full w-full max-w-2xl overflow-auto">
            <Panel inner="p-5">
              <div className="flex items-start justify-between">
                <h2 className="font-display text-4xl leading-none text-wood">{t.charter.title} · {my.name}</h2>
                <button type="button" aria-label={t.hud.close} onClick={() => setCharterOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{t.charter.intro}</p>
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
            </Panel>
          </div>
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
        {msg && (
          <div className="rounded-md border-2 border-border bg-card px-3 py-2 shadow-[var(--shadow-panel)] border-wood text-foreground">
            {msg}
          </div>
        )}
        {who && (() => {
          const now = Date.now();
          const q = poseOf(who, townOf(who.seed, seeds, now), seeds, now);
          return (
            <div className="pointer-events-auto w-full max-w-xs rounded-md border-2 border-border bg-card px-3 py-2 shadow-[var(--shadow-panel)] border-wood text-foreground shadow-[var(--shadow-cozy)]">
              <div className="flex items-start justify-between gap-3">
                <div className="font-['Caveat'] text-xl leading-tight">{who.first} {who.last}</div>
                <button type="button" aria-label={t.close} className="text-muted-foreground hover:text-foreground" onClick={() => setWho(null)}>×</button>
              </div>
              <div className="text-sm">{t.personAge(who.age)} · {t.job[who.job]![who.sex === "f" ? 0 : 1]}</div>
              <div className="text-xs text-muted-foreground">{t.livesIn(who.seed.name)} – {q.carry && q.dest ? t.carrying(q.carry, q.dest) : t.act[q.walking && q.act !== "play" ? "walking" : q.act]}</div>
            </div>
          );
        })()}
        {place && (() => {
          const ins = inspectAt(place.x, place.y, seeds, Date.now()) ?? place;
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
