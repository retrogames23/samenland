import { useEffect, useMemo, useRef, useState } from "react";
import { drawLabFigure, labCatalog, type LabCat } from "@/game/render";
import { clock, worldHour } from "@/game/time";
import type { WeatherKind } from "@/game/weather";

const CATS: { k: LabCat | "all"; label: string }[] = [
  { k: "all", label: "Alle" }, { k: "mayor", label: "Schulzen" }, { k: "court", label: "Hofstaat" },
  { k: "folk", label: "Männer" }, { k: "robe", label: "Frauen & Gewänder" }, { k: "kids", label: "Kinder" }, { k: "animal", label: "Tiere & Jagd" }, { k: "feast", label: "Feste" }, { k: "road", label: "Straße & Werkstatt" },
];
const WEATHERS: { k: WeatherKind | null; label: string }[] = [{ k: null, label: "Trocken" }, { k: "drizzle", label: "Regen" }, { k: "storm", label: "Sturm" }, { k: "snow", label: "Schnee" }];
const SPEEDS = [0, 0.25, 0.5, 1, 2];
const CYCLE = 4 * Math.PI; // two full leg cycles on the scrubber

/** Dev overlay (key P in dev or with ?figs): scrollable gallery of every figure and animal, click one to inspect it with free zoom/pan. */
export default function FigureLab({ onClose }: { onClose: () => void }) {
  const all = useMemo(() => labCatalog().map((e, i) => ({ ...e, i })), []);
  const [cat, setCat] = useState<LabCat | "all">("all"), [q, setQ] = useState("");
  const [boxes, setBoxes] = useState(false), [lines, setLines] = useState(true);
  const [speed, setSpeed] = useState(1), [card, setCard] = useState(130), [sel, setSel] = useState<number | null>(null);
  const [phase, setPhase] = useState(0), [weather, setWeather] = useState<WeatherKind | null>(null);
  const list = all.filter((e) => (cat === "all" || e.cat === cat) && e.label.toLowerCase().includes(q.toLowerCase()));
  // one row per figure, its situations side by side (catalog order keeps them together)
  const rows: { row: string; items: typeof list }[] = [];
  for (const e of list) { const r = rows[rows.length - 1]; if (r && r.row === e.row) r.items.push(e); else rows.push({ row: e.row, items: [e] }); }

  // shared animation clock: lab phase advances by speed; animals see a daytime realm clock so nobody sleeps by default
  const st = useRef({ ph: 0, last: 0, speed, boxes, lines, sel, card, weather });
  st.current = { ...st.current, speed, boxes, lines, sel, card, weather };
  const noon = useMemo(() => { const n = clock(); return n - (worldHour(n) - 12) * 3.6e6; }, []);
  const cards = useRef(new Map<number, HTMLCanvasElement>());
  const big = useRef<HTMLCanvasElement>(null);
  const view = useRef({ z: 0, x: 0, y: 0 }); // z = 0 → fit on next frame

  useEffect(() => {
    let raf = 0;
    const loop = (t: number) => {
      const s = st.current, dt = s.last ? t - s.last : 0; s.last = t;
      s.ph += (dt / 520) * Math.PI * 2 * s.speed;
      const now = noon + s.ph * 520 / (Math.PI * 2);
      const o = { boxes: s.boxes, lines: s.lines, weather: s.weather }, d = window.devicePixelRatio || 1;
      const paint = (cv: HTMLCanvasElement, f: (c: CanvasRenderingContext2D, W: number, H: number) => void) => {
        const W = cv.clientWidth, H = cv.clientHeight; if (!W || !H) return;
        if (cv.width !== Math.round(W * d) || cv.height !== Math.round(H * d)) { cv.width = Math.round(W * d); cv.height = Math.round(H * d); }
        const c = cv.getContext("2d")!; c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, cv.width, cv.height); c.setTransform(d, 0, 0, d, 0, 0); f(c, W, H);
      };
      if (s.sel != null && big.current) {
        const e = all[s.sel]; if (!e) { raf = requestAnimationFrame(loop); return; }
        paint(big.current, (c, W, H) => {
          const v = view.current; if (!v.z) { v.z = Math.min((H * 0.7) / e.h, (W * 0.8) / e.w); v.x = W / 2; v.y = H * 0.85; }
          c.strokeStyle = "rgba(60,40,20,0.12)"; c.lineWidth = 1; // world grid, one line per world unit
          if (v.z > 14) { const s0x = v.x % v.z, s0y = v.y % v.z;
            for (let x = s0x; x < W; x += v.z) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); }
            for (let y = s0y; y < H; y += v.z) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); } }
          drawLabFigure(c, e.i, v.x, v.y, v.z, s.ph, now, o);
        });
      } else for (const [i, cv] of cards.current) {
        const r = cv.getBoundingClientRect(); if (r.bottom < 0 || r.top > window.innerHeight) continue;
        const e = all[i]; if (!e) continue;
        paint(cv, (c, W, H) => drawLabFigure(c, i, W / 2, H * 0.9, Math.min((H * 0.78) / e.h, (W * 0.85) / e.w), s.ph, now, o));
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop); return () => cancelAnimationFrame(raf);
  }, [all, noon]);

  const open = (i: number | null) => { view.current.z = 0; setSel(i); };
  const step = (d: number) => { if (sel == null) return; const row = list.filter((e) => e.row === all[sel]?.row), k = row.findIndex((e) => e.i === sel); const n = row[(k + d + row.length) % row.length]; if (n) open(n.i); };
  const setSpeedP = (v: number) => { setSpeed(v); if (v === 0) setPhase(((st.current.ph % CYCLE) + CYCLE) % CYCLE); };
  const scrub = (v: number) => { setPhase(v); st.current.ph = v; };

  useEffect(() => {
    const k = (ev: KeyboardEvent) => {
      if ((ev.target as HTMLElement)?.tagName === "INPUT" && ev.key !== "Escape") return;
      if (ev.key === "Escape") { ev.stopPropagation(); if (sel != null) open(null); else onClose(); }
      else if (sel != null && ev.key === "ArrowRight") step(1);
      else if (sel != null && ev.key === "ArrowLeft") step(-1);
      else if (ev.key === " ") { ev.preventDefault(); setSpeedP(speed ? 0 : 1); }
    };
    window.addEventListener("keydown", k, true); return () => window.removeEventListener("keydown", k, true);
  });

  // detail view: wheel zooms at the cursor, drag pans, two fingers pinch
  const pts = useRef(new Map<number, { x: number; y: number }>());
  const zoomAt = (px: number, py: number, f: number) => {
    const v = view.current, nz = Math.max(2, Math.min(160, v.z * f)), k = nz / v.z;
    v.x = px - (px - v.x) * k; v.y = py - (py - v.y) * k; v.z = nz;
  };
  const local = (e: { clientX: number; clientY: number }) => { const r = big.current!.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };

  const btn = "rounded-md border border-border bg-card px-2 py-1 text-xs text-card-foreground hover:border-primary";
  const on = "bg-primary text-primary-foreground border-primary hover:bg-primary";
  const cur = sel != null ? all[sel] : null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-card text-card-foreground" dir="ltr">
      <header className="flex flex-wrap items-center gap-2 border-b border-border bg-card px-3 text-card-foreground py-2 text-xs">
        <b className="me-2 text-sm">Figurenkabinett</b>
        {sel == null && CATS.map((c) => (
          <button key={c.k} className={`${btn} ${cat === c.k ? on : ""}`} onClick={() => setCat(c.k)}>{c.label}</button>
        ))}
        {sel == null && <input className="w-36 rounded-md border border-border bg-card px-2 py-1 text-card-foreground" placeholder="Suchen…" value={q} onChange={(e) => setQ(e.target.value)} />}
        {sel != null && <>
          <button className={btn} onClick={() => open(null)}>← Übersicht</button>
          <button className={btn} onClick={() => step(-1)}>‹</button>
          <b className="min-w-28 text-center text-sm">{cur?.label}</b>
          <button className={btn} onClick={() => step(1)}>›</button>
          <button className={btn} onClick={() => { const r = big.current!.getBoundingClientRect(); zoomAt(r.width / 2, r.height / 2, 1 / 1.4); }}>−</button>
          <button className={btn} onClick={() => { const r = big.current!.getBoundingClientRect(); zoomAt(r.width / 2, r.height / 2, 1.4); }}>+</button>
          <button className={btn} onClick={() => { view.current.z = 0; }}>Einpassen</button>
        </>}
        <span className="ms-auto flex flex-wrap items-center gap-2">
          {WEATHERS.map((w) => <button key={w.label} className={`${btn} ${weather === w.k ? on : ""}`} onClick={() => setWeather(w.k)}>{w.label}</button>)}
          {SPEEDS.map((v) => <button key={v} className={`${btn} ${speed === v ? on : ""}`} onClick={() => setSpeedP(v)}>{v === 0 ? "❚❚" : `${v}×`}</button>)}
          {speed === 0 && <input type="range" min={0} max={CYCLE} step={0.01} value={phase} onChange={(e) => scrub(+e.target.value)} className="w-32" aria-label="Bild für Bild" />}
          <label className="flex items-center gap-1"><input type="checkbox" checked={lines} onChange={(e) => setLines(e.target.checked)} /> Linien</label>
          <label className="flex items-center gap-1"><input type="checkbox" checked={boxes} onChange={(e) => setBoxes(e.target.checked)} /> Boxen</label>
          {sel == null && <label className="flex items-center gap-1">Größe <input type="range" min={110} max={420} value={card} onChange={(e) => setCard(+e.target.value)} className="w-24" /></label>}
          <button className={btn} onClick={onClose} aria-label="Schließen">✕</button>
        </span>
      </header>

      {sel == null ? (
        <div className="flex-1 overflow-y-auto p-3">
          {rows.map((r) => (
            <section key={r.row} className="mb-4">
              <h3 className="mb-1 font-display text-sm">{r.row}</h3>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {r.items.map((e) => (
                  <button key={e.i} onClick={() => open(e.i)} className="flex shrink-0 flex-col overflow-hidden rounded-lg border border-border bg-card text-start hover:border-primary hover:shadow-md" style={{ width: card }}>
                    <canvas ref={(el) => { if (el) cards.current.set(e.i, el); else cards.current.delete(e.i); }} className={`w-full ${e.night ? "bg-foreground/85" : "bg-card"}`} style={{ height: card * 1.2 }} />
                    <span className="truncate px-2 py-1 text-xs">{e.sit}</span>
                  </button>
                ))}
              </div>
            </section>
          ))}
          {!rows.length && <p className="text-sm text-card-foreground">Keine Figur gefunden.</p>}
        </div>
      ) : (
        <div className="relative flex-1">
          <canvas
            ref={big} className={`h-full w-full cursor-grab touch-none ${cur?.night ? "bg-foreground/85" : "bg-card"} active:cursor-grabbing`}
            onWheel={(e) => { const p = local(e); zoomAt(p.x, p.y, Math.exp(-e.deltaY * 0.0015)); }}
            onDoubleClick={() => { view.current.z = 0; }}
            onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); pts.current.set(e.pointerId, local(e)); }}
            onPointerUp={(e) => pts.current.delete(e.pointerId)} onPointerCancel={(e) => pts.current.delete(e.pointerId)}
            onPointerMove={(e) => {
              const m = pts.current, prev = m.get(e.pointerId); if (!prev) return;
              const p = local(e), v = view.current;
              if (m.size === 1) { v.x += p.x - prev.x; v.y += p.y - prev.y; }
              else { const other = [...m].find(([k]) => k !== e.pointerId)![1];
                const d0 = Math.hypot(prev.x - other.x, prev.y - other.y), d1 = Math.hypot(p.x - other.x, p.y - other.y);
                if (d0 > 0) zoomAt((p.x + other.x) / 2, (p.y + other.y) / 2, d1 / d0); }
              m.set(e.pointerId, p);
            }}
          />
          <p className="pointer-events-none absolute bottom-2 start-3 rounded bg-card/90 px-2 py-1 text-[11px] text-card-foreground">
            Mausrad / zwei Finger: zoomen · Ziehen: verschieben · Doppelklick: einpassen · ← →: nächste Situation · Leertaste: Pause · Esc: zurück
            {lines && " · rot Hüfte, grün Saum, gestrichelt Boden"}
          </p>
        </div>
      )}
    </div>
  );
}
