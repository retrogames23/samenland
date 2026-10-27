import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { draw, iso, toTile, type Camera } from "@/game/render";
import { canPlant, radiusOf, ageHours, townStats, terrain, type Planting, type Seed } from "@/game/world";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PX = 2; // pixel-art scale
type Mode = "look" | "seed" | "tree" | "flower" | "lantern";
const TERRAIN_DE: Record<string, string> = { deep: "Tiefes Meer", water: "Wasser", sand: "Sand", grass: "Wiese", meadow: "Blumenwiese", forest: "Wald", hill: "Hügel" };

export function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [seeds, setSeeds] = useState<Seed[]>([]);
  const [plantings, setPlantings] = useState<Planting[]>([]);
  const [mine, setMine] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("look");
  const [hover, setHover] = useState<[number, number] | null>(null);
  const [form, setForm] = useState({ name: "", owner: "" });
  const [msg, setMsg] = useState<string | null>(null);
  const [, tick] = useState(0);

  const cam = useRef<Camera>({ x: 0, y: 0, zoom: 1.4 });
  const target = useRef({ zoom: 1.4, ax: 0, ay: 0 });
  const st = useRef({ seeds, plantings: new Map<string, Planting>(), hover, mode, mine });
  st.current.seeds = seeds; st.current.hover = hover; st.current.mode = mode; st.current.mine = mine;
  st.current.plantings = new Map(plantings.map((p) => [`${p.x},${p.y}`, p]));

  const focus = (x: number, y: number) => { const [ix, iy] = iso(x, y); cam.current.x = ix; cam.current.y = iy; };

  useEffect(() => {
    setMine(localStorage.getItem("samenland-seed"));
    (async () => {
      const [a, b] = await Promise.all([
        supabase.from("seeds").select("*").order("created_at"),
        supabase.from("plantings").select("*"),
      ]);
      const ss = (a.data ?? []) as Seed[];
      setSeeds(ss); setPlantings((b.data ?? []) as Planting[]);
      const my = ss.find((s) => s.id === localStorage.getItem("samenland-seed")) ?? ss[0];
      if (my) focus(my.x, my.y); else focus(256, 256);
    })();
    const ch = supabase.channel(`world-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "seeds" }, (p) =>
        setSeeds((s) => (s.some((x) => x.id === (p.new as Seed).id) ? s : [...s, p.new as Seed])))
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "plantings" }, (p) =>
        setPlantings((s) => (s.some((x) => x.id === (p.new as Planting).id) ? s : [...s, p.new as Planting])))
      .subscribe();
    const iv = setInterval(() => tick((n) => n + 1), 30000);
    return () => { supabase.removeChannel(ch); clearInterval(iv); };
  }, []);

  // render loop + input
  useEffect(() => {
    const cv = canvasRef.current!;
    const ctx = cv.getContext("2d")!;
    let raf = 0;
    const resize = () => { cv.width = Math.ceil(cv.clientWidth / PX); cv.height = Math.ceil(cv.clientHeight / PX); };
    resize(); window.addEventListener("resize", resize);
    const loop = () => {
      const c = cam.current, tg = target.current;
      if (Math.abs(tg.zoom - c.zoom) > 0.0005) {
        const nz = c.zoom + (tg.zoom - c.zoom) * 0.16;
        const px = tg.ax - cv.width / 2, py = tg.ay - cv.height / 2;
        c.x += px / c.zoom - px / nz; c.y += py / c.zoom - py / nz; c.zoom = nz;
      }
      const s = st.current;
      const h = s.hover;
      const ok = h && s.mode === "seed" ? canPlant(h[0], h[1], s.seeds) === null : null;
      draw(ctx, cv.width, cv.height, c, s.seeds, s.plantings, Date.now(), h, ok);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = cv.getBoundingClientRect();
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
      target.current = { zoom: Math.min(4, Math.max(0.3, target.current.zoom * Math.exp(-dy * 0.0015))), ax: (e.clientX - r.left) / PX, ay: (e.clientY - r.top) / PX };
    };
    cv.addEventListener("wheel", onWheel, { passive: false });
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); cv.removeEventListener("wheel", onWheel); };
  }, []);

  const tileAt = (e: React.PointerEvent) => {
    const cv = canvasRef.current!, r = cv.getBoundingClientRect(), c = cam.current;
    const sx = (e.clientX - r.left) / PX, sy = (e.clientY - r.top) / PX;
    return toTile((sx - cv.width / 2) / c.zoom + c.x, (sy - cv.height / 2) / c.zoom + c.y) as [number, number];
  };
  const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null);

  const onClick = async (x: number, y: number) => {
    setMsg(null);
    if (mode === "seed") {
      if (!form.name.trim() || !form.owner.trim()) return setMsg("Gib erst beide Namen ein.");
      const err = canPlant(x, y, seeds);
      if (err) return setMsg(err);
      const { data, error } = await supabase.from("seeds").insert({ name: form.name.trim(), owner: form.owner.trim(), x, y, hue: Math.floor(Math.random() * 360) }).select().single();
      if (error || !data) return setMsg("Das Pflanzen hat nicht geklappt. Bitte nochmal versuchen.");
      localStorage.setItem("samenland-seed", data.id);
      setMine(data.id); setSeeds((s) => [...s, data as Seed]); setMode("look");
      setMsg(`${data.name} ist gepflanzt. Komm morgen wieder – es wächst auch ohne dich.`);
    } else if (mode === "tree" || mode === "flower" || mode === "lantern") {
      const my = seeds.find((s) => s.id === mine);
      if (!my) return;
      if (Math.hypot(x - my.x, y - my.y) > radiusOf(ageHours(my, Date.now())) + 3) return setMsg("Nur in der Nähe deines Dorfes.");
      if (!["grass", "meadow", "sand", "forest"].includes(terrain(x, y))) return setMsg("Hier wächst nichts.");
      const { data } = await supabase.from("plantings").insert({ seed_id: my.id, kind: mode, x, y }).select().single();
      if (data) setPlantings((p) => [...p, data as Planting]);
    }
  };

  const my = seeds.find((s) => s.id === mine);
  const myStats = my ? townStats(my, Date.now()) : null;

  return (
    <div className="relative h-screen w-full overflow-hidden bg-background">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full cursor-grab touch-none [image-rendering:pixelated]"
        onPointerDown={(e) => { drag.current = { x: e.clientX, y: e.clientY, moved: false }; (e.target as Element).setPointerCapture(e.pointerId); }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (d && e.buttons) {
            const dx = e.clientX - d.x, dy = e.clientY - d.y;
            if (Math.abs(dx) + Math.abs(dy) > 3) d.moved = true;
            if (d.moved) { cam.current.x -= dx / PX / cam.current.zoom; cam.current.y -= dy / PX / cam.current.zoom; d.x = e.clientX; d.y = e.clientY; }
          }
          setHover(tileAt(e));
        }}
        onPointerUp={(e) => { const d = drag.current; drag.current = null; if (d && !d.moved) { const [x, y] = tileAt(e); onClick(x, y); } }}
        onPointerLeave={() => setHover(null)}
      />

      <header className="pointer-events-none absolute left-4 top-4 max-w-xs">
        <div className="pointer-events-auto rounded-md border-2 border-border bg-card/90 p-4 shadow-[var(--shadow-cozy)] backdrop-blur">
          <h1 className="font-display text-3xl leading-none text-primary">Samenland</h1>
          <p className="mt-1 text-sm text-muted-foreground">Setz einen Samen. Schau zu, wie dein Dorf wächst – in Echtzeit, auch wenn du weg bist.</p>
          {my && myStats ? (
            <div className="mt-3 space-y-1 text-sm">
              <div className="font-display text-lg text-foreground">{my.name}</div>
              <div className="text-muted-foreground">Seit {fmtAge(myStats.age)} · {myStats.houses} Häuser · ~{myStats.people} Leute</div>
              <Button size="sm" variant="secondary" className="mt-1" onClick={() => focus(my.x, my.y)}>Zu meinem Dorf</Button>
            </div>
          ) : mode !== "seed" ? (
            <Button className="mt-3" onClick={() => setMode("seed")}>Samen setzen</Button>
          ) : (
            <form className="mt-3 space-y-2" onSubmit={(e) => e.preventDefault()}>
              <Input placeholder="Name des Dorfes" maxLength={32} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <Input placeholder="Dein Name" maxLength={32} value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} />
              <p className="text-xs text-muted-foreground">{form.name.trim() && form.owner.trim() ? "Jetzt auf ein freies Stück Land klicken." : "Gib erst beide Namen ein."}</p>
              <Button type="button" size="sm" variant="ghost" onClick={() => setMode("look")}>Abbrechen</Button>
            </form>
          )}
        </div>
      </header>

      <aside className="absolute right-4 top-4 w-56 rounded-md border-2 border-border bg-card/90 p-3 shadow-[var(--shadow-cozy)] backdrop-blur">
        <h2 className="font-display text-lg text-foreground">Dörfer</h2>
        <ul className="mt-1 max-h-60 space-y-1 overflow-auto text-sm">
          {seeds.map((s) => (
            <li key={s.id}>
              <button className="w-full rounded px-2 py-1 text-left hover:bg-accent" onClick={() => focus(s.x, s.y)}>
                <span className="text-foreground">{s.name}</span>
                <span className="block text-xs text-muted-foreground">{s.owner} · {fmtAge(ageHours(s, Date.now()))}</span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {my && (
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2 rounded-md border-2 border-border bg-card/90 p-2 shadow-[var(--shadow-cozy)] backdrop-blur">
          {(["look", "tree", "flower", "lantern"] as Mode[]).map((m) => (
            <Button key={m} size="sm" variant={mode === m ? "default" : "ghost"} onClick={() => setMode(m)}>
              {{ look: "Zuschauen", tree: "Baum", flower: "Blumen", lantern: "Laterne", seed: "" }[m]}
            </Button>
          ))}
        </div>
      )}

      <div className="pointer-events-none absolute bottom-4 left-4 space-y-2 text-sm">
        {msg && <div className="rounded-md border-2 border-border bg-card/95 px-3 py-2 text-foreground">{msg}</div>}
        {hover && <div className="rounded bg-card/80 px-2 py-1 text-xs text-muted-foreground">{TERRAIN_DE[terrain(hover[0], hover[1])]} · {hover[0]}, {hover[1]}</div>}
      </div>
      <div className="pointer-events-none absolute bottom-4 right-4 text-xs text-muted-foreground">Mausrad: zoomen · Ziehen: bewegen</div>
    </div>
  );
}

function fmtAge(h: number) {
  if (h < 1) return `${Math.max(1, Math.round(h * 60))} Min.`;
  if (h < 48) return `${Math.round(h)} Std.`;
  return `${Math.round(h / 24)} Tagen`;
}
