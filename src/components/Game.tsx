import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { draw, iso, toTile, type Camera } from "@/game/render";
import {
  canPlant,
  radiusOf,
  ageHours,
  effAge,
  speedOf,
  townStats,
  terrain,
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
  const [, tick] = useState(0);

  const dpr = useRef(1);
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
      else focus(256, 256);
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
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = cv.getBoundingClientRect();
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
      target.current = {
        zoom: Math.min(7, Math.max(0.5, target.current.zoom * Math.exp(-dy * 0.0015))),
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
      if (!["grass", "meadow", "sand", "forest"].includes(terrain(x, y))) return setMsg(t.noGrow);
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

  return (
    <div className="relative h-screen w-full overflow-hidden bg-background">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full cursor-grab touch-none"
        onPointerDown={(e) => {
          drag.current = { x: e.clientX, y: e.clientY, moved: false };
          (e.target as Element).setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
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
        }}
        onPointerUp={(e) => {
          const d = drag.current;
          drag.current = null;
          if (d && !d.moved) {
            const [x, y] = tileAt(e);
            onClick(x, y);
          }
        }}
        onPointerLeave={() => setHover(null)}
      />

      <header className="pointer-events-none absolute left-4 top-4 max-w-xs">
        <div
          className={`pointer-events-auto rounded-md border-2 border-border bg-card/90 shadow-[var(--shadow-cozy)] backdrop-blur ${open ? "p-4" : "p-3"}`}
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
          {!open && <p className="mt-1 text-xs text-muted-foreground">{t.taglineShort}</p>}
          {open && (
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

      <aside className="absolute right-4 top-4 w-56 rounded-md border-2 border-border bg-card/90 p-3 shadow-[var(--shadow-cozy)] backdrop-blur">
        <h2 className="font-display text-lg text-foreground">{t.towns}</h2>
        <ul className="mt-1 max-h-60 space-y-1 overflow-auto text-sm">
          {seeds.map((s) => (
            <li key={s.id}>
              <button
                className="w-full rounded px-2 py-1 text-left hover:bg-accent"
                onClick={() => focus(s.x, s.y)}
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
      </aside>

      {my && (
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2 rounded-md border-2 border-border bg-card/90 p-2 shadow-[var(--shadow-cozy)] backdrop-blur">
          {(["look", "tree", "flower", "lantern"] as Mode[]).map((m) => (
            <Button
              key={m}
              size="sm"
              variant={mode === m ? "default" : "ghost"}
              onClick={() => setMode(m)}
            >
              {{ look: t.look, tree: t.tree, flower: t.flower, lantern: t.lantern, seed: "" }[m]}
            </Button>
          ))}
        </div>
      )}

      <div className="pointer-events-none absolute bottom-4 left-4 space-y-2 text-sm">
        {msg && (
          <div className="rounded-md border-2 border-border bg-card/95 px-3 py-2 text-foreground">
            {msg}
          </div>
        )}
        {hover && (
          <div className="rounded bg-card/80 px-2 py-1 text-xs text-muted-foreground">
            {t.terrain[terrain(hover[0], hover[1])]} · {hover[0]}, {hover[1]}
          </div>
        )}
      </div>
      <div className="pointer-events-none absolute bottom-4 right-4 text-xs text-muted-foreground">
        {t.hint}
      </div>
    </div>
  );
}
