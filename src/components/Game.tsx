import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { draw, iso, toTile, MIN_ZOOM, lastPeople, lastSources, peopleFocus, prewarmOverview, type Camera } from "@/game/render";
const pkey = (p: { id: number; seed: { id: string } }) => `${p.seed.id}:${p.id}`;
import { townOf, poseOf, type Person } from "@/game/people";
import { inspectAt, type Inspect } from "@/game/inspect";
import { Maximize2, Minimize2, Volume2, VolumeX } from "lucide-react";
import { setScene, setSound, unlock, baa, hm, tap, disposeAudio } from "@/game/audio";
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
  type Planting,
  type Seed,
} from "@/game/world";
import { DICT, plantError, type Lang } from "@/game/i18n";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Mode = "look" | "seed" | "tree" | "flower" | "lantern";

export function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [seeds, setSeeds] = useState<Seed[]>([]);
  const [plantings, setPlantings] = useState<Planting[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [lang, setLang] = useState<Lang>("de");
  const t = DICT[lang];
  const mine = seeds.find((s) => userId && s.user_id === userId)?.id ?? null;
  const [auth, setAuth] = useState({ email: "", password: "", signup: false });
  const [mode, setMode] = useState<Mode>("look");
  const [hover, setHover] = useState<[number, number] | null>(null);
  const [form, setForm] = useState({ name: "", owner: "" });
  const [msg, setMsg] = useState<string | null>(null);
  const [open, setOpen] = useState(true);
  const [listOpen, setListOpen] = useState(true);
  const [sheet, setSheet] = useState<"me" | "towns" | null>(null);
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
  const st = useRef({ seeds, plantings: new Map<string, Planting>(), hover, mode, mine });
  st.current.seeds = seeds;
  st.current.hover = hover;
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
    if (localStorage.getItem("samenland-panel") === "closed") setOpen(false);
    if (localStorage.getItem("samenland-towns") === "closed") setListOpen(false);
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
      const [a, b] = await Promise.all([
        supabase.from("seeds").select("*").order("created_at"),
        supabase.from("plantings").select("*"),
      ]);
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
      .subscribe();
    const iv = setInterval(() => tick((n) => n + 1), 30000);
    return () => {
      supabase.removeChannel(ch);
      clearInterval(iv);
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

  const show = open || sheet === "me";
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
          const hp = mode === "look" && !drag.current?.moved ? personAt(e) : null;
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
            if (mode === "look") {
              const best = personAt(e);
              const pan = (e.clientX / window.innerWidth) * 2 - 1;
              if (best) { hm(pan); setPlace(null); return setWho(best); }
              const [tx, ty] = tileAt(e);
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

      <header className={`pointer-events-none ${sheet === "me" ? "absolute inset-x-2 bottom-16 z-20 max-h-[70vh] overflow-auto" : "hidden"} md:absolute md:inset-auto md:left-4 md:top-4 md:z-auto md:block md:max-h-none md:max-w-xs md:overflow-visible`}>
        <div
          className={`pointer-events-auto rounded-md border-2 border-border bg-card/95 shadow-[var(--shadow-cozy)] backdrop-blur ${show ? "p-4" : "p-3"}`}
        >
          <div className="flex items-start justify-between gap-3">
            <h1 className="font-display text-4xl leading-none text-primary">Samenland</h1>
            <button
              type="button"
              onClick={() => {
                const next = !open;
                setOpen(next);
                localStorage.setItem("samenland-panel", next ? "open" : "closed");
              }}
              aria-expanded={open}
              aria-label={open ? t.collapse : t.expand}
              title={open ? t.collapse : t.expand}
              className="-mr-1 -mt-1 shrink-0 rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <svg
                viewBox="0 0 16 16"
                aria-hidden="true"
                className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 6l5 5 5-5" />
              </svg>
            </button>
          </div>
          {!show && <p className="mt-1 text-xs text-muted-foreground">{t.taglineShort}</p>}
          {show && (
            <>
              <p className="mt-1 text-sm text-muted-foreground">{t.tagline}</p>
              {my && myStats ? (
                <div className="mt-3 space-y-1 text-sm">
                  <div className="font-display text-lg text-foreground">{my.name}</div>
                  <div className="text-muted-foreground">
                    {t.stages[stageOf(myStats.age)]} · {t.since} {t.age(ageHours(my, Date.now()))} ·{" "}
                    {myStats.buildings} {t.buildings}
                    {myStats.speed > 1.005 && <span className="block">{t.tradeBonus(Math.round((myStats.speed - 1) * 100))}</span>}
                    {myStats.twins.map((n) => <span key={n} className="block">{t.twinWith(n)}</span>)}
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="mt-1"
                    onClick={() => focus(my.x, my.y)}
                  >
                    {t.toMine}
                  </Button>
                </div>
              ) : !userId ? (
                <form
                  className="mt-3 space-y-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    emailAuth();
                  }}
                >
                  <p className="text-xs text-muted-foreground">{t.signInToPlant}</p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="flex-1"
                      onClick={() => oauth("google")}
                    >
                      {t.google}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="flex-1"
                      onClick={() => oauth("apple")}
                    >
                      {t.apple}
                    </Button>
                  </div>
                  <div className="text-center text-xs text-muted-foreground">{t.or}</div>
                  <Input
                    type="email"
                    required
                    placeholder={t.email}
                    value={auth.email}
                    onChange={(e) => setAuth({ ...auth, email: e.target.value })}
                  />
                  <Input
                    type="password"
                    required
                    minLength={6}
                    placeholder={t.password}
                    value={auth.password}
                    onChange={(e) => setAuth({ ...auth, password: e.target.value })}
                  />
                  <Button type="submit" size="sm" className="w-full">
                    {auth.signup ? t.signUp : t.signIn}
                  </Button>
                  <button
                    type="button"
                    className="w-full text-xs text-muted-foreground underline"
                    onClick={() => setAuth({ ...auth, signup: !auth.signup })}
                  >
                    {auth.signup ? t.haveAccount : t.noAccount}
                  </button>
                </form>
              ) : mode !== "seed" ? (
                <Button className="mt-3" onClick={() => setMode("seed")}>
                  {t.plant}
                </Button>
              ) : (
                <form className="mt-3 space-y-2" onSubmit={(e) => e.preventDefault()}>
                  <Input
                    placeholder={t.townName}
                    maxLength={32}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                  <Input
                    placeholder={t.yourName}
                    maxLength={32}
                    value={form.owner}
                    onChange={(e) => setForm({ ...form, owner: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    {form.name.trim() && form.owner.trim() ? t.clickLand : t.needNames}
                  </p>
                  <Button type="button" size="sm" variant="ghost" onClick={() => setMode("look")}>
                    {t.cancel}
                  </Button>
                </form>
              )}
              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex gap-1">
                  {(["de", "en"] as Lang[]).map((l) => (
                    <button
                      key={l}
                      className={`rounded px-1.5 py-0.5 uppercase ${lang === l ? "bg-accent text-foreground" : "hover:text-foreground"}`}
                      onClick={() => switchLang(l)}
                    >
                      {l}
                    </button>
                  ))}
                </div>
                {userId && (
                  <button
                    className="underline hover:text-foreground"
                    onClick={() => supabase.auth.signOut()}
                  >
                    {t.signOut}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </header>

      <button
        type="button"
        aria-label={sound ? t.soundOff : t.soundOn}
        title={sound ? t.soundOff : t.soundOn}
        onClick={toggleSound}
        className="absolute right-14 top-4 z-10 grid h-8 w-8 place-items-center rounded-md border-2 border-border bg-card/90 text-foreground shadow-[var(--shadow-cozy)] hover:bg-accent"
      >
        {sound ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
      </button>
      <button
        type="button"
        aria-label={fs ? t.exitFullscreen : t.fullscreen}
        title={fs ? t.exitFullscreen : t.fullscreen}
        onClick={() => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.())}
        className="absolute right-4 top-4 z-10 grid h-8 w-8 place-items-center rounded-md border-2 border-border bg-card/90 text-foreground shadow-[var(--shadow-cozy)] hover:bg-accent"
      >
        {fs ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
      </button>

      <aside
        className={`${sheet === "towns" ? "absolute inset-x-2 bottom-16 z-20" : "hidden"} rounded-md border-2 border-border bg-card/95 p-3 shadow-[var(--shadow-cozy)] backdrop-blur md:absolute md:inset-auto md:right-4 md:top-14 md:z-auto md:block ${listOpen ? "md:w-56" : "md:w-auto"}`}
      >
        <button
          type="button"
          className="flex w-full items-center justify-between gap-2 text-left"
          aria-expanded={listOpen}
          onClick={() => {
            if (sheet === "towns") return setSheet(null);
            const next = !listOpen;
            setListOpen(next);
            localStorage.setItem("samenland-towns", next ? "open" : "closed");
          }}
        >
          <h2 className="font-display text-lg text-foreground">
            {t.towns} <span className="text-sm text-muted-foreground">({seeds.length})</span>
          </h2>
          <svg viewBox="0 0 16 16" aria-hidden="true" className={`h-4 w-4 text-muted-foreground transition-transform ${listOpen || sheet === "towns" ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6l5 5 5-5" />
          </svg>
        </button>
        {(listOpen || sheet === "towns") && (
        <ul className="mt-1 max-h-[50vh] space-y-1 overflow-auto text-sm md:max-h-60">
          {seeds.map((s) => (
            <li key={s.id}>
              <button
                className="w-full rounded px-2 py-1 text-left hover:bg-accent"
                onClick={() => { focus(s.x, s.y); setSheet(null); }}
              >
                <span className="text-foreground">{s.name}</span>
                <span className="block text-xs text-muted-foreground">
                  {t.stages[stageOf(effAge(s, seeds, Date.now()))]} · {s.owner} ·{" "}
                  {t.age(ageHours(s, Date.now()))}
                  {speedOf(s, seeds, Date.now()) > 1.005 && (
                    <span className="block">
                      {t.tradeBonus(Math.round((speedOf(s, seeds, Date.now()) - 1) * 100))}
                    </span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
        )}
      </aside>

      <div className="pointer-events-none absolute bottom-16 left-2 right-2 space-y-2 text-sm md:bottom-4 md:left-4 md:right-auto">
        {msg && (
          <div className="rounded-md border-2 border-border bg-card/95 px-3 py-2 text-foreground">
            {msg}
          </div>
        )}
        {who && (() => {
          const now = Date.now();
          const q = poseOf(who, townOf(who.seed, seeds, now), seeds, now);
          return (
            <div className="pointer-events-auto max-w-xs rounded-md border-2 border-border bg-card/95 px-3 py-2 text-foreground shadow-[var(--shadow-cozy)]">
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
            <div className="pointer-events-auto max-w-xs rounded-md border-2 border-border bg-card/95 px-3 py-2 text-foreground shadow-[var(--shadow-cozy)]">
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
      <div className="pointer-events-none absolute bottom-4 right-4 hidden text-xs text-muted-foreground md:block">
        {t.hint}
      </div>

      <nav className="absolute inset-x-2 bottom-2 z-20 flex gap-2 rounded-md border-2 border-border bg-card/95 p-1.5 shadow-[var(--shadow-cozy)] backdrop-blur md:hidden">
        {(["me", "towns"] as const).map((k) => (
          <button
            key={k}
            type="button"
            aria-pressed={sheet === k}
            onClick={() => setSheet(sheet === k ? null : k)}
            className={`flex-1 rounded px-3 py-2 text-sm ${sheet === k ? "bg-accent text-foreground" : "text-muted-foreground"}`}
          >
            {k === "me" ? (my ? t.myTown : t.signIn) : `${t.towns} (${seeds.length})`}
          </button>
        ))}
      </nav>
    </div>
  );
}
